import { useState } from "react"
import { DataTable } from "~/components/data-table/data-table"
import { requirePermission } from "~/lib/auth/session.server"
import { useCan } from "~/lib/auth/use-current-user"
import { parseListParams } from "~/lib/datatable/params"
import {
  MasterDataBulkActions,
  MasterDataFormDialog,
  type MasterDataActionData,
} from "~/modules/master-data/actions"
import { masterDataColumns } from "~/modules/master-data/columns"
import {
  MASTER_DATA_DATATABLE_FILTERS,
  MASTER_DATA_QUERY_SCHEMA,
} from "~/modules/master-data/query"
import { masterDataRepository } from "~/modules/master-data/repository.server"
import {
  MASTER_DATA_CATEGORIES,
  type MasterDataCategory,
} from "~/modules/master-data/types"
import type { Route } from "./+types/master-data"

export const meta: Route.MetaFunction = () => [{ title: "Master Data" }]

export const handle = { breadcrumb: "Master Data" }

const CATEGORIES: readonly string[] = MASTER_DATA_CATEGORIES
const CODE_PATTERN = /^[A-Za-z0-9_-]{2,12}$/

export async function action({
  request,
}: Route.ActionArgs): Promise<MasterDataActionData> {
  const formData = await request.formData()
  const intent = formData.get("intent")

  if (intent === "delete") {
    requirePermission(request, "master-data:delete")
    const ids = formData.getAll("ids").map(String).filter(Boolean)
    if (ids.length === 0) return { errors: { form: "No rows selected." } }

    return { deleted: await masterDataRepository.deleteEntries(ids) }
  }

  if (intent === "create" || intent === "update") {
    requirePermission(
      request,
      intent === "create" ? "master-data:add" : "master-data:edit"
    )

    const id = String(formData.get("id") ?? "")
    const name = String(formData.get("name") ?? "").trim()
    const code = String(formData.get("code") ?? "").trim()
    const category = String(formData.get("category") ?? "")
    const description = String(formData.get("description") ?? "").trim()

    // Trust boundary: never let form values reach the store unvalidated.
    const errors: Record<string, string> = {}
    if (!name) errors.name = "Name is required."
    if (!CODE_PATTERN.test(code))
      errors.code = "Use 2–12 letters, digits, dashes or underscores."
    if (!CATEGORIES.includes(category)) errors.category = "Unknown category."
    if (Object.keys(errors).length > 0) return { errors }

    const input = {
      name,
      code,
      // Validated against the whitelist above.
      category: category as MasterDataCategory,
      description,
    }

    if (intent === "create") {
      await masterDataRepository.createEntry(input)
      return { created: true }
    }

    const updated = await masterDataRepository.updateEntry(id, input)
    if (!updated) return { errors: { form: "That entry no longer exists." } }

    return { ok: true }
  }

  return { errors: { form: "Unsupported action." } }
}

export async function loader({ request }: Route.LoaderArgs) {
  requirePermission(request, "master-data:view")

  const url = new URL(request.url)
  return masterDataRepository.list(
    parseListParams(url.searchParams, MASTER_DATA_QUERY_SCHEMA)
  )
}

export default function MasterData({ loaderData }: Route.ComponentProps) {
  const [creating, setCreating] = useState(false)
  const canDelete = useCan("master-data:delete")

  return (
    <div className="mx-auto flex w-full flex-1 flex-col gap-6 p-6">
      <DataTable
        columns={masterDataColumns}
        initialResult={loaderData}
        schema={MASTER_DATA_QUERY_SCHEMA}
        getRowId={(entry) => entry.id}
        enableRowSelection={canDelete}
        getRowLabel={(entry) => entry.name}
        addAction={{
          label: "Add entry",
          permission: "master-data:add",
          onClick: () => setCreating(true),
        }}
        selectionActions={(selection) => (
          <MasterDataBulkActions selection={selection} />
        )}
        filters={MASTER_DATA_DATATABLE_FILTERS}
        searchPlaceholder="Search master data…"
        itemLabel="entries"
        emptyMessage="No entries match the current filters."
      />

      <MasterDataFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}
