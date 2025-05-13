import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [{ title: "AuthZEN Search API" }];
}

export default function Home() {
  return (
    <div>
      <h1>
        <span className="text-2xl font-bold">AuthZEN Search API</span>
        <br />
        <span className="text-xl font-light">
          A demo of the AuthZEN Search API
        </span>
      </h1>
      <img src="/arch.png" alt="Architecture" className="w-full mx-auto my-4" />
    </div>
  );
}
