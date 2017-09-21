import * as mongoose from "mongoose";

class MongooseModel {
  protected model: mongoose.Model<mongoose.Document>;
  protected insertedDoc: Map<string, object>;

  constructor(schema: mongoose.Model<mongoose.Document>) {
    this.model = schema;
    this.insertedDoc = new Map<string, object>();
  }

  public getModel() {
    return this.model;
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

  public async get(objectRequest: any) {
    return this.model.find(objectRequest).then((doc: any) => {
      if (!doc) {
        return Promise.reject({
          code: 404
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
