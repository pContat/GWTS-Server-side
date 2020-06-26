import {without, isEmpty} from "lodash";
import Listing = GWAPI.Listing;
import {GWAPI} from "../../gw-api/gw-api-type";
import {Injectable, Logger} from "@nestjs/common";
import {ItemDao} from "../../common/service/item.dao";
import {TreeNode} from "../../business-receipt/type";
import {BuyableIngredient} from "../type";
import {SearchableRecipeNode} from "../searchable-recipe-node";
import {RecipeFinderService} from "./recipe-finder.service";
import {TradeListingService} from "./trade-listing.service";


@Injectable()
export class PriceFinder {

  logger = new Logger(PriceFinder.name);
  static readonly CANTBUY = -1;
  static readonly CANTCRAFT = -2;
  private shotCutPriceMap: Map<number, number>;

  constructor(private readonly itemDao : ItemDao,
              private readonly tradeListingService : TradeListingService) {
    // todo : move this to dedicated class or redis
    this.shotCutPriceMap = new Map<number, number>();
  }

  // case : no sell for this item
  public async getBuyPrice(itemId: number, numberToBuy: number): Promise<number> {
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
          return PriceFinder.CANTBUY;
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
    const cantCraft = ingredientsPrice.find((price: number) => price === PriceFinder.CANTBUY);
    if (!isEmpty(cantCraft)) {
      this.logger.error('cant buy it');
      return PriceFinder.CANTCRAFT
    }
    return ingredientsPrice.reduce((a, b) => a + b, 0);
  }

  // case : one of children can't be buy
  // case : can't buy parent
  // return the price to craft the item
  // will tell if buy or sale
  public findBestPriceForNode(item: SearchableRecipeNode<BuyableIngredient>): number {

    const ingredientsPrice = this.findCraftPrice(item);
    if (ingredientsPrice === PriceFinder.CANTCRAFT) {
      return PriceFinder.CANTCRAFT;
    }
    const nodePrice = item.data.buyPrice;
    if (nodePrice === PriceFinder.CANTBUY) {
      return ingredientsPrice;
    }
    return ingredientsPrice < nodePrice ? ingredientsPrice : RecipeFinderService.DONTCRAFT;
  }

  // case not sell item;

  private noSaleFoundHandler(itemListing: Listing): number {
    // use buy price to evaluate
    // todo add taxe percent
    const firstBuyOffer = itemListing.buys[0];
    return firstBuyOffer ? firstBuyOffer.unit_price : PriceFinder.CANTBUY;
  }

}

export function getTotalPrice(ingredientList: BuyableIngredient[]) {
  return ingredientList.reduce((previousSomme, buyableIngredient: BuyableIngredient) => previousSomme + buyableIngredient.buyPrice, 0);
}

