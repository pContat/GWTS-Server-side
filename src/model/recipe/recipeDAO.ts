import { default as Recipe, RecipeType } from "./recipeModel";
import { MongooseDAO } from "../mongooseDAO";
import * as mongoose from "mongoose";

export class RecipeDAO extends MongooseDAO {
  constructor() {
    super(Recipe);
  }

  save(receiptData: RecipeType) {
    let receipt = new Recipe(receiptData);
    return receipt.save();
  }

  getByReceiptID(receipt_id: number) {
    return this.model.findOne({ receipt_id: receipt_id });
  }

  getReceiptFromOutput(output_item_id: number) {
    return this.model.findOne({ output_item_id: output_item_id });
  }

  deleteReceipt(itemId: mongoose.Types.ObjectId) {
    return this.delete(itemId);
  }
}
