import {TreeNode} from "../../lib";
import {Ingredient, Item, ItemDAO} from "../../model";
import {PriceFinder} from "./priceFinder";
import {clone, map} from "lodash";
import logger from "../../lib/logger/logger";
import {nodeToString, SearchableRecipeNode} from "./searchableRecipeNode";
import {getAllItemId} from "../../lib/recipeTree/ingredientTree";
import {printTree} from "../../lib/recipeTree/printTree";


export interface BuyableIngredient extends Ingredient {
  buyPrice: number;
}

/**
 * Find the best recipe to craft the given item
 */
export class RecipeFinder {
  itemDAO: ItemDAO;
  priceFinder: PriceFinder; // make singleton
  readonly DONTCRAFT = -3;
  private commerceListingCache: Map<number, any>;
  private shortCutMap: Map<number, Ingredient[]>;

  constructor() {
    this.itemDAO = new ItemDAO();
    this.priceFinder = new PriceFinder();
    // todo : move this to dedicated class or redis
    this.commerceListingCache = new Map<number, any>();
    this.shortCutMap = new Map<number, Ingredient[]>();
  }


  public async getRecipeCraftPrice(item: Item): Promise<Ingredient[]> {
    // use cache for listing and deal
    if (!item.fromRecipe) {
      logger.info('cant craft this item');
      return [];
    }
    const recipeTree = await this.prepareSearch(item);

    // DFS traversal
    const priceStack: TreeNode<Ingredient>[] = [];
    // bottom top traversal
    const shortcutCraftStack: TreeNode<Ingredient>[] = [];

    priceStack.push(recipeTree);
    shortcutCraftStack.push(recipeTree);
    // defined all buy price for each node;
    while (priceStack.length > 0) {
      const currentItem = priceStack.pop() as SearchableRecipeNode<Ingredient>; //can't be undefined -> force cast

      //todo : if shortcut already found -> skip
      let qtyToBuy = this.getQuantityToBuy(currentItem);
      // need 2 item but the craft produce 5
      if (qtyToBuy < 1) {
        qtyToBuy = 1;
        // TODO add overcomponent
      }
      //estimation
      const buyPrice = await this.priceFinder.getBuyPrice(currentItem.data.item_id, qtyToBuy);


      currentItem.nodeBuyPrice = buyPrice;
      // add warning with sell price
      // if( qtyToBuy /currentItem.parent.data.outputCountIfCraft ) < 1 we will overcraft
      priceStack.push(...currentItem.children);
      if (currentItem.children[0]) {
        shortcutCraftStack.push(currentItem.children[0])
      }
    }

    printTree(recipeTree, nodeToString,
      node => node.children as SearchableRecipeNode<Ingredient>[]);

    while (shortcutCraftStack.length > 0) {
      const currentItem = shortcutCraftStack.pop() as SearchableRecipeNode<Ingredient>; //can't be undefined -> force cast
      if (currentItem.parent) {
        const craftPrice = this.mustCraftNode(currentItem.parent);
        if (craftPrice > 0) {
          const siblings = currentItem.parent.children;
          const childrenIngredient = map(siblings, 'data');
          // get the data
          currentItem.parent.nodeBuyPrice = craftPrice;
          this.shortCutMap.set(currentItem.parent.data.item_id, childrenIngredient);
        }
      }
    }

    printTree(recipeTree, nodeToString,
      node => node.children as SearchableRecipeNode<Ingredient>[]);

    console.log(this.shortCutMap);
    const finalIngredientList = this.recursiveShortcutResolution([recipeTree.data]);
    if (finalIngredientList[0].item_id === recipeTree.data.item_id) {
      logger.info('no best recipe found for ' + recipeTree.data.item_id);
      return []
    }
    //todo add price per item !
    return finalIngredientList;
  }


  private getQuantityToBuy(currentItem: SearchableRecipeNode<Ingredient>) {
    if (currentItem.parent) {
      return (currentItem.data.count * currentItem.parent.data.count) / currentItem.parent.data.outputCountIfCraft;
    }
    return currentItem.data.count;

  }

// parent ingredients ex : [A]
  private recursiveShortcutResolution(ingredients: Ingredient[]): Ingredient[] {
    const initialIngredient = clone(ingredients);
    const finalIngedient: Ingredient[] = [];

    while (initialIngredient.length > 0) {
      const ingredient = initialIngredient.shift() as Ingredient;
      const shortcut = this.shortCutMap.get(ingredient.item_id);
      if (shortcut) {
        finalIngedient.push(...this.recursiveShortcutResolution(shortcut))
      } else {
        finalIngedient.push(ingredient)
      }
    }
    return finalIngedient;
  }


  private async prepareSearch(item: Item): Promise<SearchableRecipeNode<Ingredient>> {
    const recipeTree: TreeNode<Ingredient> = JSON.parse(item.fromRecipe.tree);
    const ingredientIds = getAllItemId(recipeTree);
    await this.priceFinder.getListings(ingredientIds); //populate cache
    return new SearchableRecipeNode(recipeTree);
  }

  // case : one of children can't be buy
  // case : can't buy parent
  // return the price to craft the item
  private mustCraftNode(item: SearchableRecipeNode<Ingredient>): number {

    const ingredientsPrice = this.priceFinder.getCraftPrice(item);
    if (ingredientsPrice === this.priceFinder.CANTCRAFT) {
      return this.priceFinder.CANTCRAFT;
    }
    const nodePrice = item.nodeBuyPrice;
    if (nodePrice === this.priceFinder.CANTBUY) {
      return ingredientsPrice;
    }
    return ingredientsPrice < nodePrice ? ingredientsPrice : this.DONTCRAFT;
  }


}
