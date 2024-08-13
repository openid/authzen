import express = require("express");
import axios from "axios";
import {
  expressjwt as jwt,
  GetVerificationKey,
  Request as JWTRequest,
} from "express-jwt";
import jwksRsa = require("jwks-rsa");
import * as dotenv from "dotenv";
import * as dotenvExpand from "dotenv-expand";
import log from "./log";
import * as pdps from "./pdps.json";

dotenvExpand.expand(dotenv.config());

// default PDP
const { AUTHZEN_PDP_URL, AUTHZEN_PDP_API_KEY } = process.env;
const AUTHZEN_PDP_API_KEYS = AUTHZEN_PDP_API_KEY ? JSON.parse(AUTHZEN_PDP_API_KEY) : {}

export const checkJwt = jwt({
  // Dynamically provide a signing key based on the kid in the header and the signing keys provided by the JWKS endpoint
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: process.env.JWKS_URI,
  }) as GetVerificationKey,

  // Validate the audience and the issuer
  audience: process.env.AUDIENCE,
  issuer: process.env.ISSUER,
  algorithms: ["RS256"],
});

// Resource mapper
const resourceMapper = async (req: express.Request, permission: string, store) => {
  switch (permission) {
    case 'can_read_user':
      return { type: 'user', id: req.params.userID, userID: req.params.userID };
    case 'can_read_todos':
      return { type: 'todo', id: 'todo-1' };
    case 'can_create_todo':
      return { type: 'todo', id: 'todo-1' };
    case 'can_update_todo':
      const todo = await store.get(req.params.id);
      return { ownerID: todo.OwnerID, id: todo.OwnerID, type: 'todo' };
    case 'can_delete_todo':
      const todoToDelete = await store.get(req.params.id);
      return { ownerID: todoToDelete.OwnerID, id: todo.OwnerID, type: 'todo' };
    default:
      return {};
  }
};

// Authorizer middleware
export const authzMiddleware = (store) => {
  return (permission: string) => {
    return async (
      req: JWTRequest,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const pdpHeader = req.headers["x_authzen_pdp"] as string;
      const pdpBaseName = (pdpHeader && pdps[pdpHeader]) ?? AUTHZEN_PDP_URL;
      const authorizerUrl = `${pdpBaseName}/access/v1/evaluation`
      log(`Authorizer: ${authorizerUrl}`);
      const pdpAuthHeader = (pdpHeader && AUTHZEN_PDP_API_KEYS[pdpHeader])
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      };
      if (pdpAuthHeader) {
        headers.authorization = pdpAuthHeader;
      }
      const data = {
        subject: {
          identity: req.auth?.sub,
          type: 'user',
          id: req.auth?.sub,
        },
        action: {
          name: permission,
        },
        resource: await resourceMapper(req, permission, store),
        context: {}
      };
      log(data);
      const response = await axios.post(authorizerUrl, data, { headers });
      log(response?.data)
      if (response?.data?.decision) {
        next();
      } else {
        res.status(403).send();
      }
    };
  };
};
