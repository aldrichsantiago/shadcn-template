"use client"

import * as React from "react"

import { NavMain, type NavItem } from "~/components/nav-main"
import { NavProjects } from "~/components/nav-projects"
import { NavUser } from "~/components/nav-user"
import { TeamSwitcher } from "~/components/team-switcher"
import { useCurrentUser } from "~/lib/auth/use-current-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar"
import {
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
  TerminalSquareIcon,
  BotIcon,
  BookOpenIcon,
  Settings2Icon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
  SettingsIcon,
} from "lucide-react"

/** Annotated so permission strings are checked against the `Permission` union. */
type SidebarData = {
  navMain: NavItem[]
  teams: React.ComponentProps<typeof TeamSwitcher>["teams"]
  projects: React.ComponentProps<typeof NavProjects>["projects"]
}

// This is sample data.
const data: SidebarData = {
  teams: [
    {
      name: "Acme Inc.",
      logo: <GalleryVerticalEndIcon />,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: <AudioLinesIcon />,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: <TerminalIcon />,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: <TerminalSquareIcon />,
      defaultOpen: true,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
        },
        {
          title: "Profile",
          url: "/profile",
        },
        {
          title: "Settings",
          url: "/settings",
        },
      ],
    },
    // {
    //   title: "Models",
    //   url: "#",
    //   icon: <BotIcon />,
    //   items: [
    //     {
    //       title: "Genesis",
    //       url: "#",
    //     },
    //     {
    //       title: "Explorer",
    //       url: "#",
    //     },
    //     {
    //       title: "Quantum",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Documentation",
    //   url: "#",
    //   icon: <BookOpenIcon />,
    //   items: [
    //     {
    //       title: "Introduction",
    //       url: "#",
    //     },
    //     {
    //       title: "Get Started",
    //       url: "#",
    //     },
    //     {
    //       title: "Tutorials",
    //       url: "#",
    //     },
    //     {
    //       title: "Changelog",
    //       url: "#",
    //     },
    //   ],
    // },
    {
      title: "Settings",
      url: "#",
      icon: <SettingsIcon />,
      items: [
        {
          title: "Users",
          url: "/users",
          permission: "user:view",
        },
        {
          title: "Roles",
          url: "/roles",
          permission: "role:view",
        },
        {
          title: "Permissions",
          url: "/permissions",
          permission: "permission:view",
        },
        {
          title: "Master Data",
          url: "/master-data",
          permission: "master-data:view",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: <FrameIcon />,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: <PieChartIcon />,
    },
    {
      name: "Travel",
      url: "#",
      icon: <MapIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useCurrentUser()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user.name, email: user.email }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
