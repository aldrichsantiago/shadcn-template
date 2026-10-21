import { randomUUID } from "node:crypto"
import type { Permission } from "~/lib/auth/permissions"
import {
  queryRows,
  type SearchAccessors,
  type SortAccessors,
} from "~/lib/datatable/in-memory-query"
import type { ListParams, Page } from "~/lib/datatable/types"
import { ROLES } from "./data.server"
import type { Role, RoleSortField } from "./types"

export type RoleInput = {
  name: string
  description: string
  permissions: Permission[]
}

export type RoleRepository = {
  list(params: ListParams<RoleSortField>): Promise<Page<Role>>
  findById(id: string): Promise<Role | undefined>
  createRole(input: RoleInput): Promise<Role>
  updateRole(id: string, input: RoleInput): Promise<boolean>
  /** Returns how many rows were actually removed. */
  deleteRoles(ids: readonly string[]): Promise<number>
  /** Case-insensitive uniqueness check, ignoring the row being edited. */
  nameExists(name: string, exceptId?: string): Promise<boolean>
}

const SORT_ACCESSORS: SortAccessors<Role> = {
  name: (role) => role.name,
  createdAt: (role) => Date.parse(role.createdAt),
}

const SEARCH_ACCESSORS: SearchAccessors<Role> = [
  (role) => role.name,
  (role) => role.description,
]

export const roleRepository: RoleRepository = {
  async list(params) {
    return queryRows({
      rows: ROLES,
      params,
      sortAccessors: SORT_ACCESSORS,
      filterPredicates: {},
      searchAccessors: SEARCH_ACCESSORS,
    })
  },

  async findById(id) {
    return ROLES.find((role) => role.id === id)
  },

  async createRole(input) {
    const role: Role = {
      id: `role_${randomUUID()}`,
      ...input,
      createdAt: new Date().toISOString(),
    }
    ROLES.push(role)
    return role
  },

  async updateRole(id, input) {
    const role = ROLES.find((candidate) => candidate.id === id)
    if (!role) return false

    Object.assign(role, input)
    return true
  },

  async deleteRoles(ids) {
    const doomed = new Set(ids)
    const before = ROLES.length

    for (let index = ROLES.length - 1; index >= 0; index--) {
      if (doomed.has(ROLES[index].id)) ROLES.splice(index, 1)
    }

    return before - ROLES.length
  },

  async nameExists(name, exceptId) {
    const normalized = name.trim().toLowerCase()
    return ROLES.some(
      (role) =>
        role.id !== exceptId && role.name.trim().toLowerCase() === normalized
    )
  },
}
