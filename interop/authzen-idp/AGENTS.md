# Repository Guidelines

## Project Structure & Module Organization

The `app/` directory holds the React Router v7 framework code. `app/routes.ts` defines the route tree, while individual route modules live in `app/routes/` and should import their generated types from `./+types/<route-file>`. Shared UI primitives reside in `app/components/`, hooks in `app/hooks/`, utilities in `app/lib/`, and reusable schemas in `app/types/`. Static assets live in `public/`. Build artifacts land in `build/`; avoid editing them manually. Generated router typings appear under `.react-router/types/` once `pnpm typecheck` or the dev server has run.

## Build, Test, and Development Commands

- `pnpm install` — install dependencies; prefer pnpm over npm.
- `pnpm dev` — launch the React Router dev server with live type generation.
- `pnpm build` — create a production bundle under `build/`.
- `pnpm start` — serve the production build via `@react-router/serve`.
- `pnpm lint:fix` — run Biome to auto-format and lint the codebase.
- `pnpm typecheck` — regenerate route types and run the strict TypeScript check.
- `pnpm generate` — invoke `buf` to regenerate Cerbos Hub gRPC/Connect clients.

### Git Guide

- Delete unused or obsolete files when your changes make them irrelevant (refactors, feature removals, etc.), and revert files only when the change is yours or explicitly requested. If a git operation leaves you unsure about other agents' in-flight work, stop and coordinate instead of deleting.
- **Before attempting to delete a file to resolve a local type/lint failure, stop and ask the user.** Other agents are often editing adjacent files; deleting their work to silence an error is never acceptable without explicit approval.
- NEVER edit `.env` or any environment variable files—only the user may change them.
- Coordinate with other agents before removing their in-progress edits—don't revert or delete work you didn't author unless everyone agrees.
- Moving/renaming and restoring files is allowed.
- ABSOLUTELY NEVER run destructive git operations (e.g., `git reset --hard`, `rm`, `git checkout`/`git restore` to an older commit) unless the user gives an explicit, written instruction in this conversation. Treat these commands as catastrophic; if you are even slightly unsure, stop and ask before touching them. _(When working within Cursor or Codex Web, these git limitations do not apply; use the tooling's capabilities as needed.)_
- Never use `git restore` (or similar commands) to revert files you didn't author—coordinate with other agents instead so their in-progress work stays intact.
- Always double-check git status before any commit
- Keep commits atomic: commit only the files you touched and list each path explicitly. For tracked files run `git commit -m "<scoped message>" -- path/to/file1 path/to/file2`. For brand-new files, use the one-liner `git restore --staged :/ && git add "path/to/file1" "path/to/file2" && git commit -m "<scoped message>" -- path/to/file1 path/to/file2`.
- Quote any git paths containing brackets or parentheses (e.g., `src/app/[candidate]/**`) when staging or committing so the shell does not treat them as globs or subshells.
- When running `git rebase`, avoid opening editors—export `GIT_EDITOR=:` and `GIT_SEQUENCE_EDITOR=:` (or pass `--no-edit`) so the default messages are used automatically.
- Never amend commits unless you have explicit written approval in the task thread.

## Coding Style & Naming Conventions

Use TypeScript strict mode with modern ECMAScript modules. Follow Biome’s defaults: two-space indentation, single quotes, and no semicolons. Prefer functional React components and hooks, and keep route logic in loaders/actions rather than component effects. Reference modules with the `~/` alias for items in `app/`. Always import route types using `./+types/<route-name>`; if they are missing, run `pnpm typecheck` instead of adjusting paths.

## Testing Guidelines

Formal automated tests are being introduced; coordinate with maintainers before adding frameworks. For now, rely on strict typing, and manual validation in the dev server. When creating tests, colocate them near the feature (e.g. `app/routes/__tests__`) and follow a `<feature>.test.ts` naming pattern. Aim for meaningful coverage over exhaustive snapshots, and document any gaps in the PR description.

## Commit & Pull Request Guidelines

Write concise, imperative commit messages (e.g. `add policy editor form`). Before opening a PR, run `pnpm lint:fix` and `pnpm typecheck`, and note any follow-up actions required. Provide a focused summary, link related issues, and include screenshots or recordings for UI-facing changes. Keep changes scoped to a single concern and call out any new configuration or environment variables such as `SESSION_SECRET` used by `app/lib/cerbos-hub.ts`.

# React Router v7 Framework Mode - Cursor Rules

## 🚨 CRITICAL: Route Type Imports - NEVER MAKE THIS MISTAKE

**THE MOST IMPORTANT RULE: ALWAYS use `./+types/[routeName]` for route type imports.**

```tsx
// ✅ CORRECT - ALWAYS use this pattern:
import type { Route } from "./+types/product-details";
import type { Route } from "./+types/product";
import type { Route } from "./+types/category";

// ❌ NEVER EVER use relative paths like this:
// import type { Route } from "../+types/product-details";  // WRONG!
// import type { Route } from "../../+types/product";       // WRONG!
```

**If you see TypeScript errors about missing `./+types/[routeName]` modules:**

1. **IMMEDIATELY run `typecheck`** to generate the types
2. **Or start the dev server** which will auto-generate types
3. **NEVER try to "fix" it by changing the import path**

## Type Generation & Workflow

- **Run `typecheck` after adding/renaming any routes**
- **Run `typecheck` if you see missing type errors**
- Types are auto-generated by `@react-router/dev` in `./+types/[routeName]` relative to each route file
- **The dev server will also generate types automatically**

---

## Critical Package Guidelines

### ✅ CORRECT Packages:

- `react-router` - Main package for routing components and hooks
- `@react-router/dev` - Development tools and route configuration
- `@react-router/node` - Node.js server adapter
- `@react-router/serve` - Production server

### ❌ NEVER Use:

- `react-router-dom` - Legacy package, use `react-router` instead
- `@remix-run/*` - Old packages, replaced by `@react-router/*`
- React Router v6 patterns - Completely different architecture

## Essential Framework Architecture

### Route Configuration (`app/routes.ts`)

```tsx
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
  route("products/:id", "routes/product.tsx", [
    index("routes/product-overview.tsx"),
    route("reviews", "routes/product-reviews.tsx"),
  ]),
  route("categories", "routes/categories-layout.tsx", [
    index("routes/categories-list.tsx"),
    route(":slug", "routes/category-details.tsx"),
  ]),
] satisfies RouteConfig;
```

### Route Module Pattern (`app/routes/product.tsx`)

```tsx
import type { Route } from "./+types/product";

// Server data loading
export async function loader({ params }: Route.LoaderArgs) {
  return { product: await getProduct(params.id) };
}

// Client data loading (when needed)
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  // runs on the client and is in charge of calling the loader if one exists via `serverLoader`
  const serverData = await serverLoader();
  return serverData;
}

// Form handling
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await updateProduct(formData);
  return redirect(href("/products/:id", { id: params.id }));
}

// Component rendering
export default function Product({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.product.name}</div>;
}
```

### Layout/Parent Routes with Outlet

**For layout routes that have child routes, ALWAYS use `<Outlet />` to render child routes:**

```tsx
import type { Route } from "./+types/categories-layout";
import { Outlet } from "react-router";

export default function CategoriesLayout(props: Route.ComponentProps) {
  return (
    <div className="layout">
      <nav>{/* Sidebar or navigation */}</nav>
      <main>
        <Outlet /> {/* ✅ This renders the matching child route */}
      </main>
    </div>
  );
}

// ❌ Never use `children` from the component props, it doesn't exist
// export default function CategoriesLayout({ children }: Route.ComponentProps) {
```

## Automatic Type Safety & Generated Types

**React Router v7 automatically generates types for every route.** These provide complete type safety for loaders, actions, components, and URL generation.

### ✅ ALWAYS Use Generated Types:

Types are autogenerated and should be imported as `./+types/[routeFileName]`. **If you're getting a type error, run `npm run typecheck` first.**

The filename for the autogenerated types is always a relative import of `./+types/[routeFileName]`:

```tsx
// routes.ts
route("products/:id", "routes/product-details.tsx");

// routes/product-details.tsx
// ✅ CORRECT: Import generated types for each route
import type { Route } from "./+types/product-details";

export async function loader({ params }: Route.LoaderArgs) {
  // params.id is automatically typed based on your route pattern
  return { product: await getProduct(params.id) };
}

export default function ProductDetails({ loaderData }: Route.ComponentProps) {
  // loaderData.product is automatically typed from your loader return
  return <div>{loaderData.product.name}</div>;
}
```

### ✅ Type-Safe URL Generation with href():

```tsx
import { Link, href } from "react-router";

// Static routes
<Link to={href("/products/new")}>New Product</Link>

// Dynamic routes with parameters - AUTOMATIC TYPE SAFETY
<Link to={href("/products/:id", { id: product.id })}>View Product</Link>
<Link to={href("/products/:id/edit", { id: product.id })}>Edit Product</Link>

// Works with redirects too
return redirect(href("/products/:id", { id: newProduct.id }));
```

### ❌ NEVER Create Custom Route Types:

```tsx
// ❌ DON'T create custom type files for routes
export namespace Route {
  export interface LoaderArgs { /* ❌ */ }
  export interface ComponentProps { /* ❌ */ }
}

// ❌ DON'T manually construct URLs - no type safety
<Link to={`/products/${product.id}`}>Product</Link> // ❌
<Link to="/products/" + product.id">Product</Link> // ❌
```

### Type Generation Setup:

- **Location**: Types generated in `./+types/[routeName]` relative to each route file
- **Auto-generated**: Created by `@react-router/dev` when you run dev server or `npm run typecheck`
- **Comprehensive**: Covers `LoaderArgs`, `ActionArgs`, `ComponentProps`, `ErrorBoundaryProps`
- **TypeScript Config**: Add `.react-router/types/**/*` to `include` in `tsconfig.json`

## Critical Imports & Patterns

### ✅ Correct Imports:

```tsx
import { Link, Form, useLoaderData, useFetcher, Outlet } from "react-router";
import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { data, redirect, href } from "react-router";
```

## Data Loading & Actions

### Server vs Client Data Loading:

```tsx
// Server-side rendering and pre-rendering
export async function loader({ params }: Route.LoaderArgs) {
  return { product: await serverDatabase.getProduct(params.id) };
}

// Client-side navigation and SPA mode
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  return {
    product: await fetch(`/api/products/${params.id}`).then((r) => r.json()),
  };
}

// Use both together - server for SSR, client for navigation
clientLoader.hydrate = true; // Force client loader during hydration
```

### Form Handling & Actions:

```tsx
// Server action
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = await updateProduct(formData);
  return redirect(href("/products"));
}

// Client action (takes priority if both exist)
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  await apiClient.updateProduct(formData);
  return { success: true };
}

// In component
<Form method="post">
  <input name="name" placeholder="Product name" />
  <input name="price" type="number" placeholder="Price" />
  <button type="submit">Save Product</button>
</Form>;
```

## Navigation & Links

### Basic Navigation:

```tsx
import { Link, NavLink } from "react-router";

// Simple links
<Link to="/products">Products</Link>

// Active state styling
<NavLink to="/dashboard" className={({ isActive }) =>
  isActive ? "active" : ""
}>
  Dashboard
</NavLink>

// Programmatic navigation
const navigate = useNavigate();
navigate("/products");
```

### Advanced Navigation with Fetchers:

```tsx
import { useFetcher } from "react-router";

function AddToCartButton({ productId }: { productId: string }) {
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post" action="/api/cart">
      <input type="hidden" name="productId" value={productId} />
      <button type="submit">
        {fetcher.state === "submitting" ? "Adding..." : "Add to Cart"}
      </button>
    </fetcher.Form>
  );
}
```

## File Organization & Naming

### ✅ Flexible File Naming:

React Router v7 uses **explicit route configuration** in `app/routes.ts`. You are NOT constrained by old file-based routing conventions.

```tsx
// ✅ Use descriptive, clear file names
export default [
  route("products", "routes/products-layout.tsx", [
    index("routes/products-list.tsx"),
    route(":id", "routes/product-details.tsx"),
    route(":id/edit", "routes/product-edit.tsx"),
  ]),
] satisfies RouteConfig;
```

### File Naming Best Practices:

- Use **descriptive names** that clearly indicate purpose
- Use **kebab-case** for consistency (`product-details.tsx`)
- Organize by **feature** rather than file naming conventions
- The **route configuration** is the source of truth, not file names

## Error Handling & Boundaries

### Route Error Boundaries:

Only setup `ErrorBoundary`s for routes if the users explicitly asks. All errors bubble up to the `ErrorBoundary` in `root.tsx` by default.

```tsx
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Oops!</h1>
      <p>{error.message}</p>
    </div>
  );
}
```

### Throwing Errors from Loaders/Actions:

```tsx
export async function loader({ params }: Route.LoaderArgs) {
  const product = await db.getProduct(params.id);
  if (!product) {
    throw data("Product Not Found", { status: 404 });
  }
  return { product };
}
```

## Advanced Patterns

### Pending UI & Optimistic Updates:

```tsx
import { useNavigation, useFetcher } from "react-router";

// Global pending state
function GlobalSpinner() {
  const navigation = useNavigation();
  return navigation.state === "loading" ? <Spinner /> : null;
}

// Optimistic UI with fetchers
function CartItem({ item }) {
  const fetcher = useFetcher();
  const quantity = fetcher.formData
    ? parseInt(fetcher.formData.get("quantity"))
    : item.quantity;

  return (
    <fetcher.Form method="post">
      <input
        type="number"
        name="quantity"
        value={quantity}
        onChange={(e) => fetcher.submit(e.currentTarget.form)}
      />
      {item.product.name}
    </fetcher.Form>
  );
}
```

### Progressive Enhancement:

```tsx
// Works without JavaScript, enhanced with JavaScript
export default function ProductSearchForm() {
  return (
    <Form method="get" action="/products">
      <input type="search" name="q" placeholder="Search products..." />
      <button type="submit">Search</button>
    </Form>
  );
}
```

## Anti-Patterns to Avoid

### ❌ React Router v6 Patterns:

```tsx
// DON'T use component routing
<Routes>
  <Route path="/" element={<Home />} />
</Routes>
```

### ❌ Manual Data Fetching:

```tsx
// DON'T fetch in components
function Product() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/products");
  }, []);
  // Use loader instead!
}
```

### ❌ Manual Form Handling:

```tsx
// DON'T handle forms manually
const handleSubmit = (e) => {
  e.preventDefault();
  fetch("/api/products", { method: "POST" });
};
// Use Form component and action instead!
```

## Essential Type Safety Rules

1. **ALWAYS** import from `"./+types/[routeName]"` - never use relative paths like `"../+types/[routeName]"`
2. **RUN `npm run typecheck`** when you see missing type errors - never try to "fix" the import path
3. **ALWAYS** use `href()` for dynamic URLs - never manually construct route strings
4. **LET TypeScript infer** loader/action return types - don't over-type returns
5. **USE Route.ComponentProps** for your route components - automatic loaderData typing
6. **ADD** `.react-router/types/**/*` to your `tsconfig.json` include array

## AI Assistant Guidelines

When working with React Router v7:

- **If you see missing `./+types/[routeName]` imports, ALWAYS suggest running `npm run typecheck` first**
- **NEVER suggest changing `./+types/[routeName]` to `../+types/[routeName]` or any other relative path**
- **After creating new routes, remind the user to run `npm run typecheck`**
- **Assume types need to be generated if they're missing, don't assume the dev server is running**
