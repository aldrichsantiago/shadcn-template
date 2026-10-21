import type { ListQuerySchema } from "~/lib/datatable/types"
import { ROLE_SORT_FIELDS, type RoleSortField } from "./types"

export const ROLE_QUERY_SCHEMA: ListQuerySchema<RoleSortField> = {
  sortableFields: ROLE_SORT_FIELDS,
  filterValues: {},
  defaultSort: [{ field: "createdAt", direction: "asc" }],
  defaultPerPage: 10,
  perPageOptions: [10, 25, 50],
  maxSearchLength: 100,
}
