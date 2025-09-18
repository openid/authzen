import { useEffect, useRef, useState } from "react";

export function useIdTokenFromHash(): string | null {
	const [idToken, setIdToken] = useState<string | null>(null);
	const hasPersistedToken = useRef(false);

	useEffect(() => {
		if (typeof window === "undefined") {
			return undefined;
		}

		const updateIdToken = () => {
			const token = extractIdToken(window.location.hash);
			if (token) {
				hasPersistedToken.current = true;
				setIdToken(token);
				const url = `${window.location.pathname}${window.location.search}`;
				window.history.replaceState(null, "", url);
			} else if (!hasPersistedToken.current) {
				setIdToken(null);
			}
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
