import request from "request-promise-native";
import {GWAPI} from "../model";
import ReceiptDetail = GWAPI.ReceiptDetail;
import ItemDetail = GWAPI.ItemDetail;

const lang = 'fr';


class GWUri {
  static readonly baseURL = "https://api.guildwars2.com/v2";
  static readonly recipes = `${GWUri.baseURL}/recipes`;
  static readonly recipeSearch = `${GWUri.baseURL}/recipes/search?output=`;
  static readonly items = `${GWUri.baseURL}/items`;
  static readonly listings = `${GWUri.baseURL}/listings`;
  static readonly prices = `${GWUri.baseURL}/prices`;
}

export class GWHttpHelper {
  static get(url: string): request.RequestPromise {
    url +=
      url.indexOf("?") === -1 ? "?lang=" + lang : "&lang=" + lang;

    const options: request.Options = {
      method: "GET",
      uri: url,
      json: true
    };
    return request(options);
  }


  static getAllRecipesId() {
    return this.get(GWUri.recipes);
  }

  static recipeDetail(recipeId: string): Promise<ReceiptDetail> {
    return this.get(GWUri.recipes + "/" + recipeId);
  }

  static recipesDetail(recipesIds: string[]): Promise<ReceiptDetail[]> {
    let ids = GWHttpHelper.buildIdParams(recipesIds);
    return this.get(GWUri.recipes + ids);
  }

  static getAllItemsId(): Promise<number[]> {
    return this.get(GWUri.items);
  }

  static itemDetail(itemId: string): Promise<ItemDetail> {
    return this.get(GWUri.items + "/" + itemId);
  }

  //Return information of multiple item
  static itemsDetail(itemsIds: string[]): Promise<ItemDetail[]> {
    let ids = "?ids=" + itemsIds[0];
    for (let i = 1; i < itemsIds.length; i++) {
      ids += "," + itemsIds[i];
    }
    return this.get(GWUri.items + ids);
  }

  //Search for recipe that create 'item_id''
  static recipeFor(itemId: string) {
    var uri = `${GWUri.recipeSearch}${itemId}`;
    return this.get(uri).then(
      (body: any) =>
        body.length > 0 ? Promise.resolve(body[0]) : Promise.reject("not found")
    );
  }

  /****** Trade Place  ****/
  static getCommerceListings(itemsIds: string[]) {
    // splite the request into multiple request of 4 to avoid partial content status
    let ids = "?ids=";
    const listingRequested = itemsIds.length;

    let promiseArray = [];
    for (let i = 0; i < listingRequested; i++) {
      ids += itemsIds[i] + ",";
      //(X & 3) => x % 4
      const modulo4OrLast = ((i + 1) & 3) === 0 || i === listingRequested - 1;
      if (modulo4OrLast) {
        //remove the last ','
        ids = ids.substring(0, ids.length - 1);
        promiseArray.push(this.get(GWUri.listings + ids));
        //initialise the next request
        ids = "?ids=";
      }
    }
    return Promise.all(promiseArray);
  }

  static commerceListing(itemId: string) {
    return this.get(GWUri.listings + "/" + itemId);
  }

  static commercePrice(itemId: string) {
    return this.get(GWUri.prices + "/" + itemId);
  }

  private static buildIdParams(ids: string[]) {
    let idsString = "?ids=" + ids[0];
    for (let i = 1; i < ids.length; i++) {
      idsString += "," + ids[i];
    }
    return idsString;
  }
}
