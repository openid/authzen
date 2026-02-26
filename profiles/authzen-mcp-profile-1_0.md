---
title: "AuthZen Profile for Model Context Protocol Tool Authorization"
abbrev: "coaz"
category: std
date: 2026-02-13
ipr: none

docname: authzen-mcp-profile-1_0
consensus: true
workgroup: OpenID AuthZEN
keyword:
 - authorization
 - MCP
 - AuthZen
 - fine-grained authorization
 - AI agents

stand_alone: true
smart_quotes: no
pi: [toc, sortrefs, symrefs, private]

author:
 -
    fullname: Atul Tulshibagwale
    organization: SGNL
    email: atul@sgnl.ai

normative:
  RFC2119:
  RFC8174:
  RFC6749:
  RFC9110:
  RFC6901:
  AUTHZEN:
    title: "Authorization API 1.0"
    target: https://openid.net/specs/authorization-api-1_0.html
    author:
      -
        name: Omri Gazitt
        org: Aserto
      -
        name: David Brossard
        org: Axiomatics
      -
        name: Atul Tulshibagwale
        org: SGNL
    date: 2026
  MCP:
    title: "Model Context Protocol Specification"
    target: https://spec.modelcontextprotocol.io/
    author:
      -
        name: Anthropic
    date: 2025
  JSONRPC:
    title: "JSON-RPC 2.0 Specification"
    target: https://www.jsonrpc.org/specification
    date: 2013

informative:
  RFC8259:
  RFC9396:
  RFC7519:
  OAUTH21:
    title: "The OAuth 2.1 Authorization Framework"
    target: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12
    date: 2024

--- abstract

This specification defines a profile of the OpenID AuthZen Authorization API for use with the Model Context Protocol (MCP). It introduces COAZ (Compatible
with OpenID AuthZen), a standardized mapping from MCP tool definitions and
their invocation parameters to the AuthZen Subject-Action-Resource-Context
(SARC) model. This enables MCP gateways and servers to perform
fine-grained, parameter-level authorization checks via an AuthZen Policy
Decision Point (PDP) before executing MCP tools. It also helps MCP Clients understand how authorization will be performed by the server, so that it can provide appropriate parameters to the MCP server tools it invokes.

--- middle

# Introduction

The Model Context Protocol {{MCP}} enables AI agents (MCP clients) to discover
and invoke tools offered by MCP servers. Tools are described in the response
to the `tools/list` method, where each tool definition includes an `inputSchema` field
containing a JSON Schema object that describes the required input parameters.
MCP clients invoke tools by providing arguments conforming to this schema.

Authorization in MCP relies on OAuth 2.1 {{OAUTH21}}. However, OAuth alone
leaves some concerns unaddressed:

- The OAuth access token is issued to the agent, which may be acting either
  autonomously on behalf of a human user who might not be present, or with a
  "human user in the loop". If the token is issued with the agent identity as
  the principal, there is no standard mechanism to capture the identity of the
  user on whose behalf the tool is being invoked.

- The OAuth access token may carry scopes that limit what the agent can do.
  However, depending on the user on whose behalf the agent is acting and what
  that user is currently authorized to access, the actual set of permitted
  resources in a specific call may be further constrained. Scopes alone cannot
  express this.

The OpenID AuthZen Authorization API {{AUTHZEN}} provides a standardized
interface for dynamic, fine-grained authorization decisions using the
Subject-Action-Resource-Context (SARC) model. This specification defines a
profile of AuthZen for MCP tool invocations, enabling MCP participants to
leverage AuthZen PDPs for access control decisions that go beyond what OAuth
alone can express.

## Requirements Notation and Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 {{RFC2119}} {{RFC8174}}
when, and only when, they appear in all capitals, as shown here.

## Terminology

This specification uses the following terms:

MCP:
: The Model Context Protocol, which enables AI agents integrate with independent services.

MCP Client:
: An AI agent or application that connects to MCP servers and invokes tools.
  The MCP Client acts as the caller in MCP.

MCP Server:
: A service that exposes tools, resources, and prompts to MCP clients via
  the Model Context Protocol.

MCP Gateway:
: An intermediary that sits between an MCP client and one or more MCP
  servers. A gateway MAY perform authorization checks on behalf of the
  MCP server.

