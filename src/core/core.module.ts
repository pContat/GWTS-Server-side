import { CacheModule, Global, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-ioredis';
import { RedisOptions } from 'ioredis';
import { CacheService } from './cache/cache.service';
import { AppLogger } from './logger/winston.logger';
import { storageProvider } from './storage/storage-provider';

const provider = [CacheService, storageProvider];
@Global()
@Module({
  imports: [
    /*CacheModule.register({
      store: 'memory',
      max: 1000,
      ttl: 60 * 60 * 24,
    }),*/
    CacheModule.register<RedisOptions>({
      store: redisStore,
      host: 'localhost',
      port: 6379, // default value
      ttl:  60 * 60 * 24
    }),
  ],
  providers: [AppLogger, ...provider],
  exports: [...provider],
})
export class CoreModule {}
