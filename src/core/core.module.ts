import { CacheModule, Global, Module } from '@nestjs/common';
import { storageProvider } from './storage/storage-provider';
import { CacheService } from './cache/cache.service';
import { AppLogger } from './logger/winston.logger';


const provider = [CacheService,storageProvider ]
@Global()
@Module({
  imports: [
    CacheModule.register({
      store: 'memory',
      max: 1000,
      ttl: 60 * 60 * 23 /* 23 hours */,
    }),
  ],
  providers: [AppLogger, ...provider],
  exports: [...provider],
})
export class CoreModule {}
