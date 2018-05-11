import ItemModel, {ItemDocument} from "../../model/item/itemModel";
import {ItemDetail} from "../../model";

export function httpGWItemToItem(itemData: ItemDetail): ItemDocument {
  if (!itemData.name) {
    console.log(itemData.id, 'as no name');
  }
  return new ItemModel(itemData);
}
