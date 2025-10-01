import { getAuditLog } from "~/lib/auditLog";
import type { Route } from "./+types/audit-log";

export async function loader(_: Route.LoaderArgs) {
	return { auditLog: getAuditLog() };
}
