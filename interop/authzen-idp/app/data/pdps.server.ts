// PDP_CONFIG should be a base64 encoded JSON string that maps PDP names to
// their configuration (host and optional headers). See README for an example.
import type { PdpMap } from "~/types/pdp";

const pdps = loadPdpsFromEnv();

export { pdps };

function loadPdpsFromEnv(): PdpMap {
  const encodedConfig = process.env.PDP_CONFIG ?? "e30="; // "{}" when unset
  const decodedConfig = decodePdpConfig(encodedConfig);

  if (!Object.keys(decodedConfig).length) {
    throw new Error("No PDPs configured. Please set PDP_CONFIG.");
  }

  return decodedConfig;
}

function decodePdpConfig(config: string): PdpMap {
  try {
    const json = Buffer.from(config, "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    return isPdpMap(parsed) ? parsed : {};
  } catch (error) {
    console.error(
      "Failed to decode PDP_CONFIG, falling back to empty config",
      error,
    );
    return {};
  }
}

function isPdpMap(value: unknown): value is PdpMap {
  return typeof value === "object" && value !== null;
}
