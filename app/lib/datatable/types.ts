import type * as React from "react"

export type SortDirection = "asc" | "desc"

/** A single-column sort instruction. `field` is always a whitelisted key. */
export type SortParam<TField extends string = string> = {
  field: TField
  direction: SortDirection
}

/**
 * Fully validated, normalized list state. This is what the server queries with
 * and what the client renders controls from — never raw user input.
 */
export type ListParams<TField extends string = string> = {
  page: number
  perPage: number
  search: string
  sort: SortParam<TField>[]
  /** filter key -> selected values. A missing/empty entry means "no constraint". */
  filters: Record<string, string[]>
}

/** One page of results plus the counters needed to render pagination. */
export type Page<TRow> = {
  rows: TRow[]
  total: number
  page: number
  perPage: number
  pageCount: number
}

/**
 * The contract every module declares once. It is the single source of truth for
 * URL parsing (client) and query validation (server), so the two can never drift.
 */
export type ListQuerySchema<TField extends string = string> = {
  /** Fields a client is allowed to sort by. Anything else is ignored. */
  sortableFields: readonly TField[]
  /** Filter key -> the exact values a client is allowed to filter by. */
  filterValues: Readonly<Record<string, readonly string[]>>
  /** Applied when no valid `sort` param is present. */
  defaultSort: readonly SortParam<TField>[]
  defaultPerPage: number
  /** Whitelisted page sizes; anything else falls back to `defaultPerPage`. */
  perPageOptions: readonly number[]
  maxSearchLength?: number
  maxFilterValuesPerKey?: number
  maxSortFields?: number
}

/**
 * A column definition is presentation + the server field it maps to, so the same
 * object drives both rendering and (whitelisted) sorting.
 */
export type DataTableColumn<TRow, TField extends string = string> = {
  id: string
  header: string
  /** Server-side field used for sorting. Omit for non-sortable columns. */
  sortField?: TField
  cell: (row: TRow) => React.ReactNode
  className?: string
  headerClassName?: string
}

export type DataTableFilterOption = {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

/** A faceted filter rendered in the toolbar. `key` must exist in the schema. */
export type DataTableFilter = {
  key: string
  label: string
  options: readonly DataTableFilterOption[]
}
