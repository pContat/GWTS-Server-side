import ItemModel, {Item, ItemDocument} from "./itemModel";
import {MongooseDAO} from "../../lib/mongo/mongooseDAO";
import {DealCritera} from "../../business/business-search/dealCritera";
import logger from "../../lib/logger/logger";

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

  async getCriteriaItem(criteria: DealCritera) {
    const condition = this.buildCriteriaQuery(criteria);
    logger.info(condition);
    return await this.find(condition);

  }

  private buildCriteriaQuery(criterias: DealCritera) {
    const criteria: any[] = [];

    // do not handle buy and sell

    criteria.push(
      {"fromRecipe": {$ne: null}}
    );

    if (criterias.doNotEvaluate.flags.length) {
      criteria.push({"flags": {"$nin": criterias.doNotEvaluate.flags}});
    }
    if (criterias.doNotEvaluate.types.length) {
      criteria.push({"types": {"$nin": criterias.doNotEvaluate.types}});
    }
    if (criterias.doNotEvaluate.rarity.length) {
      criteria.push({"rarity": {"$nin": criterias.doNotEvaluate.rarity}});
    }
    return criteria.length > 1 ? {$and: [...criteria]} : criteria[0];

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
