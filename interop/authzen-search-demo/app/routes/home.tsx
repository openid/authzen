import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [{ title: "AuthZEN Search API" }];
}

export default function Home() {
  return <h1>Home</h1>;
}
