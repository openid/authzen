import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/audit-log", "routes/audit-log.ts"),
  route("/access/*", "routes/authorize.ts"),
  route("/idp/:idp/*", "routes/idp/handler.ts"),
] satisfies RouteConfig;
