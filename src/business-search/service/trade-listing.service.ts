/*TODO :
- log search time
- add worker
- add Redis for cache and message broker
- store best deal
- persist full recipe (expand mode)
- use inventory API

*/


import { defaultDealCriteria} from "../conf/deal-critera";
import {Injectable} from "@nestjs/common";
import {ItemDao} from "../../common/service/item.dao";
import {AsyncUtils} from "../../core/utils";
import {RecipeFinderService} from "./recipe-finder.service";
import {DealCritera} from "../type";

@Injectable()
export class DealFinder {

  private configuration: DealCritera;

  constructor(private readonly itemDao : ItemDao, private readonly recipeFinder : RecipeFinderService) {
    // todo : move this to dedicated class or redis
    this.configuration = defaultDealCriteria;
  }


  async findDeal() {
    const test = await this.matchConfiguration();
    console.log(test.length, 'item to evaluate');


    // at the same time check flipping

    const final = await AsyncUtils.pseries(test, item => this.recipeFinder.getRecipeCraftPrice(item));
    // console.log(final.length, 'deal found');
    // todo check buy sell ratio meaning flipping
    console.log(final)
  }

  async matchConfiguration() {
    return await this.itemDao.getMatchingCriteriaItem(this.configuration)
  }

}
