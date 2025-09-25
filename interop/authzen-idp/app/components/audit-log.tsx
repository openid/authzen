import SyntaxHighlighter from "react-syntax-highlighter";
import docco from "react-syntax-highlighter/dist/esm/styles/hljs/vs2015";

import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
	type AuditEntry,
	AuditType,
	type AuthenticationAuditRecord,
	type AuthorizationAuditRecord,
} from "~/types/audit";

interface AuditLogProps {
	entries: AuditEntry[];
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
	dateStyle: "medium",
	timeStyle: "medium",
});

export function AuditLog({ entries }: AuditLogProps) {
	if (entries.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				Audit events will appear here once activity is recorded.
			</p>
		);
	}

	return (
		<ScrollArea className="max-h-[50rem] overflow-scroll">
			<div className="space-y-2">
				{entries
					.filter((e) => e.type === AuditType.AuthZ)
					.map((entry, index) => (
						<AuditLogEntry
							key={`${entry.timestamp}-${entry.type}-${index}`}
							entry={entry}
						/>
					))}
			</div>
		</ScrollArea>
	);
}

function AuditLogEntry({ entry }: { entry: AuditEntry }) {
	const formattedTimestamp = formatTimestamp(entry.timestamp);
	const typeLabel =
		entry.type === AuditType.AuthN ? "Authentication" : "Authorization";

	return (
		<div className="rounded-md border bg-card p-3 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-2">
					<p className="text-xs text-muted-foreground">{formattedTimestamp}</p>
					<AuditLogSummary body={entry.body} type={entry.type} />
				</div>
				<Badge variant="outline">{typeLabel}</Badge>
			</div>
			<AuditLogDetails body={entry.body} type={entry.type} />
		</div>
	);
}

function AuditLogSummary({
	body,
	type,
}: {
	body: AuditEntry["body"];
	type: AuditType;
}) {
	if (type === AuditType.AuthN) {
		return <AuthenticationSummary body={body} />;
	}
	return <AuthorizationSummary body={body} />;
}

function AuthenticationSummary({ body }: { body: AuditEntry["body"] }) {
	if (!isAuthenticationRecord(body)) {
		return null;
	}

	return (
		<div className="space-y-1">
			<p className="text-xs font-medium text-foreground uppercase tracking-wide">
				{body.idp}
			</p>
			<p className="text-xs text-muted-foreground">{body.message}</p>
		</div>
	);
}

function AuthorizationSummary({ body }: { body: AuditEntry["body"] }) {
	if (!isAuthorizationRecord(body)) {
		return null;
	}

	return (
		<div className="space-y-1">
			<p className="text-sm font-medium text-foreground">{body.endpoint}</p>
			<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
				<span>PDP {body.pdpId}</span>
				<span>•</span>
				<Badge
					className="uppercase tracking-wide"
					variant={body.ok ? "secondary" : "destructive"}
				>
					{body.ok ? "Allowed" : "Denied"}
				</Badge>
				{body.message ? <span>• {body.message}</span> : null}
			</div>
		</div>
	);
}

function AuditLogDetails({
	body,
	type,
}: {
	body: AuditEntry["body"];
	type: AuditType;
}) {
	if (type === AuditType.AuthN && isAuthenticationRecord(body)) {
		return <AuthenticationDetails body={body} />;
	}
	if (type === AuditType.AuthZ && isAuthorizationRecord(body)) {
		return <AuthorizationDetails body={body} />;
	}
	return null;
}

function AuthenticationDetails({ body }: { body: AuthenticationAuditRecord }) {
	if (!body.response) {
		return null;
	}

	return (
		<div className="mt-3 grid gap-3 text-xs">
			<JsonPreview data={body.response} label="Response" />
		</div>
	);
}

function AuthorizationDetails({ body }: { body: AuthorizationAuditRecord }) {
	return (
		<div className="mt-3 grid grid-cols-2 gap-3 text-xs">
			<JsonPreview data={body.payload} label="Request" />
			<JsonPreview data={body.response} label="Response" />
		</div>
	);
}

function JsonPreview({ data, label }: { data: unknown; label: string }) {
	if (data === undefined || data === null) {
		return null;
	}

	return (
		<div>
			<p className="font-medium uppercase tracking-wide text-foreground">
				{label}
			</p>

			<SyntaxHighlighter language="json" style={docco}>
				{formatJson(data)}
			</SyntaxHighlighter>
		</div>
	);
}

function formatJson(data: unknown): string {
	if (typeof data === "string") {
		return data;
	}
	try {
		return JSON.stringify(data, null, 2);
	} catch {
		return String(data);
	}
}

function isAuthenticationRecord(
	body: AuditEntry["body"],
): body is AuthenticationAuditRecord {
	return (
		typeof body === "object" &&
		body !== null &&
		"idp" in body &&
		"message" in body
	);
}

function isAuthorizationRecord(
	body: AuditEntry["body"],
): body is AuthorizationAuditRecord {
	return (
		typeof body === "object" &&
		body !== null &&
		"endpoint" in body &&
		"pdpId" in body
	);
}

function formatTimestamp(timestamp: string): string {
	const parsed = new Date(timestamp);
	if (Number.isNaN(parsed.getTime())) {
		return timestamp;
	}
	return dateFormatter.format(parsed);
}
