import { Discipline } from '../../business-search/type';
import { Ingredient } from '../../item/type/type';
import { TreeNode } from './tree-node';

export interface Recipe {
  ingredients: Ingredient[];
  outputItemId: number;
  outputItemCount: number;
  disciplines: Discipline[];
  id: number;
  type: string;
  chatLink: string;
  craftingTree: TreeNode<Ingredient>;
  minRating: number; //The required rating to craft the recipe.
  autoLearned: boolean; // Indicates that a recipe is unlocked by consuming a recipe sheet or not
}
