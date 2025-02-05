import jsonOrError from "../utils/jsonOrError";

const BASE_URL = import.meta.env.VITE_API_ORIGIN;

export const createUserApi = (headers: Headers) => ({
  getUser: async (userId: string) => {
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      headers: headers,
    });
    return await jsonOrError(response);
  },
});
