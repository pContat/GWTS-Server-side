import { Test } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { GwApiModule } from '../../gw-api/gw-api.module';
import { CoreModule } from '../../core/core.module';
import {ConfigModule} from "../../core/config/config.module";
import {DatabaseModule} from "../../database/database.module";
import {TradeListingService} from "./trade-listing.service";

describe('Recipe finder', () => {
  let tradeListingService: TradeListingService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [  TradeListingService ],
      imports: [CommonModule, GwApiModule, CoreModule,ConfigModule,DatabaseModule],
    }).compile();

    tradeListingService = moduleRef.get<TradeListingService>(
      TradeListingService,
    );
  });

  describe('non craftable object', () => {
    it('one', async () => {
      try {
        const result = await tradeListingService.getListing(70851);
        expect(result).toEqual( {
          id: 70851,
          buys: [],
          sells: [],
        });
      } catch (e) {
        fail(e);
      }
    });

    it('multi', async () => {
      try {
        const result = await tradeListingService.getListings([70851,70852]);
        expect(result.length).toEqual(2);
        expect(result).toEqual([
          {
            id: 70851,
            buys: [],
            sells: [],
          },
          {
            id: 70852,
            buys: [],
            sells: [],
          }
        ]);
      } catch (e) {
        fail(e);
      }
    });
  });


});
