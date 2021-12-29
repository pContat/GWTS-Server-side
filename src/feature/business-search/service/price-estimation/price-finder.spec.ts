import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationModule } from '../../../../core/configuration/configuration.module';
import { CoreModule } from '../../../../core/core.module';
import { DatabaseModule } from '../../../../core/database/database.module';
import { NoOpLogger } from '../../../../core/logger/no-op.logger';
import { GwApiModule } from '../../../gw-api/gw-api.module';
import { ItemModule } from '../../../item/item.module';
import { CANT_BUY } from '../const';
import { TradeListingService } from '../trade-listing/trade-listing.service';
import { PriceFinder } from './price-finder.service';

describe('Recipe finder', () => {
  let priceFinder: PriceFinder;
  let moduleRef: TestingModule;
  let listingService: TradeListingService;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [PriceFinder, TradeListingService],
      imports: [
        ItemModule,
        ConfigurationModule,
        GwApiModule,
        CoreModule,
        DatabaseModule,
      ],
    }).compile();

    priceFinder = moduleRef.get<PriceFinder>(PriceFinder);
    listingService = moduleRef.get<TradeListingService>(TradeListingService);
    moduleRef.useLogger(new NoOpLogger());
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  describe('1 item', () => {
    it('no sale or buy offer', async () => {
      // 6 15 24 46 56 57 58 59 60 61
      const itemId = 4;
      jest.spyOn(listingService, 'getListing').mockImplementation(() =>
        Promise.resolve({
          id: 2,
          buys: [],
          sells: [],
        }),
      );
      const result = await priceFinder.getPriceIfTPBuy(itemId, 1);
      expect(result).toEqual(CANT_BUY);
    });

    it('buyable to npc item', async () => {
      const itemId = 12136; //sac de farine;
      const result = await priceFinder.getPriceIfTPBuy(itemId, 1);
      expect(result).toEqual(8);
    });

    it('classic', async () => {
      const itemId = 54;
      jest.spyOn(listingService, 'getListing').mockImplementation(() =>
        Promise.resolve({
          id: 2,
          buys: [{ listings: 1, quantity: 1, unit_price: 5 }],
          sells: [{ listings: 1, quantity: 1, unit_price: 6 }],
        }),
      );
      const result = await priceFinder.getPriceIfTPBuy(itemId, 1);
      expect(result).toEqual(6);
    });

    it('not enoughs ', async () => {
      const itemId = 54;
      jest.spyOn(listingService, 'getListing').mockImplementation(() =>
        Promise.resolve({
          id: 2,
          buys: [{ listings: 1, quantity: 1, unit_price: 5 }],
          sells: [{ listings: 1, quantity: 1, unit_price: 6 }],
        }),
      );
      const result = await priceFinder.getPriceIfTPBuy(itemId, 2);
      expect(result).toEqual(CANT_BUY);
    });

    it('not sale but buy listing', async () => {
      const itemId = 54;
      jest.spyOn(listingService, 'getListing').mockImplementation(() =>
        Promise.resolve({
          id: 2,
          buys: [{ listings: 1, quantity: 1, unit_price: 5 }],
          sells: [],
        }),
      );
      const result = await priceFinder.getPriceIfTPBuy(itemId, 1);
      expect(result).toEqual(CANT_BUY);
    });
  });

  describe('multiple listing', () => {
    it('multiple quantity, same listing', async () => {
      const itemId = 54;
      jest.spyOn(listingService, 'getListing').mockImplementation(() =>
        Promise.resolve({
          id: 2,
          buys: [{ listings: 1, quantity: 3, unit_price: 4 }],
          sells: [{ listings: 1, quantity: 3, unit_price: 5 }],
        }),
      );
      const result = await priceFinder.getPriceIfTPBuy(itemId, 3);
      expect(result).toEqual(15);
    });

    it('multiple listing, same price (should not happen)', async () => {
      const itemId = 54;
      jest.spyOn(listingService, 'getListing').mockImplementation(() =>
        Promise.resolve({
          id: 2,
          buys: [],
          sells: [
            { listings: 1, quantity: 1, unit_price: 5 },
            { listings: 1, quantity: 2, unit_price: 5 },
          ],
        }),
      );
      const result = await priceFinder.getPriceIfTPBuy(itemId, 2);
      expect(result).toEqual(10);
    });

    it('multiple listing, multiple price', async () => {
      const itemId = 54;
      jest.spyOn(listingService, 'getListing').mockImplementation(() =>
        Promise.resolve({
          id: 2,
          buys: [],
          sells: [
            { listings: 2, quantity: 2, unit_price: 5 },
            { listings: 1, quantity: 1, unit_price: 10 },
          ],
        }),
      );
      const result = await priceFinder.getPriceIfTPBuy(itemId, 3);
      expect(result).toEqual(20);
    });
  });
});
