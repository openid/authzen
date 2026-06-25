---
title: "COAZ Profile for the Model Context Protocol - Draft 1"
abbrev: "coaz-mcp"
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
  COAZFW:
    title: "COAZ: A Framework for Mapping Information Models to AuthZEN Authorization Requests"
    target: https://openid.net/specs/authzen-coaz-framework-1_0.html
    author:
      -
        name: Atul Tulshibagwale
        org: SGNL
      -
        name: Alex Olivier
        org: Cerbos
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
  RFC8707:
  OAUTH21:
    title: "The OAuth 2.1 Authorization Framework"
    target: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12
    date: 2024

--- abstract

This specification is a COAZ profile, as defined by the COAZ framework
{{COAZFW}}, for the Model Context Protocol (MCP) {{MCP}}. It defines how MCP
JSON-RPC messages are mapped into requests to the OpenID AuthZEN Authorization
API {{AUTHZEN}}, enabling MCP gateways and servers to perform fine-grained,
parameter-level authorization through an AuthZEN Policy Decision Point (PDP).
The profile defines a fixed *default mapping* for each MCP method, so that all
MCP messages can be authorized without per-operation configuration, and allows
MCP servers to override the default for a specific tool by *declaring* a mapping
in the tool's input schema using Common Expression Language (CEL) {{CEL}}. It
also defines how an MCP server advertises declared mappings so that clients can
understand how authorization will be performed.

--- middle

# Introduction

The Model Context Protocol {{MCP}} enables AI agents (MCP clients) to discover
and invoke capabilities offered by MCP servers — tools, resources, prompts, and
more — over JSON-RPC {{JSONRPC}}. Authorization in MCP relies on OAuth 2.1
{{OAUTH21}}, but OAuth alone leaves some concerns unaddressed:

- The OAuth access token is issued to the agent, which may act autonomously on
  behalf of a human user who is not present, or with a human in the loop. There
  is no standard mechanism to capture, per request, the identity of the user on
  whose behalf the agent acts as distinct from the agent itself.

- The access token may carry scopes, but the resources a given call is actually
  permitted to touch depend on the user and on dynamic, fine-grained policy that
  scopes cannot express.

The OpenID AuthZEN Authorization API {{AUTHZEN}} provides standardized,
fine-grained authorization using the Subject-Action-Resource-Context (SARC)
model. The COAZ framework {{COAZFW}} defines, in a protocol-neutral way, how to
project the information model of a protocol into an AuthZEN Access Evaluations
request. This document is the COAZ *profile* for MCP: it binds that framework to
MCP's information model.

This profile authorizes **all** MCP messages, not only tool invocations. It does
so by defining a fixed default mapping for each MCP method ({{default-mappings}}),
which a PEP applies unless an MCP server has declared a more specific mapping for
a particular tool ({{declared-mappings}}).

## Requirements Notation and Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 {{RFC2119}} {{RFC8174}}
when, and only when, they appear in all capitals, as shown here.

## Terminology

This specification uses the terms defined in the COAZ framework {{COAZFW}} —
notably *profile*, *information model*, *input variable*, *mapping*, *literal*,
*expression*, *default mapping*, *declared mapping*, *PEP*, and *PDP* — and adds
the following:

MCP Client:
: An AI agent or application that connects to MCP servers and invokes their
  capabilities. The MCP Client acts as the caller.

MCP Server:
: A service that exposes tools, resources, and prompts to MCP clients via the
  Model Context Protocol.

MCP Gateway:
: An intermediary between an MCP client and one or more MCP servers. A gateway
  MAY act as the PEP on behalf of the MCP server.

Tool:
: A callable capability exposed by an MCP server, described by a name,
  description, and input schema.

COAZ:
: Compatible with OpenID AuthZEN (pronounced "cozy"). The framework {{COAZFW}}
  of which this document is a profile.

# Relationship to the COAZ Framework {#framework-conformance}

This profile fulfils the COAZ framework conformance requirements ({{COAZFW}},
Section 6) as summarized below; each row is specified in the referenced section.

