import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function IdToken({ idToken }: { idToken: string | null }) {
	if (!idToken) {
		return null;
	}
	return (
		<Card>
			<CardHeader>
				<CardTitle>ID Token</CardTitle>
			</CardHeader>
			<CardContent>
				<pre className="mt-2 max-h-96 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-tight">
					{JSON.stringify(JSON.parse(atob(idToken.split(".")[1])), null, 2)}
				</pre>
			</CardContent>
		</Card>
	);
}
