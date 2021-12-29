import { Module } from '@nestjs/common';
import { GwApiModule } from '../gw-api/gw-api.module';
import { ItemModule } from '../item/item.module';
import { RecipeModule } from '../recipe/recipe.module';
import { SearchController } from './search.controller';
import { DealFinder } from './service/deal/deal-finder.service';
import { FlippingFinderService } from './service/deal/flipping-finder.service';
import { PriceFinder } from './service/price-estimation/price-finder.service';
import { RecipeFinderService } from './service/recipe/recipe-finder.service';
import { TradeListingService } from './service/trade-listing/trade-listing.service';

const services = [
  DealFinder,
  RecipeFinderService,
  TradeListingService,
  FlippingFinderService,
  PriceFinder,
];

@Module({
  imports: [ItemModule, RecipeModule, GwApiModule],
  providers: [...services],
  controllers: [SearchController],
  exports: [DealFinder, PriceFinder],
})
export class SearchModule {}
