export const defaultDealCriteria = {
  minFactoryMarge: 0.15, //min % of marge gain
  minGain: 3000, //Minimun of gain
  minSellNumber: 20, //Minimun of seller
  minBuyNumber: 200, //Minimun of buyer
  //Maximun of distinct compo to craft the object (-1 : no limit)
  maxCompo: -1,
  doNotEvaluate: {
    rarity: ['Junk', 'Basic', 'Ascended', 'Legendary'],
    flags: ['AccountBound', 'NoSell'],
    types: ['Container', 'CraftingMaterial ', 'Gathering'],
  }
} as DealCritera;

export interface DealCritera {
  minFactoryMarge: number,
  minGain: number,
  minSellNumber: number,
  minBuyNumber: number,
  maxCompo: number,
  doNotEvaluate: {
    rarity: string[]
    flags: string []
    types: string []
  }

}
