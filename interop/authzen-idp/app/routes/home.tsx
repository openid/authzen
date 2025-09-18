import { useEffect } from "react";
import { redirect, useFetcher } from "react-router";
import { AuditLog } from "~/components/audit-log";
import { IdToken } from "~/components/id-token.client";
import { PDPPicker } from "~/components/pdp-picker";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { pdps } from "~/data/pdps.server";
import { getActivePdp, setActivePdp } from "~/lib/activePdp";
import { type AuditEntry, clearAuditLog } from "~/lib/auditLog";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "OpenID AuthZEN IdP Interop" },
		{ name: "description", content: "Welcome to OpenID AuthZEN IdP Interop!" },
	];
}

export async function loader(_: Route.LoaderArgs) {
	return {
		pdps: Object.keys(pdps) || [],
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (auditFetcher.state === "idle") {
			auditFetcher.load("/audit-log");
		}
		const interval = window.setInterval(() => {
			if (auditFetcher.state === "idle") {
				auditFetcher.load("/audit-log");
			}
		}, 2000);
		return () => window.clearInterval(interval);
	}, []);

	const auditEntries = auditFetcher.data?.auditLog ?? [];

	const idToken = (() => {
		try {
			const hash = window.location.hash;
			if (hash) {
				const params = new URLSearchParams(hash.replace(/^#/, ""));
				return params.get("id_token");
			}
		} catch {
			// ignore
		}
		return null;
	})();

	return (
		<main className="flex-1 bg-background">
			<div className="flex gap-4 flex-col">
				<div className="flex items-center gap-4 p-2 bg-sidebar-primary-foreground border-b border-b-border">
					<h1 className="text-2xl font-bold">OpenID AuthZEN IdP Interop</h1>
					<PDPPicker
						pdpList={loaderData.pdps}
						activePdp={loaderData.activePdp}
						setPdp={(pdp: string): void => {
							pdpFetcher.submit(
								{
									intent: "set-active-pdp",
									pdp: pdp,
									returnTo: location.pathname,
								},
								{ method: "post" },
							);
						}}
					/>
				</div>
			</div>
			<div className="container mx-auto my-8 grid grid-cols-2 gap-4">
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
					{idToken && <IdToken idToken={idToken} />}
				</div>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between gap-2">
						<CardTitle>Audit Log</CardTitle>
						<clearFetcher.Form method="post">
							<input name="intent" type="hidden" value="clear-audit-log" />
							<Button
								type="submit"
								variant="outline"
								size="sm"
								disabled={clearFetcher.state !== "idle"}
							>
								Clear
							</Button>
						</clearFetcher.Form>
					</CardHeader>
					<CardContent className="space-y-4 overflow-y-scroll">
						<AuditLog entries={auditEntries} />
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
