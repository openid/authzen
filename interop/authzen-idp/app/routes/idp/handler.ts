import { idps } from "~/data/idps.server";
import type { Route } from "./+types/handler";

export async function loader({ request, params }: Route.LoaderArgs) {
  const idpHandler = idps.find((idp) => idp.slug === params.idp);
  if (!idpHandler) {
    throw new Error(`Unknown IDP: ${params.idp}`);
  }
  return idpHandler.loader(request);
}
