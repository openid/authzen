import { Todo } from "./interfaces";
import sqlite3 = require("sqlite3");
import { open, Database } from "sqlite";

export class Store {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  static async open(filename = "./todo.db"): Promise<Store> {
    const db = await open({
      filename,
      driver: sqlite3.Database,
    });
    await db.run(
      `CREATE TABLE IF NOT EXISTS todos (
        ID TEXT PRIMARY KEY,
        Title TEXT NOT NULL,
        Completed BOOLEAN NOT NULL,
        OwnerID TEXT NOT NULL
    )`
    );
    return new Store(db);
  }

  async list(): Promise<Todo[]> {
    return this.db.all("SELECT * FROM todos");
  }

  async get(id: string): Promise<Todo> {
    return this.db.get("SELECT * FROM todos WHERE ID = ?", id);
  }

  async insert(todo: Todo): Promise<void> {
    await this.db.run(
      "INSERT INTO todos (ID, Title, Completed, OwnerID) VALUES (?, ?, ?, ?)",
      todo.ID,
      todo.Title,
      todo.Completed,
      todo.OwnerID
    );
  }

  async update(todo: Todo): Promise<void> {
    await this.db.run(
      "UPDATE todos SET Title = ?, Completed = ? WHERE ID = ?",
      todo.Title,
      todo.Completed,
      todo.ID
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.run("DELETE FROM todos WHERE ID = ?", id);
  }
}
