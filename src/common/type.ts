import { TreeNode } from '../business-receipt/type';

export interface Ingredient {
  itemId: number;
  count: number;
  isCraftable: boolean;
  outputCountIfCraft: number;
}

export interface Item {
  id: number;
  fromRecipeId?: number;
  type: string;
  name: string;
  iconUrl: string;
  level: number;
  rarity: string;
  vendorValue: number;
  chatLink: string;
  flags: string[];
}

export interface Recipe {
  ingredients: Ingredient[];
  outputItemId: number;
  outputItemCount: number;
  disciplines: string[];
  id: number;
  type: string;
  chatLink: string;
  craftingTree: TreeNode<Ingredient>;
}
