import { TreeNode } from '../../recipe/type/tree-node';

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

