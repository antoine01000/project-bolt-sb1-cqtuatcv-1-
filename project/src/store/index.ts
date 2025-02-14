import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Person, Category, Expense, Cagnotte, SubCagnotte, User, Operation, Note } from '../types';

interface AppState {
  currentUser: User | null;
  persons: Person[];
  categories: Category[];
  expenses: Expense[];
  cagnottes: Cagnotte[];
  isLoading: boolean;
  error: string | null;
  
  setCurrentUser: (user: User | null) => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadUserData: () => Promise<void>;
  
  addPerson: (name: string) => Promise<void>;
  updatePerson: (id: string, name: string) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  
  addCategory: (name: string, color: string) => Promise<void>;
  updateCategory: (id: string, name: string, color: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategoriesOrder: (categories: Category[]) => Promise<void>;
  
  addExpense: (expense: Omit<Expense, 'id' | 'userId'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  addCagnotte: (name: string, type: 'Cagnotte' | 'Dette', description?: string, targetAmount?: number) => Promise<void>;
  updateCagnotte: (id: string, updates: Partial<Omit<Cagnotte, 'id' | 'userId'>>) => Promise<void>;
  deleteCagnotte: (id: string) => Promise<void>;
  
  addSubCagnotte: (cagnotteId: string, name: string, description?: string, targetAmount?: number) => Promise<void>;
  updateSubCagnotte: (id: string, updates: Partial<Omit<SubCagnotte, 'id' | 'cagnotteId'>>) => Promise<void>;
  deleteSubCagnotte: (id: string) => Promise<void>;
  updateSubCagnotteAmount: (id: string, operation: string, value: number) => Promise<void>;

  addOrUpdateNote: (cagnotteId: string, content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
}

const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  persons: [],
  categories: [],
  expenses: [],
  cagnottes: [],
  isLoading: false,
  error: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  signUp: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, email: data.user.email }]);

        if (profileError) throw profileError;

        set({ currentUser: { email: data.user.email! } });
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        set({ currentUser: { email: data.user.email! } });
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ currentUser: null });
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadUserData: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ currentUser: null });
        return;
      }

      // Charger les données de l'utilisateur
      const [
        { data: persons },
        { data: categories },
        { data: expenses },
        { data: cagnottes },
        { data: notes }
      ] = await Promise.all([
        supabase.from('persons').select('*').order('name'),
        supabase.from('categories').select('*').order('order'),
        supabase.from('expenses').select('*').order('month'),
        supabase.from('cagnottes').select(`
          *,
          subcagnottes (
            *,
            operations (*)
          )
        `).order('created_at'),
        supabase.from('notes').select('*')
      ]);

      // Associate notes with cagnottes
      const cagnottesWithNotes = cagnottes?.map(cagnotte => ({
        ...cagnotte,
        note: notes?.find(note => note.cagnotte_id === cagnotte.id)
      })) || [];

      set({
        currentUser: { email: user.email! },
        persons: persons || [],
        categories: categories || [],
        expenses: expenses || [],
        cagnottes: cagnottesWithNotes
      });
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addPerson: async (name: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('persons')
        .insert([{ name, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        persons: [...state.persons, data]
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updatePerson: async (id: string, name: string) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('persons')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        persons: state.persons.map(p =>
          p.id === id ? { ...p, name } : p
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deletePerson: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('persons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        persons: state.persons.filter(p => p.id !== id)
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addCategory: async (name: string, color: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, color, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        categories: [...state.categories, data]
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCategory: async (id: string, name: string, color: string) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('categories')
        .update({ name, color })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        categories: state.categories.map(c =>
          c.id === id ? { ...c, name, color } : c
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCategory: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        categories: state.categories.filter(c => c.id !== id)
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCategoriesOrder: async (categories: Category[]) => {
    try {
      set({ isLoading: true, error: null });
      
      // Mettre à jour l'ordre localement
      set({ categories });

      // Mettre à jour l'ordre dans la base de données
      const updates = categories.map((category, index) => ({
        id: category.id,
        order: index
      }));

      const { error } = await supabase
        .from('categories')
        .upsert(updates);

      if (error) throw error;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addExpense: async (expense: Omit<Expense, 'id' | 'userId'>) => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        expenses: [...state.expenses, data]
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateExpense: async (expense: Expense) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('expenses')
        .update(expense)
        .eq('id', expense.id);

      if (error) throw error;

      set(state => ({
        expenses: state.expenses.map(e =>
          e.id === expense.id ? expense : e
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteExpense: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        expenses: state.expenses.filter(e => e.id !== id)
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addCagnotte: async (name: string, type: 'Cagnotte' | 'Dette', description?: string, targetAmount?: number) => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cagnottes')
        .insert([{
          name,
          type,
          description,
          target_amount: targetAmount || 0,
          user_id: user.id
        }])
        .select('*, subcagnottes(*, operations(*))')
        .single();

      if (error) throw error;

      set(state => ({
        cagnottes: [...state.cagnottes, data]
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCagnotte: async (id: string, updates: Partial<Omit<Cagnotte, 'id' | 'userId'>>) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('cagnottes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        cagnottes: state.cagnottes.map(c =>
          c.id === id ? { ...c, ...updates } : c
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCagnotte: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('cagnottes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        cagnottes: state.cagnottes.filter(c => c.id !== id)
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addSubCagnotte: async (cagnotteId: string, name: string, description?: string, targetAmount?: number) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('subcagnottes')
        .insert([{
          cagnotte_id: cagnotteId,
          name,
          description,
          target_amount: targetAmount || 0,
          amount: 0
        }])
        .select('*, operations(*)')
        .single();

      if (error) throw error;

      set(state => ({
        cagnottes: state.cagnottes.map(c => {
          if (c.id === cagnotteId) {
            return {
              ...c,
              subcagnottes: [...(c.subcagnottes || []), data]
            };
          }
          return c;
        })
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSubCagnotte: async (id: string, updates: Partial<Omit<SubCagnotte, 'id' | 'cagnotteId'>>) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('subcagnottes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        cagnottes: state.cagnottes.map(c => ({
          ...c,
          subcagnottes: (c.subcagnottes || []).map(sc =>
            sc.id === id ? { ...sc, ...updates } : sc
          )
        }))
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSubCagnotte: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('subcagnottes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        cagnottes: state.cagnottes.map(c => ({
          ...c,
          subcagnottes: (c.subcagnottes || []).filter(sc => sc.id !== id)
        }))
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSubCagnotteAmount: async (id: string, operation: string, value: number) => {
    try {
      set({ isLoading: true, error: null });
      const subcagnotte = get().cagnottes
        .flatMap(c => c.subcagnottes || [])
        .find(sc => sc.id === id);

      if (!subcagnotte) throw new Error('Subcagnotte not found');

      const previous = subcagnotte.amount;
      let newAmount;

      switch (operation) {
        case '+': newAmount = previous + value; break;
        case '-': newAmount = previous - value; break;
        case '×': newAmount = previous * value; break;
        case '÷':
          if (value === 0) throw new Error('Division par zéro impossible');
          newAmount = previous / value;
          break;
        default: throw new Error('Invalid operation');
      }

      // Update subcagnotte
      const { error: updateError } = await supabase
        .from('subcagnottes')
        .update({ amount: newAmount })
        .eq('id', id);

      if (updateError) throw updateError;

      // Add operation
      const { data: operationData, error: operationError } = await supabase
        .from('operations')
        .insert([{
          subcagnotte_id: id,
          operation: operation + value,
          previous_amount: previous,
          new_amount: newAmount
        }])
        .select()
        .single();

      if (operationError) throw operationError;

      set(state => ({
        cagnottes: state.cagnottes.map(c => ({
          ...c,
          subcagnottes: (c.subcagnottes || []).map(sc => {
            if (sc.id === id) {
              return {
                ...sc,
                amount: newAmount,
                operations: [...(sc.operations || []), operationData]
              };
            }
            return sc;
          })
        }))
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addOrUpdateNote: async (cagnotteId: string, content: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if note exists
      const { data: existingNotes } = await supabase
        .from('notes')
        .select('*')
        .eq('cagnotte_id', cagnotteId);

      let note;
      if (existingNotes && existingNotes.length > 0) {
        // Update existing note
        const { data, error } = await supabase
          .from('notes')
          .update({ content })
          .eq('id', existingNotes[0].id)
          .select()
          .single();

        if (error) throw error;
        note = data;
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert([{
            user_id: user.id,
            cagnotte_id: cagnotteId,
            content
          }])
          .select()
          .single();

        if (error) throw error;
        note = data;
      }

      // Update local state
      set(state => ({
        cagnottes: state.cagnottes.map(c =>
          c.id === cagnotteId ? { ...c, note } : c
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteNote: async (noteId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      // Update local state
      set(state => ({
        cagnottes: state.cagnottes.map(c =>
          c.note?.id === noteId ? { ...c, note: undefined } : c
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  }
}));

export default useAppStore;