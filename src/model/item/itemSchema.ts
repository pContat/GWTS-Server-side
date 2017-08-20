import * as mongoose from "mongoose";

export type ItemType = mongoose.Document & {
  item_id: number;
  receipt_id: number;
  type: string;
  name: string;
  icon: string;
  level: number;
  rarity: string;
  top: boolean;
  //Does this item have good buy/sell ratio
  demande: boolean;
};

//Definition of one item
const itemSchema = new mongoose.Schema({
  item_id: {
    type: Number,
    unique: true,
    required: true,
    dropDups: true
  },
  //If the item is the result of la receipt
  receipt_id: { type: Number, ref: "receipt" },
  //Armor / Weapon / etc
  type: {
    type: String
  },
  name: {
    type: String,
    required: true
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

  //Does this item is a top deal?
  top: {
    type: Boolean
  },

  //Does this item have good buy/sell ratio
  demande: {
    type: Boolean
  }
});
const Item = mongoose.model("Item", itemSchema);
export default Item;
