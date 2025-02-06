import { Todo, TodoValues, User, Config } from "../interfaces";

const BASE_URL = import.meta.env.VITE_API_ORIGIN;

export const createTodoApi = (url: string, headers: Headers) => ({
  listTodos: async (): Promise<Todo[]> => {
    const response = await fetch(`${url ?? BASE_URL}/todos`, { headers });
    return await jsonOrError(response);
  },

  createTodo: async (todo: TodoValues): Promise<Todo> => {
    const response = await fetch(`${url ?? BASE_URL}/todos`, {
      method: "POST",
      headers,
      body: JSON.stringify(todo),
    });
    return await jsonOrError(response);
  },

  updateTodo: async (id: string, values: TodoValues): Promise<Todo[]> => {
    const response = await fetch(`${url ?? BASE_URL}/todos/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(values),
    });
    return await jsonOrError(response);
  },

  deleteTodo: async (todo: Todo): Promise<void> => {
    const response = await fetch(`${url ?? BASE_URL}/todos/${todo.ID}`, {
      method: "DELETE",
      body: JSON.stringify(todo),
      headers,
    });
    if (response.status !== 200) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await fetch(`${url ?? BASE_URL}/users/${userId}`, { headers });
    return await jsonOrError(response);
  },

  getConfig: async (): Promise<Config> => {
    const response = await fetch(`${BASE_URL}/pdps`, { headers });
    return await jsonOrError(response);
  },
});

const jsonOrError = async (response: Response): Promise<any> => {
  if (response.status === 200) {
    return await response.json();
  }
  throw new Error(`${response.status}: ${response.statusText}`);
};
