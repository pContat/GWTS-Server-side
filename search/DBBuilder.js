//Build item and receipt
//1 use only
"use strict";
const conf = require("../config"),
    //Item = require("../model/item"),
    //Receipt = require("../model/receipt"),
    CallHelper = require("./callHelper");
const logPrefix = "DBBuilder";
const ReceiptModel = require("../model/receiptModel"),
    ItemModel = require("../model/itemModel");
//Main that build the batabase
class DBBuilder {

    constructor() {
        this.receiptModel = new ReceiptModel();
        this.itemModel = new ItemModel();
    }

    crawl() {
        const that = this;
        CallHelper.getAllRecipe()
            .then(function (receipts) {
                let promiseArray = [];
                console.log(receipts.length + "receipt to insert");
                // for (let i = 0; i < 200; i++) {
                //     promiseArray.push(that.saveReceipt(receipts[i]));
                // }
                for (let key in receipts) {
                    promiseArray.push(that.saveReceipt(receipts[key]));
                }
                return Promise.all(promiseArray);
            })

            .catch(function (err) {
                console.log(err);
            });
    }

    saveReceipt(receipt_id) {
        let that = this;
        let reciptData = {};
        return this.receiptModel.getByReceiptID(receipt_id)
            //if already exist
            .then(function (receiptFind) {
                //If item already exist
                if (typeof receiptFind !== 'undefined' && receiptFind !== null) {
                    console.log("receipt_id " + receipt_id + " already exist ");
                    return Promise.resolve();
                } else {
                    //if not
                    return CallHelper.getRecipeDetail(receipt_id)
                        .then(function (body) {
                            reciptData.output_item_id = body.output_item_id;
                            reciptData.receipt_id = receipt_id;
                            return that.saveIngredients(body.ingredients);
                        })
                        .then(function (ingredients) {
                            reciptData.ingredients = ingredients;
                            return that.receiptModel.save(reciptData);
                        })
                        .then(function () {
                            console.log("receipt_id " + receipt_id + " inserted");
                            return Promise.resolve();
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
                }
            });
    }


    //Get info for item and save then into the database
    //resollve ingredient object
    saveIngredients(ingredients) {
        let promiseArray = [];
        for (let key in ingredients) {
            let componentObject = ingredients[key];
            //Add action for every item 
            promiseArray.push(this.saveOneIngredient(componentObject));
        }
        return (Promise.all(promiseArray));

    }

    //get info from GW2 APi and retrieve or insert the item
    saveOneIngredient(componentObject) {
        const that = this;
        return this.itemModel.getByItemID(componentObject.item_id)
            //if already exist
            .then(function (itemFind) {
                //If item already exist
                if (typeof itemFind !== 'undefined' && itemFind !== null) {
                    return Promise.resolve();
                } else {
                    //if not
                    return that.saveItem(componentObject.item_id);
                }
            })
            .then(function () {
                return Promise.resolve({ item: componentObject.item_id, quantity: componentObject.count });
            })
            //else
            .catch(function (err) {
                console.log(err.message);
            });
    }

    saveItem(item_id) {
        let that = this;
        let itemData;
        return CallHelper.getItemDetail(item_id)
            .then(function (body) {
                itemData = body;
                return that.itemModel.saveItem(itemData);
            });
    }

}

module.exports = DBBuilder;

