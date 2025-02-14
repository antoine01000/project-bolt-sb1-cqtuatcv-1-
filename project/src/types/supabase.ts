export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      persons: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          month: string
          amount: number
          person_id: string
          category_id: string
          comment?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          amount: number
          person_id: string
          category_id: string
          comment?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          amount?: number
          person_id?: string
          category_id?: string
          comment?: string
          created_at?: string
        }
      }
      cagnottes: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'Cagnotte' | 'Dette'
          description?: string
          amount: number
          target_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'Cagnotte' | 'Dette'
          description?: string
          amount?: number
          target_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'Cagnotte' | 'Dette'
          description?: string
          amount?: number
          target_amount?: number
          created_at?: string
        }
      }
      subcagnottes: {
        Row: {
          id: string
          cagnotte_id: string
          name: string
          description?: string
          amount: number
          target_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          cagnotte_id: string
          name: string
          description?: string
          amount?: number
          target_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          cagnotte_id?: string
          name?: string
          description?: string
          amount?: number
          target_amount?: number
          created_at?: string
        }
      }
      operations: {
        Row: {
          id: string
          cagnotte_id: string
          operation: string
          previous_amount: number
          new_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          cagnotte_id: string
          operation: string
          previous_amount: number
          new_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          cagnotte_id?: string
          operation?: string
          previous_amount?: number
          new_amount?: number
          created_at?: string
        }
      }
    }
  }
}