| Framework requirement | This profile |
|:---|:---|
| Information model | `params`, `token` ({{information-model}}) |
| Mapping location | `x-authzen-mapping` in a tool's `inputSchema`; otherwise the default mapping ({{declared-mappings}}, {{default-mappings}}) |
| Literal/expression discriminator | bare value = literal; `$`-prefixed string = CEL expression; `$$` escape ({{expressions}}) |
| Expression language | Common Expression Language {{CEL}} ({{expressions}}) |
| Operations in scope | All MCP methods, per the default mapping table; pass-through set listed ({{default-mappings}}) |
| Default mapping behavior | Per-method default mapping table ({{default-mappings}}) |
| Declared mapping behavior | MCP server MAY declare a mapping for a tool; overrides that tool's default ({{declared-mappings}}) |
| Trust-anchored fields | `subject.id`, enforced by verification against `$token.sub` ({{declared-mappings}}) |
| Error transport | JSON-RPC 2.0 error responses ({{error-handling}}) |
| Discoverability | Declared mappings advertised in the `tools/list` response ({{declaring-support}}) |

## Architecture

The response to `tools/list` carries each tool's `inputSchema`, and, for tools
that declare a mapping, the `x-authzen-mapping` within it. Carrying the mapping in
`tools/list` makes it available to the MCP client, so that the client (or the
LLM driving it) can shape tool arguments appropriately.

When an MCP message is processed, a PEP — an MCP gateway or the MCP server
itself — selects the applicable mapping (declared, if present for the tool;
otherwise the default mapping for the method), constructs an AuthZEN Access
Evaluations request, and calls the PDP before allowing the message to take
effect.

~~~ ascii-art
+-------------+      +-------------+        +-------------+      +-------------+
| MCP Client  |      | MCP Gateway |        | MCP Server  |      | AuthZen PDP |
+-------------+      +-------------+        +-------------+      +-------------+
       |                    |                      |                    |
       |  1. tools/list     |    1. tools/list     |                    |
       +------------------->+--------------------->+                    |
       |                    |  tools incl. any     |                    |
       |  tools incl. any   |  x-authzen-mapping   |                    |
       |  x-authzen-mapping +<---------------------+                    |
       +<-------------------+                      |                    |
       |                    |                      |                    |
       |  2. MCP request    |   3. authorize       |                    |
       +------------------->+----------------------+------------------->|
       |                    |                      |   permit / deny    |
       |                    +<---------------------+--------------------+
       |                    |  4. forward request  |                    |
       |                    +--------------------->|  (5. server MAY    |
       |                    |                      |   re-authorize)    |
       |                    |   6. response        |                    |
       |  6. response       +<---------------------+                    |
       +<-------------------+                      |                    |
       v                    v                      v                    v
