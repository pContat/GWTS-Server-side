import {prepareForSearch, TreeNode} from "../../lib";
import {Ingredient, Item, ItemDAO} from "../../model";
import {PriceFinder} from "./priceFinder";


/**
 * Find the best recipe to craft the given item
 */
export class RecipeFinder {
  itemDAO: ItemDAO;
  priceFinder: PriceFinder; // make singleton
  readonly CANTBUY = -1;
  private commerceListingCache: Map<number, any>;
  private shortCutMap: Map<number, Ingredient[]>;


  constructor() {
    this.itemDAO = new ItemDAO();
    this.priceFinder = new PriceFinder();
    // todo : move this to dedicated class or redis
    this.commerceListingCache = new Map<number, any>();
    this.shortCutMap = new Map<number, Ingredient[]>();
  }

  // case : can't buy parent
  // case : one of children can't be buy
  private mustCraftItem(item: TreeNode<Ingredient>) {
    const itemPrice = this.priceFinder.buyPriceToCraft(item.data.item_id, item.data.count);
    const ingredientsPrice = item.children
      .map((ingredientNode) =>
        this.priceFinder.buyPriceToCraft(ingredientNode.data.item_id, ingredientNode.data.count)
      );
    const cantCraft = ingredientsPrice.find((price: number) => price === this.CANTBUY);

    if (cantCraft) {
      return false
    }
    const totalPriceToCraft = ingredientsPrice.reduce((a, b) => a + b, 0);
    return itemPrice !== this.CANTBUY ? totalPriceToCraft < itemPrice : true;
  }

  private async getRecipeCraftPrice(item: Item) {
    // use cache for listing and deal
    if (item.fromRecipe) {
      // preparation
      const recipeTree: TreeNode<Ingredient> = JSON.parse(item.fromRecipe.tree);
      const ingredientIds = prepareForSearch(recipeTree);
      const listings = await this.priceFinder.getListings(ingredientIds);

      //traversal
      const stack: TreeNode<Ingredient>[] = [];
      stack.push(recipeTree);
      while (stack.length > 0) {
        const currentItem = stack.pop() as TreeNode<Ingredient>; //can't be undefined -> force cast
        for (const ingredientNode of currentItem.children) {
          // traitement
          stack.push(ingredientNode)
        }

      }
    }
    return []
  }


}


export function findShortcut(root: TreeNode<Ingredient>) {
  const stack: TreeNode<Ingredient>[] = [];
  stack.push(root);
  while (stack.length > 0) {
    const currentItem = stack.pop() as TreeNode<Ingredient>; //can't be undefined -> force cast
    for (const ingredientNode of currentItem.children) {
      stack.push(ingredientNode)
    }
  }
}
