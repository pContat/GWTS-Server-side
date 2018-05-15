import {Document, Model, model, Schema} from "mongoose";

export interface Ingredient {
  item_id: number,
  count: number,
  isCraftable: boolean,
  outputCountIfCraft: number
}


export interface Recipe {
  ingredients: Ingredient[];
  output_item_id: number;
  output_item_count: number;
  disciplines: string[]
  id: number;
  type: string
  chat_link: string;
  tree: string,
}

export type RecipeDocument = Recipe & Document

const recipeSchema = new Schema({
  //A receipt is a list of ingredient that can be item
  ingredients: [
    {
      item_id: {type: Number},
      count: {
        type: Number
      },
      isCraftable: {
        type: Boolean,
        default: false
      },
      tree: {type: String},
      id: {type: Number},
      type: {type: String},
      chat_link: {type: String}
    }
  ],
  output_item_id: {
    type: Number
  },
  disciplines: [{type: String}],
  output_item_count: {
    type: Number
  },
  id: {
    type: Number
  },
  type: {
    type: String
  },
  chat_link: {
    type: String
  },
  tree: {
    type: String
  }
});
const RecipeModel: Model<RecipeDocument> = model<RecipeDocument>("Recipe", recipeSchema);
export default RecipeModel;
