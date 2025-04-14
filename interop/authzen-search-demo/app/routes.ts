import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./_layout.tsx", [
    index("routes/home.tsx"),
    route("/resource", "routes/resource.tsx"),
    route("/subject", "routes/subject.tsx"),
    route("/action", "routes/action.tsx"),
    route("/data", "routes/data.tsx"),
  ]),
  route("/set-pdp", "routes/set-pdp.tsx"),
] satisfies RouteConfig;
