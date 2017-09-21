import * as mongoose from "mongoose";
export type RecipeType = mongoose.Document & {
  ingredients: number[];
  receipt_id: number[];
  output_item_id: string;
};

const receiptSchema = new mongoose.Schema({
  //A receipt is a list of ingredient that can be item
  ingredients: [
    {
      item: { type: Number, ref: "item" },
      quantity: {
        type: Number
      }
    }
  ]
  // receipt_id: {
  //   type: Number,
  //   unique: true,
  //   dropDups: true
  // }
});

const Receipt = mongoose.model("receipt", receiptSchema);
export default Receipt;
