import { useEffect, useState, type FormEvent } from "react"
import { useFetcher } from "react-router"
import {
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { useRowSelectionContext } from "~/components/data-table/row-selection-context"
import type { RowSelection } from "~/components/data-table/use-row-selection"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Field, FieldError, FieldGroup } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  ACTION_LABELS,
  ENTITY_LABELS,
  PERMISSION_ACTIONS,
  PERMISSION_ENTITIES,
  type Permission,
} from "~/lib/auth/permissions"
import { useCan } from "~/lib/auth/use-current-user"
import type { Role } from "./types"

export type RoleActionData = {
  ok?: boolean
  created?: boolean
  deleted?: number
  errors?: Record<string, string>
}

function readActionData(fetcher: ReturnType<typeof useFetcher>) {
  return fetcher.data as RoleActionData | undefined
}

/** Row-level Edit / Delete menu. */
export function RoleRowActions({ role }: { role: Role }) {
  const fetcher = useFetcher()
  const data = readActionData(fetcher)
  const dropFromSelection = useRowSelectionContext()?.remove
  const canEdit = useCan("role:edit")
  const canDelete = useCan("role:delete")
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (data?.deleted === undefined) return
    dropFromSelection?.([role.id])
    toast.success(`Deleted ${role.name}`)
  }, [data, dropFromSelection, role.id, role.name])

  useEffect(() => {
    if (data?.errors?.form) toast.error(data.errors.form)
  }, [data])

  const deleteRole = () => {
    const formData = new FormData()
    formData.set("intent", "delete")
    formData.append("ids", role.id)
    fetcher.submit(formData, { method: "post" })
    setConfirming(false)
  }

  if (!canEdit && !canDelete) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${role.name}`}
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEdit && (
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setConfirming(true)}
            >
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canEdit && (
        <RoleFormDialog role={role} open={editing} onOpenChange={setEditing} />
      )}

      <ConfirmDeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${role.name}?`}
        description="Users on this role keep it until they are reassigned."
        pending={fetcher.state !== "idle"}
        onConfirm={deleteRole}
      />
    </>
  )
}

/** Batch action for the datatable action bar. */
export function RoleBulkActions({ selection }: { selection: RowSelection }) {
  const fetcher = useFetcher()
  const data = readActionData(fetcher)
  const [confirming, setConfirming] = useState(false)
  const { selectedIds, selectedCount, clear } = selection

  useEffect(() => {
    if (data?.deleted === undefined) return
    clear()
    toast.success(
      `${data.deleted} ${data.deleted === 1 ? "role" : "roles"} deleted`
    )
  }, [data, clear])

  useEffect(() => {
    if (data?.errors?.form) toast.error(data.errors.form)
  }, [data])

  const removeSelected = () => {
    const formData = new FormData()
    formData.set("intent", "delete")
    for (const id of selectedIds) formData.append("ids", id)
    fetcher.submit(formData, { method: "post" })
    setConfirming(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        <Trash2Icon className="size-3.5" />
        Delete
      </Button>

      <ConfirmDeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${selectedCount} roles?`}
        description="Users on these roles keep them until they are reassigned."
        pending={fetcher.state !== "idle"}
        onConfirm={removeSelected}
      />
    </>
  )
}

/**
 * Create/edit dialog. Permissions are controlled state because the checkboxes
 * are not native inputs; the form data is assembled on submit.
 */
export function RoleFormDialog({
  role,
  open,
  onOpenChange,
}: {
  /** Omit to create. */
  role?: Role
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const fetcher = useFetcher()
  const data = readActionData(fetcher)
  const errors = data?.errors
  const pending = fetcher.state !== "idle"
  const [permissions, setPermissions] = useState<Permission[]>([])

  // Reset the matrix each time the dialog opens (Radix keeps this component
  // mounted between opens, so defaults alone are not enough).
  useEffect(() => {
    if (open) setPermissions(role?.permissions ?? [])
  }, [open, role])

  useEffect(() => {
    if (data?.ok || data?.created) {
      toast.success(role ? "Role updated" : "Role created")
      onOpenChange(false)
      return
    }
    if (data?.errors?.form) toast.error(data.errors.form)
  }, [data, onOpenChange, role])

  const togglePermission = (permission: Permission) => {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((entry) => entry !== permission)
        : [...current, permission]
    )
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    formData.set("intent", role ? "update" : "create")
    if (role) formData.set("id", role.id)
    formData.delete("permissions")
    for (const permission of permissions) {
      formData.append("permissions", permission)
    }
    fetcher.submit(formData, { method: "post" })
  }

  const fieldId = (name: string) => `role-${role?.id ?? "new"}-${name}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{role ? "Edit role" : "Add role"}</DialogTitle>
          <DialogDescription>
            A role is a named set of permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <Label htmlFor={fieldId("name")}>Name</Label>
              <Input
                id={fieldId("name")}
                name="name"
                defaultValue={role?.name ?? ""}
                autoComplete="off"
                aria-invalid={errors?.name ? true : undefined}
              />
              <FieldError>{errors?.name}</FieldError>
            </Field>
            <Field>
              <Label htmlFor={fieldId("description")}>Description</Label>
              <Input
                id={fieldId("description")}
                name="description"
                defaultValue={role?.description ?? ""}
                autoComplete="off"
              />
              <FieldError>{errors?.description}</FieldError>
            </Field>
          </FieldGroup>

          <div className="mt-4 flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_repeat(4,3rem)] items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>Permission</span>
              {PERMISSION_ACTIONS.map((action) => (
                <span key={action} className="text-center">
                  {ACTION_LABELS[action]}
                </span>
              ))}
            </div>
            {PERMISSION_ENTITIES.map((entity) => (
              <div
                key={entity}
                className="grid grid-cols-[1fr_repeat(4,3rem)] items-center gap-2"
              >
                <span className="text-sm">{ENTITY_LABELS[entity]}</span>
                {PERMISSION_ACTIONS.map((action) => {
                  const permission = `${entity}:${action}` as Permission
                  return (
                    <div key={action} className="flex justify-center">
                      <Checkbox
                        checked={permissions.includes(permission)}
                        onCheckedChange={() => togglePermission(permission)}
                        aria-label={`${ACTION_LABELS[action]} ${ENTITY_LABELS[entity]}`}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <FieldError>{errors?.form}</FieldError>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              {pending ? "Saving…" : role ? "Save changes" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  pending: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
