import { AuditType, type AuthorizationAuditRecord } from "~/types/audit";
import type { PdpRequestArgs } from "~/types/pdp";
import { pushAuditLog } from "./auditLog";
import { getPdpConfig } from "./pdpState";

export async function callPdp({ endpoint, payload, pdpId }: PdpRequestArgs) {
	const pdp = getPdpConfig(pdpId);
	const url = buildPdpUrl(pdp.host, endpoint);
	const headers = buildHeaders(pdp.headers);
	const body = JSON.stringify(payload);

	let response: Response;
	try {
		response = await fetch(url, {
			method: "POST",
			headers,
			body,
		});
	} catch (error) {
		pushAuditLog(
			AuditType.AuthZ,
			createFailureRecord(endpoint, payload, pdpId, error),
		);
		throw error;
	}

	const responseBody = await parseJson(response);
	const auditRecord = createAuditRecord({
		endpoint,
		payload,
		pdpId,
		response,
		responseBody,
	});

	pushAuditLog(AuditType.AuthZ, auditRecord);

	if (!response.ok) {
		throw new Error(
			auditRecord.message ??
				`PDP request failed with status ${response.status}`,
		);
	}

	return responseBody;
}

function createFailureRecord(
	endpoint: string,
	payload: unknown,
	pdpId: string,
	error: unknown,
): AuthorizationAuditRecord {
	return {
		endpoint,
		payload,
		pdpId,
		ok: false,
		message: error instanceof Error ? error.message : "Failed to reach PDP",
	};
}

function createAuditRecord({
	endpoint,
	payload,
	pdpId,
	response,
	responseBody,
}: {
	endpoint: string;
	payload: unknown;
	pdpId: string;
	response: Response;
	responseBody: unknown;
}): AuthorizationAuditRecord {
	return {
		endpoint,
		payload,
		pdpId,
		ok: response.ok,
		response: responseBody,
		message: response.ok ? undefined : response.statusText || "Unknown error",
	};
}

function buildHeaders(customHeaders?: Record<string, string>): Headers {
	const headers = new Headers({ "Content-Type": "application/json" });
	if (!customHeaders) {
		return headers;
	}
	for (const [key, value] of Object.entries(customHeaders)) {
		headers.append(key, value);
	}
	return headers;
}

function buildPdpUrl(host: string, endpoint: string): string {
	const normalizedHost = host.endsWith("/") ? host.slice(0, -1) : host;
	const normalizedEndpoint = endpoint.startsWith("/")
		? endpoint
		: `/${endpoint}`;
	return `${normalizedHost}${normalizedEndpoint}`;
}

async function parseJson(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) {
		return null;
	}
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}
