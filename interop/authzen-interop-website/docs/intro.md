---
sidebar_position: 1
---

# Introduction

The [OpenID AuthZEN working group](https://openid.net/wg/authzen) has defined a set of interop scenarios. These all are layered around a Todo application as a Policy Enforcement Point.

:::tip New in February 2025!
For the fourth AuthZEN interop event at Gartner IAM Summit in London (March 25 2025), we have added various [API Gateways](#architecture) as Policy Enforcement Points.
:::

## What you'll find here

* Interop [scenarios](/docs/category/scenarios) for various drafts of the AuthZEN 1.0 authorization API
* Specifications for the [payloads](/docs/scenarios/todo-1.1) and expected responses 
* Interoperability [results](#results-summary) for the vendors that have participated in the interop testing

## Interop video

The following video demonstrates the Todo interop scenario and the structure of the demo application.

<iframe width="560" height="315" src="https://www.youtube.com/embed/OtwEUeYDwBo?si=rDcpicU6m9QpAjD9" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Architecture

The latest scenario defines a defense-in-depth architecture, consisting of API gateways as an initial policy enforcement point performing functional / medium-grained authorization at the HTTP route level, and the relying party (Todo app) as another enforcement point, performing fine-grained authorization at the Todo level.

![enforcement points](/img/enforcement-points.png)

## Results summary

### Policy Decision Points

| Implementation       | [Todo PEP 00](/docs/scenarios/todo/)                          | [Todo PEP 01](/docs/scenarios/todo-1.0-id)                           | [Todo PEP 02](/docs/scenarios/todo-1.1/)                          | [Gateway PEP 02](/docs/scenarios/api-gateway/)              |
| -------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| Aserto               | ✅ [Results](/docs/scenarios/todo/results/aserto)             | ✅ [Results](/docs/scenarios/todo-1.0-id/results/aserto)             | ✅ [Results](/docs/scenarios/todo-1.1/results/aserto)             | ✅ [Results](/docs/scenarios/api-gateway/results/aserto)     |
| Axiomatics           | ✅ [Results](/docs/scenarios/todo/results/axiomatics)         | ✅ [Results](/docs/scenarios/todo-1.0-id/results/axiomatics)         | ✅ [Results](/docs/scenarios/todo-1.1/results/axiomatics)         | ✅ [Results](/docs/scenarios/api-gateway/results/axiomatics) |
| Cerbos               | ✅ [Results](/docs/scenarios/todo/results/cerbos)             | ✅ [Results](/docs/scenarios/todo-1.0-id/results/cerbos)             | ✅ [Results](/docs/scenarios/todo-1.1/results/cerbos)             | ✅ [Results](/docs/scenarios/api-gateway/results/cerbos)     |
| EmpowerID            | Did not participate                                           | ✅ [Results](/docs/scenarios/todo-1.0-id/results/empowerid)          | ✅ [Results](/docs/scenarios/todo-1.1/results/empowerid)          |    |
| Hexa                 | ✅ [Results](/docs/scenarios/todo/results/hexa)               | ✅ [Results](/docs/scenarios/todo-1.0-id/results/hexa)               | ✅ [Results](/docs/scenarios/todo-1.1/results/hexa)               |    |
| Indykite             | Did not participate                                           | ✅ [Results](/docs/scenarios/todo-1.0-id/results/indykite)           | ✅ [Results](/docs/scenarios/todo-1.1/results/indykite)           |    |
| Kogito               | ✅ [Results](/docs/scenarios/todo/results/kogito)             | ✅ [Results](/docs/scenarios/todo-1.0-id/results/kogito)             | ✅ [Results](/docs/scenarios/todo-1.1/results/kogito)             |    |
| Open Policy Agent    | ✅ [Results](/docs/scenarios/todo/results/opa)                | ✅ [Results](/docs/scenarios/todo-1.0-id/results/opa)                | ✅ [Results](/docs/scenarios/todo-1.1/results/opa)                |    |
| Permit               | ✅ [Results](/docs/scenarios/todo/results/permit)             | ✅ [Results](/docs/scenarios/todo-1.0-id/results/permit)             | ✅ [Results](/docs/scenarios/todo-1.1/results/permit)             |    |
| Ping Authorize       | Did not participate                                           | ✅ [Results](/docs/scenarios/todo-1.0-id/results/pingid)             | ✅ [Results](/docs/scenarios/todo-1.1/results/pingid)             |    |
| PlainID              | ✅ [Results](/docs/scenarios/todo/results/plainid)            | ✅ [Results](/docs/scenarios/todo-1.0-id/results/plainid)            | ✅ [Results](/docs/scenarios/todo-1.1/results/plainid)            | ✅ [Results](/docs/scenarios/api-gateway/results/plainid)     |
| Real Solid Knowledge | ✅ [Results](/docs/scenarios/todo/results/RockSolidKnowledge) | ✅ [Results](/docs/scenarios/todo-1.0-id/results/RockSolidKnowledge) | Did not participate                                               | ✅ [Results](/docs/scenarios/api-gateway/results/RockSolidKnowledge)   |
| SGNL                 | ✅ [Results](/docs/scenarios/todo/results/sgnl)               | ✅ [Results](/docs/scenarios/todo-1.0-id/results/SGNL)               | ✅ [Results](/docs/scenarios/todo-1.1/results/SGNL)               |    |  |
| Thales               | ✅ [Results](/docs/scenarios/todo/results/authzforce)         | Did not participate                                                  | Did not participate                                               |    |  |
| Topaz                | ✅ [Results](/docs/scenarios/todo/results/topaz)              | ✅ [Results](/docs/scenarios/todo-1.0-id/results/topaz)              | ✅ [Results](/docs/scenarios/todo-1.1/results/topaz)              |    |  |
| 3Edges               | ✅ [Results](/docs/scenarios/todo/results/3edges)             | Replaced by Indykite                                                 | Replaced by Indykite                                              |    |  |

### API Gateways

API Gateways that support the [Gateway scenario](/docs/scenarios/api-gateway/).

| Implementation       | Hosted at                                                     |
| -------------------- | ------------------------------------------------------------- |
| AWS API Gateway      | https://aws-gateway.authzen-interop.net                       |
| Envoy                | https://authzen-envoy-proxy-demo.cerbos.dev                   |
| Kong                 | https://plainid-kong-gw.se-plainid.com                        |
| Tyk                  | https://tyk-authzen-interop.do.poc.tyk.technology             |
| Zuplo                | https://authzen-todo-main-4df5ceb.d2.zuplo.dev                |