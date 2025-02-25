import jsonOrError from "../utils/jsonOrError";

const BASE_URL = import.meta.env.VITE_API_ORIGIN;

export const createConfigApi = (headers: Headers) => ({
  getConfig: async () => {
    const response = await fetch(`${BASE_URL}/pdps`, {
      headers: headers,
    });
    return await jsonOrError(response);
  },
});
