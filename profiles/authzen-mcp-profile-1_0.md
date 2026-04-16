---
title: "AuthZen Profile for Model Context Protocol Tool Authorization - Draft 1"
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
 -
    fullname: Alex Olivier
    organization: Cerbos
    email: alex@cerbos.dev

normative:
  RFC2119:
  RFC8174:
  RFC7519:
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
  CEL:
    title: "Common Expression Language"
    target: https://cel.dev/
    author:
      -
        name: Google
    date: 2024

informative:
  RFC8259:
  RFC9396:
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
: The Model Context Protocol, which enables AI agents to integrate with independent services.

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
      "description": "Get current weather information for a location",
      "inputSchema": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "City name or zip code"
          }
        },
        "required": ["location"],
        "x-coaz-mapping": {
          "resource": [{
            "type": "'location'",
            "id": "params.arguments.location"
          }],
          "subject": [{
            "type": "'user'",
            "id": "token.sub"
          }]
        }
      }
    },
    {
      "name": "get_local_weather",
      "title": "Get local area weather",
      "description": "Get weather for the local area",
      "inputSchema": {
        "type": "object",
        "properties": {
          "zip": {
            "type": "string",
            "description": "Zip code"
          }
        },
        "required": ["zip"]
      }
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
an `x-coaz-mapping` field. This field contains a JSON object whose fields are arrays that define how
the tool's input parameters and the caller's access token map to the AuthZen
information model entities: Subject, Action, Resource, and Context.

## Mapping Expressions {#mapping-expressions}

Values within the `x-coaz-mapping` object MAY be dynamically derived from
elements of the tool invocation using Common Expression Language (CEL)
{{CEL}} expressions.

### CEL Input Variables {#cel-input}

Each CEL expression is evaluated with the following input variables:

`params`:
: A map corresponding to the `params` object of the `tools/call` {{MCP}}
  JSON-RPC {{JSONRPC}} request. This includes the `name` of the tool being
  invoked and the `arguments` map containing the caller-supplied values.
  Fields are accessed using standard CEL field or index notation
  (e.g., `params.name`, `params.arguments.id`, or
  `params.arguments["customer-id"]`).

`token`:
: A map corresponding to the complete set of decoded claims of the
  JWT-formatted {{RFC7519}} OAuth access token used to authorize the tool
  call. All claims present in the token are available, including but not
  limited to `sub`, `iss`, `aud`, `exp`, and `client_id`. Claims are
  accessed using standard CEL field or index notation (e.g., `token.sub`,
  `token.aud`, or `token.client_id`).

### CEL Output {#cel-output}

Each CEL expression MUST evaluate to a value. The value MAY be a scalar
(string, number, or boolean), a list, or a map. The resulting value is
used as the field value in the constructed AuthZen request parameter.

Each CEL expression is scoped to a single field within a single element
of a mapping array. The choice between the `evaluation` and `evaluations`
API is determined by the number of elements in the mapping arrays, not by
the type of value a CEL expression returns. See {{processing-rules}} for
the rules governing single-element versus multi-element mappings.

### Non-normative Example {#cel-example}

The following example illustrates how the CEL input variables are populated
from a `tools/call` JSON-RPC request and an access token.

Given the following `tools/call` request:

~~~ json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_customer",
    "arguments": {
      "id": "cust-12345",
      "case": "case-67890"
    }
  }
}
~~~
{: #fig-tools-call title="Example tools/call JSON-RPC request"}

And an access token with the following decoded claims:

~~~ json
{
  "sub": "alice@example.com",
  "client_id": "http://agentprovider.com/agent-app-id",
  "iss": "https://auth.example.com",
  "exp": 1750000000
}
~~~
{: #fig-token-claims title="Example decoded access token claims"}

The PEP populates the CEL input variables as follows:

| CEL Expression | Resolved Value |
|:---|:---|
| `params.name` | `"get_customer"` |
| `params.arguments.id` | `"cust-12345"` |
| `params.arguments.case` | `"case-67890"` |
| `token.sub` | `"alice@example.com"` |
| `token.client_id` | `"http://agentprovider.com/agent-app-id"` |
{: #fig-cel-resolution title="CEL expression resolution"}

### Expression Syntax {#expression-syntax}

Every string value in the `x-coaz-mapping` object is a CEL expression.
Static string values MUST be expressed as CEL string literals by wrapping
them in single quotes (e.g., `'customer'`). A string value that is not a
valid CEL expression MUST cause a mapping error (see {{mapping-errors}}).

## Mapping Object Schema {#mapping-schema}

The `x-coaz-mapping` object MUST contain the following fields:

`subject`:
: REQUIRED. An array of JSON objects describing how to construct the `subject`
  parameter of the AuthZen Access Evaluation API request. At least one field
  of the `subject` MUST be derived from the `token` input variable via a CEL
  expression.

`action`:
: OPTIONAL. An array of JSON objects describing how to construct the `action`
  parameter of the AuthZen Access Evaluation API request. If this field is
  absent, the PEP MUST use a single-element array containing `{"name": "<tool name>"}`, where `<tool name>` is the name of the MCP tool.

`resource`:
: REQUIRED. An array of JSON objects describing how to construct the `resource`
  parameter of the AuthZen Access Evaluation API request. The object MAY
  contain CEL string literals for static values and/or CEL expressions
  referencing tool call parameters and token claims.

`context`:
: REQUIRED. An array of JSON objects describing how to construct the `context`
  parameter of the AuthZen Access Evaluation API request. For autonomous
  agent use cases, the `context` MUST include the identity of the agent.
  At least one field of either the `subject` or the `context` MUST be
  derived from the `token` input variable via a CEL expression.

At least one field across the `subject` and `context` parameters MUST be
derived from the `token` input variable.

## Processing Rules {#processing-rules}
The following rules MUST be used to construct the Authorization API request from the above mapping object:

* If all fields specified in a mapping have arrays with a single element in them, then the `evaluation` API is called.
* If any field has an array with more than one element, then the `evaluations` API is called.
* If the PDP does not support the `evaluations` API and there is at least one field with more than one element in the COAZ mapping, then the PEP MUST give an error when it discovers the tool descriptions. This can be at initialization or in response to the `tools/list` call, depending on when it can access the description.
* All fields with single element arrays are specified outside of the `evaluations` array in the `evaluations` API request.
* If the `action` field is missing, it is assumed to be a single-element array containing `{"name": "<tool name>"}`, where `<tool name>` is the MCP tool name.
* All fields that have more than one element in the array values MUST have the same number of elements. A PEP MUST give an error if this is not the case.
* All fields with more than one element are specified inside the `evaluations` array in the `evaluations` API request. Each successive element of the `evaluations` array contains the successive value from each multi-valued field.

## Schema

The schema of the `x-coaz-mapping` object is as follows:

~~~ json
{
  "type": "object",
  "required": ["subject", "resource", "context"],
  "properties": {
    "subject": {
      "type": "array",
      "description": "Array of subjects requesting access, as defined in {{AUTHZEN}}",
      "items": {
        "type": "object",
        "description": "Subject object as specified in Section 3.2 of {{AUTHZEN}}"
      }
    },
    "action": {
      "type": "array",
      "description": "Array of actions to be performed on the resources (optional)",
      "items": {
        "type": "object",
        "description": "Action object as specified in Section 3.3 of {{AUTHZEN}}"
      }
    },
    "resource": {
      "type": "array",
      "description": "Array of resources to be accessed, as defined in {{AUTHZEN}}",
      "items": {
        "type": "object",
        "description": "Resource object as specified in Section 3.1 of {{AUTHZEN}}"
      }
    },
    "context": {
      "type": "array",
      "description": "Array of contextual information relevant to the authorization decision",
      "items": {
        "type": "object",
        "description": "Context object as specified in Section 3.4 of {{AUTHZEN}}"
      }
    }
  }
}
~~~

## Single-valued Example {#mapping-single-example}

The following is a non-normative example of a complete tool definition with
a COAZ mapping. The example uses the same `tools/call` request and access
token from {{cel-example}}:

Given the following `tools/call` request:

~~~ json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_customer",
    "arguments": {
      "id": "cust-12345",
      "case": "case-67890"
    }
  }
}
~~~
{: #fig-single-tools-call title="Example tools/call request for single-valued mapping"}

And an access token with the following decoded claims:

~~~ json
{
  "sub": "alice@example.com",
  "client_id": "http://agentprovider.com/agent-app-id",
  "iss": "https://auth.example.com",
  "exp": 1750000000
}
~~~
{: #fig-single-token-claims title="Example decoded access token claims for single-valued mapping"}

The tool definition is as follows:

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
            "resource": [{
              "id": "params.arguments.id",
              "type": "'customer'"
            }],
            "subject": [{
              "type": "'user'",
              "id": "token.sub"
            }],
            "context": [{
              "agent": "token.client_id",
              "case": "params.arguments.case"
            }]
          }
        }
      }
    ]
  }
}
~~~
{: #fig-coaz-example title="Example COAZ tool definition with mapping"}

In this example:

- The `resource` is constructed with the `type` set to the CEL string literal
  `'customer'` and the `id` derived from the tool call's `id` argument using
  the CEL expression `params.arguments.id`.

- The `subject` is constructed with the `type` set to the CEL string literal
  `'user'` and the `id` derived from the `sub` claim of the access token
  using `token.sub`.

- The `context` includes the `client_id` claim from the access token
  (`token.client_id`) as the agent identifier, and the `case` argument
  (`params.arguments.case`) from the tool invocation.

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

## Multi-valued Example {#mapping-multi-example}

The following is a non-normative example of a tool that copies an object from
one storage location to another. The operation requires two distinct privileges:
`read` access on the source location and `write` access on the destination
location. These are expressed as two entries in the action and resource arrays of
the x-coaz-mapping object. The `subject` and `context` are the same for both checks and are therefore each a single-element array.

Given the following `tools/call` request:

~~~ json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "copy_object",
    "arguments": {
      "source": "/bucket/reports/q1.pdf",
      "destination": "/bucket/archive/q1.pdf"
    }
  }
}
~~~
{: #fig-multi-tools-call title="Example tools/call request for multi-valued mapping"}

And an access token with the following decoded claims:

~~~ json
{
  "sub": "alice@example.com",
  "client_id": "http://agentprovider.com/agent-app-id",
  "iss": "https://auth.example.com",
  "exp": 1750000000
}
~~~
{: #fig-multi-token-claims title="Example decoded access token claims for multi-valued mapping"}

The tool definition is as follows:

~~~ json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "copy_object",
        "coaz": true,
        "description": "Copy a storage object from one location to another",
        "inputSchema": {
          "type": "object",
          "properties": {
            "source": {
              "type": "string",
              "description": "The source object location"
            },
            "destination": {
              "type": "string",
              "description": "The destination object location"
            }
          },
          "x-coaz-mapping": {
            "action": [
              { "name": "'read'" },
              { "name": "'write'" }
            ],
            "resource": [
              { "type": "'storage_object'", "id": "params.arguments.source" },
              { "type": "'storage_object'", "id": "params.arguments.destination" }
            ],
            "subject": [{
              "type": "'user'",
              "id": "token.sub"
            }],
            "context": [{
              "agent": "token.client_id"
            }]
          }
        }
      }
    ]
  }
}
~~~
{: #fig-coaz-multi-example title="Example COAZ tool definition with multi-valued mapping"}

In this example:

- The `action` array has two elements: `read` for the source and `write` for
  the destination.

- The `resource` array has two elements: the source location and the
  destination location, each taken from the corresponding tool input property.

- The `subject` and `context` arrays each have a single element, as the same
  caller identity and agent context apply to both privilege checks.

Because `action` and `resource` each contain more than one element, the
Processing Rules require the PEP to call the AuthZen Access Evaluations API.
The single-element `subject` and `context` values are placed at the top level
of the request as defaults. The resulting AuthZen Access Evaluations API
request would be:

~~~ json
{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "context": {
    "agent": "http://agentprovider.com/agent-app-id"
  },
  "evaluations": [
    {
      "action": { "name": "read" },
      "resource": { "type": "storage_object", "id": "/bucket/reports/q1.pdf" }
    },
    {
      "action": { "name": "write" },
      "resource": { "type": "storage_object", "id": "/bucket/archive/q1.pdf" }
    }
  ]
}
~~~
{: #fig-authzen-multi-request title="Resulting AuthZen Access Evaluations request for multi-valued mapping"}

## CEL Conditions Example (Non-normative) {#mapping-cel-conditions-example}

The following non-normative example demonstrates the use of CEL conditional
expressions and built-in functions within a COAZ mapping. A `transfer_funds`
tool uses CEL ternary expressions to dynamically derive mapping values based
on the tool call arguments and token claims:

~~~ json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "transfer_funds",
        "coaz": true,
        "description": "Transfer funds between accounts",
        "inputSchema": {
          "type": "object",
          "properties": {
            "from_account": {
              "type": "string",
              "description": "Source account identifier"
            },
            "to_account": {
              "type": "string",
              "description": "Destination account identifier"
            },
            "amount": {
              "type": "number",
              "description": "Transfer amount"
            },
            "currency": {
              "type": "string",
              "description": "Currency code (e.g., USD, EUR)"
            }
          },
          "x-coaz-mapping": {
            "resource": [{
              "type": "'account'",
              "id": "params.arguments.from_account",
              "sensitivity": "params.arguments.amount > 10000 ? 'high' : 'standard'"
            }],
            "action": [{
              "name": "params.arguments.currency == 'USD' ? 'domestic_transfer' : 'international_transfer'"
            }],
            "subject": [{
              "type": "token.roles.exists(r, r == 'treasury') ? 'treasury_user' : 'standard_user'",
              "id": "token.sub"
            }],
            "context": [{
              "agent": "token.client_id",
              "target_account": "params.arguments.to_account"
            }]
          }
        }
      }
    ]
  }
}
~~~
{: #fig-coaz-cel-conditions-example title="Example COAZ tool definition with CEL conditional expressions"}

In this example:

- The `resource.sensitivity` field uses a ternary expression to set the value
  to `"high"` when the transfer amount exceeds 10000, or `"standard"` otherwise.

- The `action.name` field uses a string equality check to distinguish between
  domestic and international transfers based on the currency.

- The `subject.type` field uses the CEL `exists()` macro to check whether the
  token's `roles` claim contains `"treasury"`, setting the subject type
  accordingly.

# PEP Behavior {#pep-behavior}

## Constructing the AuthZen Request

When a COAZ tool is invoked, the PEP MUST:

1. Parse the `x-coaz-mapping` from the tool's `inputSchema`.

2. Evaluate all CEL expressions with the `params` variable populated from the
   `tools/call` JSON-RPC request and the `token` variable populated from the
   decoded access token claims.

3. Construct the AuthZen Access Evaluation or Evaluations API request according to the processing rules described in {{processing-rules}} using the resolved values.

4. Send the request to the configured AuthZen PDP.

## Handling the AuthZen Response

### Evaluation API
If the AuthZen PDP returns a `decision` value of `true` (permit), the PEP
MUST allow the tool call to proceed.

If the AuthZen PDP returns a `decision` value of `false` (deny), the PEP
MUST NOT execute the tool and MUST return a JSON-RPC error response to
the MCP client.

### Evaluations API
If all decisions returned by the PDP have the value `true` (permit), then the PEP MUST allow the tool call to proceed.

If one or more of the decisions returned by the PDP are `false` (deny), then the PEP MUST NOT execute the tool and MUST return a JSON-RPC error response to the MCP client.

# Error Handling {#error-handling}

COAZ error handling follows the MCP {{MCP}} distinction between protocol errors
and tool execution errors. COAZ mapping failures and authorization denials are
protocol errors because they prevent the tool from executing. The PEP MUST
report these as JSON-RPC 2.0 {{JSONRPC}} error responses.

## COAZ Mapping Errors {#mapping-errors}

A COAZ mapping error occurs when the PEP cannot construct a valid AuthZen
request from the `x-coaz-mapping` and the `tools/call` {{MCP}} request. This
includes, but is not limited to:

- A CEL expression references a field that does not exist in the `params` or
  `token` input variables.
- A CEL expression fails to evaluate (e.g., type error, division by zero).
- The `x-coaz-mapping` object is malformed or missing required fields.
- Multi-valued arrays have mismatched element counts (see {{processing-rules}}).

When a mapping error occurs, the PEP MUST NOT execute the tool and MUST return
a JSON-RPC error response using the standard Invalid Params error code:

Error Code:
: `-32602`

Meaning:
: Invalid params. The PEP was unable to construct a valid AuthZen request from
  the COAZ mapping and the tool call parameters.

The `message` field SHOULD describe the specific mapping failure to aid
debugging.

The following is a non-normative example of a mapping error response:

~~~ json
{
  "jsonrpc": "2.0",
  "id": 456,
  "error": {
    "code": -32602,
    "message": "COAZ mapping error: CEL expression 'params.arguments.region' failed: no such key 'region' in params.arguments"
  }
}
~~~
{: #fig-mapping-error-response title="Example JSON-RPC error response for COAZ mapping failure"}

## Authorization Denial {#authorization-denial}

When the PEP receives a deny decision from the AuthZen PDP, it MUST respond
to the MCP client with a JSON-RPC error response.

This specification defines the following error code for authorization failures:

Error Code:
: `-32401`

Meaning:
: Unauthorized. The authorization check performed by the AuthZen PDP resulted
  in a deny decision for the requested tool invocation.

The `message` field of the JSON-RPC error object MAY be populated from the
`context.reason` field of {{AUTHZEN}} Access Evaluation API response, if
present.

The following is a non-normative example of an authorization denial response:

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

## PDP Communication Errors {#pdp-errors}

If the PEP is unable to reach the AuthZen PDP or receives an invalid response,
the PEP MUST NOT execute the tool and MUST return a JSON-RPC error response
using the standard Internal Error code:

Error Code:
: `-32603`

Meaning:
: Internal error. The PEP was unable to complete the authorization check due to
  a communication failure with the AuthZen PDP.

The following is a non-normative example of a PDP communication error response:

~~~ json
{
  "jsonrpc": "2.0",
  "id": 101,
  "error": {
    "code": -32603,
    "message": "Authorization service unavailable"
  }
}
~~~
{: #fig-pdp-error-response title="Example JSON-RPC error response for PDP communication failure"}

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

The access token referenced by the `token` CEL input variable MUST be
validated by the PEP before extracting claims for the AuthZen request. The PEP MUST verify the token
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

## Deployment Coverage

Implementors SHOULD ensure that at least one COAZ-aware PEP in the
deployment path evaluates the `x-coaz-mapping` for each tool invocation.
If no PEP in the request path processes the mapping, no AuthZen
authorization occurs and access control falls back to whatever other
mechanisms are in place (e.g., OAuth scopes). Deployment architectures
SHOULD be validated to confirm that COAZ mappings are consumed by an
appropriate enforcement point.

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
