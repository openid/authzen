import { pdps } from "~/data/pdps.server";

export async function callPdp(
  endpoint: string,
  payload: object,
  pdpId: string
) {
  const pdp = pdps.find((pdp) => pdp.name === pdpId);
  if (!pdp) {
    return {
      error: "PDP not found",
    };
  }

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (pdp.headers) {
    Object.entries(pdp.headers).forEach(([key, value]) => {
      headers.append(key, value);
    });
  }

  const authZENResponse = await fetch(`${pdp.host}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!authZENResponse.ok) {
    throw new Error(`PDP request failed: ${authZENResponse.statusText}`);
  }

  return authZENResponse.json();
}
