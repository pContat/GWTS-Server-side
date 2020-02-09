/*TODO :
- log search time
- add worker
- add Redis for cache and message broker
- store best deal
- persist full recipe (expand mode)
- use inventory API

*/


import {DealCritera, defaultDealCriteria} from "./deal-critera";
import {RecipeFinder} from "./recipe-finder";
import {Injectable} from "@nestjs/common";
import {ItemDao} from "../common/service/item.dao";
import {AsyncUtils} from "../core/utils";

@Injectable()
export class DealFinder {

  private commerceListingCache: Map<number, any>;
  private configuration: DealCritera;

  constructor(private readonly itemDao : ItemDao, private readonly recipeFinder : RecipeFinder) {
    // todo : move this to dedicated class or redis
    this.commerceListingCache = new Map<number, any>();
    this.configuration = defaultDealCriteria;
  }


  async findDeal() {
    const test = await this.matchConfiguration();
    console.log(test.length, 'item to evaluate');


    const final = await AsyncUtils.pseries(test, this.recipeFinder.getRecipeCraftPrice.bind(this.recipeFinder));
    // console.log(final.length, 'deal found');
    console.log(final)
  }

  async matchConfiguration() {
    return await this.itemDao.getMatchingCriteriaItem(this.configuration)
  }

}
