//Build item and receipt
//1 use only
"use strict";
const conf = require("../config"),
    Item = require("./schema/item");
//Model = require("./model");

class ItemModel {
    constructor() {
        this.schema = Item;
    }

    //Map data from the Api to our structure
    saveItem(itemData) {
        let item = new Item();
        item.name = itemData.name;
        item.type = itemData.type;
        item.rarity = itemData.rarity;
        item.icon = itemData.icon;
        item.item_id = itemData.id;
        item.top = false;
        item.demande = false;
        //DO nothing if already in
        //bug of already exist
        return Item.update(
            { item_id: itemData.id },
            { $setOnInsert: item },
            { upsert: true }      
        ).exec();
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

    getByItemID(item_id) {
        return this.schema.findOne({ "item_id": item_id });
    }

    //item_ids is array
    multiGet(item_ids) {
        if (item_ids.constructor === Array) {
            return this.schema.find({
                'item_id': {
                    $in: item_ids
                }
            });
        } else {
            console.error("array expected in multiGet");
        }
    }

}

module.exports = ItemModel;

