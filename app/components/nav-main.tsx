import * as React from "react"
import { Link, useLocation } from "react-router"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "~/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"
import { can, type Permission } from "~/lib/auth/permissions"
import { useCurrentUser } from "~/lib/auth/use-current-user"

export type NavSubItem = {
  title: string
  url: string
  /** Hidden unless the current user holds this permission. */
  permission?: Permission
}

export type NavItem = {
  title: string
  /** Landing page of the section. Use `"#"` for a section that only toggles open. */
  url: string
  icon?: React.ReactNode
  /** Whether the section starts expanded. Independent from the active route. */
  defaultOpen?: boolean
  /** Hidden unless the current user holds this permission. */
  permission?: Permission
  items?: NavSubItem[]
}

/**
 * Whether a nav url points at the current location. Only absolute urls can be
 * active, so placeholder urls such as `"#"` never highlight.
 */
export function isUrlActive(pathname: string, url: string) {
  if (!url.startsWith("/")) return false

  // Ignore trailing slashes so `/users/` and `/users` match each other.
  const current = pathname.replace(/\/+$/, "")
  const target = url.replace(/\/+$/, "")

  if (target === "") return current === ""
  return current === target || current.startsWith(`${target}/`)
}

function NavSection({ item }: { item: NavItem }) {
  const { pathname } = useLocation()

  const hasActiveChild =
    item.items?.some((subItem) => isUrlActive(pathname, subItem.url)) ?? false
  const isActive = hasActiveChild || isUrlActive(pathname, item.url)

  const [open, setOpen] = React.useState(item.defaultOpen ?? false)

  // The sidebar layout is not remounted between routes, so `defaultOpen` alone
  // never reacts to a navigation that lands on one of the sub items. Reveal the
  // section when it becomes active, but leave manual toggling alone.
  React.useEffect(() => {
    if (hasActiveChild) setOpen(true)
  }, [hasActiveChild])

  return (
    <Collapsible
      asChild
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive}>
            {item.icon}
            <span>{item.title}</span>
            <ChevronRightIcon className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isUrlActive(pathname, subItem.url)}
                >
                  <Link to={subItem.url}>
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain({ items }: { items: NavItem[] }) {
  const user = useCurrentUser()

  // Filter rather than disable: a link the user cannot open is noise.
  const visibleItems = items.flatMap((item) => {
    if (item.permission && !can(user.permissions, item.permission)) return []

    const subItems = item.items?.filter(
      (subItem) =>
        !subItem.permission || can(user.permissions, subItem.permission)
    )

    // A section that only opens children disappears when all children are hidden.
    if (item.url === "#" && subItems && subItems.length === 0) return []

    return [{ ...item, items: subItems }]
  })

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Operations</SidebarGroupLabel>
      <SidebarMenu>
        {visibleItems.map((item) => (
          <NavSection key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
