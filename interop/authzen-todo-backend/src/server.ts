import { v4 as uuidv4 } from "uuid";
import { Request as JWTRequest } from "express-jwt";
import { Response } from "express";
import { Todo } from "./interfaces";
import { Store } from "./store";
import { Directory } from "./directory";
const pdps = require("./pdps.json");

export class Server {
  store: Store;
  directory: Directory;

  constructor(store: Store) {
    this.store = store;
    this.directory = new Directory();
  }

  async listPdps(_: Request, res: Response) {
    res.json(Object.keys(pdps));
  }

  async getUser(req: JWTRequest, res: Response) {
    const { userID } = req.params;
    if(req.auth.sub === userID) {
      res.json(await this.directory.getUserByIdentity(userID));
    } else {
      res.json(await this.directory.getUserById(userID));
    }
  }

  async list(_: Request, res: Response) {
    const todos = await this.store.list();
    res.json(todos);
  }

  async create(req: JWTRequest, res: Response) {
    const todo: Todo = req.body;
    todo.ID = uuidv4();
    try {
      const user = await this.directory.getUserByIdentity(req.auth.sub);
      todo.OwnerID = user.key

      await this.store.insert(todo);
      res.json({ msg: "Todo created" });
    } catch (error) {
      res.status(422).send({error: (error as Error).message})
    }
  }

  async update(req: JWTRequest, res: Response) {
    const todo: Todo = req.body;
    todo.ID = req.params.id;

    await this.store.update(todo);
    res.json({ msg: "Todo updated" });
  }

  async delete(req: JWTRequest, res: Response) {
    await this.store.delete(req.params.id);
    res.json({ msg: "Todo deleted" });
  }
}
