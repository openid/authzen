import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("/access/*", "routes/authorize.ts"),
	route("/idp/auth0/*", "routes/idp/auth0.ts"),
] satisfies RouteConfig;
