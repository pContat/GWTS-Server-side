import { first, isNil } from 'lodash';
import { ClassType } from 'class-transformer/ClassTransformer';
import * as DataLoader from 'dataloader';
import { plainToClass } from 'class-transformer';
import { ObjectionCrudDao } from './objection-crud.dao';
import { PaginationArguments } from '../types/pagination.type';
import { NotFoundException } from '@nestjs/common';
import { CollectionUtils, StringUtils } from '../../core/utils';

export abstract class CrudService<T> {
  protected dao: ObjectionCrudDao<any>;
  // prevent n +1 graphql problem
  readonly byIdsLoader = new DataLoader(async (keys: number[]) => {
    // use this instead method instead of use cache false to get unique id in keys
    this.byIdsLoader.clearAll();
    if (keys.length === 1) {
      const response = await this.dao.findById(first(keys));
      return [response];
    }
    const result = await this.dao.findByIds(keys);
    return CollectionUtils.ensureOrder({
      keys,
      docs: result,
      prop: StringUtils.snakeToCamel(this.dao.idColumn)
    });
  });
  protected readonly modelType: ClassType<T>; // cannot use plain to class directly with generic (generic are type not class)

  protected constructor(dao: ObjectionCrudDao<any>, type: ClassType<T>) {
    this.dao = dao;
    this.modelType = type;
  }

  public async findAll(options: PaginationArguments): Promise<T[]> {
    const results = await this.dao.findAll(options);
    return plainToClass(this.modelType, results);
  }

  public async findById(id: number): Promise<T> {
    const result = (await this.byIdsLoader.load(id)) as T;
    if (isNil(result)) {
      throw new NotFoundException(id);
    }
    return plainToClass(this.modelType, result);
  }

  public async findByIds(ids: number[]): Promise<T[]> {
    const results = await this.byIdsLoader.loadMany(ids);
    return plainToClass(this.modelType, results);
  }

  // in case you want to change the input type
  public async create<U>(document: Partial<U>): Promise<T> {
    const result = (await this.dao.insert(document)) as T;
    return plainToClass(this.modelType, result);
  }

  public async update<U>(id: number, newDocument: U): Promise<T> {
    const result = (await this.dao.update(id, newDocument)) as T;
    return plainToClass(this.modelType, result);
  }

  public async patch(id: number, patchNote: Partial<T>): Promise<T> {
    const result = (await this.dao.patch(id, patchNote)) as T;
    return plainToClass(this.modelType, result);
  }

  public async delete(ids: number[]): Promise<T[]> {
    const result = await this.dao.delete(ids);
    return plainToClass(this.modelType, result);
  }
}
