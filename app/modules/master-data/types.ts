export const MASTER_DATA_CATEGORIES = ["team", "department", "region"] as const
export type MasterDataCategory = (typeof MASTER_DATA_CATEGORIES)[number]

export type MasterDataEntry = {
  id: string
  category: MasterDataCategory
  name: string
  /** Short stable code used by imports and integrations, e.g. `ENG`. */
  code: string
  description: string
  updatedAt: string
}

export const MASTER_DATA_SORT_FIELDS = [
  "name",
  "category",
  "updatedAt",
] as const
export type MasterDataSortField = (typeof MASTER_DATA_SORT_FIELDS)[number]
