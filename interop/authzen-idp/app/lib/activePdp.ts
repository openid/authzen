import { pdps } from "~/data/pdps.server";

let activePdp: keyof typeof pdps = "Cerbos";

export function getActivePdp() {
	return activePdp;
}

export function setActivePdp(pdpId: keyof typeof pdps) {
	if (!pdps[pdpId]) {
		throw new Error(`PDP with ID ${pdpId} not found`);
	}

	console.log("Setting active PDP to:", pdpId);
	activePdp = pdpId;
}
