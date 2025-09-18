import { useEffect, useState } from "react";

export function useIdTokenFromHash(): string | null {
	const [idToken, setIdToken] = useState<string | null>(() => {
		if (typeof window === "undefined") {
			return null;
		}
		return extractIdToken(window.location.hash);
	});

	useEffect(() => {
		if (typeof window === "undefined") {
			return undefined;
		}

		const updateIdToken = () => {
			setIdToken(extractIdToken(window.location.hash));
		};

		window.addEventListener("hashchange", updateIdToken);
		updateIdToken();

		return () => {
			window.removeEventListener("hashchange", updateIdToken);
		};
	}, []);

	return idToken;
}

function extractIdToken(hash: string): string | null {
	if (!hash) {
		return null;
	}

	try {
		const params = new URLSearchParams(
			hash.startsWith("#") ? hash.slice(1) : hash,
		);
		return params.get("id_token");
	} catch {
		return null;
	}
}
