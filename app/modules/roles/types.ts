import type { Permission } from "~/lib/auth/permissions"

export type Role = {
  id: string
  name: string
  description: string
  permissions: Permission[]
  createdAt: string
}

export const ROLE_SORT_FIELDS = ["name", "createdAt"] as const
export type RoleSortField = (typeof ROLE_SORT_FIELDS)[number]

/** Granted to every signed-in user, so the UI never offers to remove it. */
export const OWNER_ROLE_NAME = "Owner"
