"use strict";
const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    //ReceiptSchema = require('./receipt'),

    //Definition of one item
    ItemSchema = new Schema({
        item_id: {
            type: Number,
            unique: true,
            required: true,
            dropDups: true
        },
        //If the item is the result of la receipt
        receipt_id: { type: Number, ref: 'receipt' },
        //Armor / Weapon / etc
        type : {
            type: String
        },
        name : {
            type : String,
            required : true
        },
        icon : {
            type: String
        },
        level : {
            type : Number
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

    }, {
            toObject: {
                virtuals: true
            },
            toJSON: {
                virtuals: true
            }
        });


module.exports = mongoose.model('item', ItemSchema);