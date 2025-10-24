import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/audit-log", "routes/audit-log.ts"),
  route("/access/*", "routes/authorize.ts"),
  route("/idp/auth0/*", "routes/idp/auth0.ts"),
  route("/idp/curity/*", "routes/idp/curity.ts"),
] satisfies RouteConfig;
