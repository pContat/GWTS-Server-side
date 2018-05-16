/*TODO :
- log search time
- add worker
- add Redis for cache and message broker
- store best deal
- persist full recipe (expand mode)
- use inventory API

*/


import {ItemDAO} from "../../model";
import {DealCritera, defaultDealCriteria} from "./dealCritera";
import {RecipeFinder} from "./recipeFinder";
import {pseries} from "../../lib/utils/promiseUtils";

const logPrefix = "dealFinder";

export class DealFinder {
  itemDAO: ItemDAO;

  private commerceListingCache: Map<number, any>;
  private configuration: DealCritera;
  private recipeFinder: RecipeFinder;

  constructor() {
    this.itemDAO = new ItemDAO();
    // todo : move this to dedicated class or redis
    this.commerceListingCache = new Map<number, any>();
    this.configuration = defaultDealCriteria;
    this.recipeFinder = new RecipeFinder();
  }


  async findDeal() {
    const test = await this.matchConfiguration();
    console.log(test.length, 'item to evaluate');


    const final = await pseries(test, this.recipeFinder.getRecipeCraftPrice.bind(this.recipeFinder));
    // console.log(final.length, 'deal found');
    console.log(final)
  }

  async matchConfiguration() {
    return await this.itemDAO.getCriteriaItem(this.configuration)
  }

}
