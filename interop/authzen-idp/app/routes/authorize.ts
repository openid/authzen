import { callPdp } from "~/lib/pdpClient";
import { getActivePdp } from "~/lib/pdpState";
import type { Route } from "./+types/authorize";

export async function action({ params, request }: Route.ActionArgs) {
	const pdpPath = `/access/${params["*"]}`;

	const body = await request.json();
	if (!body) {
		return Response.json({ error: "Missing request body" }, { status: 400 });
	}

	const pdpResponse = await callPdp({
		endpoint: pdpPath,
		payload: body,
		pdpId: getActivePdp(),
	});

	return Response.json(pdpResponse);
}
