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

// https://wiki.guildwars2.com/wiki/Crafting_Supplier
// description contain : "can be purchased from master craftsmen"
export const craftingSupplies = new Map([
  [19704, 8],
  [19750, 16],
  [19924, 48],
  [19792, 8],
  [19789, 16],
  [19794, 24],
  [19793, 32],
  [19791, 48],
  [19790, 64],
  [46747, 149],
  [13010, 496],
  [13006, 1480],
  [13007, 5000],
  [13008, 20000],
  [13009, 100000],
  [12157, 8],
  [12151, 8],
  [12158, 8],
  [12153, 8],
  [12155, 8],
  [12156, 8],
  [12324, 8],
  [12136, 8],
  [12271, 8],
]);
