import {Document, DocumentQuery, Model, Types} from "mongoose";

class MongooseDAO<T extends Document> {
  protected insertedDoc: Map<string, object>;

  constructor(schema: Model<T>) {
    this._model = schema;
    this.insertedDoc = new Map<string, object>();
  }

  protected _model: Model<T>;

  get model() {
    return this._model;
  }

  public async getById(objectId: Types.ObjectId): Promise<T> {

    const doc = await this.model.findById(objectId);
    if (!doc) {
      throw ({
        code: 404,
        message: `${objectId} doesn't exists`
      })
    }
    return (doc)
  }

  public async get(objectRequest: any): Promise<T[]> {
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

  delete(objectId: Types.ObjectId): DocumentQuery<any, any> {
    return this.model.findOneAndRemove({_id: objectId});
  }

  gets(objectIds: Types.ObjectId[]) {
    return this.model.find({
      item_id: {
        $in: objectIds
      }
    });
  }
}

export {MongooseDAO};
