export default async (response: Response): Promise<any> => {
  if (response.status === 200) {
    return await response.json();
  }

  throw new Error(`${response.status}: ${response.statusText}`);
};
