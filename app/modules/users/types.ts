export const USER_STATUSES = ["active", "invited", "suspended"] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const USER_ROLES = ["owner", "admin", "member", "viewer"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const USER_TEAMS = [
  "Platform",
  "Growth",
  "Support",
  "Finance",
  "Design",
] as const
export type UserTeam = (typeof USER_TEAMS)[number]

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  team: UserTeam
  /** ISO timestamp, or `null` for users who have never signed in. */
  lastActiveAt: string | null
  /** ISO timestamp. */
  createdAt: string
}

/**
 * Fields the server will sort by. The `Record<UserSortField, ...>` maps in the
 * repository force a new accessor to be added whenever a field is added here.
 */
export const USER_SORT_FIELDS = [
  "name",
  "email",
  "role",
  "status",
  "team",
  "lastActiveAt",
  "createdAt",
] as const
export type UserSortField = (typeof USER_SORT_FIELDS)[number]
