import {TreeNode} from "../../lib";
import {Ingredient, Item, ItemDAO} from "../../model";
import {PriceFinder} from "./priceFinder";
import {map} from "lodash";
import logger from "../../lib/logger/logger";
import {nodeToString, SearchableRecipeNode} from "./searchableRecipeNode";
import {getAllItemId} from "../../lib/recipeTree/ingredientTree";
import {printTree} from "../../lib/recipeTree/printTree";


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


  public async getRecipeCraftPrice(item: Item) {
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
      currentItem.nodeBuyPrice = await this.priceFinder.getBuyPrice(currentItem.data.item_id, currentItem.data.count);
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
          this.shortCutMap.set(currentItem.parent.data.item_id, childrenIngredient);
          currentItem.parent.nodeBuyPrice = craftPrice;
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


  // parent ingredients ex : [A]
  private recursiveShortcutResolution(ingredients: Ingredient[], finalList: Ingredient[] = []): Ingredient[] {

    while (ingredients.length > 0) {
      const ingredient = ingredients.pop() as Ingredient;
      const shortcut = this.shortCutMap.get(ingredient.item_id);
      if (shortcut) {
        ingredients.push(...this.recursiveShortcutResolution(shortcut, finalList))
      } else {
        finalList.push(ingredient)
      }
    }
    return finalList;
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
