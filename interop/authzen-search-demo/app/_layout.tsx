import type { Route } from "./+types/_layout";

import { data, Outlet, useFetcher, useLocation } from "react-router";

import { pdpCookie } from "./cookies.server";
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { PDPPicker } from "./components/pdp-picker";
import { pdps } from "./data/pdps.server";

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await pdpCookie.parse(cookieHeader)) || {};

  // set the PDP cookie if it doesn't exist
  const activePdp = cookie.selectedPdp || "Cerbos";
  if (!cookie.selectedPdp) {
    cookie.selectedPdp = activePdp;
  }

  return data(
    {
      pdps,
      activePdp,
    },
    {
      headers: {
        "Set-Cookie": await pdpCookie.serialize(cookie),
      },
    }
  );
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  let fetcher = useFetcher();
  let location = useLocation();
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 bg-background">
        <div className="flex gap-4 flex-col">
          <PDPPicker
            pdpList={loaderData.pdps.map((pdp) => pdp.name)}
            activePdp={loaderData.activePdp}
            setPdp={function (pdp: string): void {
              fetcher.submit(
                { pdp: pdp, returnTo: location.pathname },
                { action: "/set-pdp", method: "post" }
              );
            }}
          />
          <div className="container mx-auto max-w-10/12">
            <Outlet />
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
