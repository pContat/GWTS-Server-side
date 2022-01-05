import { Injectable, Logger } from '@nestjs/common';
import { isEmpty, map } from 'lodash';
import { GuildWarsAPI } from '../../../gw-api/gw-api-type';
import { TreeNode } from '../../../recipe/type/tree-node';
import { craftingSupplies } from '../../conf/deal-criteria';
import { SearchableRecipeNode } from '../../searchable-recipe-node';
import { BuyableIngredient, BuyingStatus, CraftStatus } from '../../type';
import { TradeListingService } from '../trade-listing/trade-listing.service';
import Listing = GuildWarsAPI.Listing;

@Injectable()
export class PriceFinder {
  logger = new Logger(PriceFinder.name);

  constructor(private readonly tradeListingService: TradeListingService) {}

  async getPriceIfTPBuy(itemId: number, numberToBuy: number): Promise<number> {
    // little error percent here if we use shortcut X time
    // use validator to confirm and mitigate the error
    const npcPriceToBuy = craftingSupplies.get(itemId);
    if (npcPriceToBuy) {
      // always better
      return npcPriceToBuy * numberToBuy;
    }
    const itemListing = await this.tradeListingService.getListing(itemId);
    if (isEmpty(itemListing.sells)) {
      return this.noSaleFoundHandler(itemListing, numberToBuy);
    }
    let total = 0;
    let i = 0;

    //TODO remove item used from listing : cache by recipe finder
    while (numberToBuy > 0) {
      const stackQuantity = itemListing.sells[i].quantity;
      const stackUnitPrice = itemListing.sells[i].unit_price;
      const notEnoughSellInStack = stackQuantity - numberToBuy < 0;
      if (notEnoughSellInStack) {
        total += stackUnitPrice * stackQuantity;
        numberToBuy -= stackQuantity;
        i++;
        if (!itemListing.sells[i]) {
          return BuyingStatus.CANT_BUY;
        }
      } else {
        total += stackUnitPrice * numberToBuy;
        numberToBuy = 0;
      }
    }
    return total;
  }

  public findCraftablePriceForNode(
    item: SearchableRecipeNode<BuyableIngredient>,
  ): number {
    const ingredientsPrice = this.findCraftPrice(item);
    if (ingredientsPrice === CraftStatus.MISSING_INGREDIENT) {
      return CraftStatus.MISSING_INGREDIENT;
    }
    const nodePrice = item.data.buyPrice;
    if (nodePrice === BuyingStatus.CANT_BUY) {
      // case where we can craft a soulbind item
      return ingredientsPrice;
    }
    return ingredientsPrice < nodePrice
      ? ingredientsPrice
      : CraftStatus.NOT_WORTH;
  }

  // case not sell item;

  private noSaleFoundHandler(itemListing: Listing, qtyToBuy: number): number {
    // use buy price to evaluate the item if no sale available
    /*const buyTax = 1.2; // in order to make the item harder
    const firstBuyOffer = itemListing.buys[0];
    return firstBuyOffer
      ? firstBuyOffer.unit_price * buyTax * qtyToBuy
      : CANT_BUY;
      */
    // for now prefer for a can't buy
    return BuyingStatus.CANT_BUY;
  }

  // determinate the total price if we want to craft this item
  // note : the item should be hydrated from recipe finder before
  private findCraftPrice(item: TreeNode<BuyableIngredient>): number {
    const ingredients = map(item.children, 'data');
    const cannotCraft = ingredients.find(
      (ingredient) =>
        ingredient.buyPrice === BuyingStatus.CANT_BUY &&
        (!ingredient.craftPrice || ingredient.craftPrice < 0),
    );
    if (cannotCraft) {
      this.logger.warn(
        `item ${item.data.itemId}: missing ingredient availability`,
      );
      return CraftStatus.MISSING_INGREDIENT;
    }

    // exception if item is not buyable but craftable
    return ingredients.reduce((accumulator, currentValue) => {
      const priceInConsideration =
        currentValue.buyPrice === BuyingStatus.CANT_BUY
          ? currentValue.craftPrice
          : currentValue.buyPrice;
      accumulator += priceInConsideration;
      return accumulator;
    }, 0);
  }
}

export function getTotalPrice(ingredientList: BuyableIngredient[]) {
  return ingredientList.reduce(
    (previousSomme, buyableIngredient: BuyableIngredient) =>
      previousSomme + buyableIngredient.buyPrice,
    0,
  );
}
