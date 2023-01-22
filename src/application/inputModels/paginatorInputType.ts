export class PaginatorInputType {
  sortBy = 'createdAt';
  sortDirection: 'desc' | 'asc' = 'desc';
  pageNumber = 1;
  pageSize = 10;
}
