export const PERMISSION_ENTITIES = [
  "user",
  "role",
  "permission",
  "master-data",
] as const
export type PermissionEntity = (typeof PERMISSION_ENTITIES)[number]

export const PERMISSION_ACTIONS = ["view", "add", "edit", "delete"] as const
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

/** `entity:action`, e.g. `user:add`. The only permission strings the app accepts. */
export type Permission = `${PermissionEntity}:${PermissionAction}`

export const ALL_PERMISSIONS: readonly Permission[] =
  PERMISSION_ENTITIES.flatMap((entity) =>
    PERMISSION_ACTIONS.map((action) => `${entity}:${action}` as const)
  )

const PERMISSION_SET: ReadonlySet<string> = new Set(ALL_PERMISSIONS)

export function isPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value)
}

/** Absence of the permission is a denial: no session, no access. */
export function can(
  permissions: readonly Permission[] | undefined,
  required: Permission
): boolean {
  return permissions?.includes(required) ?? false
}

export const ENTITY_LABELS: Record<PermissionEntity, string> = {
  user: "Users",
  role: "Roles",
  permission: "Permissions",
  "master-data": "Master data",
}

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  add: "Create",
  edit: "Edit",
  delete: "Delete",
}

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  "user:view": "See the user directory and its filters.",
  "user:add": "Invite new users to the workspace.",
  "user:edit": "Change a user's name, email, role, or status.",
  "user:delete": "Remove users from the workspace.",
  "role:view": "See roles and the permissions they grant.",
  "role:add": "Create new roles.",
  "role:edit": "Rename roles and change their permissions.",
  "role:delete": "Delete roles that are no longer used.",
  "permission:view": "See the permission catalog.",
  "permission:add": "Add permissions (reserved for schema changes).",
  "permission:edit": "Modify permission definitions (reserved).",
  "permission:delete": "Remove permission definitions (reserved).",
  "master-data:view": "See lookup values such as teams and regions.",
  "master-data:add": "Create new lookup values.",
  "master-data:edit": "Change existing lookup values.",
  "master-data:delete": "Delete lookup values.",
}

export function splitPermission(permission: Permission): {
  entity: PermissionEntity
  action: PermissionAction
} {
  const [entity, action] = permission.split(":") as [
    PermissionEntity,
    PermissionAction,
  ]
  return { entity, action }
}
