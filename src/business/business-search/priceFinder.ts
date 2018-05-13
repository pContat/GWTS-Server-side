import {Ingredient, ItemDAO} from "../../model";
import {getCommerceListings, GWAPI} from "../../lib";
import {without} from "lodash";
import Listing = GWAPI.Listing;


export class PriceFinder {
  itemDAO: ItemDAO;
  readonly CANTBUY = -1;
  private commerceListingCache: Map<number, any>;
  private shortCutMap: Map<number, Ingredient[]>;

  constructor() {
    this.itemDAO = new ItemDAO();
    // todo : move this to dedicated class or redis
    this.commerceListingCache = new Map<number, any>();
    this.shortCutMap = new Map<number, Ingredient[]>();
  }


  public buyPriceToCraft(itemId: number, numberToBuy: number): number {
    const itemListing: Listing = this.commerceListingCache.get(itemId);
    let total = 0;
    let i = 0;
    while (numberToBuy > 0) {
      const stackQuantity = itemListing.sells[i].quantity;
      const stackUnitPrice = itemListing.sells[i].unit_price;
      const notEnoughSellInStack = numberToBuy - stackQuantity;
      if (notEnoughSellInStack) {
        total += stackUnitPrice * stackQuantity;
        numberToBuy -= stackQuantity;
        i++;
        if (!itemListing.sells[i]) {
          return -1;
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
    const listings = await getCommerceListings(ids);
    this.putInCacheListings(listings);
    return listings;
  }

  private putInCacheListings(listings: Listing[]) {
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

