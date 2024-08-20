import React, { useContext } from "react";
import { Todo, TodoValues, ITodoService, User } from "./interfaces";
import { useQuery } from "react-query";

const serviceContext = React.createContext({
  token: "",
  pdp: "",
  setPdp: (_: string) => {},
});

const urls = {
  pdps: `${process.env.REACT_APP_API_ORIGIN}/pdps`,
  todos: `${process.env.REACT_APP_API_ORIGIN}/todos`,
  todo: (id: string) => `${process.env.REACT_APP_API_ORIGIN}/todos/${id}`,
  user: (id: string) => `${process.env.REACT_APP_API_ORIGIN}/users/${id}`,
};

export const useTodoService: () => ITodoService = () => {
  const { token, pdp, setPdp } = useContext(serviceContext);
  const headers: Headers = new Headers();

  headers.append("Authorization", `Bearer ${token}`);
  headers.append("Content-Type", "application/json");
  headers.append("X_AUTHZEN_API", "1.1");
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

  const deleteTodos: (
    todoList: string[]
  ) => Promise<{ result: Record<string, "DELETED" | "DENIED"> }> = async (
    todoList
  ) => {
    const response: Response = await fetch(urls.todos, {
      method: "DELETE",
      body: JSON.stringify({ todos: todoList }),
      headers: headers,
    });
    return await jsonOrError(response);
  };

  const getUser: (userId: string) => Promise<User> = async (userId) => {
    const response = await fetch(urls.user(userId), { headers: headers });
    return await jsonOrError(response);
  };

  const listPdps: () => Promise<string[]> = async () => {
    const response = await fetch(urls.pdps, { headers: headers });
    return await jsonOrError(response);
  };

  return {
    listTodos,
    createTodo,
    saveTodo,
    deleteTodos,
    getUser,
    listPdps,
    setPdp,
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
  setPdp: (pdp: string) => void;
};

const TodoService: React.FC<React.PropsWithChildren<ServiceProps>> = ({
  children,
  token,
  pdp,
  setPdp,
}) => {
  return (
    <serviceContext.Provider value={{ token, pdp, setPdp }}>
      {children}
    </serviceContext.Provider>
  );
};

export default TodoService;
