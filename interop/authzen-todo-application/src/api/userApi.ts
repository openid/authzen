import jsonOrError from "../utils/jsonOrError";

const BASE_URL = import.meta.env.VITE_API_ORIGIN;

export const createUserApi = (url: string, headers: Headers) => ({
  getUser: async (userId: string) => {
    console.log(url);
    const response = await fetch(`${url ?? BASE_URL}/users/${userId}`, {
      headers: headers,
    });
    return await jsonOrError(response);
  },
});
