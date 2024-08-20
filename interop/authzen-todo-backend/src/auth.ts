import express from "express";
import axios from "axios";
import {
  expressjwt as jwt,
  GetVerificationKey,
  Request as JWTRequest,
} from "express-jwt";
import jwksRsa from "jwks-rsa";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import log from "./log";
import pdpsv1_0 from "./pdps/v1.0.json";
import pdpsv1_1 from "./pdps/v1.1.json";
import { Store } from "store";

// Configuration
dotenvExpand.expand(dotenv.config());

const { AUTHZEN_PDP_URL, AUTHZEN_PDP_API_KEY } = process.env;
const AUTHZEN_PDP_API_KEYS = AUTHZEN_PDP_API_KEY
  ? JSON.parse(AUTHZEN_PDP_API_KEY)
  : {};

// JWT Middleware
export const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: process.env.JWKS_URI,
  }) as GetVerificationKey,
  audience: process.env.AUDIENCE,
  issuer: process.env.ISSUER,
  algorithms: ["RS256"],
});

// Resource Mapper
const resourceMapper = async (
  req: express.Request,
  permission: string,
  store: Store
) => {
  const mappers = {
    can_read_user: () => ({
      type: "user",
      id: req.params.userID,
      userID: req.params.userID,
    }),
    can_read_todos: () => ({ type: "todo", id: "todo-1" }),
    can_create_todo: () => ({ type: "todo", id: "todo-1" }),
    can_update_todo: async () => {
      const todo = await store.get(req.params.id);
      return { ownerID: todo.OwnerID, id: todo.OwnerID, type: "todo" };
    },
    can_delete_todo: async () => {
      const todoToDelete = await store.get(req.params.id);
      return {
        ownerID: todoToDelete.OwnerID,
        id: todoToDelete.OwnerID,
        type: "todo",
      };
    },
  };

  return (mappers[permission] && (await mappers[permission]())) || {};
};

// Authorization Helper Functions
const getPdpInfo = (req: JWTRequest) => {
  const pdpHeader = req.headers["x_authzen_pdp"] as string;
  const apiVersion = req.headers["x_authzen_api"] || "1.0";

  let pdps: Record<string, string> = pdpsv1_0;
  if (apiVersion === "1.1") {
    pdps = pdpsv1_1;
  }

  const pdpBaseName = (pdpHeader && pdps[pdpHeader]) ?? AUTHZEN_PDP_URL;
  const pdpAuthHeader = pdpHeader && AUTHZEN_PDP_API_KEYS[pdpHeader];
  return { pdpBaseName, pdpAuthHeader };
};

const getHeaders = (pdpAuthHeader: string) => {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (pdpAuthHeader) headers.authorization = pdpAuthHeader;
  return headers;
};

// Authorization Middleware
export const authzMiddleware = (store: Store) => (permission: string) => {
  return async (
    req: JWTRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const { pdpBaseName, pdpAuthHeader } = getPdpInfo(req);

    const authorizerUrl = `${pdpBaseName}/access/v1/evaluation`;
    log(`Authorizer: ${authorizerUrl}`);

    const data = {
      subject: { identity: req.auth?.sub, type: "user", id: req.auth?.sub },
      action: { name: permission },
      resource: await resourceMapper(req, permission, store),
      context: {},
    };

    try {
      const response = await axios.post(authorizerUrl, data, {
        headers: getHeaders(pdpAuthHeader),
      });
      log(response?.data);
      response?.data?.decision ? next() : res.status(403).send();
    } catch (error) {
      log(error);
      res.status(500).send();
    }
  };
};

// Boxcar Authorization Middleware
export const authzBoxcarMiddleware = (store: Store) => (permission: string) => {
  return async (
    req: JWTRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (!req.body.todos)
      return res.status(400).send("Missing todos in request body");

    const { pdpBaseName, pdpAuthHeader } = getPdpInfo(req);
    const authorizerUrl = `${pdpBaseName}/access/v1/evaluations`;
    log(`Authorizer: ${authorizerUrl}`);

    const evaluations = await getEvaluations(req.body.todos, store);

    const data = {
      subject: { type: "user", identity: req.auth?.sub },
      action: { name: permission },
      evaluations,
    };

    try {
      const response = await axios.post(authorizerUrl, data, {
        headers: getHeaders(pdpAuthHeader),
      });
      if (response?.data?.evaluations) {
        req["authorization"] = response.data;
        next();
      } else {
        res.status(403).send();
      }
    } catch (error) {
      log(error);
      res.status(500).send();
    }
  };
};

async function getEvaluations(todos: string[], store: Store) {
  const evaluations = {};
  await Promise.all(
    todos.map(async (id: string) => {
      const todoToDelete = await store.get(id);
      if (todoToDelete) {
        evaluations[id] = {
          resource: { id, ownerID: todoToDelete.OwnerID, type: "todo" },
        };
      }
    })
  );
  return evaluations;
}
