import { get } from 'lodash';
import * as Objection from 'objection';
import { Model } from 'objection';
import { BaseModel } from '../models/base.model';
import { CrudDao } from '../types/crud-dao';
import { Page, PaginationArguments } from '../types/pagination.type';

export interface ObjectionQueryOption {
  transaction?: Objection.Transaction;
  relationExpression?: string;
}

export class ObjectionCrudDao<TModel extends BaseModel>
  implements CrudDao<TModel> {
  readonly idColumn: string;
  public readonly model: any; // can't call generics static method/property

  constructor(model: typeof Model) {
    this.model = model as any;
    this.idColumn = this.model.idColumn as string;
  }

  async paginate(
    pagingParam: PaginationArguments,
    option: ObjectionQueryOption & {
      sourceProvider?: () => Promise<{ results: TModel[]; total: number }>;
    } = {},
  ): Promise<Page<TModel>> {
    const { results, total } = option.sourceProvider
      ? await option.sourceProvider()
      : await this.findAllSourceProvider(pagingParam, option);

    const pageNumber = Math.ceil(pagingParam.offset / pagingParam.limit);
    const totalPages = Math.ceil(total / pagingParam.limit) - 1; //page start at 0

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

  public async findAllSourceProvider(
    params: PaginationArguments,
    option: ObjectionQueryOption = {},
  ): Promise<{ results: TModel[]; total: number }> {
    const baseQuery = this.getBasicFindAndCountQuery(params, option);
    return await baseQuery.execute();
  }

  public async findAll(
    paginationArguments: PaginationArguments = { limit: 0, offset: 0 },
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    const baseQuery = this.model
      .query(option.transaction)
      .orderBy(this.idColumn, 'DESC');
    if (this.model.isTraceable) {
      baseQuery.whereNull('delete_at');
    }

    if (paginationArguments.offset !== 0 && paginationArguments.limit !== 0) {
      baseQuery
        .limit(paginationArguments.limit)
        .offset(paginationArguments.offset);
    }

    if (paginationArguments.sortCol) {
      baseQuery.orderBy(
        paginationArguments.sortCol,
        get(paginationArguments.sortOrder, 'DESC'),
      );
    } else {
      baseQuery.orderBy(this.idColumn, 'DESC');
    }
    return await baseQuery.execute();
  }

  // todo add dataloader
  public async findById(
    id: number | string | number[] | string[],
    option: ObjectionQueryOption = {},
  ): Promise<TModel | undefined> {
    const findObject: any = {};
    // todo change this when composite
    findObject[this.idColumn] = id;

    const baseQuery = this.model
      .query(option.transaction)
      .findOne(findObject)
      .withGraphFetched(option.relationExpression);

    if (this.model.isTraceable) {
      baseQuery.whereNull('delete_at');
    }

    return await baseQuery;
  }

  public async findByIds(
    ids: number[] | string[],
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    const baseQuery = this.model
      .query(option.transaction)
      .whereIn(this.idColumn, ids)
      .withGraphFetched(option.relationExpression)
      .orderBy(this.idColumn, 'DESC');

    if (this.model.isTraceable) {
      baseQuery.whereNull('delete_at');
    }

    return await baseQuery;
  }

  public async insert(
    docToInsert: Partial<TModel>,
    option: ObjectionQueryOption = {},
  ): Promise<TModel> {
    return await this.model.query(option.transaction).insert(docToInsert);
  }

  // todo add transaction like update here
  public async bulkInsert(
    docToInsert: Partial<TModel>[],
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    return await this.model.query(option.transaction).insert(docToInsert);
  }

  public async patch(
    id: number | string,
    docToUpdate: Partial<TModel>,
    option: ObjectionQueryOption = {},
  ): Promise<TModel> {
    return await this.model
      .query(option.transaction)
      .withGraphFetched(option.relationExpression)
      .patchAndFetchById(id, docToUpdate);
  }

  public async multiOnePatch(
    ids: number[] | string[],
    patchNote: Partial<TModel>,
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    return await this.model
      .query(option.transaction)
      .patch(patchNote)
      .whereIn(this.idColumn, ids)
      .returning('*');
  }

  public async multiPatch(
    docs: { id: any; doc: Partial<TModel> }[],
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    if (!option.transaction) {
      return await Objection.transaction(
        this.model.knex(),
        async transaction => {
          return await Promise.all(
            docs.map(docToUpdate => {
              return this.patch(docToUpdate.id, docToUpdate.doc, {
                transaction,
                relationExpression: option.relationExpression,
              });
            }),
          );
        },
      );
    }

    return await Promise.all(
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
    return await this.model
      .query(option.transaction)
      .updateAndFetchById(id, docToUpdate);
  }

  public async delete(
    ids: number[] | string[],
    option: ObjectionQueryOption = {},
  ): Promise<TModel[]> {
    if (this.model.isTraceable) {
      return await this.multiOnePatch(ids, { delete_at: new Date() } as any);
    }
    return await this.model
      .query(option.transaction)
      .delete()
      .whereIn(this.idColumn, ids)
      .returning('*');
  }

  // allow to easily extend find and count for specifique use case
  protected getBasicFindAndCountQuery(
    params: PaginationArguments,
    option: ObjectionQueryOption = {},
  ) {
    // range is inclusive
    const baseQuery = this.model
      .query(option.transaction)
      .range(params.offset, params.offset + params.limit - 1);

    if (this.model.isTraceable) {
      baseQuery.whereNull('delete_at');
    }
    if (params.sortCol) {
      baseQuery.orderBy(params.sortCol, get(params, 'sortOrder', 'DESC'));
    } else {
      baseQuery.orderBy(this.idColumn, 'DESC');
    }
    return baseQuery;
  }
}
