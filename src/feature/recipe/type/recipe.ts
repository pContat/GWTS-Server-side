import { Ingredient } from "../../item/type/type";
import { TreeNode } from "./tree-node";

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