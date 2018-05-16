import {TreeNode} from "../../lib";
import {Ingredient, Item, ItemDAO} from "../../model";
import {getTotalPrice, PriceFinder} from "./priceFinder";
import {clone, map} from "lodash";
import logger from "../../lib/logger/logger";
import {nodeToString, SearchableRecipeNode} from "./searchableRecipeNode";
import {getAllItemId} from "../../lib/recipeTree/ingredientTree";
import {printTree} from "../../lib/recipeTree/printTree";


export interface BuyableIngredient extends Ingredient {
  buyPrice: number;
}


export interface RecipeResult {
  ingredients: BuyableIngredient[];
  initialPrice: number
  finalPrice: number
}


/**
 * Find the best recipe to craft the given item
 */
export class RecipeFinder {
  itemDAO: ItemDAO;
  priceFinder: PriceFinder; // make singleton
  readonly DONTCRAFT = -3;
  private commerceListingCache: Map<number, any>;
  private readonly shortCutMap: Map<number, BuyableIngredient[]>;

  constructor() {
    this.itemDAO = new ItemDAO();
    this.priceFinder = new PriceFinder();
    // todo : move this to dedicated class or redis
    this.commerceListingCache = new Map<number, any>();
    this.shortCutMap = new Map<number, BuyableIngredient[]>();
  }


  public async getRecipeCraftPrice(item: Item): Promise<RecipeResult | undefined> {
    if (!item.fromRecipe) {
      logger.info('cant craft this item');
      return undefined;
    }
    const recipeTree = await this.prepareSearch(item);
    // DFS traversal : define all buy price
    const priceStack: TreeNode<BuyableIngredient>[] = [];
    // bottom top traversal : define if crafting is better
    const shortcutCraftStack: TreeNode<BuyableIngredient>[] = [];

    priceStack.push(recipeTree);
    shortcutCraftStack.push(recipeTree);

    const initialPrice = await this.priceFinder.getBuyPrice(item.id, 1);
    // defined all buy price for each node;
    while (priceStack.length > 0) {
      const currentItem = priceStack.pop() as SearchableRecipeNode<BuyableIngredient>; //can't be undefined -> force cast

      //todo : if shortcut already found -> skip
      let qtyToBuy = this.getQuantityToBuy(currentItem);
      // need 2 item but the craft produce 5
      if (qtyToBuy < 1) {
        qtyToBuy = 1;
        // TODO add overcomponent
        // add warning with sell price
        // if( qtyToBuy /currentItem.parent.data.outputCountIfCraft ) < 1 we will have oversupply
      }
      currentItem.data.buyPrice = await this.priceFinder.getBuyPrice(currentItem.data.item_id, qtyToBuy);

      priceStack.push(...currentItem.children);
      if (currentItem.children[0]) {
        // only one child for craft check
        shortcutCraftStack.push(currentItem.children[0])
      }
    }

    printTree(recipeTree, nodeToString,
      node => node.children as SearchableRecipeNode<BuyableIngredient>[]);

    while (shortcutCraftStack.length > 0) {
      const currentItem = shortcutCraftStack.pop() as SearchableRecipeNode<BuyableIngredient>; //can't be undefined -> force cast
      if (currentItem.parent) {
        const craftPrice = this.mustCraftNode(currentItem.parent);
        if (craftPrice > 0) {
          currentItem.parent.data.buyPrice = craftPrice;
          const siblings = currentItem.parent.children;
          const childrenIngredient = map(siblings, 'data');
          this.shortCutMap.set(currentItem.parent.data.item_id, childrenIngredient);
        }
      }
    }

    printTree(recipeTree, nodeToString,
      node => node.children as SearchableRecipeNode<BuyableIngredient>[]);

    console.log(this.shortCutMap);
    const finalIngredientList = this.recursiveShortcutResolution([recipeTree.data]);
    if (finalIngredientList[0].item_id === recipeTree.data.item_id) {
      logger.info('no best recipe found for ' + recipeTree.data.item_id);
      return undefined;
    }
    //todo add price per item !
    return {
      finalPrice: getTotalPrice(finalIngredientList),
      initialPrice: initialPrice,
      ingredients: finalIngredientList,

    } as RecipeResult;
  }


  private getQuantityToBuy(currentItem: SearchableRecipeNode<BuyableIngredient>) {
    if (currentItem.parent) {
      return (currentItem.data.count * currentItem.parent.data.count) / currentItem.parent.data.outputCountIfCraft;
    }
    return currentItem.data.count;
  }


// parent ingredients ex : [A]
  private recursiveShortcutResolution(ingredients: BuyableIngredient[]): BuyableIngredient[] {
    const initialIngredient = clone(ingredients);
    const finalIngredient: BuyableIngredient[] = [];

    while (initialIngredient.length > 0) {
      const ingredient = initialIngredient.shift() as BuyableIngredient;
      const shortcut = this.shortCutMap.get(ingredient.item_id);
      if (shortcut) {
        finalIngredient.push(...this.recursiveShortcutResolution(shortcut))
      } else {
        finalIngredient.push(ingredient)
      }
    }
    return finalIngredient;
  }


  private async prepareSearch(item: Item): Promise<SearchableRecipeNode<BuyableIngredient>> {
    const recipeTree: TreeNode<BuyableIngredient> = JSON.parse(item.fromRecipe.tree);
    const ingredientIds = getAllItemId(recipeTree);
    await this.priceFinder.getListings(ingredientIds); //populate cache
    return new SearchableRecipeNode(recipeTree);
  }

  // case : one of children can't be buy
  // case : can't buy parent
  // return the price to craft the item
  private mustCraftNode(item: SearchableRecipeNode<BuyableIngredient>): number {

    const ingredientsPrice = this.priceFinder.getCraftPrice(item);
    if (ingredientsPrice === this.priceFinder.CANTCRAFT) {
      return this.priceFinder.CANTCRAFT;
    }
    const nodePrice = item.data.buyPrice;
    if (nodePrice === this.priceFinder.CANTBUY) {
      return ingredientsPrice;
    }
    return ingredientsPrice < nodePrice ? ingredientsPrice : this.DONTCRAFT;
  }


}
