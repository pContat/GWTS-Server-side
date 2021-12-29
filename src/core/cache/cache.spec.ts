import { CacheModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NoOpLogger } from '../logger/no-op.logger';
import { CacheService } from './cache.service';

describe('Cache service', () => {
  let cacheService: CacheService;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [CacheService],
      imports: [
        CacheModule.register({
          store: 'memory',
          max: 1000,
          ttl: 60 * 60 * 23 /* 23 hours */,
        }),
      ],
    }).compile();

    cacheService = moduleRef.get<CacheService>(CacheService);
    moduleRef.useLogger(new NoOpLogger());
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  describe('mget behavior', () => {
    it('existing key', async () => {
      await cacheService.set('1', 1);
      expect(await cacheService.mget(['1'])).toEqual([1]);
    });

    it('one missing', async () => {
      await cacheService.set('1', 1);
      await cacheService.set('3', 3);
      expect(await cacheService.mget(['1', '2', '3'])).toEqual([
        1,
        undefined,
        3,
      ]);
    });
  });
});
