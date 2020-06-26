import {clone, map} from "lodash";
import { TreeNode} from "../business-receipt/type";
import {getAllItemId} from "../business-receipt/ingredient-tree";
import {ItemDao} from "../common/service/item.dao";
import {Ingredient } from "../common/type";
import {Injectable, Logger} from "@nestjs/common";
import {ItemModel} from "../common/model/item-model";
import {nodeToString, SearchableRecipeNode} from "./searchable-recipe-node";
import {printTree} from "../business-receipt/print-tree";
import {getTotalPrice, PriceFinder} from "./price-finder.service";


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
@Injectable()
export class RecipeFinderService {
  logger = new Logger(RecipeFinderService.name);
  readonly DONTCRAFT = -3;
  private commerceListingCache: Map<number, any>;
  private readonly shortCutMap: Map<number, BuyableIngredient[]>;

  constructor(private readonly  priceFinder : PriceFinder,
              private  readonly itemDao : ItemDao) {
    // todo : move this to dedicated class or redis
    this.commerceListingCache = new Map<number, any>();
    this.shortCutMap = new Map<number, BuyableIngredient[]>();
  }


  public async getRecipeCraftPrice(item: ItemModel): Promise<RecipeResult | undefined> {
    if (!item.fromRecipe) {
      this.logger.log('cant craft this item');
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
      currentItem.data.buyPrice = await this.priceFinder.getBuyPrice(currentItem.data.itemId, qtyToBuy);

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
          this.shortCutMap.set(currentItem.parent.data.itemId, childrenIngredient);
        }
      }
    }

    printTree(recipeTree, nodeToString,
      node => node.children as SearchableRecipeNode<BuyableIngredient>[]);

    console.log(this.shortCutMap);
    const finalIngredientList = this.recursiveShortcutResolution([recipeTree.data]);
    if (finalIngredientList[0].itemId === recipeTree.data.itemId) {
      this.logger.log('no best recipe found for ' + recipeTree.data.itemId);
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
      const shortcut = this.shortCutMap.get(ingredient.itemId);
      if (shortcut) {
        finalIngredient.push(...this.recursiveShortcutResolution(shortcut))
      } else {
        finalIngredient.push(ingredient)
      }
    }
    return finalIngredient;
  }


  private async prepareSearch(item: ItemModel): Promise<SearchableRecipeNode<BuyableIngredient>> {
    //const recipeTree: TreeNode<BuyableIngredient> = JSON.parse(item.fromRecipe.craftingTree);
    const recipeTree = item.fromRecipe.craftingTree as TreeNode<BuyableIngredient> ;
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
