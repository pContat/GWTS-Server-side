//Build item and receipt
//1 use only
"use strict";
const conf = require("../config"),
    Receipt = require("./schema/receipt"),
    ItemModel = require("./itemModel");

class ReceiptModel {
    constructor() {
        this.schema = Receipt;
        this.ItemModel = new ItemModel();
    }

    //todo
    save(receiptData) {
        //Create the new recipt
        let receipt = new Receipt();
        receipt.output_item_id = receiptData.output_item_id;
        receipt.receipt_id = receiptData.receipt_id;
        //Get the item in mongo if they already exist
        receipt.ingredients = receiptData.ingredients;
        //Find all item
        return receipt.save();     
    }

    getByReceiptByID(receipt_id) {
         return this.schema.findOne({ "receipt_id": receipt_id });
    }

    getReceiptFromOutput(output_item_id) {
         return this.schema.findOne({ "output_item_id": output_item_id });
    }


    //Todo : use findOneAndUpdate
    update(item_id, data) {
        return this.schema.findById(item_id)
            .then(function (err, item) {
                //Alter item here
                return item.save();
            })
            .catch(function (err) {
                console.log(err);
            });
    }

    delete(item_id) {
        return this.schema.remove({ _id: item_id });
    }

}

module.exports = ReceiptModel;

