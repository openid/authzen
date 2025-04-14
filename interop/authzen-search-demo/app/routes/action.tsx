import type { Route } from "./+types/action";

export function meta({}: Route.MetaArgs) {
  return [{ title: "AuthZEN Search API - Action Search" }];
}

export default function ActionSearch() {
  return <h1>ActionSearch</h1>;
}
