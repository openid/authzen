import { callPdp } from "~/lib/pdpClient";
import { getActivePdp } from "~/lib/pdpState";
import type { Route } from "./+types/authorize";

export async function action({ params, request }: Route.ActionArgs) {
  const pdpPath = buildPdpPath(params["*"]);

  const payload = await readJsonBody(request);
  if (payload === undefined) {
    return Response.json(
      { error: "Missing or invalid request body" },
      { status: 400 },
    );
  }

  const pdpResponse = await callPdp({
    endpoint: pdpPath,
    payload,
    pdpId: getActivePdp(),
  });

  return Response.json(pdpResponse);
}

async function readJsonBody(request: Request): Promise<unknown | undefined> {
  try {
    const body = await request.json();
    return body ?? undefined;
  } catch {
    return undefined;
  }
}

function buildPdpPath(capture: string | undefined): string {
  const suffix = capture ?? "";
  return `/access/${suffix}`;
}
