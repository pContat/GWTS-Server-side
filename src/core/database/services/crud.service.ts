import { NotFoundException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ClassConstructor } from 'class-transformer';
import { isNil } from 'lodash';
import {
  createRelationLoader,
  queryManyToMap,
  singleEntityToType,
} from '../../../common/utils/loader.utils';
import { Page, PaginationArguments } from '../types/pagination.type';
import { SourceProvider } from '../types/source-provider';
import { ObjectionCrudDao } from './objection-crud.dao';

export abstract class CrudService<T> {
  protected dao: ObjectionCrudDao<any>;

  // prevent n +1 graphql problem
  readonly byIdsLoader = createRelationLoader<number, T | undefined>(keys =>
    queryManyToMap(
      () => this.dao.query().findByIds(keys).execute(),
      document => document?.[this.dao.idColumn],
      document => document,
    ),
  );

  protected readonly modelType: ClassConstructor<T>; // cannot use plain to class directly with generic
  // (generic are type not class)

  protected constructor(dao: ObjectionCrudDao<any>, type: ClassConstructor<T>) {
    this.dao = dao;
    this.modelType = type;
  }

  entitiesToType(entities: any[]): T[] {
    return plainToClass(this.modelType, entities);
  }

  entityToType(entity: any): T {
    return singleEntityToType(entity, el => this.entitiesToType(el));
  }

  async findAll(options: PaginationArguments): Promise<T[]> {
    const results = await this.dao.findAll(options);
    return this.entitiesToType(results);
  }

  async findById(id: number): Promise<T | undefined> {
    const result = (await this.byIdsLoader.load(id)) as T;
    return this.entityToType(result);
  }

  async getById(id: number): Promise<T> {
    const result = (await this.byIdsLoader.load(id)) as T;
    if (isNil(result)) {
      throw new NotFoundException(id);
    }
    return this.entityToType(result);
  }

  async getByIds(ids: number[]): Promise<T[]> {
    const result = (await this.byIdsLoader.loadMany(ids)) as T[];
    return this.entitiesToType(result);
  }

  async paginate(
    pageInput: PaginationArguments,
    option?: { sourceProvider: SourceProvider<any> },
  ): Promise<Page<T>> {
    const page = await this.dao.paginate(pageInput, option);
    const asType = this.entitiesToType(page.results);
    return { ...page, results: asType };
  }

  async findByIds(ids: number[]): Promise<T[]> {
    const results = await this.byIdsLoader.loadMany(ids);
    return this.entitiesToType(results);
  }

  // in case you want to change the input type
  async create<U>(document: Partial<U>): Promise<T> {
    const result = (await this.dao.insert(document)) as T;
    return this.entityToType(result);
  }

  async update<U>(id: number, newDocument: U): Promise<T> {
    const result = (await this.dao.update(id, newDocument)) as T;
    return this.entityToType(result);
  }

  async patch(id: number, patchNote: Partial<T>): Promise<T> {
    const result = (await this.dao.patch(id, patchNote)) as T;
    return this.entityToType(result);
  }

  async delete(ids: number[]): Promise<T[]> {
    const result = await this.dao.delete(ids);
    return this.entitiesToType(result);
  }
}
