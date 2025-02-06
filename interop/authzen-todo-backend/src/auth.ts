import express = require("express");
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
import config from "./pdps.json";
import { Store } from "store";
import { Todo } from "interfaces";

// Configuration
dotenvExpand.expand(dotenv.config());

const { AUTHZEN_PDP_URL, AUTHZEN_PDP_API_KEY } = process.env;
const AUTHZEN_PDP_API_KEYS = AUTHZEN_PDP_API_KEY
  ? JSON.parse(AUTHZEN_PDP_API_KEY)
  : {};

const enum SPEC_VERSIONS {
  VERSION_00 = "authorization-api-1_0-00",
  VERSION_01 = "authorization-api-1_0-01",
  VERSION_02 = "authorization-api-1_0-02",
}
const DEFAULT_SPEC_VERSION = SPEC_VERSIONS.VERSION_02;

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

// Resource mapper
const resourceMapper = async (
  req: express.Request,
  permission: string,
  store: Store,
  specVersion: string
) => {
  const mappers = {
    can_read_user: () => ({
      type: "user",
      id: req.params.userID,
      userID:
        specVersion === SPEC_VERSIONS.VERSION_00
          ? req.params.userID
          : undefined,
    }),
    can_read_todos: () => ({ type: "todo", id: "todo-1" }),
    can_create_todo: () => ({ type: "todo", id: "todo-1" }),
    can_update_todo: async () => {
      const todo = await store.get(req.params.id);
      if (!todo) {
        log(`todo ${req.params.id} not found in SQLite db`);
        return {};
      }
      return {
        type: "todo",
        id: todo.ID,
        ownerID:
          specVersion === SPEC_VERSIONS.VERSION_00 ? todo.OwnerID : undefined,
        properties:
          specVersion !== SPEC_VERSIONS.VERSION_00
            ? { ownerID: todo.OwnerID }
            : undefined,
      };
    },
    can_delete_todo: async () => {
      const todoToDelete = await store.get(req.params.id);
      if (!todoToDelete) {
        log(`todo ${req.params.id} not found in SQLite db`);
        return {};
      }
      return {
        type: "todo",
        id: todoToDelete.ID,
        ownerID:
          specVersion === SPEC_VERSIONS.VERSION_00
            ? todoToDelete.OwnerID
            : undefined,
        properties:
          specVersion !== SPEC_VERSIONS.VERSION_00
            ? { ownerID: todoToDelete.OwnerID }
            : undefined,
      };
    },
  };

  return (mappers[permission] && (await mappers[permission]())) || {};
};

// Authorization Helper Functions
const getPdpInfo = (req: JWTRequest) => {
  const pdpHeader = req.headers["x_authzen_pdp"] as string;
  const specVersionHeader =
    (req.headers["x_authzen_spec_version"] as string) || DEFAULT_SPEC_VERSION;
  const specVersion = Object.keys(config.pdps).includes(specVersionHeader)
    ? specVersionHeader
    : DEFAULT_SPEC_VERSION;
  const pdps = config.pdps[specVersion];
  const pdpBaseName = (pdpHeader && pdps[pdpHeader]) ?? AUTHZEN_PDP_URL;
  const pdpAuthHeader = pdpHeader && AUTHZEN_PDP_API_KEYS[pdpHeader];
  return { specVersion, pdpBaseName, pdpAuthHeader };
};

const getHeaders = (pdpAuthHeader: string) => {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (pdpAuthHeader) headers.authorization = pdpAuthHeader;
  return headers;
};

// Authorizer Middleware
export const authzMiddleware = (store: Store) => (permission: string) => {
  return async (
    req: JWTRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const { specVersion, pdpBaseName, pdpAuthHeader } = getPdpInfo(req);
    const authorizerUrl = `${pdpBaseName}/access/v1/evaluation`;
    log(`Authorizer: ${authorizerUrl}`);

    const data = {
      subject: {
        type: "user",
        id: req.auth?.sub,
        identity:
          specVersion === SPEC_VERSIONS.VERSION_00 ? req.auth?.sub : undefined,
      },
      action: {
        name: permission,
      },
      resource: await resourceMapper(req, permission, store, specVersion),
      context: {},
    };
    log(data);

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

export const checkCanUpdateTodos = async (req: JWTRequest, todos: Todo[]) => {
  const { pdpBaseName, pdpAuthHeader, specVersion } = getPdpInfo(req);
  if (
    specVersion === SPEC_VERSIONS.VERSION_00 ||
    specVersion === SPEC_VERSIONS.VERSION_01
  ) {
    return todos;
  }
  if (todos && !todos.length) {
    return todos;
  }

  const authorizerUrl = `${pdpBaseName}/access/v1/evaluations`;
  log(`Authorizer: ${authorizerUrl}`);

  const evaluations = todos.map((todo: Todo) => ({
    resource: {
      id: todo.ID,
      type: "todo",
      properties: {
        ownerID: todo.OwnerID,
      },
    },
  }));

  const data = {
    subject: { type: "user", id: req.auth?.sub },
    action: { name: "can_update_todo" },
    evaluations,
  };

  try {
    const response = await axios.post(authorizerUrl, data, {
      headers: getHeaders(pdpAuthHeader),
    });
    if (response?.data?.evaluations) {
      todos.map(
        (t, i) => (t.CannotUpdate = !response?.data?.evaluations[i].decision)
      );
    }
  } catch (error) {
    log(error);
  }
  return todos;
};
