import RecipeModel, {Recipe, RecipeDocument} from "./recipeModel";
import {MongooseDAO} from "../mongooseDAO";
import {Types} from "mongoose";

export class RecipeDAO extends MongooseDAO<RecipeDocument> {
  constructor() {
    super(RecipeModel);
  }

  save(receiptData: Recipe) {
    let receipt = new RecipeModel(receiptData);
    return receipt.save();
  }

  async getByReceiptID(receipt_id: number): Promise<RecipeDocument | null> {
    return this.model.findOne({receipt_id: receipt_id});
  }

  getReceiptFromOutput(output_item_id: number) {
    return this.model.findOne({output_item_id: output_item_id});
  }

  deleteReceipt(itemId: Types.ObjectId) {
    return this.delete(itemId);
  }
}
