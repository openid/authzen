import { authorize } from "./authzen.mjs";

export async function handler(event) {
  const isAuthorized = await authorize(event);
  return {
    isAuthorized,
  };
}
