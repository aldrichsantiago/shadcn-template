import type { Permission } from "./permissions"

export const CURRENT_USER_ROLES = [
  "owner",
  "admin",
  "member",
  "viewer",
] as const
export type CurrentUserRole = (typeof CURRENT_USER_ROLES)[number]

export type CurrentUser = {
  id: string
  name: string
  email: string
  /** The role name this user is currently resolved against. */
  role: CurrentUserRole
  permissions: readonly Permission[]
}

export function isCurrentUserRole(value: string): value is CurrentUserRole {
  return (CURRENT_USER_ROLES as readonly string[]).includes(value)
}
