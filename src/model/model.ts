import * as mongoose from "mongoose";

class MongooseModel {
  protected model: mongoose.Model<mongoose.Document>;

  constructor(schema: mongoose.Model<mongoose.Document>) {
    this.model = schema;
  }

  public getById(objectId: mongoose.Types.ObjectId) {
    return this.model.findById(objectId).then((doc: any) => {
      if (!doc) {
        return Promise.reject({
          code: 404,
          message: `${objectId} doesn't exists`
        });
      } else {
        return Promise.resolve(doc);
      }
    });
  }

  delete(objectId: mongoose.Types.ObjectId): mongoose.DocumentQuery<any, any> {
    return this.model.findOneAndRemove({ _id: objectId });
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
