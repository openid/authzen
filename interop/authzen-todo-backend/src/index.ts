import express = require("express");
import cors = require("cors");
import { Store } from "./store";
import { Server } from "./server";
import { checkJwt, authzMiddleware } from "./auth";
import * as dotenv from "dotenv";
import * as dotenvExpand from "dotenv-expand";

dotenvExpand.expand(dotenv.config());

const app: express.Application = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8080;

Store.open().then((store) => {
  const server = new Server(store);
  const checkAuthz = authzMiddleware(store);

  app.get("/pdps", server.listPdps.bind(server));
  app.get(
    "/users/:userID",
    checkJwt,
    checkAuthz("can_read_user"),
    server.getUser.bind(server)
  );
  app.get(
    "/todos",
    checkJwt,
    checkAuthz("can_read_todos"),
    server.list.bind(server)
  );
  app.post(
    "/todos",
    checkJwt,
    checkAuthz("can_create_todo"),
    server.create.bind(server)
  );
  app.put(
    "/todos/:id",
    checkJwt,
    checkAuthz("can_update_todo"),
    server.update.bind(server)
  );
  app.delete(
    "/todos/:id",
    checkJwt,
    checkAuthz("can_delete_todo"),
    server.delete.bind(server)
  );

  app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
});
