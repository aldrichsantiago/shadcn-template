/**
 * Fixed locale + timeZone so SSR markup and the client render match exactly.
 * Relative formats ("2 days ago") desync by design.
 */
const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

export function formatDate(isoDate: string | null | undefined): string {
  return isoDate ? DATE_FORMATTER.format(new Date(isoDate)) : "Never"
}
