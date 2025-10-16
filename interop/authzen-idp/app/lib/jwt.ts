export type JwtPayload = Record<string, unknown>;

function normalizeBase64UrlSegment(segment: string): string {
	const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
	const paddingNeeded = base64.length % 4 === 0 ? 0 : 4 - (base64.length % 4);
	return base64 + "=".repeat(paddingNeeded);
}

function decodeBase64(segment: string): string | null {
	try {
		if (typeof globalThis.atob === "function") {
			return globalThis.atob(segment);
		}
		if (typeof Buffer !== "undefined") {
			return Buffer.from(segment, "base64").toString("utf-8");
		}
	} catch {
		return null;
	}
	return null;
}

export function decodeJwtPayload(token: string | null): JwtPayload | null {
	if (!token) {
		return null;
	}

	const parts = token.split(".");
	if (parts.length < 2) {
		return null;
	}

	const normalized = normalizeBase64UrlSegment(parts[1]);
	const decoded = decodeBase64(normalized);

	if (!decoded) {
		return null;
	}

	return parseJson(decoded);
}

function parseJson(value: string): JwtPayload | null {
	try {
		return JSON.parse(value) as JwtPayload;
	} catch {
		return null;
	}
}
