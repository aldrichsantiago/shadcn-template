import { DataTable } from "~/components/data-table/data-table"
import { requirePermission } from "~/lib/auth/session.server"
import { parseListParams } from "~/lib/datatable/params"
import { permissionColumns } from "~/modules/permissions/columns"
import {
  PERMISSION_DATATABLE_FILTERS,
  PERMISSION_QUERY_SCHEMA,
} from "~/modules/permissions/query"
import { permissionRepository } from "~/modules/permissions/repository.server"
import type { Route } from "./+types/permissions"

export const meta: Route.MetaFunction = () => [{ title: "Permissions" }]

export const handle = { breadcrumb: "Permissions" }

export async function loader({ request }: Route.LoaderArgs) {
  requirePermission(request, "permission:view")

  const url = new URL(request.url)
  return permissionRepository.list(
    parseListParams(url.searchParams, PERMISSION_QUERY_SCHEMA)
  )
}

/**
 * Read-only by design: permissions are typed constants that gate server code, so
 * creating one here would create a string nothing enforces. Add a row to
 * `app/lib/auth/permissions.ts` instead.
 */
export default function Permissions({ loaderData }: Route.ComponentProps) {
  return (
    <div className="mx-auto flex w-full flex-1 flex-col gap-6 p-6">
      <DataTable
        columns={permissionColumns}
        initialResult={loaderData}
        schema={PERMISSION_QUERY_SCHEMA}
        getRowId={(row) => row.id}
        filters={PERMISSION_DATATABLE_FILTERS}
        searchPlaceholder="Search permissions…"
        itemLabel="permissions"
        emptyMessage="No permissions match the current filters."
      />
    </div>
  )
}
