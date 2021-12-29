import { Injectable, Logger } from '@nestjs/common';
import { clone, isEmpty, isNil, map } from 'lodash';
import { printRecipeTree } from '../../../recipe/print-tree';
import { TreeNode } from '../../../recipe/type/tree-node';
import { ItemModel } from '../../../item/model/item-model';
import { CacheService } from '../../../../core/cache/cache.service';
import { SearchableRecipeNode } from '../../searchable-recipe-node';
import { BuyableIngredient, RecipeResult } from '../../type';
import { getTotalPrice, PriceFinder } from '../price-finder.service';
import { TradeListingService } from '../trade/trade-listing.service';

/**
 * Find the best recipe to craft the given item
 * will find the craft vs buy price and cache any shortcut for the craft (when item worst craft)
 */
@Injectable()
export class RecipeFinderService {
  logger = new Logger(RecipeFinderService.name);


  constructor(
    private readonly priceFinder: PriceFinder,
    private readonly tradeListingService: TradeListingService,
    private readonly cacheService: CacheService,
  ) {}

  // if a craft has been found better than buying
  private shortCutCacheKey(itemId: number) {
    return `shortcut_${itemId}`;
  }

  // save price already computed
  private evaluationCacheKey(itemId: number) {
    return `eval_${itemId}`;
  }

  private setShortcut(itemId, buyableList: BuyableIngredient[]) {
    return this.cacheService.set(this.shortCutCacheKey(itemId), buyableList);
  }

  public getShortCut(itemId: number): Promise<BuyableIngredient[] | undefined> {
    return this.cacheService.get<BuyableIngredient[]>(
      this.shortCutCacheKey(itemId),
      () => undefined,
    );
  }

  public async getRecipeCraftList(
    item: ItemModel,
  ): Promise<RecipeResult | undefined> {
    if (!item.fromRecipe) {
      this.logger.log(`can t craft item ${item.id}`);
      return undefined;
    }
    const recipeTree = await this.prepareSearchTree(item);
    // DFS traversal : define all buy price for each node if we want to craft it
    const requiredPriceEvaluationNodeList: SearchableRecipeNode<
      BuyableIngredient
    >[] = [];
    // bottom top traversal : define if crafting is better than buying
    const craftStack: SearchableRecipeNode<BuyableIngredient>[] = [];

    requiredPriceEvaluationNodeList.push(recipeTree);
    craftStack.push();

    // optimisation purpose : prepare all the listing
    await this.tradeListingService.getListingsForTree(recipeTree);
    // todo : do not bother if item do not match min sell / buy
    // we do not want to create an item that does not sell

    // the price of the item if we want to buy it
    const initialItemPrice = await this.priceFinder.getBuyPrice(item.id, 1);

    // step 1 : defined all buy price for each node
    while (requiredPriceEvaluationNodeList.length > 0) {
      const currentItem = requiredPriceEvaluationNodeList.pop();
      if (!currentItem) {
        throw new Error('what did you do with the price stack');
      }

      // if another already get the price do not bother
      // the shortcut will exist or not if not interesting
      const existingPrice = await this.getEval(currentItem.data.itemId);
      if (!isNil(existingPrice)) {
        this.logger.debug(
          `prevent re evaluation of item ${currentItem.data.itemId}`,
        );
        continue;
      }
      currentItem.data.buyPrice = await this.getBuyPrice(currentItem);
      // add evaluation for all children
      requiredPriceEvaluationNodeList.push(...currentItem.children);
      if (currentItem.data.isCraftable || !isEmpty(currentItem.children)) {
        // only one children is required for craft check, it'll check the parent
        craftStack.push(currentItem.children[0]);
      }
    }

    // step2 :  define if crafting is better than buying for each node
    while (craftStack.length > 0) {
      const currentItem = craftStack.pop();
      if (!currentItem) {
        throw new Error('what did you do with the shortcut price stack');
      }
      // set the parent as the shortcut if the price is interesting
      // meaning : create the parent with child ingredient is more interesting
      if (currentItem.parent) {
        const craftPrice = this.priceFinder.findBestPriceForNode(
          currentItem.parent,
        );

        // do not wait, not worse it
        this.setEval(currentItem.parent.data.itemId, craftPrice);

        currentItem.parent.data.craftPrice = craftPrice;

        if (craftPrice > 0) {
          currentItem.parent.data.originalBuyPrice =
            currentItem.parent.data.buyPrice;
          currentItem.parent.data.buyPrice = craftPrice; // for other
          const siblings = currentItem.parent.children;
          const childrenIngredient = map(siblings, 'data');
          // it's better to craft than to buy
          this.logger.log(
            `shortcut found for item ${currentItem.parent.data.itemId} : ${currentItem.parent.data.craftPrice}`,
          );

          // check if it can be serialized
          await this.setShortcut(
            currentItem.parent.data.itemId,
            childrenIngredient,
          );
        }
      } else {
        this.logger.error(`item ${currentItem.data.itemId} without parent`);
      }
    }

    this.logger.debug('\r\n' + printRecipeTree(recipeTree));
    // step3 : final price
    const finalIngredientList = await this.recursiveShortcutResolution([
      recipeTree.data,
    ]);
    if (finalIngredientList[0].itemId === recipeTree.data.itemId) {
      this.logger.log('no best recipe found for ' + recipeTree.data.itemId);
      return undefined;
    }
    //todo add price per item !
    return {
      finalPrice: getTotalPrice(finalIngredientList),
      initialPrice: initialItemPrice,
      ingredients: finalIngredientList,
      itemId: item.id,
    } as RecipeResult;
  }

  // parent ingredients ex : [A]
  private async recursiveShortcutResolution(
    ingredients: BuyableIngredient[],
  ): Promise<BuyableIngredient[]> {
    const initialIngredient = clone(ingredients);
    const finalIngredient: BuyableIngredient[] = [];

    while (initialIngredient.length > 0) {
      const ingredient = initialIngredient.shift() as BuyableIngredient;
      const shortcut = await this.getShortCut(ingredient.itemId);
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

  private async prepareSearchTree(
    item: ItemModel,
  ): Promise<SearchableRecipeNode<BuyableIngredient>> {
    const recipeTree = item.fromRecipe.craftingTree as TreeNode<
      BuyableIngredient
    >;
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
    return currentItem.data.count;
  }

  private setEval(itemId, price: number) {
    return this.cacheService.set(this.evaluationCacheKey(itemId), price);
  }

  public getEval(itemId: number): Promise<number> {
    return this.cacheService.get<number>(
      this.evaluationCacheKey(itemId),
      () => undefined,
    );
  }

  private async getBuyPrice(
    currentItem: SearchableRecipeNode<BuyableIngredient>,
  ) {
    let quantityToBuy = this.getQuantityToBuy(currentItem);
    // need 2 item but the parent craft can produce 5 item
    if (quantityToBuy < 1) {
      quantityToBuy = 1;
      // TODO add overcomponent
      // add warning with sell price
      // if( qtyToBuy /currentItem.parent.data.outputCountIfCraft ) < 1 we will have oversupply
    }
    return await this.priceFinder.getBuyPrice(
      currentItem.data.itemId,
      quantityToBuy,
    );
  }
}
