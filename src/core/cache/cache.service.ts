import { Injectable, Logger } from '@nestjs/common';
import { Cache, caching, Store } from 'cache-manager';
import { AsyncFunction } from '../utils';

@Injectable()
export class CacheService {
  readonly log = new Logger(CacheService.name);
  public memoryCache: Store & Cache;

  constructor() {
    // todo : change it when production
    this.memoryCache = caching({
      store: 'memory',
      max: 100,
      ttl: 100000 /*seconds*/,
    });
  }

  public async flushAll() {
    this.log.debug('flush cache');
    this.memoryCache = caching({
      store: 'memory',
      max: 100,
      ttl: 100000 /*seconds*/,
    });
  }

  public async get<T>(key: any, callbackIfNotFound: AsyncFunction): Promise<T> {
    this.log.debug(`get key ${key}`);
    return await this.memoryCache.wrap(key, callbackIfNotFound);
  }

  public async set(key: any, value: any): Promise<any> {
    return await this.memoryCache.set(key, value, { ttl: 100000 });
  }

  public async mget(keys: any[]): Promise<any[]> {
    this.log.debug(`get keys ${keys.toString()}`);
    return await this.memoryCache.mget(...keys);
  }
}
