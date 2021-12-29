import { Ingredient } from '../item/type/type';

export interface BuyableIngredient extends Ingredient {
  buyPrice: number;

  /** @description If a craft is found, the initial buy price is stored here */
  originalBuyPrice?: number;
  craftPrice?: number;
}

export interface RecipeResult {

  ingredients: BuyableIngredient[];

  /** @description The buying price of the item*/
  initialPrice: number;
  /** @description The price after the buying all craft item craft*/
  finalPrice: number;
  itemId: number;
}

export interface DealCriteria {
  minFactoryMarge: number;
  minGain: number;
  minimumNumberOfSale: number;
  minimumNumberOfBuy: number;
  maxCompo: number;
  doNotEvaluate: {
    rarity: string[];
    flags: string[];
    types: string[];
    itemList: number[];
  };
}
