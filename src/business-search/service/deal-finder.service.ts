/*TODO :
- log search time
- add worker
- add Redis for cache and message broker
- store best deal
- persist full recipe (expand mode)
- use inventory API

*/


import {DealCritera, defaultDealCriteria} from "./conf/deal-critera";
import {RecipeFinderService} from "./recipe-finder";
import {Injectable} from "@nestjs/common";
import {ItemDao} from "../common/service/item.dao";
import {AsyncUtils} from "../core/utils";

@Injectable()
export class DealFinder {

  private commerceListingCache: Map<number, any>;
  private configuration: DealCritera;

  constructor(private readonly itemDao : ItemDao, private readonly recipeFinder : RecipeFinderService) {
    // todo : move this to dedicated class or redis
    this.commerceListingCache = new Map<number, any>();
    this.configuration = defaultDealCriteria;
  }


  async findDeal() {
    const test = await this.matchConfiguration();
    console.log(test.length, 'item to evaluate');


    const final = await AsyncUtils.pseries(test, item => this.recipeFinder.getRecipeCraftPrice(item));
    // console.log(final.length, 'deal found');
    // todo check buy sell ratio
    console.log(final)
  }

  async matchConfiguration() {
    return await this.itemDao.getMatchingCriteriaItem(this.configuration)
  }

}
