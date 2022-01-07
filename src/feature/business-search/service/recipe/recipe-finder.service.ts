import { Injectable, Logger } from '@nestjs/common';
import { clone, first, isEmpty, isNil, map } from 'lodash';
import { CacheService } from '../../../../core/cache/cache.service';
import { ItemModel } from '../../../item/model/item-model';
import { RecipeModel } from '../../../recipe/model/recipe-model';
import { TreeNode } from '../../../recipe/type/tree-node';
import { SearchableRecipeNode } from '../../searchable-recipe-node';
import { BuyableIngredient, RecipeResult } from '../../type';
import {
  getTotalPrice,
  PriceFinder,
} from '../price-estimation/price-finder.service';

/*
TODO : 
- add over component handling or ratio price (rest after craft)
- add price per item
*/
@Injectable()
export class RecipeFinderService {
  private readonly logger = new Logger(RecipeFinderService.name);

  constructor(
    private readonly priceFinder: PriceFinder,
    private readonly cacheService: CacheService,
  ) {}

  /** @description Find the best recipe to craft the given item*/
  async getRecipeCraftList(
    item: ItemModel & { fromRecipe: RecipeModel },
  ): Promise<RecipeResult | undefined> {
    if (!item.fromRecipe) {
      this.logger.debug(`item ${item.id}: can't craft it`);
      return undefined;
    }
    const recipeTree = this.prepareSearchTree(item);
    // DFS traversal : define all buy price for each node if we want to craft it
    const buyPriceEvaluationNodeList: SearchableRecipeNode<BuyableIngredient>[] =
      [];
    // bottom top traversal : define if crafting is better than buying
    const craftScanStack: SearchableRecipeNode<BuyableIngredient>[] = [];

    craftScanStack.push();

    // optimization purpose : prepare all the listing cache before traversal
    // 05/01/22 : does not seams to improve performance
    //await this.tradeListingService.getListingsForTree(recipeTree);

    // the price of the item if we want to buy it
    const initialItemPrice = await this.priceFinder.getPriceIfTPBuy(item.id, 1);

    // step 1 : defined all buy price for each node
    // will also fil the craftStack
    buyPriceEvaluationNodeList.push(recipeTree);
    while (buyPriceEvaluationNodeList.length > 0) {
      const currentItem = buyPriceEvaluationNodeList.pop();
      if (!currentItem) {
        throw new Error(
          'should not happen, what did you do with the requiredPriceEvaluationNodeList ?',
        );
      }

      // if another tree scan already compute the craft price do not bother recomputing it
      // the shortcut will exist or not if not interesting
      const existingCraftPrice = await this.getExistingCraftPriceScan(
        currentItem.data.itemId,
      );
      if (!isNil(existingCraftPrice)) {
        currentItem.data.craftPrice = existingCraftPrice;
        currentItem.data.buyPrice = await this.getBuyPrice(currentItem);
        this.logger.debug(
          `item ${currentItem.data.itemId}: prevent craft evaluation`,
        );
        // no need to evaluate the children
        continue;
      }

      currentItem.data.buyPrice = await this.getBuyPrice(currentItem);
      // add evaluation for all children
      buyPriceEvaluationNodeList.push(...currentItem.children);
      if (currentItem.data.isCraftable || !isEmpty(currentItem.children)) {
        // only one children is required for craft scan given that we will retrieve all siblings
        craftScanStack.push(first(currentItem.children));
      }
    }

    // step2 : once all buy price are define, for each node, scan if crafting the item is better than buying it
    while (!isEmpty(craftScanStack)) {
      const currentItem = craftScanStack.pop();
      if (!currentItem) {
        throw new Error('what did you do with the craftStack');
      }

      if (currentItem.parent) {
        const craftPrice = this.priceFinder.findCraftablePriceForNode(
          currentItem.parent,
        );

        const parentNode = currentItem.parent.data;
        // do not wait, not worse it
        this.setCraftPriceScan(parentNode.itemId, craftPrice);
        parentNode.craftPrice = craftPrice;

        const craftIsValuable = craftPrice > 0;
        if (craftIsValuable) {
          // WARN : scan sequence can possibly change price estimation
          this.logger.log(
            `shortcut found for item ${parentNode.itemId} : ${parentNode.craftPrice}`,
          );
          // set the parent as the shortcut if the price is interesting
          // meaning : create the parent with child ingredient is more interesting
          const childrenIngredient = map(currentItem.parent.children, 'data');
          await this.setCraftShortcut(parentNode.itemId, childrenIngredient);
        }
      } else {
        this.logger.error(`item ${currentItem.data.itemId}: as no parent`);
      }
    }

    // this.logger.debug('\r\n' + printRecipeTree(recipeTree));

    // step3 : final price estimation
    const finalIngredientList = await this.recursiveShortcutResolution([
      recipeTree.data,
    ]);

    const noRecipeFound =
      first(finalIngredientList).itemId === recipeTree.data.itemId;
    if (noRecipeFound) {
      this.logger.debug(`item ${recipeTree.data.itemId}: no best recipe found`);
      return undefined;
    } else {
      this.logger.debug(`item ${recipeTree.data.itemId}: best recipe found !`);
    }

    //TODO:  add price per item
    const craftPrice = getTotalPrice(finalIngredientList);
    const gain = (initialItemPrice - craftPrice) * 0.85; // we expect to sold it
    return {
      gainRatio: +((gain / craftPrice) * 100).toFixed(2),
      item: {
        itemName: item.name,
        itemLvl: item.level,
      },
      disciplines: item.fromRecipe.disciplines,
      maxLvl: item.fromRecipe.minRating,
      autoLearned: item.fromRecipe.autoLearned,
      gain: gain,
      craftPrice,
      buyPrice: initialItemPrice,
      ingredients: finalIngredientList,
      itemId: item.id,
    };
  }

