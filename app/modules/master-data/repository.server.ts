import { randomUUID } from "node:crypto"
import { queryRows } from "~/lib/datatable/in-memory-query"
import type { ListParams, Page } from "~/lib/datatable/types"
import { MASTER_DATA } from "./data.server"
import type {
  MasterDataCategory,
  MasterDataEntry,
  MasterDataSortField,
} from "./types"

export type MasterDataInput = {
  name: string
  code: string
  category: MasterDataCategory
  description: string
}

export type MasterDataRepository = {
  list(params: ListParams<MasterDataSortField>): Promise<Page<MasterDataEntry>>
  createEntry(input: MasterDataInput): Promise<MasterDataEntry>
  updateEntry(id: string, input: MasterDataInput): Promise<boolean>
  /** Returns how many rows were actually removed. */
  deleteEntries(ids: readonly string[]): Promise<number>
}

export const masterDataRepository: MasterDataRepository = {
  async list(params) {
    return queryRows({
      rows: MASTER_DATA,
      params,
      sortAccessors: {
        name: (entry) => entry.name,
        category: (entry) => entry.category,
        updatedAt: (entry) => Date.parse(entry.updatedAt),
      },
      filterPredicates: {
        category: (entry, values) => values.includes(entry.category),
      },
      searchAccessors: [
        (entry) => entry.name,
        (entry) => entry.code,
        (entry) => entry.description,
      ],
    })
  },

  async createEntry(input) {
    const entry: MasterDataEntry = {
      id: `md_${randomUUID()}`,
      ...input,
      updatedAt: new Date().toISOString(),
    }
    MASTER_DATA.push(entry)
    return entry
  },

  async updateEntry(id, input) {
    const entry = MASTER_DATA.find((candidate) => candidate.id === id)
    if (!entry) return false

    Object.assign(entry, input, { updatedAt: new Date().toISOString() })
    return true
  },

  async deleteEntries(ids) {
    const doomed = new Set(ids)
    const before = MASTER_DATA.length

    for (let index = MASTER_DATA.length - 1; index >= 0; index--) {
      if (doomed.has(MASTER_DATA[index].id)) MASTER_DATA.splice(index, 1)
    }

    return before - MASTER_DATA.length
  },
}
