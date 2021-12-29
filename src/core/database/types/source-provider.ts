import { ObjectionQueryOption } from './objection-query-option';
import { PaginationArguments } from './pagination.type';

export type SourceProvider<T> = (
  pageArgs: PaginationArguments,
  options?: ObjectionQueryOption
) => Promise<{ results: T[]; total: number }>;
