import { decodeJwtPayload } from "~/lib/jwt";
import { JsonPreview } from "./audit-log";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function IdToken({ idToken }: { idToken: string | null }) {
	if (!idToken) {
		return null;
	}

	const payload = decodeJwtPayload(idToken);

	return (
		<Card>
			<CardHeader>
				<CardTitle>ID Token Details</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-xs">
				<JsonPreview data={idToken} label="Raw token" />
				<JsonPreview data={payload} label="Decoded payload" />

				{/* <div>
					<p className="mb-2 text-sm font-semibold">Decoded payload</p>
					{payload ? (
						<pre className="max-h-96 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-tight">
							{JSON.stringify(payload, null, 2)}
						</pre>
					) : (
						<p className="text-sm text-muted-foreground">
							Could not decode the ID token payload.
						</p>
					)}
				</div> */}
			</CardContent>
		</Card>
	);
}
