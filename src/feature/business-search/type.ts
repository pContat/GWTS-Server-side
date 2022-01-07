import { Ingredient } from '../item/type/type';

export interface BuyableIngredient extends Ingredient {
  /** @description the current TP buy price  */
  buyPrice: number | BuyingStatus;
  /** @description If an item is craftable, the craft price is stored here */
  craftPrice?: number | CraftStatus;
}

export interface DealCriteria {
  minFactoryMarge: number;
  minGain: number;
  minimumNumberOfSale: number;
  minimumNumberOfBuy: number;
  maxCompo: number;

  /** @description Maximum amount to invest in one deal */
  maxBuyPrice : number

  minLevel : number


  doNotEvaluate: {
    rarity: string[];
    flags: string[];
    types: string[];
    itemBlacklist: number[];
  };
}

export enum CraftStatus {
  /** * @description : if the crafting price is > than buying the item directly */
  NOT_WORTH = -3,
  /** @description : if the item can be craft but there is no buying item in trading post  */
  MISSING_INGREDIENT = -2,
}

export enum BuyingStatus {
  /** * @description : if there is no sale listing for this item  */
  CANT_BUY = -1,
}

export interface Flip {
  itemId: number;
  buyPrice: number;
  sellPrice: number;
  gain: number;
  gainRatio: number;
  itemName: string;
  chatLink: string;
    /** * @description : define the chance of the item to be sold */
  saleIndex : number
}

export interface RecipeResult {
  /** @description List of ingredient to craft this item */
  ingredients: BuyableIngredient[];
  /** @description The buying price of the item */
  buyPrice: number;
  /** @description The price after the buying all craft item craft*/
  craftPrice: number;
  itemId: number;
  gain: number;
  gainRatio: number;
  itemName: string;
}
