import React, { useState, useMemo, useEffect } from 'react';
import useAppStore from '../../store';
import { Category, Expense } from '../../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpense?: Expense;
  onEdit?: (expense: Expense) => void;
}

interface CategoryGroup {
  main: string;
  sub?: string;
  subSub?: string;
  id: string;
  color: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, editExpense, onEdit }) => {
  const { persons, categories, addExpense } = useAppStore();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState('');
  const [personId, setPersonId] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [subSubCategory, setSubSubCategory] = useState('');
  const [comment, setComment] = useState('');

  // Initialiser les valeurs si on est en mode édition
  useEffect(() => {
    if (editExpense) {
      setMonth(editExpense.month);
      setAmount(editExpense.amount.toString());
      setPersonId(editExpense.person_id);
      setComment(editExpense.comment || '');

      // Trouver la catégorie et initialiser les sélecteurs
      const category = categories.find(c => c.id === editExpense.category_id);
      if (category) {
        const parts = category.name.split(' > ');
        setMainCategory(parts[0] || '');
        setSubCategory(parts[1] || '');
        setSubSubCategory(parts[2] || '');
      }
    }
  }, [editExpense, categories]);

  // Organiser les catégories par niveaux
  const categoryGroups = useMemo(() => {
    const groups: { [key: string]: CategoryGroup } = {};
    
    categories.forEach(category => {
      const parts = category.name.split(' > ');
      groups[category.id] = {
        main: parts[0],
        sub: parts[1],
        subSub: parts[2],
        id: category.id,
        color: category.color
      };
    });
    
    return groups;
  }, [categories]);

  // Obtenir les catégories principales uniques
  const mainCategories = useMemo(() => {
    const mains = new Set(Object.values(categoryGroups).map(g => g.main));
    return Array.from(mains);
  }, [categoryGroups]);

  // Obtenir les sous-catégories pour une catégorie principale
  const getSubCategories = (main: string) => {
    const subs = new Set(
      Object.values(categoryGroups)
        .filter(g => g.main === main && g.sub)
        .map(g => g.sub)
    );
    return Array.from(subs);
  };

  // Obtenir les sous-sous-catégories
  const getSubSubCategories = (main: string, sub: string) => {
    const subSubs = new Set(
      Object.values(categoryGroups)
        .filter(g => g.main === main && g.sub === sub && g.subSub)
        .map(g => g.subSub)
    );
    return Array.from(subSubs);
  };

  // Trouver l'ID de la catégorie sélectionnée
  const getSelectedCategoryId = () => {
    const selectedCategory = Object.values(categoryGroups).find(g => 
      g.main === mainCategory &&
      (!subCategory || g.sub === subCategory) &&
      (!subSubCategory || g.subSub === subSubCategory)
    );
    return selectedCategory?.id;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const categoryId = getSelectedCategoryId();
    if (!month || !amount || !personId || !categoryId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (editExpense && onEdit) {
      onEdit({
        ...editExpense,
        month,
        amount: parseFloat(amount),
        person_id: personId,
        category_id: categoryId,
        comment: comment.trim()
      });
    } else {
      addExpense({
        month,
        amount: parseFloat(amount),
        person_id: personId,
        category_id: categoryId,
        comment: comment.trim()
      });
    }
    
    // Reset form
    setMonth(new Date().toISOString().slice(0, 7));
    setAmount('');
    setPersonId('');
    setComment('');
    setMainCategory('');
    setSubCategory('');
    setSubSubCategory('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {editExpense ? 'Modifier la dépense' : 'Ajouter une dépense'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mois
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personne
            </label>
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Sélectionner une personne</option>
              {persons.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie principale
            </label>
            <select
              value={mainCategory}
              onChange={(e) => {
                setMainCategory(e.target.value);
                setSubCategory('');
                setSubSubCategory('');
              }}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {mainCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {mainCategory && getSubCategories(mainCategory).length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sous-catégorie
              </label>
              <select
                value={subCategory}
                onChange={(e) => {
                  setSubCategory(e.target.value);
                  setSubSubCategory('');
                }}
                className="w-full p-2 border rounded"
              >
                <option value="">Sélectionner une sous-catégorie</option>
                {getSubCategories(mainCategory).map(sub => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          {subCategory && getSubSubCategories(mainCategory, subCategory).length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sous-sous-catégorie
              </label>
              <select
                value={subSubCategory}
                onChange={(e) => setSubSubCategory(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Sélectionner une sous-sous-catégorie</option>
                {getSubSubCategories(mainCategory, subCategory).map(subSub => (
                  <option key={subSub} value={subSub}>
                    {subSub}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire (optionnel)
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              {editExpense ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};