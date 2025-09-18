import { redirect, useFetcher } from "react-router";
import { AuditLog } from "~/components/audit-log";
import { PDPPicker } from "~/components/pdp-picker";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { pdps } from "~/data/pdps.server";
import { getActivePdp, setActivePdp } from "~/lib/activePdp";
import { getAuditLog } from "~/lib/auditLog";
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
		auditLog: getAuditLog(),
	};
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const selectedPDP = formData.get("pdp");
	const returnTo = formData.get("returnTo")?.toString() || "/";
	if (!selectedPDP || Array.isArray(selectedPDP)) {
		return { error: "Invalid PDP selected", returnTo };
	}
	setActivePdp(selectedPDP?.toString());
	return redirect(returnTo);
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const fetcher = useFetcher();

	return (
		<main className="flex-1 bg-background">
			<div className="flex gap-4 flex-col">
				<div className="flex items-center gap-4 p-2 bg-sidebar-primary-foreground border-b border-b-border">
					<h1 className="text-2xl font-bold">OpenID AuthZEN IdP Interop</h1>
					<PDPPicker
						pdpList={loaderData.pdps}
						activePdp={loaderData.activePdp}
						setPdp={(pdp: string): void => {
							fetcher.submit(
								{ pdp: pdp, returnTo: location.pathname },
								{ method: "post" },
							);
						}}
					/>
				</div>
			</div>
			<div className="container mx-auto my-8 grid grid-cols-2 gap-4">
				<Card>
					<CardHeader>
						<CardTitle>Login</CardTitle>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<a href="/idp/auth0/login">Login with Auth0</a>
						</Button>
					</CardContent>
				</Card>
				<AuditLog entries={loaderData.auditLog} />
			</div>
		</main>
	);
}