Tool:
: A callable function exposed by an MCP server, described by a name,
  description, and input schema.

PDP:
: Policy Decision Point, as defined in {{AUTHZEN}}. A service that evaluates
  authorization requests and returns access decisions.

PEP:
: Policy Enforcement Point, as defined in {{AUTHZEN}}. In the context of this specification, the PEP
  is typically the MCP gateway or MCP server that calls the AuthZen PDP and enforces
  the resulting decision.

COAZ:
: Compatible with OpenID AuthZen (pronounced "cozy"). A marker indicating that an MCP tool
  supports the AuthZen mapping defined in this specification.

# Authorization Requirements for MCP Tools

In order to achieve dynamic, fine-grained authorization for MCP tool
invocations, the following capabilities are needed beyond what OAuth provides:

1. Verification of both the agent identity and the user identity on whose
   behalf the agent is acting, for each tool call the agent makes.

2. Determination of the specific resources that each tool call operates on.

3. Capture of additional context relevant to each tool call, such as tool specific parameters.

The AuthZen API is designed to provide exactly this kind of dynamic,
fine-grained authorization, but it requires specific parameters structured
according to its information model. The purpose of this profile is therefore
to:

- Declare whether a given MCP tool is AuthZen compatible, and

- If a tool is AuthZen compatible, define how its input parameters and
  session tokens map to the AuthZen SARC model.

## Architecture

The response to the `tools/list` call of MCP has the `inputSchema` in it. The `inputSchema` declares whether the tool is COAZ or not.

If a tool is COAZ, then the `inputSchema` includes a mapping of how the tool parameters are mapped to the AuthZen PDP.

By including it in the response of the `tools/list` call, the COAZ mapping is made available to the MCP Client. This is so that the LLM (or the MCP Client) can determine the values for the tool parameters appropriately when calling the tool.

The authorization flow proceeds as follows: When the tool is called, a PEP (either an MCP gateway or the MCP
server itself) calls the AuthZen PDP. The PEP uses the mapping defined in this
specification to construct the AuthZen request parameters from the tool call
arguments and the associated access token.

It is also possible for the MCP client to call the AuthZen PDP before making
the tool call. However, since the MCP client may not be trusted by the MCP
server, this does not preclude the MCP server from performing its own
authorization check.

The architecture is described below:

~~~ ascii-art

+-------------+        +-------------+           +-------------+       +-------------+
|             |        |             |           |             |       |             |
| MCP Client  |        | MCP Gateway |           | MCP Server  |       | AuthZen PDP |
|             |        |             |           |             |       |             |
+-------------+        +-------------+           +-------------+       +-------------+
       |                      |                         |                     |
       |     1. List Tools    |                         |                     |
       |                      |                         |                     |
       +--------------------->|      1. List Tools      |                     |
       |                      |                         |                     |
       |                      |------------------------>|                     |
       |                      |                         |                     |
       |                      |                         |                     |
       |                      |                         |                     |
       |                      |<------------------------+                     |
       |                      |   Tools list including  |                     |
       |<---------------------+       COAZ mapping      |                     |
       | Tools list including |                         |                     |
       |     COAZ mapping     |                         |                     |
       |                      |                         |                     |
       |                      |                         |                     |
       |     2. Tool call     |                         |                     |
       |                      |                         |      3. Verify      |
       +--------------------->|                         |     permissions     |
       |                      |                         |                     |
       |                      +-------------------------+-------------------->|
       |                      |                         |                     |
       |                      |                         |                     |
       |                      <-------------------------+---------------------+
       |                      |                         |    Permit tool      |
       |                      |                         |                     |
       |                      |                         |                     |
       |                      |       4. Tool call      |                     |
       |                      |                         |                     |
       |                      |------------------------>|                     |
       |                      |                         |      5. Verify      |
       |                      |                         |     permissions     |
       |                      |                         |                     |
       |                      |                         +-------------------->|
       |                      |                         |                     |
       |                      |                         |                     |
       |                      |                         |<--------------------+
       |                      |<------------------------+    Permit tool      |
       |                      |                         |                     |
       |<---------------------+    6. Tool response     |                     |
       |                      |                         |                     |
       |   6. Tool response   |                         |                     |
       |                      |                         |                     |
       v                      v                         v                     v
