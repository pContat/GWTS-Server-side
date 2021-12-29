import { get, isEmpty } from 'lodash';
import * as Objection from 'objection';
import {
  OrderByDirection,
  PartialModelObject,
  TransactionOrKnex,
} from 'objection';
import { CrudDao } from '../types/crud-dao';
import { ObjectionQueryOption } from '../types/objection-query-option';
import { Page, PaginationArguments } from '../types/pagination.type';
import { SourceProvider } from '../types/source-provider';

export function responseToPage<T>(
  pagingParam: { offset: number; limit: number },
  results: T[],
  total: number,
): Page<T> {
  const pageNumber = Math.ceil(pagingParam.offset / pagingParam.limit) + 1;
  const totalPages = Math.ceil(total / pagingParam.limit); // page start at 0
  return {
    results,
    pageNumber,
    totalPages,
    first: pagingParam.offset === 0,
    last: pageNumber === totalPages,
    numberOfElements: results.length,
    pageSize: pagingParam.limit,
    totalElements: total,
  };
}

export class ObjectionCrudDao<TModel extends Objection.Model>
  implements CrudDao<TModel> {
  readonly idColumn: string;

  // model is a class
  public readonly model: typeof Objection.Model; // can't call generics static method/property

  constructor(model: typeof Objection.Model) {
    this.model = model;
    this.idColumn = model.idColumn as string;
  }

  public query(trxOrKnex?: TransactionOrKnex) {
    return this.model.query(trxOrKnex) as Objection.QueryBuilder<TModel>;
  }

  async paginate(
    pagingParam: PaginationArguments,
    option: ObjectionQueryOption & {
      sourceProvider?: SourceProvider<TModel>;
    } = {},
  ): Promise<Page<TModel>> {
    const { results, total } = option.sourceProvider
      ? await option.sourceProvider(pagingParam, option)
      : await this.findAllSourceProvider(pagingParam, option);

    return responseToPage(pagingParam, results, total);
  }

  public async findAllSourceProvider(
    params: PaginationArguments,
    option: ObjectionQueryOption = {},
  ): Promise<{ results: TModel[]; total: number }> {
    const baseQuery = this.getBasicFindAndCountQuery(params, option);
    return baseQuery.execute();
  }

  public async findAll(
    options: PaginationArguments,
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    const baseQuery = this.findAllQuery(options, option);
    if (options.offset !== 0 && options.limit !== 0) {
      baseQuery.limit(options.limit).offset(options.offset);
    }
    return baseQuery.execute();
  }

  public async findById(
    id: number | string | number[] | string[],
    option: ObjectionQueryOption = {},
  ): Promise<TModel | undefined> {
    const findObject: any = {};
    // todo change this when composite
    findObject[this.idColumn] = id;

    const baseQuery = this.query(option.transaction)
      .findOne(findObject)
      .withGraphFetched(option.relationExpression);

    if ((<any>this.model).isTraceable) {
      baseQuery.whereNull('delete_at');
    }

    return baseQuery;
  }

  public async findByIds(
    ids: number[] | string[],
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    const baseQuery = this.query(option.transaction)
      .whereIn(this.idColumn, ids)
      .withGraphFetched(option.relationExpression)
      .orderBy(this.idColumn, 'DESC');

    if ((<any>this.model).isTraceable) {
      baseQuery.whereNull('delete_at');
    }

    return baseQuery;
  }

  public async insert(
    docToInsert: Partial<TModel>,
    option: ObjectionQueryOption = {},
  ): Promise<TModel> {
    return this.query(option.transaction).insert(docToInsert as any);
  }

  public async bulkInsert(
    docToInsert: PartialModelObject<TModel>[],
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    if (isEmpty(docToInsert)) {
      return [];
    }
    return this.query(option.transaction).insert(docToInsert);
  }

  public async patch(
    id: number | string,
    docToUpdate: Partial<TModel>,
    option: ObjectionQueryOption = {},
  ): Promise<TModel> {
    return this.query(option.transaction)
      .withGraphFetched(option.relationExpression)
      .patchAndFetchById(
        id,
        (docToUpdate as unknown) as PartialModelObject<TModel>,
      );
  }

  public async simpleUpsert(
    id: number | string,
    docToUpdate: Partial<TModel>,
    option: ObjectionQueryOption = {},
  ): Promise<TModel> {
    return id
      ? this.patch(id, docToUpdate, option)
      : this.insert(docToUpdate as any, option);
  }

  public async multiOnePatch(
    ids: number[] | string[],
    patchNote: Partial<TModel>,
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    return this.query(option.transaction)
      .patch((patchNote as unknown) as PartialModelObject<TModel>)
      .whereIn(this.idColumn, ids)
      .returning('*');
  }

  public async multiPatch(
    docs: { id: any; doc: Partial<TModel> }[],
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    if (!option.transaction) {
      return Objection.transaction(this.model.knex(), async transaction => {
        return Promise.all(
          docs.map(docToUpdate => {
            return this.patch(docToUpdate.id, docToUpdate.doc, {
              transaction,
              relationExpression: option.relationExpression,
            });
          }),
        );
      });
    }

    return Promise.all(
      docs.map(docToUpdate => {
        return this.patch(docToUpdate.id, docToUpdate.doc, option);
      }),
    );
  }

  public async update(
    id: number | string,
    docToUpdate: TModel,
    option: ObjectionQueryOption = {},
  ): Promise<TModel> {
    // todo : fix typing
    return this.query(option.transaction).updateAndFetchById(
      id,
      docToUpdate as any,
    );
  }

  public async delete(
    ids: number[] | string[],
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    if ((<any>this.model).isTraceable) {
      // todo : where delete not already present to prevent trigger update ?
      return this.multiOnePatch(ids, { delete_at: new Date() } as any);
    }
    return this.query(option.transaction)
      .delete()
      .whereIn(this.idColumn, ids)
      .returning('*');
  }

  // in case of traceable to remove the data for good
  public async hardDelete(
    ids: number[] | string[],
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    return this.query(option.transaction)
      .delete()
      .whereIn(this.idColumn, ids)
      .returning('*');
  }

  // allow to easily extend find and count for specific use case
  protected getBasicFindAndCountQuery(
    params: PaginationArguments,
    option: ObjectionQueryOption = {},
  ) {
    // range is inclusive
    const baseQuery = this.findAllQuery(params, option).range(
      params.offset,
      params.offset + params.limit - 1,
    );
    return baseQuery;
  }

  protected findAllQuery(
    params: PaginationArguments,
    option: ObjectionQueryOption = {},
  ) {
    const baseQuery = this.query(option.transaction);
    if ((<any>this.model).isTraceable) {
      baseQuery.whereNull('delete_at');
    }
    if (params.sortCol) {
      baseQuery.orderBy(
        params.sortCol,
        get(params, 'sortOrder', 'DESC') as OrderByDirection,
      );
    } else {
      baseQuery.orderBy(this.idColumn, 'DESC');
    }
    return baseQuery;
  }
}
