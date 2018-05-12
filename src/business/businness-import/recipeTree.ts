import {Ingredient, ItemDocument, RecipeDocument} from "../../model";

export class Node<T> {
  public data: T;
  public children: Node<T>[];

  constructor(data: T) {
    this.data = data;
    this.children = [];
  }
}

export function ingredientsToNodes(recipe: RecipeDocument) {
  return recipe.ingredients.map((ingredient) => {
    const data = {count: ingredient.count, item_id: ingredient.item_id, isCraftable: ingredient.isCraftable};
    return new Node<Ingredient>(data)
  })
}

export function createRootTree(item: ItemDocument): Node<Ingredient> {
  const recipe: RecipeDocument = item.fromRecipe;
  const data = {count: 1, item_id: recipe.output_item_id, isCraftable: true} as Ingredient;
  const root = new Node<Ingredient>(data); // 1 : output item id
  root.children.push(...ingredientsToNodes(recipe)); //do not break reference
  return root
}


