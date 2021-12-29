import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache, CachingConfig } from 'cache-manager';
import { AsyncFunction, AsyncUtils } from '../utils';

@Injectable()
@Injectable()
export class CacheService {
  readonly log = new Logger(CacheService.name);

  private cleanCallBackList: AsyncFunction[] = [];

  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache & { mget?<T>(...args: any[]): Promise<any> },
  ) {}

  public registerCleanCallBack(cleanCallBack: AsyncFunction) {
    this.cleanCallBackList.push(cleanCallBack);
  }

  public async flushAll() {
    this.log.log('flush cache');
    await this.cacheManager.reset();
    return AsyncUtils.pAll(this.cleanCallBackList);
  }

  public async get<T>(
    key: string,
    callbackIfNotFound: AsyncFunction,
  ): Promise<T> {
    this.log.debug(`get key${key}`);
    return this.cacheManager.wrap(key, callbackIfNotFound);
  }

  public async set(
    key: string,
    value: any,
    options?: CachingConfig,
  ): Promise<any> {
    this.log.debug(`set key ${key}`);
    return this.cacheManager.set(key, value, options);
  }

  public async mget(
    keys: string[],
    callbackIfNotFound?: AsyncFunction,
  ): Promise<any> {
    this.log.debug(`get mkeys ${keys.toString()}`);
    return this.cacheManager.mget(...keys);
  }
}
