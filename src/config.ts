/*
Created by : Contat Paul
For any information, please contact at : contat.paul@gmail.com

Contain multiple global config for the project
*/
export default {
  db: {
    mongo: "mongodb://localhost/GWTS"
  },

  //Path are the combination between 'pathToFile' and path from the database
  pathToFile: "../",
  projectDir: __dirname,
  lang: "en",
  taxePercent: 0.15,
  item: {
    blackList: [
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
      67344
    ],
    minRarity: "dk"
  },
  dealCritiria: {
    //min % of marge gain
    minfactoryMarge: 0.15,
    //Minimun of gain
    minGain: 3000,
    //?
    minMarge: 8000,
    //Minimun of seller
    minSellNumber: 20,
    //Minimun of buyer
    minBuyNumber: 20,
    //Maximun of compo to craft the object (-1 : no limit)
    maxCompo: -1,
    exceptRarity: ["Junk", "Basic", "Ascended", "Legendary"],
    excepFlag: ["AccountBound", "NoSell"],
    excepType: ["Container", "CraftingMaterial ", "Gathering", "Bag"]
  }
};
