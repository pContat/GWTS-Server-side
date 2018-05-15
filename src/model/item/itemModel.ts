import {Document, Model, model, Schema} from "mongoose";
import RecipeModel from "../recipe/recipeModel";
import {RecipeDocument} from "..";


export type ItemDocument = Item & Document;

export interface Item {
  id: number;
  fromRecipe: RecipeDocument;
  type: string;
  name: string;
  icon: string;
  level: number;
  rarity: string;
  vendor_value: number,
  chat_link: string
  flags: string[]
}

//Definition of one item
const itemSchema = new Schema({
  id: {
    type: Number,
    unique: true,
    required: true
  },
  //If the item is the result of a receipt
  fromRecipe: {
    type: RecipeModel.schema,
    default: null
  },
  //Armor / Weapon / etc
  type: {
    type: String
  },
  name: {
    type: String
  },
  icon: {
    type: String
  },
  level: {
    type: Number
  },
  rarity: {
    type: String
  },
  flags: [{type: String}],
  chat_link: {
    type: String
  },
  vendor_value: {
    type: Number
  },
});

const ItemModel: Model<ItemDocument> = model<ItemDocument>("Item", itemSchema);
export default ItemModel;