  // parent ingredients ex : [A]
  private async recursiveShortcutResolution(
    ingredients: BuyableIngredient[],
  ): Promise<BuyableIngredient[]> {
    const initialIngredient = clone(ingredients);
    const finalIngredient: BuyableIngredient[] = [];

    while (initialIngredient.length > 0) {
      const ingredient = initialIngredient.shift();
      const shortcut = await this.getCraftShortcut(ingredient.itemId);
      if (shortcut) {
        finalIngredient.push(
          ...(await this.recursiveShortcutResolution(shortcut)),
        );
      } else {
        finalIngredient.push(ingredient);
      }
    }
    return finalIngredient;
  }

  /** @description Transform the recipe from the item into a searchable tree that allow two way navigation*/
  private prepareSearchTree(item: ItemModel) {
    const recipeTree = item.fromRecipe
      .craftingTree as TreeNode<BuyableIngredient>;
    return new SearchableRecipeNode(recipeTree);
  }

  // ex : If I need to craft 2 parent and to do 1 I need 3 myself but one craft create 2
  private getQuantityToBuy(
    currentItem: SearchableRecipeNode<BuyableIngredient>,
  ) {
    if (currentItem.parent) {
      return (
        (currentItem.data.count * currentItem.parent.data.count) /
        currentItem.parent.data.outputCountIfCraft
      );
    }
    // case when we need 2 item but the parent craft can produce 5 item
    if (currentItem.data.count < 1) {
      return 1;
      // TODO add overcomponent
      // add warning with sell price
      // if( qtyToBuy /currentItem.parent.data.outputCountIfCraft ) < 1 we will have oversupply
    }
    return currentItem.data.count;
  }

  private setCraftPriceScan(itemId, price: number) {
    return this.cacheService.set(this.scanCacheKey(itemId), price);
  }

  private getExistingCraftPriceScan(itemId: number): Promise<number> {
    return this.cacheService.get<number>(
      this.scanCacheKey(itemId),
      () => undefined,
    );
  }

  // if a craft has been found better than buying
  private shortcutCacheKey(itemId: number) {
    return `shortcut_${itemId}`;
  }

  // save price already computed
  private scanCacheKey(itemId: number) {
    return `scan_${itemId}`;
  }

  /** @description : a shortcut mean that the in order to get the itemId, it's preferable to craft it than to buy it*/
  private setCraftShortcut(itemId: number, buyableList: BuyableIngredient[]) {
    return this.cacheService.set(this.shortcutCacheKey(itemId), buyableList);
  }

  public getCraftShortcut(
    itemId: number,
  ): Promise<BuyableIngredient[] | undefined> {
    return this.cacheService.get<BuyableIngredient[]>(
      this.shortcutCacheKey(itemId),
      () => undefined,
    );
  }

  private async getBuyPrice(
    currentItem: SearchableRecipeNode<BuyableIngredient>,
  ) {
    let quantityToBuy = this.getQuantityToBuy(currentItem);
    return await this.priceFinder.getPriceIfTPBuy(
      currentItem.data.itemId,
      quantityToBuy,
    );
  }
}
