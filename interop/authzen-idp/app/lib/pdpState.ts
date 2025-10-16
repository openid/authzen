import { pdps } from "~/data/pdps.server";
import type { PdpConfig } from "~/types/pdp";

let activePdp = getInitialActivePdp();

function getInitialActivePdp(): string {
	const [firstPdp] = listPdps();
	if (!firstPdp) {
		throw new Error(
			"Unable to determine initial PDP. Ensure PDP_CONFIG is set.",
		);
	}
	return firstPdp;
}

export function listPdps(): string[] {
	return Object.keys(pdps);
}

export function getActivePdp(): string {
	if (!pdps[activePdp]) {
		activePdp = getInitialActivePdp();
	}
	return activePdp;
}

export function setActivePdp(pdpId: string): void {
	assertPdpExists(pdpId);
	activePdp = pdpId;
}

export function getPdpConfig(pdpId: string): PdpConfig {
	assertPdpExists(pdpId);
	return pdps[pdpId];
}

function assertPdpExists(pdpId: string): void {
	if (!pdps[pdpId]) {
		throw new Error(`PDP with ID ${pdpId} not found`);
	}
}