~~~
{: #fig-coaz-architecture title="COAZ enforcement for MCP messages"}

Steps 3 and 5 are alternatives. If a gateway acts as the PEP it calls the PDP;
otherwise the server does. It is possible, but redundant, for both to call the
PDP.

# Information Model {#information-model}

This profile exposes two input variables to expressions:

`params`:
: A map corresponding to the `params` object of the MCP JSON-RPC request being
  authorized. For `tools/call` this includes `name` (the tool name) and
  `arguments` (the caller-supplied values); for other methods it contains that
  method's parameters as defined by {{MCP}}. Fields are accessed using standard
  CEL field or index notation (e.g., `params.name`, `params.arguments.id`,
  `params.uri`, or `params.arguments["customer-id"]`).

`token`:
: A map corresponding to the complete set of decoded claims of the JWT-formatted
  {{RFC7519}} OAuth access token used to authorize the request. All claims are
  available, including but not limited to `sub`, `iss`, `aud`, `exp`, and
  `client_id`. Claims are accessed using standard CEL field or index notation
  (e.g., `token.sub`, `token.aud`, `token.client_id`).

## The Subject-Identity Claim {#subject-identity-claim}

The AuthZEN `subject` identifies the principal on whose behalf authorization is
requested. Throughout this profile, `subject.id` is derived from a single token
claim, the **subject-identity claim**, which by convention is `sub` — hence the
expression `$token.sub` used in the mappings below.

Where an access token is issued with the agent as the principal (so `sub`
identifies the *agent*, not the human user on whose behalf it acts), a deployment
MAY designate a different claim — an on-behalf-of claim — as the subject-identity
claim, so that `subject.id` carries the human user. When a deployment designates
an on-behalf-of claim `C`, every use of `$token.sub` as `subject.id` in this
profile (in default mappings, in declared mappings, and in the verification of
{{declared-mappings}}) is read as `$token.C`. The agent identity remains in
`context.agent` (typically `$token.?client_id`) regardless. The designated claim
MUST be agreed between the PEP and the token issuer; absent any designation, the
subject-identity claim is `sub`.

# Expressions and Literals {#expressions}

This profile uses Common Expression Language {{CEL}} as its expression language,
and distinguishes literals from expressions syntactically:

- A string value that begins with a `$` is a **CEL expression**. The text
  following the `$` is the CEL expression, evaluated against the `params` and
  `token` input variables (e.g., `$token.sub`, `$params.arguments.id`,
  `$params.arguments.amount > 10000 ? 'high' : 'standard'`). Within the
  expression, ordinary CEL syntax applies, including CEL's own single-quoted
  string literals.

- Any other value is a **literal**, used verbatim (e.g., the string `customer`,
  the number `10`, the boolean `true`).

- To express a literal string that begins with a `$`, the leading `$` is doubled.
  `$$50` denotes the literal string `$50`; `$$` denotes the literal string `$`.
  Doubling applies only to a leading `$`.

A CEL expression MUST evaluate to a single JSON value — a scalar, list, or map —
as required by the COAZ expression contract ({{COAZFW}}, Section 3.5). A list or
map returned by an expression is a single field value and does not, by itself,
produce multiple evaluations.

CEL field selection on a missing key is an error. To populate an OPTIONAL field
from a claim or parameter that may be absent, an expression MUST use CEL optional
selection (the `.?` operator, e.g. `$token.?client_id`); an expression that
yields an absent optional causes its field to be omitted from the request, as
defined by the COAZ expression contract. An expression that errors, or that
yields absent or null for a REQUIRED field (`subject`, `action`, or `resource`),
is a mapping error ({{mapping-errors}}). Because evaluating CEL requires a CEL
evaluator, there is no expression-free conformance level for this profile.

The following example illustrates how the input variables are populated. Given
the `tools/call` request:

~~~ json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_customer",
    "arguments": { "id": "cust-12345", "case": "case-67890" }
  }
}
~~~
{: #fig-tools-call title="Example tools/call JSON-RPC request"}

and an access token with decoded claims:

~~~ json
{
  "sub": "alice@example.com",
  "client_id": "http://agentprovider.com/agent-app-id",
  "iss": "https://auth.example.com",
  "aud": "https://mcp.example.com",
  "exp": 1750000000
}
~~~
{: #fig-token-claims title="Example decoded access token claims"}

expressions resolve as follows:

| Expression | Resolved value |
|:---|:---|
| `$params.name` | `"get_customer"` |
| `$params.arguments.id` | `"cust-12345"` |
| `$token.sub` | `"alice@example.com"` |
| `$token.?client_id` | `"http://agentprovider.com/agent-app-id"` |
| `customer` | `"customer"` (literal) |
{: #fig-cel-resolution title="Expression and literal resolution"}

# Declaring a Mapping {#declaring-support}

An MCP server declares a mapping for a tool by including an `x-authzen-mapping`
object within that tool's `inputSchema` in the `tools/list` response. The
presence of `x-authzen-mapping` indicates the tool carries a declared mapping;
its absence means the default mapping for `tools/call` applies. No separate
marker field is used.

Because the declared mapping is carried in the `tools/list` response, it is
available to the MCP client, satisfying the framework's discoverability
capability. When MCP Server Cards become available, `x-authzen-mapping` SHOULD
also be included there.

The following non-normative example shows a `tools/list` response with one tool
that declares a mapping and one that does not:

~~~ json
{
  "tools": [
    {
      "name": "get_customer",
      "description": "Get customer details",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id":   { "type": "string", "description": "The customer identifier" },
          "case": { "type": "string", "description": "The case being worked on" }
        },
        "required": ["id"],
        "x-authzen-mapping": {
          "subject": { "type": "identity", "id": "$token.sub" },
          "context": { "agent": "$token.?client_id", "case": "$params.arguments.case" },
          "evaluations": [
            { "action": { "name": "get_customer" },
              "resource": { "type": "customer", "id": "$params.arguments.id" } }
          ]
        }
      }
    },
    {
      "name": "get_local_weather",
      "description": "Get weather for the local area",
      "inputSchema": {
        "type": "object",
        "properties": { "zip": { "type": "string", "description": "Zip code" } },
        "required": ["zip"]
      }
    }
  ]
}
~~~
{: #fig-tools-list title="Example tools/list response with a declared mapping"}

`get_customer` declares a mapping; `get_local_weather` does not and is therefore
authorized by the default `tools/call` mapping ({{default-mappings}}).

# Default Mappings {#default-mappings}

This profile defines a default mapping for each MCP method. A PEP MUST apply the
default mapping for a method unless a declared mapping applies to the specific
operation ({{declared-mappings}}).

Every default mapping shares the following top-level defaults, which establish
the subject (the user on whose behalf the agent acts) and the agent context:

~~~ json
{
  "subject": { "type": "identity", "id": "$token.sub" },
  "context": { "agent": "$token.?client_id" },
  "evaluations": [ { "...": "per-method action and resource" } ]
}
~~~
{: #fig-default-envelope title="Shared default-mapping envelope"}

For methods that target the MCP server as a whole rather than a specific item,
`resource.id` identifies this MCP server. MCP requires access tokens to be
audience-bound to the target server via resource indicators {{RFC8707}}, so the
server identity is carried in the `aud` claim. The default mappings express this
as `$token.aud`, with the following normative resolution: `resource.id` MUST be a
single string identifying this server. When `aud` is a single string, that value
is used directly. When `aud` is an array (as permitted by {{RFC7519}}), the PEP
MUST select the single member that identifies this server (its own resource
identifier per {{RFC8707}}) and use that value; `resource.id` MUST NOT be set to
an array. If the PEP cannot resolve `aud` to exactly one server-identifying
value, it is a mapping error ({{mapping-errors}}). A PEP that knows its own
resource identifier from configuration MAY use it directly instead of deriving
it from `aud`.

The default mappings are:

## Lifecycle

~~~ jsonc
// initialize
{ "subject": { "type": "identity", "id": "$token.sub" },
  "context": { "agent": "$token.?client_id", "protocol_version": "$params.protocolVersion" },
  "evaluations": [ { "action": { "name": "initialize" },
    "resource": { "type": "mcp_server", "id": "$token.aud" } } ] }
~~~

`ping` is a pass-through operation: the PEP MUST NOT call the PDP and MUST allow
it to proceed.

## Tools

~~~ jsonc
// tools/list
{ "subject": { "type": "identity", "id": "$token.sub" },
  "context": { "agent": "$token.?client_id" },
  "evaluations": [ { "action": { "name": "tools/list" },
    "resource": { "type": "mcp_server", "id": "$token.aud" } } ] }

// tools/call  (applies when the tool declares no mapping)
{ "subject": { "type": "identity", "id": "$token.sub" },
  "context": { "agent": "$token.?client_id" },
  "evaluations": [ { "action": { "name": "$params.name" },
    "resource": { "type": "tool", "id": "$params.name" } } ] }
~~~

## Resources

~~~ jsonc
// resources/list
{ "subject": { "type": "identity", "id": "$token.sub" },
  "context": { "agent": "$token.?client_id" },
  "evaluations": [ { "action": { "name": "resources/list" },
    "resource": { "type": "mcp_server", "id": "$token.aud" } } ] }

// resources/read   (resources/subscribe and resources/unsubscribe use the
//                   same shape; only action.name differs)
{ "subject": { "type": "identity", "id": "$token.sub" },
  "context": { "agent": "$token.?client_id" },
  "evaluations": [ { "action": { "name": "resources/read" },
    "resource": { "type": "resource", "id": "$params.uri" } } ] }
~~~

## Prompts

~~~ jsonc
// prompts/list
{ "subject": { "type": "identity", "id": "$token.sub" },
  "context": { "agent": "$token.?client_id" },
  "evaluations": [ { "action": { "name": "prompts/list" },
    "resource": { "type": "mcp_server", "id": "$token.aud" } } ] }

// prompts/get
{ "subject": { "type": "identity", "id": "$token.sub" },
  "context": { "agent": "$token.?client_id" },
  "evaluations": [ { "action": { "name": "prompts/get" },
    "resource": { "type": "prompt", "id": "$params.name" } } ] }
~~~

## Completion

~~~ jsonc
// completion/complete
{ "subject": { "type": "identity", "id": "$token.sub" },
  "context": { "agent": "$token.?client_id" },
  "evaluations": [ {
    "action": { "name": "completion/complete" },
    "resource": {
      "type": "$params.ref.type == 'ref/prompt' ? 'prompt' : 'resource'",
      "id":   "$params.ref.type == 'ref/prompt' ? $params.ref.name : $params.ref.uri" } } ] }
~~~

## Logging

~~~ jsonc
// logging/setLevel
{ "subject": { "type": "identity", "id": "$token.sub" },
  "context": { "agent": "$token.?client_id", "level": "$params.level" },
  "evaluations": [ { "action": { "name": "logging/setLevel" },
    "resource": { "type": "mcp_server", "id": "$token.aud" } } ] }
~~~

## Tasks

~~~ jsonc
// tasks/get   (tasks/result and tasks/cancel use the same shape; only
//              action.name differs)
{ "subject": { "type": "identity", "id": "$token.sub" },
  "context": { "agent": "$token.?client_id" },
  "evaluations": [ { "action": { "name": "tasks/get" },
    "resource": { "type": "task", "id": "$params.taskId" } } ] }

// tasks/list
{ "subject": { "type": "identity", "id": "$token.sub" },
  "context": { "agent": "$token.?client_id" },
  "evaluations": [ { "action": { "name": "tasks/list" },
    "resource": { "type": "mcp_server", "id": "$token.aud" } } ] }
~~~

## Pass-through Operations

The following are pass-through: the PEP MUST NOT call the PDP for them and MUST
allow them to proceed. They are listed explicitly so that the absence of a
mapping is never interpreted as a deny.

- `ping`
- all notifications (`notifications/*`), which carry no `id` and expect no
  response.

## Unknown Methods

A request whose `method` has neither a default mapping defined by this profile
nor an applicable declared mapping, and that is not in the pass-through set
above, MUST be denied: the PEP MUST NOT allow it to proceed and MUST return an
authorization denial ({{authorization-denial}}). This ensures that methods
introduced by future MCP versions or extensions fail closed rather than bypassing
authorization. The pass-through set is the only set of methods that proceed
without a PDP decision.

## Server-initiated Requests

The MCP requests `sampling/createMessage`, `elicitation/create`, and
`roots/list` are initiated by the server toward the client. The PEP model in
this profile authorizes client-to-server requests using the client's access
token, which is not the appropriate identity for server-initiated requests.
Authorization of server-initiated requests is therefore out of scope for this
version of the profile.

# Declared Mappings {#declared-mappings}

An MCP server MAY declare a mapping for a tool by including `x-authzen-mapping` in
the tool's `inputSchema` ({{declaring-support}}). A declared mapping has the same
shape as a default mapping — an AuthZEN Access Evaluations request template — and
uses the same expression and literal rules ({{expressions}}).

A declared mapping for a tool **overrides the default `tools/call` mapping for
that tool only**. It does not affect the default mapping for any other method or
for `tools/call` of any other tool.

The subject identifier (`subject.id`) is a trust-anchored field ({{COAZFW}},
Section 3.8), enforced by verification. A declared mapping MUST include a
top-level `subject` whose `id` is set to an expression resolving to the
subject-identity claim ({{subject-identity-claim}}) — that is, `$token.sub` (or
`$token.C` where an on-behalf-of claim `C` is designated). The PEP MUST verify
that the resolved `subject.id` equals the value of the subject-identity claim in
the validated access token; if it does not, or if `subject` or `subject.id` is
absent, the PEP MUST treat the request as a mapping error ({{mapping-errors}}).
This keeps the identifier explicit in the mapping while preventing an MCP server
— the party being authorized — from asserting the identity of a different
subject.

To close off identity smuggling, a declared mapping MUST NOT set `subject` within
any entry of the `evaluations` array; the single top-level `subject` applies to
all evaluations. A PEP MUST reject a declared mapping that places `subject` inside
an `evaluations` entry as a mapping error.

A declared mapping MAY otherwise shape the top-level `subject`: it MAY set
`subject.type` and additional subject attributes (under `properties`, per
{{AUTHZEN}}), so that different invocations can produce different subject objects.
If a declared mapping omits `subject.type`, the PEP MUST supply `identity`. Any
subject attribute other than `subject.id` — including `subject.type` — is
untrusted input, exactly like declared `action`, `resource`, and `context`
attributes; only the verified `subject.id` is trustworthy as the authenticated
identity. See {{security-considerations}}.

For autonomous-agent use cases the `context` MUST include the agent identity
(typically `$token.?client_id`).

## Single-evaluation Example

The declared mapping for `get_customer` in {{fig-tools-list}}, applied to the
request and token in {{fig-tools-call}} and {{fig-token-claims}}, produces:

~~~ json
{
  "subject": { "type": "identity", "id": "alice@example.com" },
  "context": { "agent": "http://agentprovider.com/agent-app-id", "case": "case-67890" },
  "evaluations": [
    { "action": { "name": "get_customer" },
      "resource": { "type": "customer", "id": "cust-12345" } }
  ]
}
~~~
{: #fig-authzen-single title="Resulting Access Evaluations request (single evaluation)"}

## Multi-evaluation Example

A tool that copies an object requires two checks: `read` on the source and
`write` on the destination. These are two entries in the `evaluations` array; the
shared `subject` and `context` remain at the top level. As in every declared
mapping, `subject.id` is set to `$token.sub` and verified by the PEP.

~~~ json
{
  "name": "copy_object",
  "description": "Copy a storage object from one location to another",
  "inputSchema": {
    "type": "object",
    "properties": {
      "source":      { "type": "string", "description": "Source object location" },
      "destination": { "type": "string", "description": "Destination object location" }
    },
    "required": ["source", "destination"],
    "x-authzen-mapping": {
      "subject": { "type": "identity", "id": "$token.sub" },
      "context": { "agent": "$token.?client_id" },
      "evaluations": [
        { "action": { "name": "read" },
          "resource": { "type": "storage_object", "id": "$params.arguments.source" } },
        { "action": { "name": "write" },
          "resource": { "type": "storage_object", "id": "$params.arguments.destination" } }
      ]
    }
  }
}
~~~
{: #fig-coaz-multi title="Declared mapping with multiple evaluations"}

For a `tools/call` to `copy_object` with arguments
`{"source": "/bucket/reports/q1.pdf", "destination": "/bucket/archive/q1.pdf"}`,
the resulting request is:

~~~ json
{
  "subject": { "type": "identity", "id": "alice@example.com" },
  "context": { "agent": "http://agentprovider.com/agent-app-id" },
  "evaluations": [
    { "action": { "name": "read" },
      "resource": { "type": "storage_object", "id": "/bucket/reports/q1.pdf" } },
    { "action": { "name": "write" },
      "resource": { "type": "storage_object", "id": "/bucket/archive/q1.pdf" } }
  ]
}
~~~
{: #fig-authzen-multi title="Resulting Access Evaluations request (multiple evaluations)"}

## Conditional Expression Example

CEL conditionals and built-ins MAY be used in any expression. A `transfer_funds`
tool derives values from arguments and token claims, including a `subject.type`
that varies with the caller's roles. The mapping sets `subject.id` to `$token.sub`,
which the PEP verifies against the token ({{declared-mappings}}). Because the
declared `subject.type` is untrusted, a policy that grants elevated access MUST do
so on the basis of the verified `subject.id`, not the declared `subject.type`:

~~~ json
{
  "name": "transfer_funds",
  "description": "Transfer funds between accounts",
  "inputSchema": {
    "type": "object",
    "properties": {
      "from_account": { "type": "string" },
      "to_account":   { "type": "string" },
      "amount":       { "type": "number" },
      "currency":     { "type": "string" }
    },
    "required": ["from_account", "to_account", "amount", "currency"],
    "x-authzen-mapping": {
      "subject": {
        "type": "$token.roles.exists(r, r == 'treasury') ? 'treasury_user' : 'standard_user'",
        "id": "$token.sub"
      },
      "context": { "agent": "$token.?client_id", "target_account": "$params.arguments.to_account" },
      "evaluations": [
        {
          "action": { "name": "$params.arguments.currency == 'USD' ? 'domestic_transfer' : 'international_transfer'" },
          "resource": {
            "type": "account",
            "id": "$params.arguments.from_account",
            "properties": {
              "sensitivity": "$params.arguments.amount > 10000 ? 'high' : 'standard'"
            }
          }
        }
      ]
    }
  }
}
~~~
{: #fig-coaz-conditions title="Declared mapping using CEL conditional expressions"}

# PEP Behavior {#pep-behavior}

When an MCP message is processed, the PEP MUST:

1. Determine the JSON-RPC `method`. If it is a pass-through operation
   ({{default-mappings}}), allow it without calling the PDP.

2. Select the applicable mapping: for a `tools/call` whose tool declares an
   `x-authzen-mapping`, use the declared mapping; otherwise use the default mapping
   for the method. A method that is neither in the pass-through set nor has a
   mapping MUST be denied ({{default-mappings}}).

3. Populate `params` from the request's `params` object and `token` from the
   decoded, validated access token claims.

4. Resolve the mapping: literals verbatim, `$`-prefixed values by evaluating the
   CEL expression ({{expressions}}).

5. Verify the subject identity: the effective `subject.id` of every evaluation in
   the constructed request — the top-level subject, and after any override the
   subject of each `evaluations` entry — MUST equal the value of the
   subject-identity claim ({{subject-identity-claim}}) in the validated access
   token. A declared mapping MUST NOT carry a per-evaluation `subject`
   ({{declared-mappings}}). If any effective `subject.id` does not match, or a
   per-evaluation `subject` is present in a declared mapping, treat the request as
   a mapping error ({{mapping-errors}}) and do not call the PDP.

6. Construct the AuthZEN Access Evaluations request from the resolved mapping and
   send it to the configured PDP. This profile always uses the Access Evaluations
   API; the PDP MUST support it.

7. Enforce the response: if every decision is `true` (permit), allow the message
   to proceed; if any decision is `false` (deny), do not allow it and return a
   JSON-RPC error ({{authorization-denial}}).

# Error Handling {#error-handling}

This profile reports the COAZ error categories ({{COAZFW}}, Section 4) as
JSON-RPC 2.0 {{JSONRPC}} error responses. In every case the PEP MUST NOT allow
the message to proceed. As required by {{JSONRPC}}, the `id` of each error
response MUST equal the `id` of the request that caused it, or be `null` if the
request `id` could not be determined.

## Mapping Errors {#mapping-errors}

A mapping error occurs when the PEP cannot construct a valid AuthZEN request —
for example, an expression references a missing field, an expression fails to
evaluate, or the mapping is malformed. The PEP MUST return error code `-32602`
(Invalid params). The `message` SHOULD describe the failure.

~~~ json
{
  "jsonrpc": "2.0",
  "id": 456,
  "error": {
    "code": -32602,
    "message": "COAZ mapping error: expression '$params.arguments.region' failed: no such key 'region'"
  }
}
~~~
{: #fig-mapping-error title="JSON-RPC error response for a mapping failure"}

## Authorization Denial {#authorization-denial}

When one or more decisions are deny, the PEP MUST return an error response with
code `-32001`. This code is drawn from the JSON-RPC 2.0 {{JSONRPC}} range
reserved for implementation-defined server errors (`-32000` to `-32099`); a
code outside that range, such as `-32401`, is non-conformant with {{JSONRPC}}
and MUST NOT be used. The `message` MAY be populated from an implementation-
defined reason conveyed in the decision `context` of the {{AUTHZEN}} response;
note that {{AUTHZEN}} does not define a standard key for this, so the PEP MUST
NOT assume a specific field name.

~~~ json
{
  "jsonrpc": "2.0",
  "id": 789,
  "error": {
    "code": -32001,
    "message": "Access denied: insufficient permissions for customer record"
  }
}
~~~
{: #fig-denial-error title="JSON-RPC error response for an authorization denial"}

Implementations MAY alternatively surface an authorization denial as a tool
result with `isError` set to `true`, where the MCP message and deployment make
that distinction meaningful; the choice between a protocol-level error and a
tool-level error result is left to the implementation.

## PDP Communication Errors {#pdp-errors}

If the PEP cannot reach the PDP or receives an invalid response, it MUST return
error code `-32603` (Internal error).

~~~ json
{
  "jsonrpc": "2.0",
  "id": 101,
  "error": { "code": -32603, "message": "Authorization service unavailable" }
}
~~~
{: #fig-pdp-error title="JSON-RPC error response for a PDP communication failure"}

# Security Considerations

## Token Integrity

The access token referenced by the `token` input variable MUST be validated by
the PEP before its claims are used. The PEP MUST verify the token signature,
issuer, audience, and expiration in accordance with {{RFC7519}} and the OAuth
framework in use. Because default mappings for server-scoped operations use the
`aud` claim as the resource identifier, correct audience validation and
resource-indicator binding {{RFC8707}} are essential.

## Zero-Trust for AI Agents

This profile represents the human user as the AuthZEN Subject and the AI agent
as part of the Context. This separation lets policies evaluate the trust level of
the user and the agent independently, supporting zero-trust architectures for AI
agent interactions.

## Subject Identity

The subject identifier (`subject.id`) is trust-anchored: every mapping sets it to
`$token.sub`, and the PEP verifies that the resolved value equals the subject of
the validated access token, rejecting any mismatch ({{declared-mappings}}). This
is essential where the PEP is an MCP gateway and the declared mapping is authored
by the MCP server: without this check, the server — the party being authorized —
could assert the identity of any principal and obtain a decision for a user the
caller never authenticated as. The verification keeps the identifier explicit in
the mapping while binding it to the authenticated identity.

## Untrusted Declared-Mapping Attributes

A declared mapping is supplied by the MCP server, which is the party whose
operation is being authorized. Every attribute it produces — `action`,
`resource`, `context`, and all subject attributes other than the verified
`subject.id`, including `subject.type` — is untrusted input to the PDP. PDP
policies MUST NOT treat an attribute that originates from a declared mapping as
authoritative for identity or privilege; for example, a policy MUST NOT grant
access on the basis of a `subject.type` or `context` attribute that the mapping
could freely set. The trustworthy authorization inputs are the verified
`subject.id` and any attributes the PDP itself obtains from trusted sources.

## Mapping Integrity

A declared mapping is supplied by the MCP server. A PEP SHOULD validate that a
declared mapping is well-formed and that its expressions reference only defined
properties, and MUST verify the trust-anchored `subject.id` ({{declared-mappings}}),
before relying on it. The trust placed in the server as the author of declared
mappings MUST be considered in the deployment's threat model.

## Fail-Closed Enforcement

As required by the framework, the PEP MUST fail closed: a mapping error, a
denial, or a PDP communication failure all result in the message being refused.

## Transport Security

All communication between the PEP and the PDP MUST use TLS, as specified in the
transport requirements of {{AUTHZEN}}.

## Deployment Coverage

Implementers SHOULD ensure that at least one COAZ-aware PEP in the deployment
path authorizes each in-scope MCP message. If no PEP processes the mapping, no
AuthZEN authorization occurs and access control falls back to other mechanisms.

# IANA Considerations

This document has no IANA actions.

--- back

# Relationship to Other Specifications

## COAZ Framework

This document is a profile of the COAZ framework {{COAZFW}}. The framework
defines the protocol-neutral model — mappings shaped as AuthZEN Access
Evaluations requests, the literal/expression distinction, the expression
contract, and the conformance requirements. This profile binds that model to
MCP's information model and JSON-RPC transport.

## OpenID AuthZEN Authorization API

The constructed request and the decision response are defined by {{AUTHZEN}}.
This profile uses the Access Evaluations API exclusively.

## Model Context Protocol

This profile extends the MCP {{MCP}} tool schema with the `x-authzen-mapping`
extension to `inputSchema`. It is backward compatible: servers and clients that
do not understand it ignore the field, and the default mappings still allow a
PEP to authorize their messages.

## OAuth 2.1

This profile complements OAuth 2.1 {{OAUTH21}}. OAuth provides authentication and
coarse-grained authorization via scopes; this profile enables fine-grained,
parameter-level decisions that consider the specific resources and context of
each message.

# Acknowledgements

The authors would like to thank Martin Besozzi for the original proposal on
AuthZEN integration for fine-grained authorization in MCP, and the members of
the OpenID AuthZEN Working Group for their ongoing work on the Authorization API
standard.

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
