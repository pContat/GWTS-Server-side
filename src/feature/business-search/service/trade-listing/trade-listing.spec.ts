import { Test, TestingModule } from '@nestjs/testing';
import { Connection, KNEX_CONNECTION } from '@willsoto/nestjs-objection';
import { ConfigurationModule } from '../../../../core/configuration/configuration.module';
import { CoreModule } from '../../../../core/core.module';
import { DatabaseModule } from '../../../../core/database/database.module';
import { NoOpLogger } from '../../../../core/logger/no-op.logger';
import { GwApiModule } from '../../../gw-api/gw-api.module';
import { ItemModule } from '../../../item/item.module';
import { TradeListingService } from './trade-listing.service';

describe('Recipe finder', () => {
  let tradeListingService: TradeListingService;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [TradeListingService],
      imports: [
        ItemModule,
        ConfigurationModule,
        GwApiModule,
        CoreModule,
        DatabaseModule,
      ],
    }).compile();

    tradeListingService = moduleRef.get<TradeListingService>(
      TradeListingService,
    );
    moduleRef.useLogger(new NoOpLogger());
  });

  afterEach(async () => {
    const currentConnection = moduleRef.get<Connection>(KNEX_CONNECTION);
    await moduleRef.close();
  });

  describe('non craftable object', () => {
    it('one', async () => {
      try {
        const result = await tradeListingService.getListing(70851);
        expect(result).toEqual({
          id: 70851,
          buys: [],
          sells: [],
        });
      } catch (e) {
        fail(e);
      }
    });

    it('multi non craftable', async () => {
      try {
        const result = await tradeListingService.getListings([70851, 70852]);
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
          },
        ]);
      } catch (e) {
        fail(e);
      }
    });
  });
});
