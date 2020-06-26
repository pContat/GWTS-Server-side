import {Global, Module} from '@nestjs/common';
import {CommonModule} from "../common/common.module";
import {DealFinder} from "./service/deal-finder.service";
import {PriceFinder} from "./service/price-finder.service";
import {GwApiModule} from "../gw-api/gw-api.module";
import {SearchController} from "./search.controller";
import {RecipeFinderService} from "./service/recipe-finder.service";
import {TradeListingService} from "./service/trade-listing.service";
import {FlippingFinderService} from "./service/flipping-finder.service";

@Global()
@Module({
  imports: [CommonModule,GwApiModule],
  providers: [ DealFinder, PriceFinder,RecipeFinderService, TradeListingService, FlippingFinderService],
  controllers : [SearchController],
  exports: [DealFinder, PriceFinder],
})
export class SearchModule {}
