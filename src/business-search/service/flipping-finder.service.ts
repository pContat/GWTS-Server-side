import {Injectable, Logger} from "@nestjs/common";
import {AsyncUtils} from "../../core/utils";
import {without} from "lodash";

import {CacheService} from "../../core/cache/cache.service";
import {GWApiService} from "../../gw-api/gw-http-api.service";
import {GWAPI} from "../../gw-api/gw-api-type";
import {ItemDao} from "../../common/service/item.dao";
import Listing = GWAPI.Listing;


// will handle the listing cache and parrallele request
@Injectable()
export class TradeListingService {
  logger = new Logger(TradeListingService.name);

  constructor(private readonly cacheService : CacheService,
              private readonly itemDao : ItemDao,
              private readonly gwApi : GWApiService) {
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

  private listingCacheKey(id : number){
    return `listing_${id}`;
  }

  public async getListings(ids: number[]): Promise<Listing[]> {
    const { missingIds,cache } = await this.findNonCachedKeys(ids);
    const listings = await this.gwApi.getCommerceListings(missingIds);
    await this.putListingsInCache(listings);
    return [ ...cache , ... listings];
  }

  private async findNonCachedKeys(ids: number[]) {
    // todo : do race
    const cacheKeys = ids.map(this.listingCacheKey);
    const cachedListing = await this.cacheService.mget(cacheKeys);
    const excludeIds = cachedListing.map((listing: Listing) => listing?.id);
    const toRequestId = without(ids, ...excludeIds);
    return {
      cache: cachedListing.filter( (el) => !!el),
      missingIds: toRequestId
    }
  }

  // todo : change this for mset
  private async putListingsInCache(listings: Listing[]) {
    return await AsyncUtils.asyncForEach(listings,(listing) => {
      return this.cacheService.set(this.listingCacheKey(listing.id), listing);
    })
  }

  async getListing(itemId: number): Promise<Listing> {
    // todo : warning check if buyable before
    const cacheKey = this.listingCacheKey(itemId);
    return await this.cacheService.get<Listing>(cacheKey , async() => {
      const listings = await this.gwApi.getCommerceListing(itemId);
      // if no listing it can be found in vendor_value /item
      if (!listings) {
        return await this.listingNotFoundHandler(itemId);
      }
    });

  }

  private async listingNotFoundHandler(itemId: number) {
    this.logger.debug('no listing for ' + itemId);
    const price = await this.itemDao.getVendorPrice(itemId);
    return (price === 0) ? this.createEmptyListing(itemId) : this.createFakeListing(itemId, price);
  }
}
