import ItemModel, {ItemDocument} from "../../model/item/itemModel";
import {GWAPI} from "./gwApiModel";
import logger from "../logger/logger";
import ItemDetail = GWAPI.ItemDetail;

export function GWApiItemToItem(itemData: ItemDetail): ItemDocument {
  if (!itemData.name) {
    logger.warning(`${itemData.id} as no name`);
  }
  return new ItemModel(itemData);
}
