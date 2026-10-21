import { PlusCircleIcon } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import { Separator } from "~/components/ui/separator"
import type { DataTableFilter } from "~/lib/datatable/types"

type DataTableFacetedFilterProps = {
  filter: DataTableFilter
  selected: readonly string[]
  onToggleValue: (value: string) => void
  onClear: () => void
}

/**
 * Multi-select filter. Interaction lives on the `CommandItem` (which cmdk exposes
 * as a selectable option) rather than on a nested checkbox, so there is no
 * double-toggle race and screen readers get the right option semantics.
 */
export function DataTableFacetedFilter({
  filter,
  selected,
  onToggleValue,
  onClear,
}: DataTableFacetedFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-dashed"
        >
          <PlusCircleIcon className="size-3.5" />
          {filter.label}
          {selected.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-4" />
              <Badge
                variant="secondary"
                className="rounded-3xl px-1.5 font-normal"
              >
                {selected.length}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          <CommandInput placeholder={filter.label} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {filter.options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    data-checked={isSelected}
                    onSelect={() => onToggleValue(option.value)}
                  >
                    {option.icon && (
                      <option.icon className="size-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="clear-filters"
                    onSelect={onClear}
                    className="justify-center"
                  >
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
