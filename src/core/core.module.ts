import { Global, Module } from '@nestjs/common';
import { AppLogger } from './logger/logger.service';
import { CacheService } from './cache/cache.service';

@Global()
@Module({
  imports: [],
  providers: [AppLogger, CacheService],
  exports: [CacheService],
})
export class CoreModule {}
