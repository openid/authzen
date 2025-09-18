// PDP_CONFIG should be a base64 encoded JSON string that maps PDP names to
// their configuration (host and optional headers). See README for an example.
import type { PdpMap } from "~/types/pdp";

const PDP_CONFIG = process.env.PDP_CONFIG ?? "e30="; // defaults to "{}" when unset

function decodePdpConfig(config: string): PdpMap {
	try {
		return JSON.parse(Buffer.from(config, "base64").toString("utf-8"));
	} catch (error) {
		console.error(
			"Failed to decode PDP_CONFIG, falling back to empty config",
			error,
		);
		return {};
	}
}

const pdps = decodePdpConfig(PDP_CONFIG);

if (!Object.keys(pdps).length) {
	throw new Error("No PDPs configured. Please set PDP_CONFIG.");
}

export { pdps };
