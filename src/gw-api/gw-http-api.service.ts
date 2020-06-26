import {chunk, flatten, isEmpty} from 'lodash';
import {HttpService, Injectable, Logger} from '@nestjs/common';
import {GWAPI} from './gw-api-type';
import {bufferCount, concatMap, delay, filter, first, flatMap, map, share,} from 'rxjs/operators';
import {of, Subject} from 'rxjs';
import {CollectionUtils, ObservableFunction} from '../core/utils';
import ReceiptDetail = GWAPI.RecipeDetail;
import ItemDetail = GWAPI.ItemDetail;
import Listing = GWAPI.Listing;
import Price = GWAPI.Price;
import RecipeDetail = GWAPI.RecipeDetail;


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


  constructor(private readonly httpService: HttpService) {}

  static requestCount = 0; // used as id
  public pendingRequest = new Subject<{ id: number; callback: ObservableFunction }>();
  // no more than 10 req / s
  public httpRequestPoolExecutor = this.pendingRequest.asObservable().pipe(
    bufferCount(1),
    concatMap(data => of(data).pipe(delay(200))),
    flatMap(e => e), // or mergeAll() or concatAll()
    flatMap( el => {
      return el.callback().pipe(map( response => {
        return { id : el.id , response}
      }));
    }),
    share(),
  );

  get<T>(url: string): Promise<T> {
    const requestId = GWApiService.requestCount++;
    return new Promise((resolve, reject) => {
      const callback = () => {
        this.logger.debug(`do call ${requestId} : ${url}`);
        return this.httpService
          .get(this.appendLangParam(url))
          .pipe(
            first(),
            map(el => el.data),
          )
      };

      const notifier = this.httpRequestPoolExecutor
        .pipe(
          filter(el => el.id === requestId),
          map(el => el.response as T),
            first(),
        )
        .subscribe( resolve, reject);

      this.pendingRequest.next({ id: requestId, callback });


    });
  }

  async getAllRecipesId(): Promise<RecipeDetail[]> {
    return this.get(this.recipes);
  }

  getRecipeDetail(recipeId: number): Promise<ReceiptDetail> {
    return this.get<ReceiptDetail>(`${this.recipes}/${recipeId}`);
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
    const requestPromise = requestUriList.map(idList => this.handleAllListing(idList));
    const responseArray: Listing[][] = await Promise.all(requestPromise);
    //cflattenArray.forEach(sortListingByPrice);
    // suppose to be sorted from documentation https://wiki.guildwars2.com/wiki/API:2/commerce/listings
    return flatten(responseArray);
  }

  private async handleAllListing(ids : number[]){
    try {
      const joinIds  = this.buildIdParams(ids);
      const result =  await this.get<Listing[]>(this.listings + joinIds);
      // warning the api can ommit to return value if it considere a bad item id
      if (result.length === ids.length) {
        return result;
      }
      return CollectionUtils.ensureOrder({
        keys : ids,
        docs: result,
        prop: 'id',
      });
    } catch (error) {
      if (error.response.status === 404) {
        this.logger.error(`no listing found item ${ids}`);
        return Array(ids.length).fill(undefined);
      }
      throw error;
    }
  }


  getCommercePrice(itemId: number): Promise<Price> {
    return this.get(`${this.prices}/${itemId}`);
  }

  async getCommerceListing(itemId: number): Promise<Listing> {
     try {
       return  await this.get<Listing>(`${this.listings}/${itemId}`);
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

  private appendLangParam(url: string) {
    const lastArg =
        url.indexOf('?') === -1 ? `?lang=${this.lang}` : `&lang=${this.lang}`;
    return url + lastArg;
  }

}
