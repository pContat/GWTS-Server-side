import {without} from "lodash";
import Listing = GWAPI.Listing;
import {GWAPI} from "../gw-api/gw-api-type";
import {Injectable, Logger} from "@nestjs/common";
import {ItemDao} from "../common/service/item.dao";
import {TreeNode} from "../business-receipt/type";
import {BuyableIngredient} from "./recipe-finder";
import {GWApiService} from "../gw-api/gw-http-api.service";


@Injectable()
export class PriceFinder {

  logger = new Logger(PriceFinder.name);
  readonly CANTBUY = -1;
  readonly CANTCRAFT = -2;
  private commerceListingCache: Map<number, any>;
  private shotCutPriceMap: Map<number, number>;

  constructor(private readonly itemDao : ItemDao, private readonly gwApi : GWApiService) {
    // todo : move this to dedicated class or redis
    this.commerceListingCache = new Map<number, any>();
    this.shotCutPriceMap = new Map<number, number>();
  }

  // case : no sell for this item
  public async getBuyPrice(itemId: number, numberToBuy: number): Promise<number> {
    // todo : use shortcut if found
    // little error percent here if we use shortcut X time
    // use validator to confirm and mitigate the error

    // todo : warning check if purposable before
    let itemListing: Listing = this.commerceListingCache.get(itemId);
    // if no listing it can be found in vendor_value /item
    if (!itemListing) {
      itemListing = await this.listingNotFoundHandler(itemId);
    }

    if (itemListing.sells.length == 0) {
      return this.noSaleFoundHandler(itemListing);
    }
    let total = 0;
    let i = 0;

    //TODO remove from listing : cache by recipe finder
    while (numberToBuy > 0) {
      const stackQuantity = itemListing.sells[i].quantity;
      const stackUnitPrice = itemListing.sells[i].unit_price;
      const notEnoughSellInStack = stackQuantity - numberToBuy < 0;
      if (notEnoughSellInStack) {
        total += stackUnitPrice * stackQuantity;
        numberToBuy -= stackQuantity;
        i++;
        if (!itemListing.sells[i]) {
          return this.CANTBUY;
        }
      } else {
        total += stackUnitPrice * numberToBuy;
        numberToBuy = 0;
      }
    }
    return total;
  }

  public async getListings(ids: number[]): Promise<Listing[]> {
    //check if already cached
    const listings = await this.gwApi.getCommerceListings(ids);
    this.putListingsInCache(listings);
    return listings;
  }


  public getCraftPrice(item: TreeNode<BuyableIngredient>): number {
    const ingredientsPrice = item.children.map(child => child.data.buyPrice);
    const cantCraft = ingredientsPrice.find((price: number) => price === this.CANTBUY);
    if (cantCraft) {
      return this.CANTCRAFT
    }

    return ingredientsPrice.reduce((a, b) => a + b, 0);
  }

  // case not sell item;

  private noSaleFoundHandler(itemListing: Listing): number {
    // use buy price to evaluate
    // todo add taxe percent
    const firstBuyOffer = itemListing.buys[0];
    return firstBuyOffer ? firstBuyOffer.unit_price : this.CANTBUY;
  }

  private async listingNotFoundHandler(itemId: number) {
    this.logger.debug('no listing for ' + itemId);
    const price = await this.itemDao.getVendorPrice(itemId);
    const fakeListing = (price === 0) ? this.createEmptyListing(itemId) : this.createFakeListing(itemId, price);
    this.putListingsInCache([fakeListing]);
    return this.commerceListingCache.get(itemId);
  }

  private createEmptyListing(itemId: number) {
    return {
      id: itemId,
      buys: [],
      sells: []
    };
  }

  // some item can't be buy in trading post but to pnj
  private createFakeListing(itemId: number, price: number): Listing {
    return {
      id: itemId,
      buys: [],
      sells: [{listings: 1, unit_price: price, quantity: 9999}]
    };
  }

  private putListingsInCache(listings: Listing[]) {
    listings.forEach((listing) => {
      this.commerceListingCache.set(listing.id, listing);
    })
  }

  private checkIfCached(ids: number[]) {
    const cachedListing = ids.map(this.commerceListingCache.get);
    const excludeIds = cachedListing.map((listing: Listing) => listing.id);
    const toRequestId = without(ids, ...excludeIds);
    return {
      cache: cachedListing,
      ids: toRequestId
    }
  }
}

export function getTotalPrice(ingredientList: BuyableIngredient[]) {
  return ingredientList.reduce((previousSomme, buyableIngredient: BuyableIngredient) => previousSomme + buyableIngredient.buyPrice, 0);
}

