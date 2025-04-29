const PDP_AUTH_CONFIG = process.env.PDP_AUTH_CONFIG || "e30="; // base64 encoded empty object

let decodedConfig: Record<string, Record<string, string>> = {};

try {
  decodedConfig = JSON.parse(
    Buffer.from(PDP_AUTH_CONFIG, "base64").toString("utf-8")
  );
} catch {
  console.error("Failed to decode PDP_AUTH_CONFIG, using empty object");
}

interface PDP {
  name: string;
  host: string;
  headers?: Record<string, string>;
}

const pdps: PDP[] = [
  {
    name: "Cerbos",
    host: "https://authzen-proxy-demo.cerbos.dev",
    headers: decodedConfig["Cerbos"] ?? undefined,
  },
  {
    name: "Axiomatics",
    host: "https://...",
    headers: decodedConfig["Axiomatics"] ?? undefined,
  },
];

export { pdps };
