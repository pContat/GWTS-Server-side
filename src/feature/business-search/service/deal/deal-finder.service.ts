/*TODO :
- add worker
- add Redis for cache and message broker
- store best deal
- use inventory API
*/

import { Injectable, Logger } from '@nestjs/common';
import { sumBy } from 'lodash';
import { AsyncUtils, TimeUtils } from '../../../../common/utils';
import { ItemDao } from '../../../item/service/item.dao';
import { defaultDealCriteria } from '../../conf/deal-criteria';
import { DealCriteria } from '../../type';
import { RecipeFinderService } from '../recipe/recipe-finder.service';
import { TradeListingService } from '../trade-listing/trade-listing.service';
import { FlippingFinderService } from './flipping-finder.service';

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
    this.logger.log(`${matchingCriteriaItem.length} items to evaluate`);

    const start = TimeUtils.clock();
    const craftList = [];
    const flipList = [];
    // todo : change this to improve
    const notTooMuch = await AsyncUtils.parallelBatch(
      matchingCriteriaItem,
      async (item) => {
        if (!(await this.doesMatchMinSellBuyRatio(item.id))) {
          this.logger.log(`item ${item.id}: no minimum buy/sale requirement`);
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
      10,
    );

    const end = TimeUtils.clock(start);
    this.logger.log(`end process in ${end}`);

    const content = {
      craft: craftList,
      flip: flipList,
    };
    return content;
  }

  async doesMatchMinSellBuyRatio(itemId: number) {
    const listing = await this.tradeListingService.getListing(itemId);
    const buyQuantity = sumBy(listing.buys,"quantity")
    const sellQuantity =  sumBy(listing.sells,"quantity")
    return (
      buyQuantity >= this.configuration.minimumNumberOfBuy &&
      sellQuantity >= this.configuration.minimumNumberOfSale
    );
  }

  async matchConfiguration() {
    return await this.itemDao.getMatchingCriteriaItem(this.configuration);
  }
}
