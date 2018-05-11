/*
"use strict";
const request = require("request"),
  conf = require("../config"),
  CallHelper = require("./callHelper"),
  ReceiptModel = require("../_model/receiptModel"),
  ItemModel = require("../_model/itemModel");

class DealFinder {
  constructor(item_id, redisClient) {
    this.item_id = item_id;
    this.cachedClient = redisClient;
    this.itemModel = new ItemModel();
    this.receiptModel = new ReceiptModel();
  }

  find() {

  }

  getCraftPrice(item_id) {
    const that = this;
    //if cache
    this.cachedClient.get("item_id", function (err, price) {
      // reply is null when the key is missing
      console.log(price);
      if (price !== null) {
        return price;
      } else {
        //check if primal or get receipt
        return that.receiptModel.getReceiptFromOutput(item_id)
        // .then(function (recipt) {
        //     if (recipt !== null) {
        //         //multi price
        //         for (recipt)
        //             recipt.ingredients  // "item": 19724, "quantity": 3
        //     }
        //     else {
        //         //one price
        //     }

        // });
      }
    });
  }

  deal(receipt_id, parentPrice, first) {
    const that = this;
    //get the ingredients
    // TOdo : if no deal find in cache
    return this.receiptModel.getByReceiptByID(receipt_id)
      .then(function (recipt) {
        if (recipt !== null) {
          //multi price
          for (let key in recipt.ingredients) {
            // "item": 19724, "quantity": 3
            //async here : save the price of the item
            const item_id = recipt.ingredients[key].item;

            CallHelper.getCommercePrice(item_id)
              .then(function (price) {
                const selfPrice = price;
                //has ingredient
                return that.receiptModel.getReceiptFromOutput(item_id);

              })
              .then(function (receipt) {
                if (receipt !== null) {
                  //recursive call
                  if (that.deal(receipt.receipt_id), selfPrice) {
                    //good

                  } else {
                    linePrice(receipt, dealArray);
                  }
                } else {
                  let value = first ? true : (line < parentPrice);
                  return value;
                }
              });
          }
        }
        else {
          console.log(receipt_id + "receipt doesn't exist");
        }

      });
  }


  /!*deal : [ item_id :  {
      value : X,
      receipt : ingredient from receipt
  }]
  *!/
  linePrice(receipt, dealArray) {
    //getListing all
    const listing = [];
    let value = 0;
    for (let key in receipt.ingredients) {
      let item_id = receipt.ingredients[key].item;
      if (item_id in dealArray) {
        value += dealArray[item_id].value;

      } else {
        //use the precalculed type
        value += this.getCommercePriceWithQuantity(receipt.ingredients[key].quantity, listing[item_id]);
      }
    }
  };

  //Based on curent comerce list compute the craftDetailPrice for a compo
  getCommercePriceWithQuantity(quantity, commerceListing) {
    //display the final result
    let itemPrice = 0;
    for (var stack in commerceListing.sells) {
      var stackQuantity = commerceListing.sells[stack].quantity;
      if (stackQuantity === 'undefined') console.error('Stack quantity undefined');
      if (stackQuantity >= quantity) {
        itemPrice += commerceListing.sells[stack].unit_price * quantity;
        return itemPrice;
      } else {
        itemPrice += commerceListing.sells[stack].unit_price * stackQuantity;
        quantity -= stackQuantity;
      }
    }
    //No sufficient compo
    return -1;
  }


  //getData
  //this.cachedClient.set(item_id, commerceListing);
  //const key = item_id + "_listing";
  //this.cachedClient.set(item_id, commerceListing);

  //for i in compoent {
  //totalpric =+ computcraft()
  //}

  //Ask the API for the first buy price
  findBuyPrice(item_id) {
    return new Promise(function (resolve, reject) {
      var itemId = self.craftRecip.first.output_item_id;
      getCommercePrice(itemId)
        .then(function (prices) {
          if (prices.sells.quantity >= minSellNumber && prices.buys.quantity >= minBuyNumber) {
            self.buyPrice = prices.sells.unit_price;
            if (DEBUG) {
              console.log(logPrefix + 'find a buy price :' + self.buyPrice);
            }
            resolve(true);
          } else {
            console.log('Do not have the min sale requirement');
            resolve(false);
          }
        })
        .catch(function (e) {
          console.error('There is no prices at all');
          onError(e);
          resolve(false);
        });
    });
  }

}

module.exports = DealFinder;
*/
