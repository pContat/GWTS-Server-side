import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache, CachingConfig, Store } from 'cache-manager';
import { AsyncFunction, AsyncUtils } from '../../common/utils';

@Injectable()
export class CacheService {
  readonly log = new Logger(CacheService.name);

  private cleanCallBackList: AsyncFunction[] = [];

  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache & {
      mget?<T>(...args: any[]): Promise<any>;
      store: Store & { getClient(): any };
    },
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
    this.log.verbose(`get key ${key}`);
    return this.cacheManager.wrap(key, callbackIfNotFound);
  }

  public async set(
    key: string,
    value: any,
    options?: CachingConfig,
  ): Promise<string> {
    this.log.verbose(`set key ${key}`);
    return this.cacheManager.set(key, value, options);
  }

  public async mget<T>(
    keys: string[],
    callbackIfNotFound?: AsyncFunction,
  ): Promise<T[]> {
    // ioredis cache manager does not expose mget but is present from redis client
    const mgetMethod =
      this.cacheManager.mget || this.cacheManager.store?.getClient()?.mget.bind(this.cacheManager.store?.getClient());
    this.log.verbose(`get mkeys ${keys.toString()}`);
    return mgetMethod(...keys);
  }
}
