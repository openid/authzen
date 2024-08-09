export interface TodoValues {
  Title: string;
  Completed: boolean;
}

export interface Todo extends TodoValues {
  ID: string;
  OwnerID: string;
}

export interface User {
  id: string;
  email: string;
  picture: string;
  name: string;
}

export interface ITodoService {
  listTodos: () => Promise<Todo[]>;
  createTodo: (todo: TodoValues) => Promise<Todo>;
  saveTodo: (id: string, values: TodoValues) => Promise<Todo[]>;
  deleteTodos: (
    todoList: string[]
  ) => Promise<{ result: Record<string, "DELETED" | "DENIED"> }>;
  getUser: (sub: string) => Promise<User>;
  listPdps: () => Promise<string[]>;
  setPdp: (pdp: string) => void;
}

export interface TodoProps {
  todo: Todo;
  selectedForDelete: boolean;
  handleCompletedChange: (todoId: string, completed: boolean) => void;
  handleDeleteCheck: (markedForDeletion: boolean) => void;
}

export interface TodosPropsn {
  todos: Todo[] | void;
  showCompleted: boolean;
  showActive: boolean;
  refreshTodos: () => void;
  errorHandler(errorText: string, autoClose?: number | boolean): void;
}

export interface AppProps {
  user: AuthUser;
}

export interface AuthUser {
  email: string;
  sub: string;
}
