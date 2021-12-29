import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { GwApiModule } from '../gw-api/gw-api.module';
import { SearchController } from './search.controller';
import { DealFinder } from './service/deal/deal-finder.service';
import { FlippingFinderService } from './service/flipping-finder.service';
import { PriceFinder } from './service/price-finder.service';
import { RecipeFinderService } from './service/recipe/recipe-finder.service';
import { TradeListingService } from './service/trade/trade-listing.service';

const services = [
  DealFinder,
  RecipeFinderService,
  TradeListingService,
  FlippingFinderService,
  PriceFinder,
];

@Module({
  imports: [CommonModule, GwApiModule],
  providers: [...services],
  controllers: [SearchController],
  exports: [DealFinder, PriceFinder],
})
export class SearchModule {}
