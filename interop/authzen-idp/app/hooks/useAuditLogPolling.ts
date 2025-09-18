import { useEffect } from "react";
import type { FetcherWithComponents } from "react-router";

const DEFAULT_POLL_INTERVAL_MS = 2000;

export function useAuditLogPolling(
	fetcher: FetcherWithComponents<unknown>,
	intervalMs = DEFAULT_POLL_INTERVAL_MS,
): void {
	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		if (fetcher.state === "idle") {
			fetcher.load("/audit-log");
		}

		const intervalId = window.setInterval(() => {
			if (fetcher.state === "idle") {
				fetcher.load("/audit-log");
			}
		}, intervalMs);

		return () => window.clearInterval(intervalId);
	}, [fetcher, intervalMs]);
}
