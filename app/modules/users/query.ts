import { CircleCheckIcon, CircleSlashIcon, ClockIcon } from "lucide-react"
import type {
  DataTableFilter,
  DataTableFilterOption,
  ListQuerySchema,
} from "~/lib/datatable/types"
import {
  USER_ROLES,
  USER_SORT_FIELDS,
  USER_STATUSES,
  USER_TEAMS,
  type UserRole,
  type UserSortField,
  type UserStatus,
} from "./types"

export type UserFilterKey = "status" | "role" | "team"

type FilterConfig = {
  label: string
  options: readonly DataTableFilterOption[]
}

/**
 * Labels/icons are keyed by the value unions from `types.ts`, so adding a status
 * or role is a compile error here until it has a label and an icon. Filter values
 * can therefore never drift from what the server accepts.
 */
const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
}

const STATUS_ICONS: Record<UserStatus, DataTableFilterOption["icon"]> = {
  active: CircleCheckIcon,
  invited: ClockIcon,
  suspended: CircleSlashIcon,
}

const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
}

const ROLE_ICONS: Record<UserRole, DataTableFilterOption["icon"]> = {
  owner: CircleCheckIcon,
  admin: CircleCheckIcon,
  member: CircleCheckIcon,
  viewer: CircleCheckIcon,
}

export const USER_FILTERS: Record<UserFilterKey, FilterConfig> = {
  status: {
    label: "Status",
    options: USER_STATUSES.map((value) => ({
      value,
      label: STATUS_LABELS[value],
      icon: STATUS_ICONS[value],
    })),
  },
  role: {
    label: "Role",
    options: USER_ROLES.map((value) => ({
      value,
      label: ROLE_LABELS[value],
      icon: ROLE_ICONS[value],
    })),
  },
  team: {
    label: "Team",
    options: USER_TEAMS.map((value) => ({ value, label: value })),
  },
}

function allowedValues(key: UserFilterKey): readonly string[] {
  return USER_FILTERS[key].options.map((option) => option.value)
}

/** The single source of truth for validating user list queries. */
export const USER_QUERY_SCHEMA: ListQuerySchema<UserSortField> = {
  sortableFields: USER_SORT_FIELDS,
  filterValues: {
    status: allowedValues("status"),
    role: allowedValues("role"),
    team: allowedValues("team"),
  },
  // Newest first: the most useful default for an admin table, and a stable tie
  // breaker for the name sort.
  defaultSort: [{ field: "createdAt", direction: "desc" }],
  defaultPerPage: 10,
  perPageOptions: [10, 25, 50, 100],
  maxSearchLength: 100,
}

/** `Object.keys` widens to `string[]`; the keys are constrained by the Record type above. */
export const USER_DATATABLE_FILTERS: readonly DataTableFilter[] = (
  Object.keys(USER_FILTERS) as UserFilterKey[]
).map((key) => ({
  key,
  label: USER_FILTERS[key].label,
  options: USER_FILTERS[key].options,
}))
