import type { AuditBody, AuditEntry, AuditType } from "~/types/audit";

const MAX_ENTRIES = 100;
const auditLog: AuditEntry[] = [];

export function pushAuditLog(type: AuditType, body: AuditBody) {
	auditLog.push({
		timestamp: new Date().toISOString(),
		type,
		body,
	});
	if (auditLog.length > MAX_ENTRIES) {
		auditLog.shift();
	}
}

export function clearAuditLog() {
	auditLog.length = 0;
}

export function getAuditLog(): AuditEntry[] {
	return [...auditLog].reverse();
}
