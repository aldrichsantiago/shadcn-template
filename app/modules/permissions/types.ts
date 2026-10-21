import type {
  Permission,
  PermissionAction,
  PermissionEntity,
} from "~/lib/auth/permissions"

/** Read-only projection of the permission catalog for the datatable. */
export type PermissionRow = {
  id: Permission
  entity: PermissionEntity
  action: PermissionAction
  description: string
}

export const PERMISSION_SORT_FIELDS = ["entity", "action"] as const
export type PermissionSortField = (typeof PERMISSION_SORT_FIELDS)[number]
