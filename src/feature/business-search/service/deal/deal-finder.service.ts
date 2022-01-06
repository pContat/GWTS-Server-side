/*TODO :
- add worker
- add Redis for cache and message broker
- store best deal
- use inventory API
*/

import { Inject, Injectable, Logger } from '@nestjs/common';
import { sumBy, take } from 'lodash';
import { AsyncUtils, TimeUtils } from '../../../../common/utils';
import { FileStorageInterface } from '../../../../core/storage/file-storage.interface';
import { apiStorage } from '../../../../core/storage/storage-provider';
import { ItemDao } from '../../../item/service/item.dao';
import { defaultDealCriteria } from '../../conf/deal-criteria';
import { DealCriteria, Flip, RecipeResult } from '../../type';
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
    @Inject(apiStorage) private readonly fileStorage: FileStorageInterface,
  ) {
    this.configuration = defaultDealCriteria;
  }

  async findDeal() {
    const matchingCriteriaItem = await this.matchConfiguration();
    this.logger.log(`${matchingCriteriaItem.length} items to evaluate`);

    const start = TimeUtils.clock();
    const craftList: RecipeResult[] = [];
    const flipList: Flip[] = [];
    // todo : change this to improve
    let totalEvaluated = 0;
    await AsyncUtils.batch(
      matchingCriteriaItem,
      async (item) => {
        if (!(await this.doesMatchMinSellBuyRatio(item.id))) {
          this.logger.debug(`item ${item.id}: no minimum buy/sale requirement`);
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
      50,
      (batchResponse) => {
        totalEvaluated += batchResponse.length;
        this.logger.log(
          `${totalEvaluated} / ${matchingCriteriaItem.length} item evaluated`,
        );
      },
    );

    const end = TimeUtils.clock(start);
    this.logger.log(`end process in ${end}`);

    const content = {
      craft: craftList,
      flip: flipList,
    };
    return content;
  }

  async getTopDeal() {
    const allDeal = await this.findDeal();
    await this.fileStorage.saveFile(
      `./export_${new Date().getTime()}.json`,
      Buffer.from(JSON.stringify(allDeal)),
      {
        isPublic: true,
      },
    );

    const sortedDeal = {
      craft: take(
        allDeal.craft.sort((a, b) => b.gainRatio - a.gainRatio),
        10,
      ),
      flip: take(
        allDeal.flip.sort((a, b) => b.gainRatio - a.gainRatio),
        10,
      ),
    };
    await this.fileStorage.saveFile(
      `./deal_${new Date().getTime()}.json`,
      Buffer.from(JSON.stringify(sortedDeal)),
      {
        isPublic: true,
      },
    );
  }

  async doesMatchMinSellBuyRatio(itemId: number) {
    const listing = await this.tradeListingService.getListing(itemId);
    const buyQuantity = sumBy(listing.buys, 'quantity');
    const sellQuantity = sumBy(listing.sells, 'quantity');
    return (
      buyQuantity >= this.configuration.minimumNumberOfBuy &&
      sellQuantity >= this.configuration.minimumNumberOfSale
    );
  }

  async matchConfiguration() {
    return await this.itemDao.getMatchingCriteriaItem(this.configuration);
  }
}
