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
  ]),
] satisfies RouteConfig
