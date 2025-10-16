import { useEffect, useRef } from "react";
import type { FetcherWithComponents } from "react-router";

const DEFAULT_POLL_INTERVAL_MS = 2000;

export function useAuditLogPolling(
	fetcher: FetcherWithComponents<unknown>,
	intervalMs = DEFAULT_POLL_INTERVAL_MS,
): void {
	const hasLoadedRef = useRef(false);
	const intervalRef = useRef<number | undefined>(undefined);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		if (!hasLoadedRef.current) {
			hasLoadedRef.current = true;
			fetcher.load("/audit-log");
		}

		intervalRef.current = window.setInterval(() => {
			if (fetcher.state === "idle") {
				fetcher.load("/audit-log");
			}
		}, intervalMs);

		return () => {
			if (intervalRef.current !== undefined) {
				window.clearInterval(intervalRef.current);
			}
		};
	}, [fetcher, intervalMs]);
}
