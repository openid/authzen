// PDP_CONFIG should be a base64 encoded JSON string that maps PDP names to
// their configuration (host and optional headers). See README for an example.
import {
  type CreateIdpHandlerOptions,
  createIdpHandler,
} from "~/lib/create-idp-handler";

const idps = loadIdpsFromEnv();

export { idps };

function loadIdpsFromEnv(): ReturnType<typeof createIdpHandler>[] {
  const encodedConfig = process.env.IDP_CONFIG ?? "W10="; // "[]" when unset
  const decodedConfig = decodeIdpConfig(encodedConfig);

  if (!decodedConfig.length) {
    throw new Error("No IdPs configured. Please set IDP_CONFIG.");
  }

  return decodedConfig.map((config) => createIdpHandler(config));
}

function decodeIdpConfig(config: string): CreateIdpHandlerOptions[] {
  try {
    const json = Buffer.from(config, "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    return isIdpMap(parsed) ? parsed : [];
  } catch (error) {
    console.error(
      "Failed to decode IDP_CONFIG, falling back to empty config",
      error,
    );
    return [];
  }
}

function isIdpMap(value: unknown): value is CreateIdpHandlerOptions[] {
  return Array.isArray(value) && value.every(isIdpHandlerOptions);
}

function isIdpHandlerOptions(value: unknown): value is CreateIdpHandlerOptions {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CreateIdpHandlerOptions).slug === "string" &&
    typeof (value as CreateIdpHandlerOptions).label === "string" &&
    typeof (value as CreateIdpHandlerOptions).oauthClient === "object"
  );
}
