import { Ingredient } from '../item/type/type';

export interface BuyableIngredient extends Ingredient {
  /** @description the current TP buy price  */
  buyPrice: number | BuyingStatus;
  /** @description If an item is craftable, the craft price is stored here */
  craftPrice?: number | CraftStatus;
}

export interface DealCriteria {
  /** @description min % of marge gain : we do not want to gain 10 silver if it cost 100g  */
  minMarge: number;
  /** @description Minimum of gain  */
  minGain: number;
  /** @description Maximum amount to invest in one deal : -1 no limit */
  maxInvestmentPrice: number;

  /** @description Allow to detect 'hot' item  */
  minimumNumberOfSale: number;
  /** @description Allow to detect 'hot' item  */
  minimumNumberOfBuy: number;

  craft: CraftCriteria;

  minItemLevel: number;

  doNotEvaluate: {
    rarity: string[];
    flags: string[];
    types: string[];
    itemBlacklist: number[];
  };
}

export interface CraftCriteria {
  /** @description Filter the maximum of different compo required, -1 = no restriction */
  maxCompo: number | -1;
  /** @description Restrict craft to only auto recipe */
  autoLearnedOnly: boolean;
  /** @description Filter the maximum of different compo required, let empty for all */
  allowedDisciplines: { discipline: Discipline; maxLvl: number }[];
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
  chatLink: string;
  /** * @description : define the chance of the item to be sold */
  saleIndex: number;
  item: {
    itemName: string;
    itemLvl: number;
  };
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
  item: {
    itemName: string;
    itemLvl: number;
  };
  autoLearned: boolean;
  disciplines: Discipline[];
  maxLvl: number;
}

export enum Discipline {
  Artificer = 'Artificer',
  Armorsmith = 'Armorsmith',
  Chef = 'Chef',
  Huntsman = 'Huntsman',
  Jeweler = 'Jeweler',
  Leatherworker = 'Leatherworker',
  Tailor = 'Tailor',
  Weaponsmith = 'Weaponsmith',
  Scribe = 'Scribe',
}
