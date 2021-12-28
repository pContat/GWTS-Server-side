import { DealCriteria } from '../type';

export const defaultDealCriteria = {
  minFactoryMarge: 0.15, //min % of marge gain
  minGain: 10000, //Minimum of gain
  minimumNumberOfSale: 50, //Minimum of seller
  minimumNumberOfBuy: 50, //Minimum of buyer
  maxBuyPrice: -1, // (-1 : no limit)
  //Maximum of distinct compo to craft the object (-1 : no limit)
  maxCompo: -1,
  // blacklist
  doNotEvaluate: {
    rarity: ['Junk', 'Basic', 'Ascended', 'Legendary'],
    flags: ['AccountBound', 'NoSell', 'SoulbindOnAcquire'],
    types: ['Container', 'CraftingMaterial ', 'Gathering'],
    itemList: [
      3993,
      4909,
      8587,
      9225,
      12132,
      12610,
      12623,
      12663,
      12697,
      12703,
      12705,
      23893,
      23311,
      23325,
      23757,
      23411,
      23987,
      30034,
      45238,
      67185,
      67344,
    ],
  },
} as DealCriteria;
