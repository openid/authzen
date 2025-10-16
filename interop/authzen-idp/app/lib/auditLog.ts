import type { AuditBody, AuditEntry, AuditType } from "~/types/audit";

const MAX_ENTRIES = 100;
const auditEntries: AuditEntry[] = [];

export function pushAuditLog(type: AuditType, body: AuditBody) {
	auditEntries.push(createAuditEntry(type, body));
	trimExcessEntries();
}

export function clearAuditLog() {
	auditEntries.length = 0;
}

export function getAuditLog(): AuditEntry[] {
	return [...auditEntries].reverse();
}

function createAuditEntry(type: AuditType, body: AuditBody): AuditEntry {
	return {
		timestamp: new Date().toISOString(),
		type,
		body,
	};
}

function trimExcessEntries() {
	if (auditEntries.length <= MAX_ENTRIES) {
		return;
	}

	const excess = auditEntries.length - MAX_ENTRIES;
	auditEntries.splice(0, excess);
}
