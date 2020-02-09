import {Global, Module} from '@nestjs/common';
import {CommonModule} from "../common/common.module";
import {DealFinder} from "./deal-finder.service";
import {PriceFinder} from "./price-finder.service";
import {GwApiModule} from "../gw-api/gw-api.module";

@Global()
@Module({
  imports: [CommonModule,GwApiModule],
  providers: [ DealFinder, PriceFinder],
  exports: [DealFinder, PriceFinder],
})
export class CoreModule {}
