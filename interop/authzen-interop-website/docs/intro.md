---
sidebar_position: 1
---

# Introduction

The [OpenID AuthZEN working group](https://openid.net/wg/authzen) has defined a set of interop scenarios. These all are layered around a Todo application as a Policy Enforcement Point.

:::tip New in December 2025!
For the seventh AuthZEN interop event at Gartner IAM Summit in Grapevine (Dec 8 2025), we have added various [Identity Providers](#architecture) as Policy Enforcement Points.
:::

## What you'll find here

* Interop [scenarios](/docs/category/scenarios) for various drafts of the AuthZEN 1.0 authorization API
* Specifications for the [payloads](/docs/scenarios/todo-1.1) and expected responses 
* Interoperability [results](#results-summary) for the vendors that have participated in the interop testing

## Interop video

The following video demonstrates the Todo interop scenario and the structure of the demo application.

<iframe width="560" height="315" src="https://www.youtube.com/embed/OtwEUeYDwBo?si=rDcpicU6m9QpAjD9" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Architecture

AuthZEN is built around a defense-in-depth approach to IAM:
* coarse-grained authorization can be performed during authentication, with the IdP functioning as a policy enforcement point
* medium-grained authorization can be enforced by API gateways, performing functional authorization at the HTTP route level
* the relying party (in our case, a Todo app) is the final enforcement point, performing fine-grained authorization at the Todo level

![enforcement points](/img/enforcement-points.png)

## Interoperability events

The AuthZEN working group sponsored seven formal interoperability events since June 2024, focusing on various scenarios:

| Scenario          | Event                   | Draft | Endpoints                 |
| ----------------- | ----------------------- | ----- | ------------------------- |
| App Code          | Identiverse 2024        | 00    | `/evaluation`             |
| App Code          | EIC 2024                | 01    | `/evaluation`             |
| App Code          | Authenticate 2024       | 02    | + `/evaluations`          |
| App Code          | Gartner IAM US 2024     | 02    | + `/evaluations`          |
| API Gateway       | Gartner IAM London 2025 | 02    | + `/evaluations`          |
| Search            | Identiverse 2025        | 03    | `/search`, `/.well-known` |
| Identity Provider | Gartner IAM US 2025     | 04    | `/search`                 |

## Results summary

### Policy Decision Points

#### Todo (App Code & API Gateway `evaluation` / `evaluations` API) scenarios

Policy Decision Points that participated in the various App Code and [API Gateway](/docs/scenarios/api-gateway/) scenarios.

| Implementation       | [Todo PEP 00](/docs/scenarios/todo/)                          | [Todo PEP 01](/docs/scenarios/todo-1.0-id)                           | [Todo PEP 02](/docs/scenarios/todo-1.1/)                          | [Gateway PEP 02](/docs/scenarios/api-gateway/)                         |
| -------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Aserto               | ✅ [Results](/docs/scenarios/todo/results/aserto)             | ✅ [Results](/docs/scenarios/todo-1.0-id/results/aserto)             | ✅ [Results](/docs/scenarios/todo-1.1/results/aserto)             | ✅ [Results](/docs/scenarios/api-gateway/results/aserto)               |
| Axiomatics           | ✅ [Results](/docs/scenarios/todo/results/axiomatics)         | ✅ [Results](/docs/scenarios/todo-1.0-id/results/axiomatics)         | ✅ [Results](/docs/scenarios/todo-1.1/results/axiomatics)         | ✅ [Results](/docs/scenarios/api-gateway/results/axiomatics)           |
| Amazon VP            | Did not participate                                           | Did not participate                                                  | ✅ [Results](/docs/scenarios/todo-1.1/results/avp)                | ✅ [Results](/docs/scenarios/api-gateway/results/avp)                  |
| Cerbos               | ✅ [Results](/docs/scenarios/todo/results/cerbos)             | ✅ [Results](/docs/scenarios/todo-1.0-id/results/cerbos)             | ✅ [Results](/docs/scenarios/todo-1.1/results/cerbos)             | ✅ [Results](/docs/scenarios/api-gateway/results/cerbos)               |
| EmpowerID            | Did not participate                                           | ✅ [Results](/docs/scenarios/todo-1.0-id/results/empowerid)          | ✅ [Results](/docs/scenarios/todo-1.1/results/empowerid)          | Did not participate                                                    |
| Hexa                 | ✅ [Results](/docs/scenarios/todo/results/hexa)               | ✅ [Results](/docs/scenarios/todo-1.0-id/results/hexa)               | ✅ [Results](/docs/scenarios/todo-1.1/results/hexa)               | ✅ [Results](/docs/scenarios/api-gateway/results/hexa)                 |
| Indykite             | Did not participate                                           | ✅ [Results](/docs/scenarios/todo-1.0-id/results/indykite)           | ✅ [Results](/docs/scenarios/todo-1.1/results/indykite)           | Did not participate                                                    |
| Kogito               | ✅ [Results](/docs/scenarios/todo/results/kogito)             | ✅ [Results](/docs/scenarios/todo-1.0-id/results/kogito)             | ✅ [Results](/docs/scenarios/todo-1.1/results/kogito)             | Did not participate                                                    |
| Open Policy Agent    | ✅ [Results](/docs/scenarios/todo/results/opa)                | ✅ [Results](/docs/scenarios/todo-1.0-id/results/opa)                | ✅ [Results](/docs/scenarios/todo-1.1/results/opa)                | Did not participate                                                    |
| OpenFGA              | Did not participate                                           | Did not participate                                                  | ✅ [Results](/docs/scenarios/todo-1.1/results/openfga)            | ✅ [Results](/docs/scenarios/api-gateway/results/openfga)              |
| Permit               | ✅ [Results](/docs/scenarios/todo/results/permit)             | ✅ [Results](/docs/scenarios/todo-1.0-id/results/permit)             | ✅ [Results](/docs/scenarios/todo-1.1/results/permit)             | Did not participate                                                    |
| Ping Authorize       | Did not participate                                           | ✅ [Results](/docs/scenarios/todo-1.0-id/results/pingid)             | ✅ [Results](/docs/scenarios/todo-1.1/results/pingid)             | ✅ [Results](/docs/scenarios/api-gateway/results/ping)                 |
| PlainID              | ✅ [Results](/docs/scenarios/todo/results/plainid)            | ✅ [Results](/docs/scenarios/todo-1.0-id/results/plainid)            | ✅ [Results](/docs/scenarios/todo-1.1/results/plainid)            | ✅ [Results](/docs/scenarios/api-gateway/results/plainid)              |
| Real Solid Knowledge | ✅ [Results](/docs/scenarios/todo/results/RockSolidKnowledge) | ✅ [Results](/docs/scenarios/todo-1.0-id/results/RockSolidKnowledge) | ✅ [Results](/docs/scenarios/todo-1.1/results/RockSolidKnowledge) | ✅ [Results](/docs/scenarios/api-gateway/results/RockSolidKnowledge)   |
| SGNL                 | ✅ [Results](/docs/scenarios/todo/results/sgnl)               | ✅ [Results](/docs/scenarios/todo-1.0-id/results/SGNL)               | ✅ [Results](/docs/scenarios/todo-1.1/results/SGNL)               | ✅ [Results](/docs/scenarios/api-gateway/results/SGNL)                 |
| Thales               | ✅ [Results](/docs/scenarios/todo/results/authzforce)         | Did not participate                                                  | Did not participate                                               | Did not participate                                                    |
| Topaz                | ✅ [Results](/docs/scenarios/todo/results/topaz)              | ✅ [Results](/docs/scenarios/todo-1.0-id/results/topaz)              | ✅ [Results](/docs/scenarios/todo-1.1/results/topaz)              | ✅ [Results](/docs/scenarios/api-gateway/results/topaz)                |
| WSO2                 | Did not participate                                           | Did not participate                                                  | ✅ [Results](/docs/scenarios/todo-1.1/results/wso2)               | ✅ [Results](/docs/scenarios/api-gateway/results/wso2)                 |
| 3Edges               | ✅ [Results](/docs/scenarios/todo/results/3edges)             | Replaced by Indykite                                                 | Replaced by Indykite                                              | Did not participate                                                    |

#### Search API scenario

Policy Decision Points that participated in the [Search](/docs/scenarios/search/) scenario.

| Implementation              | [Search PEP 03](/docs/scenarios/search/)                      |
| --------------------------- | ------------------------------------------------------------- |
| Apache KIE                  | ✅ [Results](/docs/scenarios/search/results/apachekie)        |
| Axiomatics                  | ✅ [Results](/docs/scenarios/search/results/axiomatics)       |
| Cerbos                      | ✅ [Results](/docs/scenarios/search/results/cerbos)           |
| EmpowerID                   | ✅ [Results](/docs/scenarios/search/results/empowerid)        |
| Indykite                    | ✅ [Results](/docs/scenarios/search/results/indykite)         |
| PingAuthorize (ID Partners) | ✅ [Results](/docs/scenarios/search/results/ping)             |
| PlainID                     | ✅ [Results](/docs/scenarios/search/results/plainid)          |
| Topaz                       | ✅ [Results](/docs/scenarios/search/results/topaz)            |
| WSO2                        | ✅ [Results](/docs/scenarios/search/results/wso2)             |

#### Identity Provider interop scenario (`search` API)

Policy Decision Points that participated in the [IdP](/docs/scenarios/idp/) scenario.

| Implementation              | [IdP PEP 04](/docs/scenarios/idp/)                         |
| --------------------------- | ---------------------------------------------------------- |
| Apache KIE                  | ✅ [Results](/docs/scenarios/idp/results/apachekie)        |
| Axiomatics                  | ✅ [Results](/docs/scenarios/idp/results/axiomatics)       |
| Cerbos                      | ✅ [Results](/docs/scenarios/idp/results/cerbos)           |
| EmpowerID                   | ✅ [Results](/docs/scenarios/idp/results/empowerid)        |
| PingAuthorize (ID Partners) | ✅ [Results](/docs/scenarios/idp/results/ping)             |
| PlainID                     | ✅ [Results](/docs/scenarios/idp/results/plainid)          |
| SGNL                        | ✅ [Results](/docs/scenarios/idp/results/SGNL)             |
| Topaz                       | ✅ [Results](/docs/scenarios/idp/results/topaz)            |
| WSO2                        | ✅ [Results](/docs/scenarios/idp/results/wso2)             |

### API Gateways

API Gateways that participated in the [Gateway](/docs/scenarios/api-gateway/) scenario.

| Implementation       | Hosted at                                                     |
| -------------------- | ------------------------------------------------------------- |
| AWS API Gateway      | https://aws-gateway.authzen-interop.net                       |
| Envoy                | https://authzen-envoy-proxy-demo.cerbos.dev                   |
| Kong                 | https://plainid-kong-gw.se-plainid.com                        |
| Tyk                  | https://tyk-authzen-interop.do.poc.tyk.technology             |
| Layer7               | https://authzen-interop-gw.layer7.broadcom.com                |
| WSO2                 | https://authzen-interop-demo.wso2.com/api/identity            |
| Zuplo                | https://authzen-todo-main-4df5ceb.d2.zuplo.dev                |

### Identity Providers 

Identity Providers that support the [IdP](/docs/scenarios/idp/) scenario.

| Implementation              | Hosted at                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| Auth0                       | https://authzen-idp-demo.eu.auth0.com                                          |
| Curity                      | https://login-demo.curity.io/                                                  |
| Duende                      | https://demo-authzen-idsrv.duendesoftware.com                                  |
| EmpowerID                   | https://idp.authzen-demo.eidlabs.net                                           |
| Gluu / Janssen              | https://test-jans5.gluu.info/                                                  |
| Keycloak                    | https://kc-interop-authzen.happyisland-d2af5d5e.westus2.azurecontainerapps.io/ |
| Ping Federate (ID Partners) | https://pingfed.idpartners.au/                                                 |
| PingOne (ID Partners)       | https://apps.pingone.asia/709b8f55-bc83-48ae-b965-89f616b7d124                 |