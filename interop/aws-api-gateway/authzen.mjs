import fetch from "node-fetch";
import { jwtDecode } from "jwt-decode";
import pdps from "./pdps.json" with { "type": "json" };

function log(message) {
  if (true) {
    console.log(message);
  }
}

const { AUTHZEN_PDP_API_KEYS } = process.env;

function getPdpInfo(req) {
  const pdpName = req.headers["x_authzen_gateway_pdp"];
  const pdpBaseUrl = pdpName && pdps[pdpName];
  const pdpAuthHeader = pdpName && AUTHZEN_PDP_API_KEYS[pdpName];
  return { pdpName, pdpBaseUrl, pdpAuthHeader };
};

function getSubjectId(req) {
  const jwt = req.headers['authorization'] && req.headers['authorization'].substring && req.headers['authorization'].substring(7);
  const decodedJwt = jwt && jwtDecode(jwt);
  return decodedJwt && decodedJwt.sub;
}

export async function authorize(req) {
  const subjectId = getSubjectId(req);
  if (!subjectId) {
    log('error: could not retrieve subject claim from JWT');
    return false;
  }

  const { pdpName, pdpBaseUrl, pdpAuthHeader } = getPdpInfo(req);
  if (!pdpBaseUrl) {
    log(`error: could not retrieve URL for PDP ${pdpName}`);
    return false;
  }

  log(`Authorizer: ${pdpName} hosted at ${pdpBaseUrl}`);
  const endpoint = req.routeKey.split(' ');
  const method = endpoint && endpoint.length > 0 && endpoint[0];
  const route = endpoint && endpoint.length > 1 && endpoint[1];
  log(`method: ${method}`);
  log(`route: ${route}`);

  const payload = {
    "subject": {
      "type": "user",
      "id": subjectId
    },
    "action": {
      "name": method
    },
    "resource": {
      "type": "route",
      "id": route
    },
    "context": {
    },
  };
  log(payload);

  try {
    const headers = {
      'content-type': 'application/json',
    };
    if (pdpAuthHeader) {
      headers['authorization'] = pdpAuthHeader;
    }
    const response = await fetch(`${pdpBaseUrl}/access/v1/evaluation`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers
    });
    
    const json = await response.json();
    log(json);
    const decision = json && json.decision;
    log(`decision: ${decision}`);
    return decision;
  } catch (error) {
    console.error(`error: ${error.message}`);
    return false;
  }
}

