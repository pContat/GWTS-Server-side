import { chunk, flatten, isEmpty } from 'lodash';
import { HttpService, Injectable } from '@nestjs/common';
import { GWAPI } from './gw-api-type';
import ReceiptDetail = GWAPI.RecipeDetail;
import ItemDetail = GWAPI.ItemDetail;
import Listing = GWAPI.Listing;
import Price = GWAPI.Price;
import { map } from 'rxjs/operators';

@Injectable()
export class GWApiService {
  private readonly lang = 'fr';
  private readonly baseURL = 'https://api.guildwars2.com/v2';
  private readonly recipes = `${this.baseURL}/recipes`;
  private readonly recipeSearch = `${this.baseURL}/recipes/search?output=`;
  private readonly items = `${this.baseURL}/items`;
  private readonly listings = `${this.baseURL}/commerce/listings`;
  private readonly prices = `${this.baseURL}/commerce/prices`;

  constructor(private readonly httpService: HttpService) {}

  get(url: string) {
    return this.httpService
      .get(this.appendLangParam(url))
      .pipe(map(el => el.data))
      .toPromise();
  }

  private appendLangParam(url: string) {
    const lastArg =
      url.indexOf('?') === -1 ? `?lang=${this.lang}` : `&lang=${this.lang}`;
    return url + lastArg;
  }

  getAllRecipesId() {
    return this.get(this.recipes);
  }

  getRecipeDetail(recipeId: number): Promise<ReceiptDetail> {
    return this.get(`${this.recipes}/${recipeId}`);
  }

  getRecipesDetail(recipesIds: number[]): Promise<ReceiptDetail[]> {
    const ids = this.buildIdParams(recipesIds);
    return this.get(this.recipes + ids);
  }

  getAllItemsId(): Promise<number[]> {
    return this.get(this.items);
  }

  getItemDetail(itemId: string): Promise<ItemDetail> {
    return this.get(`${this.items}/${itemId}`);
  }

  //Return information of multiple item
  getItemsDetail(itemsIds: number[]): Promise<ItemDetail[]> {
    let ids = '?ids=' + itemsIds[0];
    for (let i = 1; i < itemsIds.length; i++) {
      ids += ',' + itemsIds[i];
    }
    return this.get(this.items + ids);
  }

  //Search for recipe that create 'item_id''
  async recipeFor(itemId: number) {
    const uri = `${this.recipeSearch}${itemId}`;
    const body = await this.get(uri);
    if (isEmpty(body)) {
      throw new Error('not found');
    }
    return body[0];
  }

  /****** Trade Place  ****/
  async getCommerceListings(itemsIds: number[]): Promise<Listing[]> {
    // splite the request into multiple request of 4 to avoid partial content status
    const requestUriList = this.splitRequest(itemsIds);
    const finalUri = requestUriList.map(ids => this.buildIdParams(ids));
    const requestPromise = finalUri.map(idsURI =>
      this.get(this.listings + idsURI),
    );
    const responseArray: Listing[][] = await Promise.all(requestPromise);
    const flattenArray = flatten(responseArray);
    //cflattenArray.forEach(sortListingByPrice); suppose to be sorted from documentation https://wiki.guildwars2.com/wiki/API:2/commerce/listings
    return flattenArray;
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

  getCommercePrice(itemId: number): Promise<Price> {
    return this.get(`${this.prices}/${itemId}`);
  }

  splitRequest(ids: number[]): number[][] {
    const maxConcurrentId = 4;
    const subRequestNumber = Math.floor(ids.length / maxConcurrentId);
    return chunk(ids, subRequestNumber);
  }

  getCommerceListing(itemId: number): Promise<Listing> {
    return this.get(`${this.listings}/${itemId}`);
  }

  buildIdParams(ids: number[]) {
    let idsString = '?ids=' + ids[0];
    for (let i = 1; i < ids.length; i++) {
      idsString += ',' + ids[i];
    }
    return idsString;
  }
}
