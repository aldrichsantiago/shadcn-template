import {
  queryRows,
  type FilterPredicates,
  type SearchAccessors,
  type SortAccessors,
} from "~/lib/datatable/in-memory-query"
import type { ListParams, Page } from "~/lib/datatable/types"
import { USERS } from "./data.server"
import type { UserFilterKey } from "./query"
import type { User, UserSortField } from "./types"

/**
 * The seam a real database slots into. Keep every accessor/predicate below in sync
 * with `USER_QUERY_SCHEMA` — the `Record<...>` types make omissions compile errors.
 */
/** Editable fields. Team/timestamps are out of scope of the edit form. */
export type UserPatch = Pick<User, "name" | "email" | "role" | "status">

export type UserRepository = {
  list(params: ListParams<UserSortField>): Promise<Page<User>>
  /** Returns how many rows were actually removed. */
  deleteUsers(ids: readonly string[]): Promise<number>
  /** Returns false when the id no longer exists. */
  updateUser(id: string, patch: UserPatch): Promise<boolean>
}

const SORT_ACCESSORS: SortAccessors<User> = {
  name: (user) => user.name,
  email: (user) => user.email,
  role: (user) => user.role,
  status: (user) => user.status,
  team: (user) => user.team,
  // Nulls are handled by the comparators: never-active users sort last either way.
  lastActiveAt: (user) =>
    user.lastActiveAt ? Date.parse(user.lastActiveAt) : null,
  createdAt: (user) => Date.parse(user.createdAt),
} satisfies Record<UserSortField, (user: User) => unknown>

const SEARCH_ACCESSORS: SearchAccessors<User> = [
  (user) => user.name,
  (user) => user.email,
  (user) => user.team,
  (user) => user.role,
  (user) => user.status,
]

const FILTER_PREDICATES: FilterPredicates<User> = {
  status: (user, values) => values.includes(user.status),
  role: (user, values) => values.includes(user.role),
  team: (user, values) => values.includes(user.team),
} satisfies Record<UserFilterKey, (user: User, values: string[]) => boolean>

export const userRepository: UserRepository = {
  // Async on purpose: the in-memory implementation is synchronous, but callers
  // should not have to change when this is swapped for SQL.
  async list(params) {
    return queryRows({
      rows: USERS,
      params,
      sortAccessors: SORT_ACCESSORS,
      filterPredicates: FILTER_PREDICATES,
      searchAccessors: SEARCH_ACCESSORS,
    })
  },

  async deleteUsers(ids) {
    const doomed = new Set(ids)
    const before = USERS.length

    // Mutates the mock store in place — `list()` reads this same array.
    for (let index = USERS.length - 1; index >= 0; index--) {
      if (doomed.has(USERS[index].id)) USERS.splice(index, 1)
    }

    return before - USERS.length
  },

  async updateUser(id, patch) {
    const user = USERS.find((candidate) => candidate.id === id)
    if (!user) return false

    Object.assign(user, patch)
    return true
  },
}
