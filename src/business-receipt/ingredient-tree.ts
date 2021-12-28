import { Ingredient, Recipe } from '../common/type';
import { TreeNode } from './type';

function recipeToNodes(recipe: Recipe, quantity = 1): TreeNode<Ingredient>[] {
  return recipe.ingredients.map(ingredient => {
    const data = {
      count: ingredient.count * quantity,
      itemId: ingredient.itemId,
      isCraftable: ingredient.isCraftable,
      outputCountIfCraft: 1,
    };
    return new TreeNode<Ingredient>(data);
  });
}

function createRootTree(recipeForItem: Recipe): TreeNode<Ingredient> {
  const data = {
    count: 1,
    itemId: recipeForItem.outputItemId,
    isCraftable: true,
  } as Ingredient;
  const root = new TreeNode<Ingredient>(data); // 1 : output item id
  root.children.push(...recipeToNodes(recipeForItem)); //do not break reference
  return root;
}

// TODO: can use cache to improve creation time : priority low
export function buildRecipeTree(
  recipeForItem: Recipe,
  recipeCache: Map<number, Recipe>,
): TreeNode<Ingredient> {
  const stack: TreeNode<Ingredient>[] = [];
  const root = createRootTree(recipeForItem);
  stack.push(root);
  while (stack.length > 0) {
    const currentItem = stack.pop() as TreeNode<Ingredient>; //can't be undefined -> force cast
    for (const ingredientNode of currentItem.children) {
      const recipe = recipeCache.get(ingredientNode.data.itemId);
      if (recipe) {
        currentItem.data.outputCountIfCraft = recipe.outputItemCount;
        // const item = await itemDao.model.findOne({id: ingredientNode.data.item_id}) as ItemDocument;
        ingredientNode.children.push(...recipeToNodes(recipe));
      }
      stack.push(ingredientNode);
    }
  }
  return root;
}

// get all ids to query commerce listing and define parent relationship
export function getAllItemId(root: TreeNode<Ingredient>): number[] {
  const stack: TreeNode<Ingredient>[] = [];
  stack.push(root);
  const ids = [root.data.itemId];
  while (stack.length > 0) {
    const currentItem = stack.pop() as TreeNode<Ingredient>; //can't be undefined -> force cast
    for (const ingredientNode of currentItem.children) {
      ids.push(ingredientNode.data.itemId);
      stack.push(ingredientNode);
    }
  }
  return Array.from(new Set(ids));
}
