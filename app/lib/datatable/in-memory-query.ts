import type { DateRange, ListParams, Page, SortParam } from "./types"

/** Row -> the value to compare/sort by, per sortable field. */
export type SortAccessors<TRow> = Record<string, (row: TRow) => unknown>
/** Row + selected values -> predicate, per filterable key. */
export type FilterPredicates<TRow> = Record<
  string,
  (row: TRow, values: string[]) => boolean
>
/** Row -> the ISO timestamp a date-range filter constrains. */
export type DateAccessors<TRow> = Record<
  string,
  (row: TRow) => string | null | undefined
>
/** Row -> the text to match a search term against. */
export type SearchAccessors<TRow> = readonly ((row: TRow) => unknown)[]

const DAY_MS = 86_400_000

/**
 * Nullish values always sort last, regardless of direction — otherwise a single
 * missing field flips to the top of every descending page.
 */
function compareWithDirection(
  a: unknown,
  b: unknown,
  direction: SortParam["direction"]
): number {
  const aMissing = a === null || a === undefined
  const bMissing = b === null || b === undefined
  if (aMissing || bMissing) return aMissing ? (bMissing ? 0 : 1) : -1

  const result = compareValues(a, b)
  return direction === "desc" ? -result : result
}

export function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (typeof a === "number" && typeof b === "number") return a - b
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  if (typeof a === "boolean" && typeof b === "boolean")
    return Number(a) - Number(b)
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

/** Multi-column sort, applied in the order the sort params are declared. */
export function sortRows<TRow>(
  rows: readonly TRow[],
  sort: readonly SortParam[],
  accessors: SortAccessors<TRow>
): TRow[] {
  const comparators = sort.flatMap(({ field, direction }) => {
    const accessor = accessors[field]
    if (!accessor) return []
    return [
      (a: TRow, b: TRow) =>
        compareWithDirection(accessor(a), accessor(b), direction),
    ]
  })

  if (comparators.length === 0) return [...rows]

  // Array.prototype.sort is stable per spec, so equal rows keep their input order.
  return [...rows].sort((a, b) => {
    for (const compare of comparators) {
      const result = compare(a, b)
      if (result !== 0) return result
    }
    return 0
  })
}

/** Each filter key narrows the result (AND across keys, OR within a key's values). */
export function filterRows<TRow>(
  rows: readonly TRow[],
  filters: Record<string, string[]>,
  predicates: FilterPredicates<TRow>
): TRow[] {
  const active = Object.entries(filters).filter(
    ([key, values]) => values.length > 0 && predicates[key] !== undefined
  )
  if (active.length === 0) return [...rows]

  return rows.filter((row) =>
    active.every(([key, values]) => predicates[key](row, values))
  )
}

/**
 * Case-insensitive substring match. Multiple whitespace-separated terms must all
 * match (in any of the searched fields), which makes "ana active" behave the way
 * people expect from an admin table.
 */
export function searchRows<TRow>(
  rows: readonly TRow[],
  term: string,
  accessors: SearchAccessors<TRow>
): TRow[] {
  const terms = term.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0 || accessors.length === 0) return [...rows]

  return rows.filter((row) => {
    const haystack = accessors
      .map((accessor) => accessor(row))
      .filter((value) => value !== null && value !== undefined)
      .join(" ")
      .toLowerCase()
    return terms.every((needle) => haystack.includes(needle))
  })
}

function toTime(value: string | null | undefined): number | null {
  if (!value) return null
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : time
}

/**
 * Inclusive day range. `to` covers the whole day, undated rows never match, and an
 * active range excludes them rather than treating "never" as ancient history.
 */
export function filterRowsByDateRange<TRow>(
  rows: readonly TRow[],
  dateRanges: Record<string, DateRange>,
  accessors: DateAccessors<TRow>
): TRow[] {
  const bounds = Object.entries(dateRanges).flatMap(([key, range]) => {
    const accessor = accessors[key]
    if (!accessor || (!range.from && !range.to)) return []
    return [
      {
        accessor,
        from: range.from ? Date.parse(`${range.from}T00:00:00Z`) : null,
        to: range.to ? Date.parse(`${range.to}T00:00:00Z`) + DAY_MS : null,
      },
    ]
  })
  if (bounds.length === 0) return [...rows]

  return rows.filter((row) =>
    bounds.every(({ accessor, from, to }) => {
      const time = toTime(accessor(row))
      if (time === null) return false
      if (from !== null && time < from) return false
      if (to !== null && time >= to) return false
      return true
    })
  )
}

export function paginateRows<TRow>(
  rows: readonly TRow[],
  requestedPage: number,
  perPage: number
): Page<TRow> {
  const total = rows.length
  const pageCount = Math.max(1, Math.ceil(total / perPage))
  // Clamp instead of erroring: a stale request still renders useful results.
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  const start = (page - 1) * perPage

  return {
    rows: rows.slice(start, start + perPage),
    total,
    page,
    perPage,
    pageCount,
  }
}

export type QueryRowsOptions<TRow, TField extends string> = {
  rows: readonly TRow[]
  params: ListParams<TField>
  sortAccessors: SortAccessors<TRow>
  filterPredicates: FilterPredicates<TRow>
  dateAccessors?: DateAccessors<TRow>
  searchAccessors: SearchAccessors<TRow>
}

/**
 * The full server-side pipeline. Swap this out for a real SQL/ORM adapter and the
 * rest of the datatable (wire format, UI, validation) keeps working unchanged.
 */
export function queryRows<TRow, TField extends string>({
  rows,
  params,
  sortAccessors,
  filterPredicates,
  dateAccessors = {},
  searchAccessors,
}: QueryRowsOptions<TRow, TField>): Page<TRow> {
  const filtered = filterRows(rows, params.filters, filterPredicates)
  const ranged = filterRowsByDateRange(
    filtered,
    params.dateRanges,
    dateAccessors
  )
  const searched = searchRows(ranged, params.search, searchAccessors)
  const sorted = sortRows(searched, params.sort, sortAccessors)
  return paginateRows(sorted, params.page, params.perPage)
}
