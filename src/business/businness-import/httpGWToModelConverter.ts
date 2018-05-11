import {ItemDetail} from "@model/httpGWApi";
import Item from "@model/item/itemModel";

export function httpGWItemToItem(itemData: ItemDetail): any {
  if (!itemData.name) {
    console.log(itemData.id);
  }
  return new Item(itemData);
}
