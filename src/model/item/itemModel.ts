import Receipt from "../recipe/recipeModel";
import * as mongoose from "mongoose";

export type ItemType = mongoose.Document & {
  id: string;
  fromReceipt: number;
  type: string;
  name: string;
  icon: string;
  level: number;
  rarity: string;
  top: boolean;
  flags: string[];
  //Does this item have good buy/sell ratio
  demande: boolean;
};

//Definition of one item
const itemSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  //If the item is the result of a receipt
  fromReceipt: {
    type: Receipt.schema,
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
  flags: [{ type: String }],
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
const Item = mongoose.model("Item", itemSchema);
export default Item;
