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
  top: boolean;
  flags: string[];
  //Does this item have good buy/sell ratio
  demande: boolean;
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

  //Rarity of the object
  rarity: {
    type: String
  },
  flags: [{type: String}],
  //Does this item is a top deal?
  top: {
    type: Boolean,
    default: false
  },
  //Does this item have good buy/sell ratio
  demande: {
    type: Boolean,
    default: false
  }
});

const ItemModel: Model<ItemDocument> = model<ItemDocument>("Item", itemSchema);
export default ItemModel;
