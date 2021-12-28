import { Test } from '@nestjs/testing';
import { GWApiService } from './gw-http-api.service';
import { HttpModule } from '@nestjs/common';
import { ConfigModule } from '../core/config/config.module';

describe('GW API', () => {
  let gwApiService: GWApiService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [GWApiService],
      imports: [ConfigModule, HttpModule],
    }).compile();

    gwApiService = moduleRef.get<GWApiService>(GWApiService);
  });

  describe('handle non buyable object', () => {
    it('one', async () => {
      try {
        const result = await gwApiService.getCommerceListing(70851);
        expect(result).toBeUndefined();
      } catch (e) {
        fail(e);
      }
    });

    it('multi', async () => {
      try {
        const result = await gwApiService.getCommerceListings([70851, 70852]);
        expect(result.length).toEqual(2);
        expect(result[0]).toBeUndefined();
      } catch (e) {
        fail(e);
      }
    });
  });
});
