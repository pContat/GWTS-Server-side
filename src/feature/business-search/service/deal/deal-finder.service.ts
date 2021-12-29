/*TODO :
- add worker
- add Redis for cache and message broker
- store best deal
- use inventory API
*/

import { Injectable, Logger } from '@nestjs/common';
import { ItemDao } from '../../../item/service/item.dao';
import { AsyncUtils, FileUtils, TimeUtils } from '../../../../common/utils';
import { defaultDealCriteria } from '../../conf/deal-critera';
import { DealCriteria } from '../../type';
import { FlippingFinderService } from '../flipping-finder.service';
import { RecipeFinderService } from '../recipe/recipe-finder.service';
import { TradeListingService } from '../trade/trade-listing.service';

@Injectable()
export class DealFinder {
  private configuration: DealCriteria;
  logger = new Logger(DealFinder.name);

  constructor(
    private readonly itemDao: ItemDao,
    private readonly flippingFinder: FlippingFinderService,
    private readonly tradeListingService: TradeListingService,
    private readonly recipeFinder: RecipeFinderService,
  ) {
    this.configuration = defaultDealCriteria;
  }

  async findDeal() {
    const matchingCriteriaItem = await this.matchConfiguration();
    console.log(matchingCriteriaItem.length, 'item to evaluate');

    const start = TimeUtils.clock();

    // no more parallelBatch , the timer is api side
    /*
    const shouldCraftItemPromise =  AsyncUtils.parallelBatch(matchingCriteriaItem,async (item) => {
       if(await this.doesMatchMinSellBuyRatio(item.id)){
         this.logger.log(`no minimum buy/sale requirement for ${item.id}`);
         return;
       }
      return this.recipeFinder.getRecipeCraftList(item);
    }, 100);
    const flipPromise =  AsyncUtils.parallelBatch(matchingCriteriaItem,async (item) => {
      if(await this.doesMatchMinSellBuyRatio(item.id)){
        this.logger.log(`no minimum buy/sale requirement for ${item.id}`);
        return;
      }
      return this.flippingFinder.shouldFlipItem(item.id);
    }, 100);
    const [shouldCraftItem,flip] = await Promise.all([shouldCraftItemPromise,flipPromise]);
    */

    const craftList = [];
    const flipList = [];
    // todo : change this to improve
    const notTooMuch = await AsyncUtils.parallelBatch(
      matchingCriteriaItem,
      async item => {
        if (!(await this.doesMatchMinSellBuyRatio(item.id))) {
          this.logger.log(`no minimum buy/sale requirement for ${item.id}`);
          return;
        }
        const [craft, flip] = await Promise.all([
          this.recipeFinder.getRecipeCraftList(item),
          this.flippingFinder.shouldFlipItem(item),
        ]);
        if (craft) {
          craftList.push(craft);
        }
        if (flip) {
          flipList.push(flip);
        }
      },
      100,
    );

    const end = TimeUtils.clock(start);
    this.logger.log(`end proccess in ${end}`);

    const content = {
      craft: craftList,
      flip: flipList,
    };

    await FileUtils.createJsonFile(content, './export.json');
  }

  async doesMatchMinSellBuyRatio(itemId: number) {
    const listing = await this.tradeListingService.getListing(itemId);
    return (
      listing.buys.length > this.configuration.minimumNumberOfBuy &&
      listing.sells.length > this.configuration.minimumNumberOfSale
    );
  }

  async matchConfiguration() {
    return await this.itemDao.getMatchingCriteriaItem(this.configuration);
  }
}
