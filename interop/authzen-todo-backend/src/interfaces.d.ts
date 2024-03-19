export interface Todo {
  ID: string;
  Title: string;
  Completed: boolean;
  OwnerID: string;
}

export interface User {
  key: string;
  email: string;
  picture: string;
  name: string;
}
export interface UserCache {
  [key: string]: User;
}
