import { Injectable, Logger } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { TreeNode } from '../../recipe/type/tree-node';
import { GuildWarsAPI } from '../../gw-api/gw-api-type';
import { SearchableRecipeNode } from '../searchable-recipe-node';
import { BuyableIngredient } from '../type';
import { CANT_BUY, CANT_CRAFT, DONT_CRAFT } from './const';
import { TradeListingService } from './trade/trade-listing.service';
import Listing = GuildWarsAPI.Listing;

@Injectable()
export class PriceFinder {
  logger = new Logger(PriceFinder.name);

  private shotCutPriceMap: Map<number, number>;

  constructor(private readonly tradeListingService: TradeListingService) {
    // todo : move this to dedicated class or redis
    this.shotCutPriceMap = new Map<number, number>();
  }

  // case : no sell for this item
  public async getBuyPrice(
    itemId: number,
    numberToBuy: number,
  ): Promise<number> {
    // todo : use shortcut if found
    // little error percent here if we use shortcut X time
    // use validator to confirm and mitigate the error

    const itemListing = await this.tradeListingService.getListing(itemId);

    if (itemListing.sells.length == 0) {
      return this.noSaleFoundHandler(itemListing);
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
          return CANT_BUY;
        }
      } else {
        total += stackUnitPrice * numberToBuy;
        numberToBuy = 0;
      }
    }
    return total;
  }

  // determinate the total price if we want to buy this item
  // note : the item should be hydrated from recipe finder before
  private findCraftPrice(item: TreeNode<BuyableIngredient>): number {
    const ingredientsPrice = item.children.map(child => child.data.buyPrice);
    const cantCraft = ingredientsPrice.find(
      (price: number) => price === CANT_BUY,
    );
    if (!isEmpty(cantCraft)) {
      this.logger.error('cant buy it');
      return CANT_CRAFT;
    }
    return ingredientsPrice.reduce((a, b) => a + b, 0);
  }

  // case : one of children can't be buy
  // case : can't buy parent
  // return the price to craft the item
  // will tell if buy or sale
  public findBestPriceForNode(
    item: SearchableRecipeNode<BuyableIngredient>,
  ): number {
    const ingredientsPrice = this.findCraftPrice(item);
    if (ingredientsPrice === CANT_CRAFT) {
      return CANT_CRAFT;
    }
    const nodePrice = item.data.buyPrice;
    if (nodePrice === CANT_BUY) {
      return ingredientsPrice;
    }
    return ingredientsPrice < nodePrice ? ingredientsPrice : DONT_CRAFT;
  }

  // case not sell item;

  private noSaleFoundHandler(itemListing: Listing): number {
    // use buy price to evaluate
    // todo add taxe percent
    const firstBuyOffer = itemListing.buys[0];
    return firstBuyOffer ? firstBuyOffer.unit_price : CANT_BUY;
  }
}

export function getTotalPrice(ingredientList: BuyableIngredient[]) {
  return ingredientList.reduce(
    (previousSomme, buyableIngredient: BuyableIngredient) =>
      previousSomme + buyableIngredient.buyPrice,
    0,
  );
}
