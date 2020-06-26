import { caching, Cache } from 'cache-manager';
import { Injectable, Logger } from '@nestjs/common';
import { AsyncFunction, AsyncUtils } from '../utils';

@Injectable()
export class CacheService {
  readonly log = new Logger(CacheService.name);
  public memoryCache: Cache;
  private cleanCallBackList: AsyncFunction[] = [];

  constructor() {
    // todo : change it when production
    this.memoryCache = caching({ store: 'memory', max: 100, ttl: 100 /*seconds*/ });
  }

  public registerCleanCallBack(cleanCallBack: AsyncFunction) {
    this.cleanCallBackList.push(cleanCallBack);
  }

  public async flushAll() {
    this.log.log('flush cache');
    this.memoryCache = caching({ store: 'memory', max: 100, ttl: 100 /*seconds*/ });
    return await AsyncUtils.pAll(this.cleanCallBackList);
  }

  public async get(key: string, callbackIfNotFound: AsyncFunction): Promise<any> {
    this.log.log('get key' + key);
    return await this.memoryCache.wrap(key, callbackIfNotFound);
  }

  public async mget(keys: string[], callbackIfNotFound: AsyncFunction): Promise<any> {
    this.log.log('get keys' + keys.toString());
    return await this.memoryCache.wrap(...keys, callbackIfNotFound);
  }
}
