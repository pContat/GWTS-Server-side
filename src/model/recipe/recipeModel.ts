import {Document, Model, model, Schema} from "mongoose";

export interface Recipe {
  ingredients: number[];
  output_item_id: string;
}

export type RecipeDocument = Recipe & Document

const recipeSchema = new Schema({
  //A receipt is a list of ingredient that can be item
  ingredients: [
    {
      item: {type: Number, ref: "item"},
      quantity: {
        type: Number
      }
    }
  ],
  output_item_id: {
    type: Number
  }
  // receipt_id: {
  //   type: Number,
  //   unique: true,
  //   dropDups: true
  // }
});


const RecipeModel: Model<RecipeDocument> = model<RecipeDocument>("Recipe", recipeSchema);
export default RecipeModel;
