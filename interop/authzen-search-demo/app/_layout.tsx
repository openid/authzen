import type { Route } from "./+types/_layout";

import { data, Outlet, useFetcher, useLocation } from "react-router";

import { pdpCookie } from "./cookies.server";
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { PDPPicker } from "./components/pdp-picker";
import { pdps } from "./data/pdps.server";
import { getPDPMetadata } from "./lib/callPdp";
import { CheckCircle2Icon, CircleMinusIcon } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await pdpCookie.parse(cookieHeader)) || {};

  // set the PDP cookie if it doesn't exist
  const activePdp = cookie.selectedPdp || "Cerbos";
  if (!cookie.selectedPdp) {
    cookie.selectedPdp = activePdp;
  }

  const pdp = pdps[activePdp];

  let pdpMetadata = undefined;
  try {
    pdpMetadata = await getPDPMetadata(activePdp);
  } catch (error) {}

  return data(
    {
      pdps: Object.keys(pdps) || [],
      activePdp,
      activePdpHost: pdp.host,
      pdpMetadata,
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
          <div className="flex items-center gap-4 p-2 bg-sidebar-primary-foreground border-b border-b-border">
            <PDPPicker
              pdpList={loaderData.pdps}
              activePdp={loaderData.activePdp}
              setPdp={function (pdp: string): void {
                fetcher.submit(
                  { pdp: pdp, returnTo: location.pathname },
                  { action: "/set-pdp", method: "post" }
                );
              }}
            />
            <div className="gap-1 flex flex-col">
              {loaderData.activePdpHost && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold">Host: </span>
                  {loaderData.activePdpHost}
                </div>
              )}
              {loaderData.pdpMetadata && (
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2Icon size={20} />
                    <div className="text-sm text-muted-foreground">
                      Metadata
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loaderData.pdpMetadata.access_evaluation_endpoint ? (
                      <CheckCircle2Icon size={20} />
                    ) : (
                      <CircleMinusIcon size={20} />
                    )}
                    <div className="text-sm text-muted-foreground">
                      Evaluation
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loaderData.pdpMetadata.access_evaluations_endpoint ? (
                      <CheckCircle2Icon size={20} />
                    ) : (
                      <CircleMinusIcon size={20} />
                    )}
                    <div className="text-sm text-muted-foreground">
                      Evaluations
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loaderData.pdpMetadata.search_resource_endpoint ? (
                      <CheckCircle2Icon size={20} />
                    ) : (
                      <CircleMinusIcon size={20} />
                    )}
                    <div className="text-sm text-muted-foreground">
                      Resource Search
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loaderData.pdpMetadata.search_subject_endpoint ? (
                      <CheckCircle2Icon size={20} />
                    ) : (
                      <CircleMinusIcon size={20} />
                    )}
                    <div className="text-sm text-muted-foreground">
                      Subject Search
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loaderData.pdpMetadata.search_action_endpoint ? (
                      <CheckCircle2Icon size={20} />
                    ) : (
                      <CircleMinusIcon size={20} />
                    )}
                    <div className="text-sm text-muted-foreground">
                      Action Search
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="container mx-auto max-w-10/12">
            <Outlet />
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
