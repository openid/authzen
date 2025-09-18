import { type FetcherWithComponents, redirect, useFetcher } from "react-router";
import { AuditLog } from "~/components/audit-log";
import { IdToken } from "~/components/id-token.client";
import { PDPPicker } from "~/components/pdp-picker";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuditLogPolling } from "~/hooks/useAuditLogPolling";
import { useIdTokenFromHash } from "~/hooks/useIdTokenFromHash";
import { clearAuditLog } from "~/lib/auditLog";
import { getActivePdp, listPdps, setActivePdp } from "~/lib/pdpState";
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
			<div className="container mx-auto my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
				<IdentityProviderSection idToken={idToken} />
				<AuditLogSection
					auditEntries={auditEntries}
					clearFetcher={clearFetcher}
				/>
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
	return (
		<div className="flex flex-col gap-4">
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
			{idToken ? <IdToken idToken={idToken} /> : null}
		</div>
	);
}

interface AuditLogSectionProps {
	auditEntries: AuditEntry[];
	clearFetcher: FetcherWithComponents<unknown>;
}

function AuditLogSection({ auditEntries, clearFetcher }: AuditLogSectionProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-2">
				<CardTitle>Audit Log</CardTitle>
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
