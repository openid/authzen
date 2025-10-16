import { type ReactNode, useMemo } from "react";
import { type FetcherWithComponents, redirect, useFetcher } from "react-router";
import { AuditLog, JsonPreview } from "~/components/audit-log";
import { IdToken } from "~/components/id-token.client";
import { PDPPicker } from "~/components/pdp-picker";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuditLogPolling } from "~/hooks/useAuditLogPolling";
import { useIdTokenFromHash } from "~/hooks/useIdTokenFromHash";
import { clearAuditLog } from "~/lib/auditLog";
import { decodeJwtPayload } from "~/lib/jwt";
import { getActivePdp, listPdps, setActivePdp } from "~/lib/pdpState";
import { cn } from "~/lib/utils";
import type { AuditEntry } from "~/types/audit";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "OpenID AuthZEN IdP Interop" },
		{ name: "description", content: "Welcome to OpenID AuthZEN IdP Interop!" },
	];
}

export async function loader(_: Route.LoaderArgs) {
	return {
		pdps: listPdps(),
		activePdp: getActivePdp(),
	};
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const intent = formData.get("intent");

	if (intent === "clear-audit-log") {
		clearAuditLog();
		return { status: "cleared" };
	}
	const selectedPDP = formData.get("pdp");
	const returnTo = formData.get("returnTo")?.toString() || "/";
	if (!selectedPDP || Array.isArray(selectedPDP)) {
		return { error: "Invalid PDP selected", returnTo };
	}
	setActivePdp(selectedPDP?.toString());
	return redirect(returnTo);
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const pdpFetcher = useFetcher();
	const clearFetcher = useFetcher();
	const auditFetcher = useFetcher<{ auditLog: AuditEntry[] }>();

	useAuditLogPolling(auditFetcher);
	const idToken = useIdTokenFromHash();
	const auditEntries = auditFetcher.data?.auditLog ?? [];

	const handlePdpSelection = (pdp: string) => {
		const returnTo =
			typeof window === "undefined" ? "/" : window.location.pathname;
		pdpFetcher.submit(
			{
				intent: "set-active-pdp",
				pdp,
				returnTo,
			},
			{ method: "post" },
		);
	};

	return (
		<main className="flex-1 bg-background">
			<HomeHeader
				activePdp={loaderData.activePdp}
				pdps={loaderData.pdps}
				onSelectPdp={handlePdpSelection}
			/>
			<div className="container mx-auto my-4">
				<Card>
					<CardHeader>
						<CardTitle>Identity Provider</CardTitle>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<a href="/idp/auth0/login">Login with Auth0</a>
						</Button>
					</CardContent>
				</Card>
			</div>
			<div className="container mx-auto my-4 grid grid-cols-1 gap-4 md:grid-cols-3">
				<IdentityProviderSection idToken={idToken} />
				<div className="md:col-span-2">
					<AuditLogSection
						auditEntries={auditEntries}
						clearFetcher={clearFetcher}
					/>
				</div>
			</div>
		</main>
	);
}

interface HomeHeaderProps {
	activePdp: string;
	pdps: string[];
	onSelectPdp: (pdp: string) => void;
}

function HomeHeader({ activePdp, pdps, onSelectPdp }: HomeHeaderProps) {
	return (
		<div className="bg-sidebar-primary-foreground border-b border-b-border">
			<div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:gap-6">
				<h1 className="text-2xl font-bold">OpenID AuthZEN IdP Interop</h1>
				<PDPPicker activePdp={activePdp} pdpList={pdps} setPdp={onSelectPdp} />
			</div>
		</div>
	);
}

function IdentityProviderSection({ idToken }: { idToken: string | null }) {
	const tokenPayload = useMemo(() => decodeJwtPayload(idToken), [idToken]);
	const recordClaimValue =
		tokenPayload && "record" in tokenPayload ? tokenPayload.record : undefined;

	const hasIdToken = Boolean(idToken);



	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Token Status</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<StatusItem
						badge={
							hasIdToken ? (
								<Badge>Issued</Badge>
							) : (
								<Badge variant="destructive">Missing</Badge>
							)
						}
						description={
							hasIdToken
								? "The IdP returned an ID token in the latest login response."
								: "No ID token detected. Complete the login flow to request one from the IdP."
						}
						label="ID token"
						className={cn(
							!!hasIdToken && "bg-green-300",
							!hasIdToken && "bg-red-100",
						)}
					/>
					<StatusItem
						badge={
							recordClaimValue ? (
								<Badge>Claim set</Badge>
							) : (
								<Badge variant="destructive">Missing</Badge>
							)
						}
						label="Record claim"
						description={
							!!recordClaimValue
								? "Record claim returned by the IdP."
								: "No record claim detected."
						}
						
						className={cn(
							!!recordClaimValue && "bg-green-300",
							!recordClaimValue && "bg-red-100",
						)}
					/>
					{!!recordClaimValue && (
						<JsonPreview data={recordClaimValue} label="Record claim value" />
					)}
				</CardContent>
			</Card>
			{idToken ? <IdToken idToken={idToken} /> : null}
		</div>
	);
}

function StatusItem({
	label,
	badge,
	description,
	className,
}: {
	label: string;
	badge: ReactNode;
	description: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"rounded-md border border-border bg-muted/30 p-3",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-3">
				<span className="text-sm font-medium">{label}</span>
				{badge}
			</div>
			<p className="mt-1 text-xs text-muted-foreground">{description}</p>
		</div>
	);
}

function formatClaimValue(value: unknown): string {
	if (value === null) {
		return "null";
	}
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return String(value);
	}
	return JSON.stringify(value);
}

interface AuditLogSectionProps {
	auditEntries: AuditEntry[];
	clearFetcher: FetcherWithComponents<unknown>;
}

function AuditLogSection({ auditEntries, clearFetcher }: AuditLogSectionProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-2">
				<CardTitle>{`IdP->PDP Request Log`}</CardTitle>
				<clearFetcher.Form className="flex" method="post">
					<input name="intent" type="hidden" value="clear-audit-log" />
					<Button
						disabled={clearFetcher.state !== "idle"}
						size="sm"
						type="submit"
						variant="outline"
					>
						Clear
					</Button>
				</clearFetcher.Form>
			</CardHeader>
			<CardContent className="space-y-4">
				<AuditLog entries={auditEntries} />
			</CardContent>
		</Card>
	);
}