+-------------+        +-------------+           +-------------+       +-------------+
|             |        |             |           |             |       |             |
| MCP Client  |        | MCP Gateway |           | MCP Server  |       | AuthZen PDP |
|             |        |             |           |             |       |             |
+-------------+        +-------------+           +-------------+       +-------------+
~~~
 {: #fig-coaz-architecture title="COAZ Architecture"}


 In the above diagram, the arrows 3 and 5 are alternatives to each other. If a Gateway exists, then it calls the AuthZen PDP, but if it doesn't exist, then the Server calls the AuthZen PDP. It is possible, but redundant for both these components to call the AuthZen PDP.


# Declaring AuthZen Compatibility {#declaring-support}

MCP servers advertise that specific tools support AuthZen-based authorization
by including a field named `coaz` in the tool object returned in the response
to the `tools/list` method. The value of this field MUST be the boolean value
`true` to indicate support for AuthZen.

When MCP Server Cards become available, this field SHOULD also be included in the
tool object within the server card.

The following is a non-normative example of a `tools/list` response containing
both a COAZ-compatible tool and a non-compatible tool:

~~~ json
{
  "tools": [
    {
      "name": "get_weather",
      "coaz": true,
      "title": "Weather Information Provider",
      // more response fields.
    },
    {
      "name": "get_local_weather",
      "title": "Get local area weather",
      // more response fields, not including a "coaz" field.
    }
  ]
}
~~~
{: #fig-tools-list title="Example tools/list response with COAZ declaration"}

In this example, the `get_weather` tool is AuthZen compatible because it
includes the `coaz` field set to `true`. The `get_local_weather` tool is not
AuthZen compatible because it does not include a `coaz` field.

# The COAZ Mapping {#coaz-mapping}

## Overview

For COAZ tools, the `inputSchema` object MUST include
an `x-coaz-mapping` field. This field contains a JSON object that defines how
the tool's input parameters and the caller's access token map to the AuthZen
information model entities: Subject, Action, Resource, and Context.

## Mapping Variables {#mapping-variables}

Values within the `x-coaz-mapping` object MAY reference elements from the
tool invocation using the following variables:

`$properties`:
: Refers to the `properties` field of the `inputSchema` of the tool object.
  Individual properties within this variable are referenced using JSON
  Pointer {{RFC6901}} notation adapted for JSONPath.

`$token`:
: Refers to the JWT-formatted {{RFC7519}} OAuth access token used to authorize
  the tool call. Claims within the token are referenced using JSONPath
  notation.

Fields within these variables MUST be referred to using JSONPath expressions.

## Mapping Object Schema {#mapping-schema}

The `x-coaz-mapping` object MUST contain the following fields:

`resource`:
: REQUIRED. A JSON object describing how to construct the `resource`
  parameter of the AuthZen Access Evaluation API request. The object MAY
  contain static values and/or JSONPath references to tool input properties
  and token claims.

`subject`:
: REQUIRED. A JSON object describing how to construct the `subject`
  parameter of the AuthZen Access Evaluation API request. At least one field
  of the `subject` MUST be derived from the `$.token` variable.

`context`:
: REQUIRED. A JSON object describing how to construct the `context`
  parameter of the AuthZen Access Evaluation API request. For autonomous
  agent use cases, the `context` MUST include the identity of the agent.
  At least one field of either the `subject` or the `context` MUST be
  derived from the `$.token` variable.

`action`:
: OPTIONAL. A JSON object describing how to construct the `action`
  parameter of the AuthZen Access Evaluation API request. If this field is
  absent, the PEP MUST construct an Action object containing a single field
  named `name` whose value is the tool name from the MCP tool definition.

At least one field across the `subject` and `context` parameters MUST be
derived from the `$token` variable.

## Schema

The schema of the `x-coaz-mapping` object is as follows:

~~~ typescript

interface CoazMapping {
  resource: object;
  subject: object;
  context: object;
  action?: object;
}
~~~

## Example {#mapping-example}

The following is a non-normative example of a complete tool definition with
a COAZ mapping:

~~~ json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "get_customer",
        "coaz": true,
        "description": "Get customer details",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "The customer identifier"
            },
            "case": {
              "type": "string",
              "description": "The case being worked on by the agent"
            }
          },
          "x-coaz-mapping": {
            "resource": {
              "id": "$properties['id']",
              "type": "customer"
            },
            "subject": {
              "type": "user",
              "id": "$token['sub']"
            },
            "context": {
              "agent": "$token['client_id']",
              "case": "$properties['case']"
            }
          }
        }
      }
    ]
  }
}
~~~
{: #fig-coaz-example title="Example COAZ tool definition with mapping"}

In this example:

- The `resource` is constructed with a static `type` value of `"customer"` and the `id` taken from the tool's `id`
  input property.

- The `subject` is constructed with a static `type` value of `"user"` and the
  `id` taken from the `sub` claim of the access token.

- The `context` includes the `client_id` claim from the access token as
  the agent identifier, and the `case` input property from the tool
  invocation.

- The `action` is not specified in the mapping, so the PEP constructs it
  as `{"name": "get_customer"}` using the tool name.

The resulting AuthZen Access Evaluation API request would be:

~~~ json
{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "action": {
    "name": "get_customer"
  },
  "resource": {
    "type": "customer",
    "id": "cust-12345"
  },
  "context": {
    "agent": "http://agentprovider.com/agent-app-id",
    "case": "case-67890"
  }
}
~~~
{: #fig-authzen-request title="Resulting AuthZen Access Evaluation request"}

# PEP Behavior {#pep-behavior}

## Constructing the AuthZen Request

When a COAZ tool is invoked, the PEP MUST:

1. Parse the `x-coaz-mapping` from the tool's `inputSchema`.

2. Resolve all JSONPath references against the tool call's input arguments
   (for `$.properties` references) and the access token (for `$.token`
   references).

3. Construct the AuthZen Access Evaluation API request using the resolved
   values.

4. Send the request to the configured AuthZen PDP.

## Handling the AuthZen Response

If the AuthZen PDP returns a `decision` value of `true` (permit), the PEP
MUST allow the tool call to proceed.

If the AuthZen PDP returns a `decision` value of `false` (deny), the PEP
MUST NOT execute the tool and MUST return a JSON-RPC error response to
the MCP client.

# Error Handling {#error-handling}

When the PEP receives a deny decision from the AuthZen PDP, it MUST respond
to the MCP client with a JSON-RPC 2.0 {{JSONRPC}} error response.

This specification defines the following error code for authorization failures
in JSON-RPC:

Error Code:
: `-32401`

Meaning:
: Unauthorized. The authorization check performed by the AuthZen PDP resulted
  in a deny decision for the requested tool invocation.

The `message` field of the JSON-RPC error object MAY be populated from the
`context.reason` field of the AuthZen Access Evaluation API response, if
present.

The following is a non-normative example of an error response:

~~~ json
{
  "jsonrpc": "2.0",
  "id": 789,
  "error": {
    "code": -32401,
    "message": "Access denied: insufficient permissions for customer record"
  }
}
~~~
{: #fig-error-response title="Example JSON-RPC error response for authorization denial"}

# Security Considerations

## Externalized Authorization

This profile promotes the externalization of authorization logic from MCP
tool implementations. By delegating authorization decisions to an AuthZen PDP,
tool developers can separate security logic from business logic, enabling
centralized policy management and consistent enforcement across tools.

## Zero-Trust for AI Agents

A critical security consideration for MCP deployments is the distinction
between the human user (represented as the AuthZen Subject) and the AI agent
(represented in the AuthZen Context). This separation enables policies that
can independently evaluate the trust level of both the user and the agent,
supporting zero-trust architectures for AI agent interactions.

## Token Integrity

The access token referenced by `$token` MUST be validated by the PEP before
extracting claims for the AuthZen request. The PEP MUST verify the token
signature, issuer, audience, and expiration in accordance with {{RFC7519}}
and the OAuth framework in use.

## Transport Security

All communication between the PEP and the AuthZen PDP MUST use TLS as
specified in the transport requirements of {{AUTHZEN}}.

## Mapping Integrity

The `x-coaz-mapping` is provided by the MCP server as part of the tool
definition. MCP clients and gateways that act as PEPs SHOULD validate that
the mapping is well-formed and that all referenced properties exist in the
tool's `inputSchema` before constructing the AuthZen request.

# IANA Considerations

This document has no IANA actions.

--- back

# Relationship to Other Specifications

## OpenID AuthZen Authorization API

This specification is a profile of the OpenID AuthZen Authorization API
{{AUTHZEN}}. It defines a specific usage pattern for the Access Evaluation
API endpoint in the context of MCP tool invocations, including how to
construct the Subject, Action, Resource, and Context parameters from MCP
tool definitions and OAuth access tokens.

## Model Context Protocol

This specification extends the MCP {{MCP}} tool definition schema by
introducing the `coaz` field and the `x-coaz-mapping` extension to the
`inputSchema` object. These extensions are designed to be backward compatible
with existing MCP implementations; servers and clients that do not understand
COAZ will simply ignore these fields.

## OAuth 2.1

This specification complements the OAuth 2.1 {{OAUTH21}} authorization
framework used by MCP. While OAuth provides authentication and coarse-grained
authorization via scopes, this profile enables fine-grained, parameter-level
authorization decisions that consider the specific resources and context of
each tool invocation.

# Design Considerations

## Opt-in Complexity

The COAZ mapping is entirely optional. MCP servers that do not require
fine-grained authorization are not required to implement or understand the
`x-coaz-mapping` schema. This ensures that the profile does not impose
unnecessary complexity on simple deployments.

## Leveraging Standards

Rather than defining an MCP-specific authorization language, this profile
leverages the OpenID AuthZen Authorization API {{AUTHZEN}}, a ratified
standard designed for interoperable authorization. This allows the MCP
ecosystem to remain authorization-implementation neutral by deferring
policy evaluation to external, purpose-built policy engines.

## Declarative Mapping

The `x-coaz-mapping` replaces ad-hoc, implementation-specific authorization
code that developers would otherwise embed in tool handlers. By formalizing
the mapping as a declarative schema, authorization intent becomes
machine-readable and can be processed by gateways and proxies without
requiring knowledge of the tool's internal implementation.

# Acknowledgements

The author would like to thank Martin Besozzi for the original proposal on
OpenID AuthZen integration for fine-grained authorization in MCP, which
inspired the development of this specification. Thanks also to the members
of the OpenID AuthZen Working Group for their ongoing work on the
Authorization API standard.

# Notices

Copyright (c) 2025 The OpenID Foundation.

The OpenID Foundation (OIDF) grants to any Contributor, developer, implementer,
or other interested party a non-exclusive, royalty free, worldwide copyright license to
reproduce, prepare derivative works from, distribute, perform and display, this
Implementers Draft, Final Specification, or Final Specification Incorporating Errata
Corrections solely for the purposes of (i) developing specifications, and (ii)
implementing Implementers Drafts, Final Specifications, and Final Specification
Incorporating Errata Corrections based on such documents, provided that attribution
be made to the OIDF as the source of the material, but that such attribution does not
indicate an endorsement by the OIDF.

The technology described in this specification was made available from contributions
from various sources, including members of the OpenID Foundation and others.
Although the OpenID Foundation has taken steps to help ensure that the technology
is available for distribution, it takes no position regarding the validity or scope of any
intellectual property or other rights that might be claimed to pertain to the
implementation or use of the technology described in this specification or the extent
to which any license under such rights might or might not be available; neither does it
represent that it has made any independent effort to identify any such rights. The
OpenID Foundation and the contributors to this specification make no (and hereby
expressly disclaim any) warranties (express, implied, or otherwise), including implied
warranties of merchantability, non-infringement, fitness for a particular purpose, or
title, related to this specification, and the entire risk as to implementing this
specification is assumed by the implementer. The OpenID Intellectual Property
Rights policy (found at openid.net) requires contributors to offer a patent promise not
to assert certain patent claims against other contributors and against implementers.
OpenID invites any interested party to bring to its attention any copyrights, patents,
patent applications, or other proprietary rights that may cover technology that may be
required to practice this specification.
