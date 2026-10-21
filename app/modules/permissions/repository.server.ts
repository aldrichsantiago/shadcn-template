import {
  ALL_PERMISSIONS,
  ENTITY_LABELS,
  PERMISSION_ACTIONS,
  PERMISSION_DESCRIPTIONS,
  splitPermission,
} from "~/lib/auth/permissions"
import { queryRows } from "~/lib/datatable/in-memory-query"
import type { ListParams, Page } from "~/lib/datatable/types"
import type { PermissionRow, PermissionSortField } from "./types"

/** Permissions are defined in code, so the catalog is derived, never stored. */
const ROWS: PermissionRow[] = ALL_PERMISSIONS.map((permission) => {
  const { entity, action } = splitPermission(permission)
  return {
    id: permission,
    entity,
    action,
    description: PERMISSION_DESCRIPTIONS[permission],
  }
})

export type PermissionRepository = {
  list(params: ListParams<PermissionSortField>): Promise<Page<PermissionRow>>
}

export const permissionRepository: PermissionRepository = {
  async list(params) {
    return queryRows({
      rows: ROWS,
      params,
      sortAccessors: {
        entity: (row) => ENTITY_LABELS[row.entity],
        action: (row) => PERMISSION_ACTIONS.indexOf(row.action),
      },
      filterPredicates: {
        entity: (row, values) => values.includes(row.entity),
      },
      searchAccessors: [(row) => row.id, (row) => row.description],
    })
  },
}
