import request from "request-promise-native";
import {GWAPI} from "../../model/index";
import {chunk, flatten} from "lodash";
import ReceiptDetail = GWAPI.ReceiptDetail;
import ItemDetail = GWAPI.ItemDetail;
import Listing = GWAPI.Listing;
import Price = GWAPI.Price;

const lang = 'fr';


class GWUri {
  static readonly baseURL = "https://api.guildwars2.com/v2";
  static readonly recipes = `${GWUri.baseURL}/recipes`;
  static readonly recipeSearch = `${GWUri.baseURL}/recipes/search?output=`;
  static readonly items = `${GWUri.baseURL}/items`;
  static readonly listings = `${GWUri.baseURL}/commerce/listings`;
  static readonly prices = `${GWUri.baseURL}/commerce/prices`;
}

function get(url: string): request.RequestPromise {
  url +=
    url.indexOf("?") === -1 ? "?lang=" + lang : "&lang=" + lang;

  const options: request.Options = {
    method: "GET",
    uri: url,
    json: true
  };
  return request(options);
}

export function getAllRecipesId() {
  return get(GWUri.recipes);
}

export function getRecipeDetail(recipeId: number): Promise<ReceiptDetail> {
  return get(GWUri.recipes + "/" + recipeId);
}

export function getRecipesDetail(recipesIds: number[]): Promise<ReceiptDetail[]> {
  let ids = buildIdParams(recipesIds);
  return get(GWUri.recipes + ids);
}

export function getAllItemsId(): Promise<number[]> {
  return get(GWUri.items);
}

export function getItemDetail(itemId: string): Promise<ItemDetail> {
  return get(GWUri.items + "/" + itemId);
}

//Return information of multiple item
export function getItemsDetail(itemsIds: number[]): Promise<ItemDetail[]> {
  let ids = "?ids=" + itemsIds[0];
  for (let i = 1; i < itemsIds.length; i++) {
    ids += "," + itemsIds[i];
  }
  return get(GWUri.items + ids);
}

//Search for recipe that create 'item_id''
export function recipeFor(itemId: number) {
  var uri = `${GWUri.recipeSearch}${itemId}`;
  return get(uri).then(
    (body: any) =>
      body.length > 0 ? Promise.resolve(body[0]) : Promise.reject("not found")
  );
}

/****** Trade Place  ****/
export async function getCommerceListings(itemsIds: number[]): Promise<Listing[]> {
  // splite the request into multiple request of 4 to avoid partial content status
  const requestUriList = splitRequest(itemsIds);
  const finalUri = requestUriList.map(buildIdParams);
  const requestPromise = finalUri.map((idsURI) => get(GWUri.recipes + idsURI));
  const responseArray: Listing[][] = await Promise.all(requestPromise);
  const flattenArray = flatten(responseArray);
  //cflattenArray.forEach(sortListingByPrice); suppose to be sorted from documentation https://wiki.guildwars2.com/wiki/API:2/commerce/listings
  return flattenArray;

}

export function sortListingByPrice(itemListing: Listing) {
  // croissant
  itemListing.buys = itemListing.buys.sort((x, y) => x.unit_price - y.unit_price);
  // decroissant
  itemListing.sells = itemListing.sells.sort((x, y) => y.unit_price - x.unit_price);
}


export function getCommercePrice(itemId: number): Promise<Price> {
  return get(GWUri.prices + "/" + itemId);
}

function splitRequest(ids: number[]): number[][] {
  const maxConcurentId = 4;
  const subRequestNumber = Math.floor(ids.length / maxConcurentId);
  return chunk(ids, subRequestNumber);
}

export function getCommerceListing(itemId: number): Promise<Listing> {
  return get(GWUri.listings + "/" + itemId);
}

function buildIdParams(ids: number[]) {
  let idsString = "?ids=" + ids[0];
  for (let i = 1; i < ids.length; i++) {
    idsString += "," + ids[i];
  }
  return idsString;
}
