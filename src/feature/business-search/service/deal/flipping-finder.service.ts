import { Injectable, Logger } from '@nestjs/common';
import { first, sumBy } from 'lodash';
import { ItemModel } from '../../../item/model/item-model';
import { defaultDealCriteria } from '../../conf/deal-criteria';
import { Flip } from '../../type';
import { TradeListingService } from '../trade-listing/trade-listing.service';

@Injectable()
export class FlippingFinderService {
  logger = new Logger(FlippingFinderService.name);
  configuration = defaultDealCriteria;

  constructor(private readonly tradeListingService: TradeListingService) {}

  async shouldFlipItem(item: ItemModel): Promise<
    Flip
    | undefined
  > {
    const listing = await this.tradeListingService.getListing(item.id);

    const buyPrice = first(listing.buys).unit_price;
    const sellPrice = first(listing.sells).unit_price;

    const buyQuantity = sumBy(listing.buys, 'quantity');
    const sellQuantity = sumBy(listing.sells, 'quantity');

    // 15% tax on trading post
    const possibleGainIfFlipping = (sellPrice - buyPrice) * 0.85;
    if (possibleGainIfFlipping < this.configuration.minGain) {
      this.logger.debug(
        `item ${item.id}: min gain not reached ${possibleGainIfFlipping}`,
      );
      return;
    }
    return {
      gainRatio : +((possibleGainIfFlipping / buyPrice) * 100).toFixed(2),
      saleIndex : +((sellQuantity / buyQuantity) * 100).toFixed(2),
      gain: possibleGainIfFlipping,
      buyPrice: buyPrice,
      sellPrice: sellPrice,
      itemId: item.id,
      itemName: item.name,
      chatLink: item.chatLink,
    };
  }
}
