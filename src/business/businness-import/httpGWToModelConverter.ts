import ItemModel, {ItemDocument} from "../../model/item/itemModel";
import {GWAPI} from "../../model";
import ItemDetail = GWAPI.ItemDetail;

export function httpGWItemToItem(itemData: ItemDetail): ItemDocument {
  if (!itemData.name) {
    console.log(itemData.id, 'as no name');
  }

  return new ItemModel(itemData);
}
