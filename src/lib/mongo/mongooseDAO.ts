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


  public async find(objectRequest: Object): Promise<T[]> {
    return await this.model.find(objectRequest);
  }

  public async findOne(condition: Object): Promise<T> {
    const result = await this.model.findOne(condition);
    this.throwIfNotFound(result);
    return result as T;
  }

  delete(objectId: Types.ObjectId): DocumentQuery<any, any> {
    return this.model.findOneAndRemove({_id: objectId});
  }

  findByIds(objectIds: Types.ObjectId[]) {
    return this.model.find({
      item_id: {
        $in: objectIds
      }
    });
  }

  private throwIfNotFound(result: any) {
    if (!result) {
      throw ({
        code: 404,
        message: `no entity found for criteria `
      })
    }
  }
}

export {MongooseDAO};
