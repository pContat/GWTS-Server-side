import { Injectable, Logger } from '@nestjs/common';
import { chunk, flatten, isEmpty } from 'lodash';
import { AsyncUtils } from '../../common/utils';
import { GuildWarsAPI } from './gw-api-type';
import { HTTPPoolExecutor } from './http-pool-executor';
import ReceiptDetail = GuildWarsAPI.RecipeDetail;
import ItemDetail = GuildWarsAPI.ItemDetail;
import Listing = GuildWarsAPI.Listing;
import Price = GuildWarsAPI.Price;
import RecipeDetail = GuildWarsAPI.RecipeDetail;

@Injectable()
export class GWApiService {
  private readonly logger = new Logger(GWApiService.name);
  private readonly lang = 'fr';
  private readonly baseURL = 'https://api.guildwars2.com/v2';
  private readonly recipes = `${this.baseURL}/recipes`;
  private readonly recipeSearch = `${this.baseURL}/recipes/search?output=`;
  private readonly items = `${this.baseURL}/items`;
  private readonly listings = `${this.baseURL}/commerce/listings`;
  private readonly prices = `${this.baseURL}/commerce/prices`;
  private readonly maxIdsPerRequest = 15; //more id per request seams too much

  constructor(private readonly httpService: HTTPPoolExecutor) {}

  async getAllRecipesId(): Promise<RecipeDetail[]> {
    return this.httpService.get(this.appendLangParam(this.recipes));
  }

  getRecipeDetail(recipeId: number): Promise<ReceiptDetail> {
    return this.httpService.get<ReceiptDetail>(
      this.appendLangParam(`${this.recipes}/${recipeId}`),
    );
  }

  getRecipesDetail(recipesIds: number[]): Promise<ReceiptDetail[]> {
    const ids = this.buildIdParams(recipesIds);
    return this.httpService.get(this.appendLangParam(this.recipes + ids));
  }

  getAllItemsId(): Promise<number[]> {
    return this.httpService.get(this.appendLangParam(this.items));
  }

  getItemDetail(itemId: string): Promise<ItemDetail> {
    return this.httpService.get(
      this.appendLangParam(`${this.items}/${itemId}`),
    );
  }

  getItemsDetail(itemsIds: number[]): Promise<ItemDetail[]> {
    const ids = this.buildIdParams(itemsIds);
    return this.httpService.get(this.appendLangParam(this.items + ids));
  }

  /** @description Search for recipe that create 'item_id' */
  async recipeFor(itemId: number) {
    const uri = `${this.recipeSearch}${itemId}`;
    const body = await this.httpService.get(this.appendLangParam(uri));
    if (isEmpty(body)) {
      throw new Error('not found');
    }
    return body[0];
  }

  /****** Trade Place  ****/
  async getCommerceListings(
    itemsIds: number[],
  ): Promise<Listing[] | undefined> {
    // split the request into multiple request to avoid partial content status
    const requestUriList = this.splitRequest(itemsIds);
    const requestPromise = requestUriList.map((idList) =>
      this.handleAllListing(idList),
    );
    // if a listing failed, everything failed
    const responseArray: Listing[][] = await AsyncUtils.settledAll(
      requestPromise,
    );
    // suppose to be sorted from documentation https://wiki.guildwars2.com/wiki/API:2/commerce/listings
    return flatten(responseArray);
  }

  getCommercePrice(itemId: number): Promise<Price> {
    return this.httpService.get(
      this.appendLangParam(`${this.prices}/${itemId}`),
    );
  }

  async getCommerceListing(itemId: number): Promise<Listing> {
    try {
      return await this.httpService.get<Listing>(
        this.appendLangParam(`${this.listings}/${itemId}`),
      );
    } catch (error) {
      if (error.response.status === 404) {
        this.logger.error(`no listing found item ${itemId}`);
        return undefined;
      }
      throw error;
    }
  }

  sortListingByPrice(itemListing: Listing) {
    itemListing.buys = itemListing.buys.sort(
      (x, y) => x.unit_price - y.unit_price,
    );
    itemListing.sells = itemListing.sells.sort(
      (x, y) => y.unit_price - x.unit_price,
    );
  }

  private async handleAllListing(ids: number[]) {
    try {
      const joinIds = this.buildIdParams(ids);
      const result = await this.httpService.get<Listing[]>(
        this.appendLangParam(this.listings + joinIds),
      );
      // warning the api can omit to return value if it consider as a bad item id
      if (result.length === ids.length) {
        return result;
      }
    } catch (error) {
      // gw api return 404 if no listing for this item
      // response is not available if timeout
      if (error?.response?.status === 404) {
        this.logger.error(`item ${ids.join(',')}: no listing found `);
        return Array(ids.length).fill(undefined);
      }
      throw error;
    }
  }

  private splitRequest(ids: number[]): number[][] {
    return chunk(ids, this.maxIdsPerRequest);
  }

  private buildIdParams(ids: number[]) {
    return `?ids=${ids.join(',')}`;
  }

  private appendLangParam(url: string) {
    const lastArg =
      url.indexOf('?') === -1 ? `?lang=${this.lang}` : `&lang=${this.lang}`;
    return url + lastArg;
  }
}
