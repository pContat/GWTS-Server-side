import { Injectable, Logger } from '@nestjs/common';
import { chunk, flatten, isEmpty } from 'lodash';
import { AsyncUtils, CollectionUtils } from '../../common/utils';
import { GuildWarsAPI } from './gw-api-type';
import { HTTPPoolExecutor } from './http-pool-executor';
import ReceiptDetail = GuildWarsAPI.RecipeDetail;
import ItemDetail = GuildWarsAPI.ItemDetail;
import Listing = GuildWarsAPI.Listing;
import Price = GuildWarsAPI.Price;
import RecipeDetail = GuildWarsAPI.RecipeDetail;

// todo add debug validator to check how many time an item is called
@Injectable()
export class GWApiService {
  logger = new Logger(GWApiService.name);
  private readonly lang = 'fr';
  private readonly baseURL = 'https://api.guildwars2.com/v2';
  private readonly recipes = `${this.baseURL}/recipes`;
  private readonly recipeSearch = `${this.baseURL}/recipes/search?output=`;
  private readonly items = `${this.baseURL}/items`;
  private readonly listings = `${this.baseURL}/commerce/listings`;
  private readonly prices = `${this.baseURL}/commerce/prices`;
  private readonly maxIdPerRequest = 15; //more id per request seams too much

  constructor(private readonly httpService: HTTPPoolExecutor) {}

  async getAllRecipesId(): Promise<RecipeDetail[]> {
    return this.httpService.get(this.recipes);
  }

  getRecipeDetail(recipeId: number): Promise<ReceiptDetail> {
    return this.httpService.get<ReceiptDetail>(`${this.recipes}/${recipeId}`);
  }

  getRecipesDetail(recipesIds: number[]): Promise<ReceiptDetail[]> {
    const ids = this.buildIdParams(recipesIds);
    return this.httpService.get(this.recipes + ids);
  }

  getAllItemsId(): Promise<number[]> {
    return this.httpService.get(this.items);
  }

  getItemDetail(itemId: string): Promise<ItemDetail> {
    return this.httpService.get(`${this.items}/${itemId}`);
  }

  //Return information of multiple item
  getItemsDetail(itemsIds: number[]): Promise<ItemDetail[]> {
    let ids = '?ids=' + itemsIds[0];
    for (let i = 1; i < itemsIds.length; i++) {
      ids += ',' + itemsIds[i];
    }
    return this.httpService.get(this.items + ids);
  }

  //Search for recipe that create 'item_id''
  async recipeFor(itemId: number) {
    const uri = `${this.recipeSearch}${itemId}`;
    const body = await this.httpService.get(uri);
    if (isEmpty(body)) {
      throw new Error('not found');
    }
    return body[0];
  }

  /****** Trade Place  ****/
  async getCommerceListings(itemsIds: number[]): Promise<Listing[]> {
    // split the request into multiple request of max 4 to avoid partial content status
    const requestUriList = this.splitRequest(itemsIds);
    const requestPromise = requestUriList.map(idList =>
      this.handleAllListing(idList),
    );
    // if a listing failed , everything failed
    const responseArray: Listing[][] = await AsyncUtils.settledAll(requestPromise);
    // suppose to be sorted from documentation https://wiki.guildwars2.com/wiki/API:2/commerce/listings
    return flatten(responseArray);
  }

  private async handleAllListing(ids: number[]) {
    try {
      const joinIds = this.buildIdParams(ids);
      const result = await this.httpService.get<Listing[]>(
        this.listings + joinIds,
      );
      // warning the api can omit to return value if it consider as a bad item id
      if (result.length === ids.length) {
        return result;
      }
      return CollectionUtils.ensureOrder({
        docs: result,
        keys: ids,
        prop: 'id',
      });
    } catch (error) {
      // gw api return 404 if no listing for this item
      // response is not available if timeout
      if (error?.response?.status === 404) {
        this.logger.error(`no listing found item ${ids}`);
        return Array(ids.length).fill(undefined);
      }
      throw error;
    }
  }

  getCommercePrice(itemId: number): Promise<Price> {
    return this.httpService.get(`${this.prices}/${itemId}`);
  }

  async getCommerceListing(itemId: number): Promise<Listing> {
    try {
      return await this.httpService.get<Listing>(`${this.listings}/${itemId}`);
    } catch (error) {
      if (error.response.status === 404) {
        this.logger.error(`no listing found item ${itemId}`);
        return undefined;
      }
      throw error;
    }
  }

  sortListingByPrice(itemListing: Listing) {
    // croissant
    itemListing.buys = itemListing.buys.sort(
      (x, y) => x.unit_price - y.unit_price,
    );
    // decroissant
    itemListing.sells = itemListing.sells.sort(
      (x, y) => y.unit_price - x.unit_price,
    );
  }

  private splitRequest(ids: number[]): number[][] {
    return chunk(ids, this.maxIdPerRequest);
  }

  private buildIdParams(ids: number[]) {
    let idsString = '?ids=' + ids[0];
    for (let i = 1; i < ids.length; i++) {
      idsString += ',' + ids[i];
    }
    return idsString;
  }
}
