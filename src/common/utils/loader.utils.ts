import DataLoader from 'dataloader';
import { first, identity } from 'lodash';

export function createRelationLoader<Tin, Tout>(
  loaderFunction: (keys: Tin[]) => Promise<Map<Tin, Tout>>,
  notFoundValue?: unknown | Error,
) {
  const loader = new DataLoader(async (keys: Tin[]) => {
    loader.clearAll();
    const results = await loaderFunction(keys);
    return keys.map((key: Tin) => results.get(key) ?? notFoundValue);
  });
  return {
    load: (key: Tin) => loader.load(key),
    loadMany: (key: Tin[]) => loader.loadMany(key),
  };
}

export function singleEntityToType<T, U>(
  entity: T,
  manyMapper: (input: T[]) => U[],
) {
  return first(manyMapper([entity]));
}

// case : relation manyToMany
export async function queryManyToMap<TEntity, TKey, TOut>(
  queryManyFunction: () => Promise<TEntity[]>,
  keyMapper: (element: TEntity) => TKey = (el: any) => el.id,
  valueMapper: (el: TEntity) => TOut = identity,
): Promise<Map<TKey, TOut>> {
  const databaseResponse = await queryManyFunction();
  const response = new Map();
  databaseResponse.forEach((el) => {
    response.set(keyMapper(el), valueMapper(el));
  });
  return response;
}

export function defaultQueryManyToMap<
  TEntity extends { id: number },
  TOut = TEntity,
>(
  queryManyFunction: () => Promise<TEntity[]>,
  valueMapper: (el: TEntity) => TOut = identity,
) {
  return queryManyToMap(
    queryManyFunction,
    (element) => element.id,
    valueMapper,
  );
}
