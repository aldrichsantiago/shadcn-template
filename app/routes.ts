import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  layout("routes/sidebar-layout.tsx", { id: "sidebar-layout" }, [
    route("dashboard", "routes/dashboard.tsx"),
    route("users", "routes/users.tsx"),
    route("roles", "routes/roles.tsx"),
    route("permissions", "routes/permissions.tsx"),
    route("master-data", "routes/master-data.tsx"),
    route("profile", "routes/profile.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig
