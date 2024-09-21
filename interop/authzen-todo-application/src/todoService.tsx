import React, { useContext } from "react";
import { Todo, TodoValues, ITodoService, User, Config } from "./interfaces";
import { useQuery } from "react-query";

const serviceContext = React.createContext({
  token: "",
  pdp: "",
  specVersion: "",
  setPdp: (_: string) => {},
  setSpecVersion: (_: string) => {},
});

const urls = {
  pdps: `${process.env.REACT_APP_API_ORIGIN}/pdps`,
  todos: `${process.env.REACT_APP_API_ORIGIN}/todos`,
  todo: (id: string) => `${process.env.REACT_APP_API_ORIGIN}/todos/${id}`,
  user: (id: string) => `${process.env.REACT_APP_API_ORIGIN}/users/${id}`,
};

export const useTodoService: () => ITodoService = () => {
  const { token, pdp, specVersion, setPdp, setSpecVersion } = useContext(serviceContext);
  const headers: Headers = new Headers();

  headers.append("Authorization", `Bearer ${token}`);
  headers.append("Content-Type", "application/json");
  if (specVersion) {
    headers.append("X_AUTHZEN_SPEC_VERSION", specVersion);
  }
  if (pdp) {
    headers.append("X_AUTHZEN_PDP", pdp);
  }

  const listTodos = async (): Promise<Todo[]> => {
    const response = await fetch(urls.todos, { headers: headers });
    return await jsonOrError(response);
  };

  const createTodo = async (todo: TodoValues): Promise<Todo> => {
    const response = await fetch(urls.todos, {
      method: "POST",
      headers,
      body: JSON.stringify(todo),
    });
    return await jsonOrError(response);
  };

  const saveTodo = async (id: string, values: TodoValues): Promise<Todo[]> => {
    const response = await fetch(urls.todo(id), {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(values),
    });
    return await jsonOrError(response);
  };

  const deleteTodo: (todo: Todo) => Promise<void | Response> = async (todo) => {
    const response: Response = await fetch(urls.todo(todo.ID), {
      method: "DELETE",
      body: JSON.stringify(todo),
      headers: headers,
    });
    if (response.status !== 200) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
  };

  const getUser: (userId: string) => Promise<User> = async (userId) => {
    const response = await fetch(urls.user(userId), { headers: headers });
    return await jsonOrError(response);
  };

  const getConfig: () => Promise<Config> = async () => {
    const response = await fetch(urls.pdps, { headers: headers });
    return await jsonOrError(response);
  };

  return {
    listTodos,
    createTodo,
    saveTodo,
    deleteTodo,
    getUser,
    getConfig,
    pdp,
    specVersion,
    setPdp,
    setSpecVersion,
  };
};

export const useUser: (userId: string) => User = (userId: string) => {
  const { getUser } = useTodoService();
  const response = useQuery(["User", userId], () => {
    return getUser(userId);
  });
  return response.data as User;
};

const jsonOrError = async (response: Response): Promise<any> => {
  if (response.status === 200) {
    return await response.json();
  }

  throw new Error(`${response.status}: ${response.statusText}`);
};

export type ServiceProps = {
  token: string;
  pdp: string;
  specVersion: string;
  setPdp: (pdp: string) => void;
  setSpecVersion: (specVersion: string) => void;
};

const TodoService: React.FC<React.PropsWithChildren<ServiceProps>> = ({
  children,
  token,
  pdp,
  specVersion,
  setPdp,
  setSpecVersion,
}) => {
  return (
    <serviceContext.Provider value={{ token, pdp, specVersion, setPdp, setSpecVersion }}>
      {children}
    </serviceContext.Provider>
  );
};

export default TodoService;
