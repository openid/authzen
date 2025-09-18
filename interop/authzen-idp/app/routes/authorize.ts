import { getActivePdp } from "~/lib/activePdp";
import { callPdp } from "~/lib/callPdp";
import type { Route } from "./+types/authorize";

export async function action({ params, request }: Route.ActionArgs) {
	const pdpPath = `/access/${params["*"]}`;

	const body = await request.json();
	if (!body) {
		return Response.json({ error: "Missing request body" }, { status: 400 });
	}

	const pdpResponse = await callPdp(pdpPath, body, getActivePdp());

	return Response.json(pdpResponse);
}
