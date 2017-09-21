import { default as Item, ItemType } from "./itemSchema";
import { MongooseModel } from "../model";

export class ItemModel extends MongooseModel {
  constructor() {
    super(Item);
  }

  //Map data from the Api to our structure
  saveItem(itemData: ItemType) {
    let item: any = new Item(itemData);
    item.top = false;
    item.demande = false;
    // FIXME DO nothing if already in
    return Item.update(
      { id: itemData.id },
      { $setOnInsert: item },
      { upsert: true }
    ).exec();
  }

  //Todo : use findOneAndUpdate
  // update(item_id, data) {
  //   return Item.findById(item_id)
  //     .then(function(err, item) {
  //       //Alter item here
  //       return item.save();
  //     })
  //     .catch(function(err) {
  //       console.log(err);
  //     });
  // }
}
