export interface PaginationArguments {
  limit: number;
  offset: number;
  sortCol?: string; // should be col name_
  sortOrder?: string; // format should be ASC or DESC
}

export interface Page<T> {
  results: T[];
  first: boolean;
  last: boolean;
  pageNumber: number;
  numberOfElements: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}
