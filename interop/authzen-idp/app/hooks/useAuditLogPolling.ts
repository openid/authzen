import { useEffect, useRef } from "react";
import type { FetcherWithComponents } from "react-router";

const DEFAULT_POLL_INTERVAL_MS = 2000;

export function useAuditLogPolling(
	fetcher: FetcherWithComponents<unknown>,
	intervalMs = DEFAULT_POLL_INTERVAL_MS,
): void {
	const hasLoadedRef = useRef(false);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		if (!hasLoadedRef.current && fetcher.state === "idle") {
			hasLoadedRef.current = true;
			fetcher.load("/audit-log");
		}

		const intervalId = window.setInterval(() => {
			if (fetcher.state === "idle") {
				fetcher.load("/audit-log");
			}
		}, intervalMs);

		return () => window.clearInterval(intervalId);
	}, [fetcher, fetcher.state, intervalMs]);
}
