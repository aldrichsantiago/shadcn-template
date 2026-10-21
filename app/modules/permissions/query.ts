import { ENTITY_LABELS, PERMISSION_ENTITIES } from "~/lib/auth/permissions"
import type { DataTableFilter, ListQuerySchema } from "~/lib/datatable/types"
import { PERMISSION_SORT_FIELDS, type PermissionSortField } from "./types"

export const PERMISSION_QUERY_SCHEMA: ListQuerySchema<PermissionSortField> = {
  sortableFields: PERMISSION_SORT_FIELDS,
  filterValues: { entity: PERMISSION_ENTITIES },
  defaultSort: [
    { field: "entity", direction: "asc" },
    { field: "action", direction: "asc" },
  ],
  // The catalog is small enough to show in one page.
  defaultPerPage: 10,
  perPageOptions: [10, 25, 50, 100],
  maxSearchLength: 100,
}

export const PERMISSION_DATATABLE_FILTERS: readonly DataTableFilter[] = [
  {
    key: "entity",
    label: "Entity",
    options: PERMISSION_ENTITIES.map((entity) => ({
      value: entity,
      label: ENTITY_LABELS[entity],
    })),
  },
]
