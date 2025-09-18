export interface AuthenticationEntry {
	idp: string;
	message: string;
}

export interface AuthorizationEntry {
	endpoint: string;
	payload: object;
	pdpId: string;
	ok: boolean;
	response?: object;
}

export enum AuditType {
	AuthN = "AuthN",
	AuthZ = "AuthZ",
}

export interface AuditEntry {
	timestamp: Date;
	type: AuditType;
	body: AuthenticationEntry | AuthorizationEntry;
}

const auditLog: AuditEntry[] = [];

export function pushAuditLog(
	type: AuditType,
	entry: AuthenticationEntry | AuthorizationEntry,
) {
	auditLog.push({
		timestamp: new Date(),
		type,
		body: entry,
	});
	if (auditLog.length > 100) {
		auditLog.shift();
	}
}
export function clearAuditLog() {
	auditLog.length = 0;
}

export function getAuditLog() {
	return [...auditLog].reverse();
}
