import { v4 as uuidv4 } from "uuid";
import { Request as JWTRequest } from "express-jwt";
import { Response } from "express";
import { Todo } from "./interfaces";
import { Store } from "./store";
import { Directory } from "./directory";
import { createStatefulAuthorizationService } from "./statefulAuthorizationService";
import { checkCanUpdateTodos } from "./auth";
import { getPdpInfo } from "./auth";
import pdps from "./pdps.json";

export class Server {
  store: Store;
  directory: Directory;

  constructor(store: Store) {
    this.store = store;
    this.directory = new Directory();
  }

  async listPdps(_: Request, res: Response) {
    const config = {
      pdps: {},
      gateways: {},
      gatewayPdps: [],
    };
    const versions = Object.keys(pdps.pdps);
    for (const v of versions) {
      config.pdps[v] = Object.keys(pdps.pdps[v])
    }
    config.gateways = pdps.gateways;
    config.gatewayPdps = Object.keys(pdps.gatewayPdps);
    res.json(config);
  }

  async listGatewayPdps(_: Request, res: Response) {
    res.json(pdps.gatewayPdps);
  }
  
  async getUser(req: JWTRequest, res: Response) {
    const { userID } = req.params;
    if(req.auth.sub === userID) {
      res.json(await this.directory.getUserByIdentity(userID));
    } else {
      res.json(await this.directory.getUserById(userID));
    }
  }

  async list(req: JWTRequest, res: Response) {
    let todos = await this.store.list();
    todos = await checkCanUpdateTodos(req, todos);
    res.json(todos);
  }

  async create(req: JWTRequest, res: Response) {
    const todo: Todo = req.body;
    todo.ID = uuidv4();
    try {
      const user = await this.directory.getUserByIdentity(req.auth.sub);
      todo.OwnerID = user.id;


      await this.store.insert(todo);
      await this.getStatefulAuthorizationService(req).insert(todo.ID, req.auth.sub);

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
    await this.getStatefulAuthorizationService(req).delete(req.params.id, req.auth.sub);
    res.json({ msg: "Todo deleted" });
  }

  private getStatefulAuthorizationService(req: JWTRequest){ 
      const { pdpBaseName, pdpAuthHeader, pdpHeader } = getPdpInfo(req);
      return createStatefulAuthorizationService(pdpBaseName, pdpAuthHeader, pdpHeader);
  }
}
