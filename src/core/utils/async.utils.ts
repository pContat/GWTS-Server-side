import { chunk , clone} from 'lodash';

export type AsyncFunction = (...args: any[]) => Promise<any>;
export type TypedAsyncFunction<T> = (...args: any[]) => Promise<T>;

export class AsyncUtils {
  // apply the callback with the given array of param
  static async pseries(params: any[], callBack: AsyncFunction): Promise<any> {
    return params.reduce((promise, item) => {
      return promise.then((result: any) => callBack(item));
    }, Promise.resolve());
  }

  static async pseriesFactory(factory: AsyncFunction[]) {
    return factory.reduce((promise, item) => {
      return promise.then((result: any) => item());
    }, Promise.resolve());
  }

  static async pAll(factoryList: AsyncFunction[]) {
    const pendingPromiseList = factoryList.map(asyncFunction =>
      asyncFunction(),
    );
    return await Promise.all(pendingPromiseList);
  }

  static async parallelBatch(
    allParameters: any[],
    callBack: AsyncFunction,
    batchSize: number,
  ) {
    const finalResult = [];
    const paramCopy = clone(allParameters);
    // should copy
    while (paramCopy.length > 0) {
      const params = paramCopy.splice(0, batchSize);
      const promiseCall = params.map(callBack);
      const batchResult = await Promise.all(promiseCall);
      finalResult.push(batchResult);
    }
    return finalResult;
  }

  static async serieBatch(functionStacks: AsyncFunction[], batchSize: number) {
    return chunk(functionStacks, batchSize).map(batch => {
      return async () =>
        Promise.all(batch.map((request: AsyncFunction) => request()));
    });
  }

  // do not stop batch if one failed
  static async reflectedParallelBatch(
    allParameters: any[],
    callBack: AsyncFunction,
    batchSize: number,
  ) {
    const finalResult = [];
    while (allParameters.length > 0) {
      const params = allParameters.splice(0, batchSize);
      const batchResult = await Promise.all(
        params.map(param => AsyncUtils.reflect(callBack(param))),
      );
      finalResult.push(...batchResult);
    }
    return finalResult;
  }

  // do not stop promise.all even if one reject
  static reflect(promise: any) {
    return promise.then(
      (v: any) => {
        return { v, status: 'resolve' };
      },
      (e: any) => {
        return { e: e.message || e, status: 'rejected' };
      },
    );
  }
}
