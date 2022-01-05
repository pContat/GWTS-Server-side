import { Test } from '@nestjs/testing';
import { CoreModule } from '../../../../core/core.module';
import { DatabaseModule } from '../../../../core/database/database.module';
import { GwApiModule } from '../../../gw-api/gw-api.module';
import { DealFinder } from './deal-finder.service';
import { FlippingFinderService } from './flipping-finder.service';
import { PriceFinder } from '../price-estimation/price-finder.service';
import { RecipeFinderService } from '../recipe/recipe-finder.service';
import { TradeListingService } from '../trade-listing/trade-listing.service';
import { ConfigModule } from '@nestjs/config';

describe('Deal finder', () => {
  let dealFinder: DealFinder;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DealFinder,
        PriceFinder,
        RecipeFinderService,
        TradeListingService,
        FlippingFinderService,
      ],
      imports: [
        GwApiModule,
        CoreModule,
        ConfigModule,
        DatabaseModule,
      ],
    }).compile();

    dealFinder = moduleRef.get<DealFinder>(DealFinder);
  });

  describe('craftable object', () => {
    it('create', async () => {
      try {
        const result = await dealFinder.findDeal();
        console.log(result);
        //expect(result.creditNoteSellingItems.length).toEqual(2);
      } catch (e) {
        fail(e);
      }
    });
  });
});
