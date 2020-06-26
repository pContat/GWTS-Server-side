import { Injectable, Logger } from '@nestjs/common';
import { AsyncUtils, CollectionUtils } from '../../core/utils';
import { without, first } from 'lodash';

import { CacheService } from '../../core/cache/cache.service';
import { GWApiService } from '../../gw-api/gw-http-api.service';
import { GWAPI } from '../../gw-api/gw-api-type';
import { ItemDao } from '../../common/service/item.dao';
import Listing = GWAPI.Listing;
import { getAllItemId } from '../../business-receipt/ingredient-tree';
import { SearchableRecipeNode } from '../searchable-recipe-node';

import * as DataLoader from 'dataloader';
import {isNil} from "@nestjs/common/utils/shared.utils";

// will handle the listing cache and batch request with dataloader
@Injectable()
export class TradeListingService {
  logger = new Logger(TradeListingService.name);

  readonly byIdsLoader : DataLoader<number, GWAPI.Listing>;

  constructor(
    private readonly cacheService: CacheService,
    private readonly itemDao: ItemDao,
    private readonly gwApi: GWApiService,
  ) {

    this.byIdsLoader = new DataLoader(async (keys: number[]) => {
      // use this instead method instead of use cache false to get unique id in keys
      this.byIdsLoader.clearAll();
      if (keys.length === 1) {
        const response = await this.gwApi.getCommerceListing(first(keys));
        return [response];
      }
      return  await this.gwApi.getCommerceListings(keys);
    });
  }

  public async getListings(ids: number[]): Promise<Listing[]> {
    const { missingIds, cache } = await this.findNonCachedKeys(ids);
    const listings = await this.gwApi.getCommerceListings(missingIds);

    // not found handler for many key
    const promiseList = ids.map(  (value : number, index : number ) => {
      const itemId = ids[index];
      let listing = listings[index] ;
      return (isNil(listing)) ? this.listingNotFoundHandler(itemId) : Promise.resolve(listing);
    });
    const listingList = await Promise.all(promiseList);
    await this.putListingsInCache(listingList);
    return [...cache, ...listingList];
  }

  public getListingsForTree(recipeTree: SearchableRecipeNode<any>) {
    const ingredientIds = getAllItemId(recipeTree);
    return this.getListings(ingredientIds);
  }

  async getListing(itemId: number): Promise<Listing> {
    const cacheKey = this.listingCacheKey(itemId);
    return await this.cacheService.get<Listing>(cacheKey, async () => {
      const listings = await this.byIdsLoader.load(itemId);
      // if no listing it can be found in vendor_value /item
      if (!listings) {
        return await this.listingNotFoundHandler(itemId);
      }
      return listings;
    });
  }

  private async findNonCachedKeys(ids: number[]) {
    // todo : do race
    const cacheKeys = ids.map(this.listingCacheKey);
    const cachedListing = await this.cacheService.mget(cacheKeys);
    const excludeIds = cachedListing.map((listing: Listing) => listing?.id);
    const toRequestId = without(ids, ...excludeIds);
    return {
      cache: cachedListing.filter(el => !!el),
      missingIds: toRequestId,
    };
  }

  // todo : use mset
  private async putListingsInCache( listings: Listing[]) {
    return await AsyncUtils.asyncForEach(listings, listing => {
      return this.cacheService.set(this.listingCacheKey(listing.id), listing);
    });


  }

  private async listingNotFoundHandler(itemId: number) {
    this.logger.debug('no listing for ' + itemId);
    const price = await this.itemDao.getVendorPrice(itemId);
    return price === 0
      ? this.createEmptyListing(itemId)
      : this.createFakeListing(itemId, price);
  }

  private createEmptyListing(itemId: number): Listing {
    return {
      id: itemId,
      buys: [],
      sells: [],
    };
  }

  // some item can't be buy in trading post but to pnj
  private createFakeListing(itemId: number, price: number): Listing {
    return {
      id: itemId,
      buys: [],
      sells: [{ listings: 1, unit_price: price, quantity: 9999 }],
    };
  }

  private listingCacheKey(id: number) {
    return `listing_${id}`;
  }

}
