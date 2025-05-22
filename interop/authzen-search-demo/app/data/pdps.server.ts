// PDP_CONFIG should be a base64 encoded JSON string.
// The JSON object should map PDP names (e.g., "Cerbos") to objects containing header key-value pairs.
// Example JSON:
// {
//   "Cerbos": {
//     "host": "https://authzen-proxy-demo.cerbos.dev"
//   },
//   "Topaz": {
//     "host": "https://topaz-search.authzen-interop.net",
//     "headers": {
//       "Authorization": "basic 101520"
//     }
//   }
// }

interface PDP {
  host: string;
  headers?: Record<string, string>;
}

// Defaults to base64 encoded empty object ("{}") if not set.
const PDP_CONFIG = process.env.PDP_CONFIG || "e30=";

// Stores the decoded configuration, mapping PDP names to their specific headers.
let pdps: Record<string, PDP> = {};

try {
  pdps = JSON.parse(Buffer.from(PDP_CONFIG, "base64").toString("utf-8"));
} catch (e) {
  console.error("Failed to decode PDP_CONFIG, using empty object", e);
}

if (!Object.keys(pdps).length) {
  throw new Error("No PDPs configured. Please set PDP_CONFIG.");
}

export { pdps };
