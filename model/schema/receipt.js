"use strict";
const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ItemSchema = require('./item'),
    ReceiptSchema = new Schema({
        //A receipt is a list of ingredient that can be item
        ingredients: [
            {
                item: { type: Number, ref: 'item' },
                quantity: {
                    type: Number
                }
            }
        ],
        receipt_id: {
            type: Number,
            unique: true,
            required: true,
            dropDups: true
        },
        output_item_id : { type: Number, ref: 'item' }
    },
        {
            toObject: {
                virtuals: true
            },
            toJSON: {
                virtuals: true
            }
        });


module.exports = mongoose.model('receipt', ReceiptSchema);