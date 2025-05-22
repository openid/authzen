import { HttpProblems, ZuploContext, ZuploRequest, environment } from "@zuplo/runtime"

const pdps = {
  "Aserto": "https://topaz-gateway.authzen-interop.net",
  "AVP": "https://authzen-avp.interop-it.org",
  "Axiomatics": "https://pdp.alfa.guide",
  "Cerbos": "https://authzen-proxy-demo.cerbos.dev",
  "HexaOPA": "https://interop.authzen.hexaorchestration.org",
  "OpenFGA": "https://authzen-interop.openfga.dev/stores/01JNW1803442023HVDKV03FB3A",
  "PingAuthorize": "https://authzen.idpartners.au",
  "PlainID": "https://authzeninteropt.se-plainid.com",
  "Rock Solid Knowledge": "https://authzen.identityserver.com",
  "SGNL": "https://authzen.sgnlapis.cloud",
  "Topaz": "https://topaz-gateway.authzen-interop.net",
  "WSO2": "https://authzen-interop-demo.wso2.com/api/identity"
}
const { AUTHZEN_PDP_API_KEYS } = environment
const apiKeys = (AUTHZEN_PDP_API_KEYS && JSON.parse(AUTHZEN_PDP_API_KEYS)) ?? {}

export default async function policy(
  request: ZuploRequest,
  context: ZuploContext,
) {

  if (!request.user) {
    context.log.error(
      "User is not authenticated. An authentication policy must come before the authorization policy.",
    )
    return HttpProblems.unauthorized(request, context)
  }

  const authzenRequest = JSON.stringify({
    "subject": {
      "type": "identity",
      "id": request.user.sub
    },
    "resource": {
      "type": "route",
      "id": context.route.path
    },
    "action": {
      "name": request.method,
    },
  })

  const gatewayPdp = request.headers.get("X_AUTHZEN_GATEWAY_PDP")
  if (!gatewayPdp) {
    context.log.error("GATEWAY PDP URL is missing in the request headers.")
    return HttpProblems.forbidden(request, context)
  }
  const pdpUrl = pdps[gatewayPdp]
  if (!pdpUrl) {
    context.log.error("PDP is not in certified PDP list.")
  }
  const gatewayPdpUrl = `${pdpUrl}/access/v1/evaluation`

  try {
    context.log.info(`Sending request to ${gatewayPdp} at ${gatewayPdpUrl}`)
    context.log.debug(`AuthZEN request: ${authzenRequest}`)

    const apiKey = apiKeys[gatewayPdp]
    const headers = {
      "content-type": "application/json",
    }
    if (apiKey) {
      headers["Authorization"] = apiKey
    }

    const authzenResponse = await fetch(gatewayPdpUrl, { 
      headers,
      method: 'POST',
      body: authzenRequest
    })
    const response = await authzenResponse.json()
    context.log.debug(`AuthZEN response: ${JSON.stringify(response)}`)

    if (response && response.decision) {
      return request
    }
    context.log.error(
      `The user '${request.user.sub}' is not authorized to perform this action.`,
    )
    return HttpProblems.forbidden(request, context);
  } catch (e) {
    context.log.error(
      `AuthZEN authorization error. The user '${request.user.sub}' is not authorized to perform this action.`,
    )
    return HttpProblems.forbidden(request, context)
  }
}
