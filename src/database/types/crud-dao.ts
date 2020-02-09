import { Page, PaginationArguments } from './pagination.type';
import { BaseModel } from '../models/base.model';

export type IdValue = string | number | string[] | number[];

export interface CrudDao<T extends BaseModel> {
  readonly idColumn: string | string[];

  findAll(options: PaginationArguments): Promise<T[]>;

  paginate(options: PaginationArguments): Promise<Page<T>>;

  findById(id: IdValue ): Promise<T | undefined>;

  findByIds(ids: IdValue[]): Promise<T[]>;

  insert(docToInsert: Partial<T> | Partial<T>[]): Promise<T>;

  patch(id: IdValue, docToUpdate: T): Promise<T>;

  multiOnePatch(ids: IdValue[], patchNote: T): Promise<T[]>;

  update(id: IdValue, docToUpdate: T): Promise<T>;

  delete(ids: IdValue[]): Promise<T[]>;
}
