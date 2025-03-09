export interface Todo {
  ID: string;
  Title: string;
  Completed: boolean;
  OwnerID: string;
  CannotUpdate?: boolean;
}

export interface User {
  id: string;
  email: string;
  picture: string;
  name: string;
}
export interface UserCache {
  [id: string]: User;
}

export interface StatefulAuthorizationService {
  insert(todoId: string, userId: string): Promise<void>;
  delete(todoId: string, userId: string): Promise<void>;
}