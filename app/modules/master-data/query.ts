import type { DataTableFilter, ListQuerySchema } from "~/lib/datatable/types"
import {
  MASTER_DATA_CATEGORIES,
  MASTER_DATA_SORT_FIELDS,
  type MasterDataSortField,
} from "./types"

const CATEGORY_LABELS: Record<string, string> = {
  team: "Team",
  department: "Department",
  region: "Region",
}

export const MASTER_DATA_QUERY_SCHEMA: ListQuerySchema<MasterDataSortField> = {
  sortableFields: MASTER_DATA_SORT_FIELDS,
  filterValues: { category: MASTER_DATA_CATEGORIES },
  defaultSort: [{ field: "name", direction: "asc" }],
  defaultPerPage: 10,
  perPageOptions: [10, 25, 50],
  maxSearchLength: 100,
}

export const MASTER_DATA_DATATABLE_FILTERS: readonly DataTableFilter[] = [
  {
    key: "category",
    label: "Category",
    options: MASTER_DATA_CATEGORIES.map((category) => ({
      value: category,
      label: CATEGORY_LABELS[category],
    })),
  },
]
