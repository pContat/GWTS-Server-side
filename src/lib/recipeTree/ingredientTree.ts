import {Ingredient, ItemDocument, RecipeDocument} from "../../model";
import {TreeNode} from "./recipeTree";

export function createRootTree(item: ItemDocument): TreeNode<Ingredient> {
  const recipe: RecipeDocument = item.fromRecipe;
  const data = {count: 1, item_id: recipe.output_item_id, isCraftable: true} as Ingredient;
  const root = new TreeNode<Ingredient>(data); // 1 : output item id
  root.children.push(...ingredientsToNodes(recipe)); //do not break reference
  return root
}

// get all ids to query commerce listing and define parent relationship
export function getAllItemId(root: TreeNode<Ingredient>): number[] {
  const stack: TreeNode<Ingredient>[] = [];
  stack.push(root);
  const ids = [root.data.item_id];
  while (stack.length > 0) {
    const currentItem = stack.pop() as TreeNode<Ingredient>; //can't be undefined -> force cast
    for (const ingredientNode of currentItem.children) {
      ids.push(ingredientNode.data.item_id);
      stack.push(ingredientNode)
    }
  }
  return Array.from(new Set(ids));
}

export function ingredientsToNodes(recipe: RecipeDocument) {
  return recipe.ingredients.map((ingredient) => {
    const data = {count: ingredient.count, item_id: ingredient.item_id, isCraftable: ingredient.isCraftable};
    return new TreeNode<Ingredient>(data)
  })
}
