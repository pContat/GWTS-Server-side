import ItemModel, {Item, ItemDocument} from "./itemModel";
import {MongooseDAO} from "../../lib/mongo/mongooseDAO";

export class ItemDAO extends MongooseDAO<ItemDocument> {
  constructor() {
    super(ItemModel);
  }

  //Map data from the Api to our structure
  saveItem(itemData: Item) {
    let item: any = new ItemModel(itemData);
    item.top = false;
    item.demande = false;
    // FIXME DO nothing if already in
    return ItemModel.update(
      {id: itemData.id},
      {$setOnInsert: item},
      {upsert: true}
    ).exec();
  }

  async getVendorPrice(itemId: number): Promise<number> {
    const item = await this.findOne({"id": itemId});
    return item.vendor_value;
  }


  /*    db.parents.find(
  {'children.age': {$gte: 18}},
  {children:{$elemMatch:{age: {$gte: 18}}}})*/

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
