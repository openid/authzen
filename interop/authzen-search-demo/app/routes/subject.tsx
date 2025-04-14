import type { Route } from "./+types/action";

export function meta({}: Route.MetaArgs) {
  return [{ title: "AuthZEN Search API - Subject Search" }];
}

export default function SubjectSearch() {
  return <h1>SubjectSearch</h1>;
}
