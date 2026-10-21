import type { ListParams, ListQuerySchema, SortParam } from "./types"

/** Plain params owned by the datatable. Filters are namespaced `filter.<key>`. */
export const DATATABLE_PARAM_KEYS = ["page", "per_page", "sort", "q"] as const
export const FILTER_PARAM_PREFIX = "filter."

const DEFAULT_MAX_SEARCH_LENGTH = 100
const DEFAULT_MAX_FILTER_VALUES_PER_KEY = 25
const DEFAULT_MAX_SORT_FIELDS = 3
/** Guards against absurd `page` values being used to build huge offset queries. */
const MAX_PAGE = 10_000

function readPositiveInt(raw: string | null): number | null {
  if (raw === null) return null
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_PAGE
    ? parsed
    : null
}

/**
 * Keeps parsing and serialization in agreement when a schema declares a
 * `defaultPerPage` that is missing from `perPageOptions`.
 */
export function resolveDefaultPerPage(schema: ListQuerySchema): number {
  return schema.perPageOptions.includes(schema.defaultPerPage)
    ? schema.defaultPerPage
    : (schema.perPageOptions[0] ?? 10)
}

function parseSort<TField extends string>(
  raw: string | null,
  schema: ListQuerySchema<TField>
): SortParam<TField>[] {
  const fallback = () => [...schema.defaultSort]
  if (!raw) return fallback()

  const allowed = new Set<string>(schema.sortableFields)
  const maxFields = schema.maxSortFields ?? DEFAULT_MAX_SORT_FIELDS
  const seen = new Set<string>()
  const sort: SortParam<TField>[] = []

  for (const token of raw.split(",")) {
    const trimmed = token.trim()
    if (!trimmed) continue

    const field = trimmed.replace(/^[-+]/, "")
    // `allowed` is a Set<string> because Set<TField>.has() does not narrow;
    // membership is checked against the schema whitelist before the cast.
    if (!allowed.has(field) || seen.has(field)) continue

    seen.add(field)
    sort.push({
      field: field as TField,
      direction: trimmed.startsWith("-") ? "desc" : "asc",
    })
    if (sort.length >= maxFields) break
  }

  return sort.length > 0 ? sort : fallback()
}

function parseFilters<TField extends string>(
  searchParams: URLSearchParams,
  schema: ListQuerySchema<TField>
): Record<string, string[]> {
  const maxValues =
    schema.maxFilterValuesPerKey ?? DEFAULT_MAX_FILTER_VALUES_PER_KEY
  const filters: Record<string, string[]> = {}

  for (const [key, rawValue] of searchParams.entries()) {
    if (!key.startsWith(FILTER_PARAM_PREFIX)) continue

    const filterKey = key.slice(FILTER_PARAM_PREFIX.length)
    const allowedValues = schema.filterValues[filterKey]
    if (!allowedValues) continue

    const allowed = new Set<string>(allowedValues)
    const selected = filters[filterKey] ?? (filters[filterKey] = [])

    for (const candidate of rawValue.split(",")) {
      const value = candidate.trim()
      if (!value || !allowed.has(value) || selected.includes(value)) continue
      selected.push(value)
      if (selected.length >= maxValues) break
    }
  }

  for (const key of Object.keys(filters)) {
    if (filters[key].length === 0) delete filters[key]
  }

  return filters
}

/**
 * Turns untrusted search params into normalized list params. Unknown sort fields,
 * unknown filter keys/values, and out-of-range page sizes are dropped rather than
 * rejected, so a hand-edited URL degrades to a sane query instead of erroring.
 */
export function parseListParams<TField extends string>(
  searchParams: URLSearchParams,
  schema: ListQuerySchema<TField>
): ListParams<TField> {
  const requestedPerPage = readPositiveInt(searchParams.get("per_page"))
  const defaultPerPage = resolveDefaultPerPage(schema)

  return {
    page: readPositiveInt(searchParams.get("page")) ?? 1,
    perPage:
      requestedPerPage && schema.perPageOptions.includes(requestedPerPage)
        ? requestedPerPage
        : defaultPerPage,
    search: (searchParams.get("q") ?? "")
      .trim()
      .slice(0, schema.maxSearchLength ?? DEFAULT_MAX_SEARCH_LENGTH),
    sort: parseSort(searchParams.get("sort"), schema),
    filters: parseFilters(searchParams, schema),
  }
}

function sortsAreEqual<TField extends string>(
  a: readonly SortParam<TField>[],
  b: readonly SortParam<TField>[]
): boolean {
  return (
    a.length === b.length &&
    a.every(
      (sort, index) =>
        sort.field === b[index].field && sort.direction === b[index].direction
    )
  )
}

/**
 * Serializes back to search params, preserving any params the datatable does not
 * own (e.g. `tab=active`) so the URL stays the single source of truth.
 * Defaults are omitted to keep canonical URLs clean and redirect-free.
 */
export function serializeListParams<TField extends string>(
  params: ListParams<TField>,
  schema: ListQuerySchema<TField>,
  base?: URLSearchParams
): URLSearchParams {
  const search = new URLSearchParams(base)

  for (const key of DATATABLE_PARAM_KEYS) search.delete(key)
  for (const key of [...search.keys()]) {
    if (key.startsWith(FILTER_PARAM_PREFIX)) search.delete(key)
  }

  if (params.page > 1) search.set("page", String(params.page))
  if (params.perPage !== resolveDefaultPerPage(schema)) {
    search.set("per_page", String(params.perPage))
  }
  if (params.search) search.set("q", params.search)
  if (!sortsAreEqual(params.sort, schema.defaultSort)) {
    search.set(
      "sort",
      params.sort
        .map((sort) =>
          sort.direction === "desc" ? `-${sort.field}` : sort.field
        )
        .join(",")
    )
  }

  for (const [key, values] of Object.entries(params.filters)) {
    if (values.length > 0)
      search.set(`${FILTER_PARAM_PREFIX}${key}`, values.join(","))
  }

  return search
}

/**
 * Order-insensitive fingerprint of only the params the datatable owns. Used by the
 * loader to decide whether a redirect to the canonical URL is needed — comparing
 * whole query strings would produce false positives from param ordering.
 */
export function datatableParamsFingerprint<TField extends string>(
  searchParams: URLSearchParams,
  schema: ListQuerySchema<TField>
): string {
  const parts: string[] = []

  for (const key of DATATABLE_PARAM_KEYS) {
    for (const value of searchParams.getAll(key)) parts.push(`${key}=${value}`)
  }

  for (const key of Object.keys(schema.filterValues)) {
    const values = searchParams
      .getAll(`${FILTER_PARAM_PREFIX}${key}`)
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean)
      .sort()
    if (values.length > 0)
      parts.push(`${FILTER_PARAM_PREFIX}${key}=${values.join(",")}`)
  }

  return parts.join("&")
}
