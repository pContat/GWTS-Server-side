/*TODO :
- log search time
- add worker
- add Redis for cache and message broker
- store best deal
- persist full recipe (expand mode)
- use inventory API

*/


import {Item, ItemDAO} from "../../model";
import {getCommercePrice} from "../../lib";
import {DealCritera, defaultDealCriteria} from "./dealCritera";
import logger from "../../lib/logger/logger";

const logPrefix = "dealFinder";

export class DealFinder {
  itemDAO: ItemDAO;

  private commerceListingCache: Map<number, any>;
  private configuration: DealCritera;

  constructor() {
    this.itemDAO = new ItemDAO();
    // todo : move this to dedicated class or redis
    this.commerceListingCache = new Map<number, any>();
    this.configuration = defaultDealCriteria;
  }

  // TODO take care of price increase if large buy
  getCommercePriceWithQuantity(quantity: any, commerceListing: any) {
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

  private async findBuyPrice(item: Item): Promise<number> {
    const price = await getCommercePrice(item.id);
    // TODO : compute diff between sell and buy
    const minCheck = price.sells.quantity >= this.configuration.minSellNumber && price.buys.quantity >= this.configuration.minBuyNumber;
    if (minCheck) {
      const buyPrice = price.sells.unit_price;
      logger.info(logPrefix + 'find a buy price :' + buyPrice);
      return buyPrice;
    }
    return -1;
  }


  private getRecipeCraftPrice() {

  }

}


/*

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

*/
