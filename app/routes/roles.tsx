import { useState } from "react"
import { DataTable } from "~/components/data-table/data-table"
import { isPermission } from "~/lib/auth/permissions"
import { requirePermission } from "~/lib/auth/session.server"
import { useCan } from "~/lib/auth/use-current-user"
import { parseListParams } from "~/lib/datatable/params"
import {
  RoleBulkActions,
  RoleFormDialog,
  type RoleActionData,
} from "~/modules/roles/actions"
import { roleColumns } from "~/modules/roles/columns"
import { ROLE_QUERY_SCHEMA } from "~/modules/roles/query"
import { roleRepository } from "~/modules/roles/repository.server"
import { OWNER_ROLE_NAME } from "~/modules/roles/types"
import type { Route } from "./+types/roles"

export const meta: Route.MetaFunction = () => [{ title: "Roles" }]

export const handle = { breadcrumb: "Roles" }

export async function action({
  request,
}: Route.ActionArgs): Promise<RoleActionData> {
  const formData = await request.formData()
  const intent = formData.get("intent")

  if (intent === "delete") {
    requirePermission(request, "role:delete")
    const ids = formData.getAll("ids").map(String).filter(Boolean)
    if (ids.length === 0) return { errors: { form: "No rows selected." } }

    const doomed = await Promise.all(
      ids.map((id) => roleRepository.findById(id))
    )
    if (doomed.some((role) => role?.name === OWNER_ROLE_NAME)) {
      return { errors: { form: "The Owner role cannot be deleted." } }
    }

    return { deleted: await roleRepository.deleteRoles(ids) }
  }

  if (intent === "create" || intent === "update") {
    requirePermission(request, intent === "create" ? "role:add" : "role:edit")

    const id = String(formData.get("id") ?? "")
    const name = String(formData.get("name") ?? "").trim()
    const description = String(formData.get("description") ?? "").trim()
    // Trust boundary: unknown permission strings never reach the store.
    const permissions = formData
      .getAll("permissions")
      .map(String)
      .filter(isPermission)

    const errors: Record<string, string> = {}
    if (!name) errors.name = "Name is required."
    else if (
      await roleRepository.nameExists(
        name,
        intent === "update" ? id : undefined
      )
    ) {
      errors.name = "A role with that name already exists."
    }
    if (Object.keys(errors).length > 0) return { errors }

    if (intent === "create") {
      await roleRepository.createRole({ name, description, permissions })
      return { created: true }
    }

    const updated = await roleRepository.updateRole(id, {
      name,
      description,
      permissions,
    })
    if (!updated) return { errors: { form: "That role no longer exists." } }

    return { ok: true }
  }

  return { errors: { form: "Unsupported action." } }
}

export async function loader({ request }: Route.LoaderArgs) {
  requirePermission(request, "role:view")

  const url = new URL(request.url)
  return roleRepository.list(
    parseListParams(url.searchParams, ROLE_QUERY_SCHEMA)
  )
}

export default function Roles({ loaderData }: Route.ComponentProps) {
  const [creating, setCreating] = useState(false)
  const canDelete = useCan("role:delete")

  return (
    <div className="mx-auto flex w-full flex-1 flex-col gap-6 p-6">
      <DataTable
        columns={roleColumns}
        initialResult={loaderData}
        schema={ROLE_QUERY_SCHEMA}
        getRowId={(role) => role.id}
        enableRowSelection={canDelete}
        getRowLabel={(role) => role.name}
        addAction={{
          label: "Add role",
          permission: "role:add",
          onClick: () => setCreating(true),
        }}
        selectionActions={(selection) => (
          <RoleBulkActions selection={selection} />
        )}
        searchPlaceholder="Search roles…"
        itemLabel="roles"
        emptyMessage="No roles match the current filters."
      />

      <RoleFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}
