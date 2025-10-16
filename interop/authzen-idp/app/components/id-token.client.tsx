import { useMemo } from "react";
import { decodeJwtPayload } from "~/lib/jwt";
import { JsonPreview } from "./audit-log";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function IdToken({ idToken }: { idToken: string | null }) {
	const payload = useMemo(() => decodeJwtPayload(idToken), [idToken]);
	const hasDecodedPayload = payload !== null;

	if (!idToken) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>ID Token Details</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-xs">
				<JsonPreview data={idToken} label="Raw token" />
				{hasDecodedPayload ? (
					<JsonPreview data={payload} label="Decoded payload" />
				) : (
					<p className="text-xs text-muted-foreground">
						Could not decode the ID token payload.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
