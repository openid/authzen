import { pdps } from "~/data/pdps.server";
import { metadataResponse } from "./schema";

export async function callPdp(
  endpoint: string,
  payload: object,
  pdpId: string
) {
  const pdp = pdps[pdpId];
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

export async function getPDPMetadata(pdpId: string) {
  const pdp = pdps[pdpId];
  if (!pdp) {
    throw new Error(`PDP not found`);
  }

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (pdp.headers) {
    Object.entries(pdp.headers).forEach(([key, value]) => {
      headers.append(key, value);
    });
  }

  const authZENResponse = await fetch(
    `${pdp.host}/.well-known/authzen-configuration`,
    {
      method: "GET",
      headers,
    }
  );

  if (!authZENResponse.ok) {
    throw new Error(
      `PDP metadata request failed: ${authZENResponse.statusText}`
    );
  }

  try {
    const data = await authZENResponse.json();
    return metadataResponse.parse(data);
  } catch (error) {
    console.error("Error parsing metadata response:", error);
    throw new Error("Invalid metadata response");
  }
}
