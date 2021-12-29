import { chunk, cloneDeep } from 'lodash';
import { Observable } from 'rxjs';

export type AsyncFunction = (...args: any[]) => Promise<any>;
export type ObservableFunction = (...args: any[]) => Observable<any>;
export type TypedAsyncFunction<T, U> = (...args: T[]) => Promise<U>;
export type TypedAsyncMapper<T, U> = (value: T, index: number, array: T[]) => Promise<U>;

export class AsyncUtils {
  // apply the callback with the given array of param
  static async pseries<T>(params: T[], callBack: AsyncFunction): Promise<unknown> {
    return params.reduce((promise, item) => {
      return promise.then(() => callBack(item));
    }, Promise.resolve());
  }

  static async pseriesFactory(factory: AsyncFunction[]) {
    return factory.reduce((promise, item) => {
      return promise.then((result: any) => item());
    }, Promise.resolve());
  }

  static async pAll(factoryList: AsyncFunction[]) {
    const pendingPromiseList = factoryList.map((asyncFunction) => asyncFunction());
    return Promise.all(pendingPromiseList);
  }

  static async asyncForEach<T, U>(array: T[], callback: TypedAsyncMapper<T, U>) {
    const promiseList = array.map(callback);
    return Promise.all(promiseList);
  }

  static async parallelBatch<T, U>(
    allParameters: T[],
    mapper: TypedAsyncMapper<T, U>,
    batchSize: number
  ): Promise<U[]> {
    const copyParam = cloneDeep(allParameters);
    const finalResult = [];
    while (copyParam.length > 0) {
      const params = copyParam.splice(0, batchSize);
      // eslint-disable-next-line no-await-in-loop
      const batchResult = await Promise.all(params.map(mapper));
      finalResult.push(...batchResult);
    }
    return finalResult;
  }

  static async serieBatch(functionStacks: AsyncFunction[], batchSize: number) {
    return chunk(functionStacks, batchSize).map((batch) => {
      // eslint-disable-next-line @typescript-eslint/ban-types
      return async () => Promise.all(batch.map((request: Function) => request()));
    });
  }

  // do not stop batch if one failed
  static async reflectedParallelBatch(
    allParameters: any[],
    callBack: AsyncFunction,
    batchSize: number
  ) {
    const finalResult = [];
    while (allParameters.length > 0) {
      const params = allParameters.splice(0, batchSize);
      // eslint-disable-next-line no-await-in-loop
      const batchResult = await Promise.all(
        params.map((param) => AsyncUtils.reflect(callBack(param)))
      );
      finalResult.push(...batchResult);
    }
    return finalResult;
  }

  // do not stop promise.all even if one reject
  static reflect(promise: any) {
    return promise.then(
      function (v: any) {
        return { v, status: 'resolve' };
      },
      function (e: any) {
        return { e: e.message || e, status: 'rejected' };
      }
    );
  }
}
