export const defaultDealCriteria = {
  minFactoryMarge: 0.15, //min % of marge gain
  minGain: 3000, //Minimun of gain
  // minMarge: 8000,
  minSellNumber: 20,    //Minimun of seller
  minBuyNumber: 200,     //Minimun of buyer
  //Maximun of distinct compo to craft the object (-1 : no limit)
  maxCompo: -1,
  exceptRarity: ['Junk', 'Basic', 'Ascended', 'Legendary'],
  exceptFlag: ['AccountBound', 'NoSell'],
  exceptType: ['Container', 'CraftingMaterial ', 'Gathering', 'Bag'],
};

export interface DealCritera {
  minFactoryMarge: number,
  minGain: number,
  minSellNumber: number,
  minBuyNumber: number,
  maxCompo: number,
  exceptRarity: string[]
  exceptFlag: string []
  exceptType: string []
}
