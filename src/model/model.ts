import * as mongoose from "mongoose";

class MongooseModel {
  protected model: mongoose.Model<mongoose.Document>;

  constructor(schema: mongoose.Model<mongoose.Document>) {
    this.model = schema;
  }

  public get(objectId: mongoose.Types.ObjectId) {
    return this.model.findOne({ item_id: objectId });
  }

  delete(objectId: mongoose.Types.ObjectId) {
    return this.model.remove({ _id: objectId });
  }

  gets(objectIds: Array<mongoose.Types.ObjectId>) {
    return this.model.find({
      item_id: {
        $in: objectIds
      }
    });
  }
}

export { MongooseModel };
