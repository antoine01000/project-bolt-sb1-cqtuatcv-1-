export interface User {
  email: string;
}

export interface Person {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  order?: number;
}

export interface Expense {
  id: string;
  month: string;
  amount: number;
  person_id: string;
  category_id: string;
  comment?: string;
  user_id: string;
  created_at: string;
}

export interface Operation {
  id: string;
  subcagnotte_id: string;
  operation: string;
  previous_amount: number;
  new_amount: number;
  created_at: string;
}

export interface SubCagnotte {
  id: string;
  cagnotte_id: string;
  name: string;
  description?: string;
  amount: number;
  target_amount: number;
  created_at: string;
  operations: Operation[];
}

export interface Note {
  id: string;
  user_id: string;
  cagnotte_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Cagnotte {
  id: string;
  name: string;
  type: 'Cagnotte' | 'Dette';
  description?: string;
  amount: number;
  target_amount: number;
  user_id: string;
  created_at: string;
  subcagnottes: SubCagnotte[];
  note?: Note;
}