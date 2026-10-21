import { useEffect, useState } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { useCan } from "~/lib/auth/use-current-user"
import { MASTER_DATA_CATEGORIES, type MasterDataEntry } from "./types"

export type MasterDataActionData = {
  ok?: boolean
  created?: boolean
  deleted?: number
  errors?: Record<string, string>
}

function readActionData(fetcher: ReturnType<typeof useFetcher>) {
  return fetcher.data as MasterDataActionData | undefined
}

/** Row-level Edit / Delete menu. */
export function MasterDataRowActions({ entry }: { entry: MasterDataEntry }) {
  const fetcher = useFetcher()
  const data = readActionData(fetcher)
  const dropFromSelection = useRowSelectionContext()?.remove
  const canEdit = useCan("master-data:edit")
  const canDelete = useCan("master-data:delete")
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (data?.deleted === undefined) return
    dropFromSelection?.([entry.id])
    toast.success(`Deleted ${entry.name}`)
  }, [data, dropFromSelection, entry.id, entry.name])

  useEffect(() => {
    if (data?.errors?.form) toast.error(data.errors.form)
  }, [data])

  const deleteEntry = () => {
    const formData = new FormData()
    formData.set("intent", "delete")
    formData.append("ids", entry.id)
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
            aria-label={`Actions for ${entry.name}`}
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
        <MasterDataFormDialog
          entry={entry}
          open={editing}
          onOpenChange={setEditing}
        />
      )}

      <ConfirmDeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${entry.name}?`}
        description="Anything referencing this value will keep its current text."
        pending={fetcher.state !== "idle"}
        onConfirm={deleteEntry}
      />
    </>
  )
}

/** Batch action for the datatable action bar. */
export function MasterDataBulkActions({
  selection,
}: {
  selection: RowSelection
}) {
  const fetcher = useFetcher()
  const data = readActionData(fetcher)
  const [confirming, setConfirming] = useState(false)
  const { selectedIds, selectedCount, clear } = selection

  useEffect(() => {
    if (data?.deleted === undefined) return
    clear()
    toast.success(
      `${data.deleted} ${data.deleted === 1 ? "entry" : "entries"} deleted`
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
        title={`Delete ${selectedCount} entries?`}
        description="Anything referencing these values will keep its current text."
        pending={fetcher.state !== "idle"}
        onConfirm={removeSelected}
      />
    </>
  )
}

/** Create/edit dialog. All fields are native, so FormData submits directly. */
export function MasterDataFormDialog({
  entry,
  open,
  onOpenChange,
}: {
  /** Omit to create. */
  entry?: MasterDataEntry
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const fetcher = useFetcher()
  const data = readActionData(fetcher)
  const errors = data?.errors
  const pending = fetcher.state !== "idle"

  useEffect(() => {
    if (data?.ok || data?.created) {
      toast.success(entry ? "Entry updated" : "Entry created")
      onOpenChange(false)
      return
    }
    if (data?.errors?.form) toast.error(data.errors.form)
  }, [data, entry, onOpenChange])

  const fieldId = (name: string) => `master-data-${entry?.id ?? "new"}-${name}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit entry" : "Add entry"}</DialogTitle>
          <DialogDescription>
            Lookup values used by users, imports and integrations.
          </DialogDescription>
        </DialogHeader>

        <fetcher.Form method="post">
          <input
            type="hidden"
            name="intent"
            value={entry ? "update" : "create"}
          />
          {entry && <input type="hidden" name="id" value={entry.id} />}

          <FieldGroup>
            <Field>
              <Label htmlFor={fieldId("name")}>Name</Label>
              <Input
                id={fieldId("name")}
                name="name"
                defaultValue={entry?.name ?? ""}
                autoComplete="off"
                aria-invalid={errors?.name ? true : undefined}
              />
              <FieldError>{errors?.name}</FieldError>
            </Field>
            <Field>
              <Label htmlFor={fieldId("code")}>Code</Label>
              <Input
                id={fieldId("code")}
                name="code"
                defaultValue={entry?.code ?? ""}
                autoComplete="off"
                aria-invalid={errors?.code ? true : undefined}
              />
              <FieldError>{errors?.code}</FieldError>
            </Field>
            <Field>
              <Label htmlFor={fieldId("category")}>Category</Label>
              <Select
                name="category"
                defaultValue={entry?.category ?? MASTER_DATA_CATEGORIES[0]}
              >
                <SelectTrigger id={fieldId("category")} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MASTER_DATA_CATEGORIES.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="capitalize"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors?.category}</FieldError>
            </Field>
            <Field>
              <Label htmlFor={fieldId("description")}>Description</Label>
              <Input
                id={fieldId("description")}
                name="description"
                defaultValue={entry?.description ?? ""}
                autoComplete="off"
              />
              <FieldError>{errors?.description}</FieldError>
            </Field>
          </FieldGroup>

          <FieldError>{errors?.form}</FieldError>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              {pending ? "Saving…" : entry ? "Save changes" : "Create entry"}
            </Button>
          </DialogFooter>
        </fetcher.Form>
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
