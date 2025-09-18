import { pdps } from "~/data/pdps.server";
import { AuditType, pushAuditLog } from "./auditLog";

export async function callPdp(
	endpoint: string,
	payload: object,
	pdpId: string,
) {
	const pdp = pdps[pdpId];
	if (!pdp) {
		return {
			error: "PDP not found",
		};
	}

	const headers = new Headers();
	headers.append("Content-Type", "application/json");
	if (pdp.headers) {
		Object.entries(pdp.headers).forEach(([key, value]) => {
			headers.append(key, value);
		});
	}

	const authZENResponse = await fetch(`${pdp.host}${endpoint}`, {
		method: "POST",
		headers,
		body: JSON.stringify(payload),
	});

	if (!authZENResponse.ok) {
		pushAuditLog(AuditType.AuthZ, {
			idp: pdpId,
			endpoint,
			message: `PDP request failed: ${authZENResponse.statusText}`,
			ok: authZENResponse.ok,
		});
		throw new Error(`PDP request failed: ${authZENResponse.statusText}`);
	}

	const response = await authZENResponse.json();

	pushAuditLog(AuditType.AuthZ, {
		endpoint,
		payload,
		pdpId,
		ok: authZENResponse.ok,
		response,
	});

	return response;
}
