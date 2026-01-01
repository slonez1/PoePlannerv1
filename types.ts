
export interface Ingredient {
  item: string;
  amount: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions: string[];
  rating: number;
  notes: string;
  sourceUrl?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  tags: string[];
  imageUrl?: string;
  category?: string;
  isMade?: boolean;
}

export interface RotationItem {
  id: string;
  recipeId: string;
}

export type ViewState = 'library' | 'rotation' | 'discovery' | 'add' | 'settings';
export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline' | 'conflict';

export interface VaultData {
  recipes: Recipe[];
  rotation: RotationItem[];
  lastUpdated: number;
}