import { Injectable, Logger } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';
import DataLoader from 'dataloader';
import { without } from 'lodash';
import { AsyncUtils, CollectionUtils } from '../../../../common/utils';
import { CacheService } from '../../../../core/cache/cache.service';
import { GuildWarsAPI } from '../../../gw-api/gw-api-type';
import { GWApiService } from '../../../gw-api/gw-http-api.service';
import { ItemDao } from '../../../item/service/item.dao';
import { getAllItemId } from '../../../recipe/ingredient-tree';
import { SearchableRecipeNode } from '../../searchable-recipe-node';

import Listing = GuildWarsAPI.Listing;

/** @description Will handle the listing request (with bath and cache to prevent ban) */

@Injectable()
export class TradeListingService {
  private readonly logger = new Logger(TradeListingService.name);

  private readonly byIdsLoader: DataLoader<number, GuildWarsAPI.Listing>;

  constructor(
    private readonly cacheService: CacheService,
    private readonly itemDao: ItemDao,
    private readonly gwApi: GWApiService,
  ) {
    this.byIdsLoader = new DataLoader(async (keys: number[]) => {
      this.logger.verbose('by id loader ' + keys.length);
      // use this instead method instead of use cache false to get unique id in keys
      this.byIdsLoader.clearAll();
      const result = await this.gwApi.getCommerceListings(keys);
      return CollectionUtils.ensureOrder({
        docs: result,
        keys,
        prop: 'id',
      });
    });
  }

  async getListings(ids: number[]): Promise<Listing[]> {
    const { missingIds, cache } = await this.findNonCachedKeys(ids);
    const listings = await this.gwApi.getCommerceListings(missingIds);

    // not found handler for many key
    const promiseList = ids.map((value: number, index: number) => {
      const itemId = ids[index];
      const listing = listings[index];
      return isNil(listing)
        ? this.listingNotFoundHandler(itemId)
        : Promise.resolve(listing);
    });
    const listingList = await Promise.all(promiseList);
    await this.putListingsInCache(listingList);
    return [...cache, ...listingList];
  }

  async getListing(itemId: number): Promise<Listing> {
    const cacheKey = this.listingCacheKey(itemId);
    return await this.cacheService.get<Listing>(cacheKey, async () => {
      const listings = await this.byIdsLoader.load(itemId);
      // if no listing it can be found in vendor_value /item
      if (!listings) {
        // todo caution with vendor price here
        return await this.listingNotFoundHandler(itemId);
      }
      return listings;
    });
  }

  getListingsForTree(recipeTree: SearchableRecipeNode<any>) {
    const ingredientIds = getAllItemId(recipeTree);
    return this.getListings(ingredientIds);
  }

  private async findNonCachedKeys(ids: number[]) {
    const cacheKeys = ids.map(this.listingCacheKey);
    const cachedListing = await this.cacheService.mget(cacheKeys);
    const excludeIds = cachedListing.map((listing: Listing) => listing?.id);
    const toRequestIds = without(ids, ...excludeIds);
    return {
      cache: cachedListing.filter((el) => !!el) as Listing[],
      missingIds: toRequestIds,
    };
  }

  // TODO : use mset
  private async putListingsInCache(listings: Listing[]) {
    return await AsyncUtils.asyncForEach(listings, (listing) => {
      return this.cacheService.set(this.listingCacheKey(listing.id), listing);
    });
  }

  private async listingNotFoundHandler(itemId: number) {
    this.logger.debug('no listing for ' + itemId);
    const price = await this.itemDao.getVendorPrice(itemId);
    return price === 0
      ? this.createEmptyListing(itemId)
      : this.createFakeNPCListing(itemId, price);
  }

  private createEmptyListing(itemId: number): Listing {
    return {
      id: itemId,
      buys: [],
      sells: [],
    };
  }

  // some item can't be buy in trading post but to pnj
  private createFakeNPCListing(itemId: number, price: number): Listing {
    return {
      id: itemId,
      buys: [],
      sells: [{ listings: 1, unit_price: price, quantity: 99999 }],
    };
  }

  private listingCacheKey(id: number) {
    return `listing_${id}`;
  }
}
