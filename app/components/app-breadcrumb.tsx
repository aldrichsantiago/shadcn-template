import * as React from "react"
import { Link, useMatches } from "react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"

/**
 * Route modules opt into the layout breadcrumb by exporting a handle:
 *
 *   export const handle = { breadcrumb: "Users" }
 */
type BreadcrumbHandle = { breadcrumb?: string }

function readBreadcrumb(handle: unknown): string | undefined {
  if (typeof handle !== "object" || handle === null) return undefined
  const { breadcrumb } = handle as BreadcrumbHandle
  return typeof breadcrumb === "string" ? breadcrumb : undefined
}

export function AppBreadcrumb() {
  const crumbs = useMatches().flatMap((match) => {
    const label = readBreadcrumb(match.handle)
    return label ? [{ id: match.id, pathname: match.pathname, label }] : []
  })

  if (crumbs.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1

          return (
            <React.Fragment key={crumb.id}>
              {/* Ancestors collapse on small screens; the current page stays visible. */}
              <BreadcrumbItem
                className={isLast ? undefined : "hidden md:block"}
              >
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.pathname}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
