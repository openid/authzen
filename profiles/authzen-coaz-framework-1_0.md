---
title: "COAZ: A Framework for Mapping Information Models to AuthZEN Authorization Requests - Draft 1"
abbrev: "coaz-framework"
category: std
date: 2026-02-13
ipr: none

docname: authzen-coaz-framework-1_0
consensus: true
workgroup: OpenID AuthZEN
keyword:
 - authorization
 - AuthZen
 - fine-grained authorization
 - information model mapping
 - policy enforcement

stand_alone: true
smart_quotes: no
pi: [toc, sortrefs, symrefs, private]

author:
-
    fullname: Alex Olivier
    organization: Cerbos
    email: alex@cerbos.dev
-
    fullname: Atul Tulshibagwale
    organization: CrowdStrike
    email: atul.tulshibagwale@crowdstrike.com

normative:
  RFC2119:
  RFC8174:
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
  CEL:
    title: "Common Expression Language"
    target: https://cel.dev/
    author:
      -
        name: Google
    date: 2024

informative:
  RFC8259:
  RFC9110:
  COAZMCP:
    title: "COAZ Profile for Model Context Protocol"
    target: https://openid.net/specs/authzen-mcp-profile-1_0.html
    date: 2026
  MCP:
    title: "Model Context Protocol"
    target: https://modelcontextprotocol.io/specification/2025-11-25
    date: 2025-11-25

  OPENAPI:
    title: "OpenAPI Specification"
    target: https://spec.openapis.org/oas/latest.html
    date: 2024

--- abstract

This specification defines COAZ (Compatible with OpenID AuthZEN, pronounced
"cozy"), a framework for mapping the information model of an arbitrary protocol
or interface into a request to the OpenID AuthZEN Authorization API. COAZ
establishes a single, protocol-neutral model: the inputs of an incoming
operation are projected, through a declarative mapping, into an AuthZEN
Authorization API request — an Access Evaluation request for a single decision,
or an Access Evaluations request for several — expressed using the
Subject-Action-Resource-Context (SARC) model. Mapping values are either literal constants or expressions evaluated
against the operation's inputs, enabling both fixed field-to-field mappings and
dynamic, computed mappings. Expressions are written, by default, in the Common
Expression Language (CEL); a profile MAY designate a different expression
language. This specification does not define a mapping for any
specific protocol; it defines the common model and the conformance contract
that individual COAZ *profiles* fulfil — for example, a profile for the Model
Context Protocol (MCP), for HTTP APIs, or for OpenAPI-described routes.

--- middle

# Introduction

A wide range of systems need to make fine-grained authorization decisions about
operations expressed in some protocol or interface, for example: 

* An HTTP request
* A JSON-RPC message
* An invocation of a tool described by a schema
* A route described by an OpenAPI {{OPENAPI}} document.

The OpenID AuthZEN Authorization API {{AUTHZEN}} provides a standardized,
interoperable way to obtain such decisions using the
Subject-Action-Resource-Context (SARC) model. What it does not define
is how to *derive* an AuthZEN request from the information model of any
particular protocol.

COAZ (Compatible with OpenID AuthZEN) is the framework that fills this gap. It
defines a single, protocol-neutral pattern:

~~~ ascii-art
   an operation in any          a declarative                an AuthZEN
   information model            mapping                      request
  +-------------------+        +-------------------+        +-------------------+
  |  operation inputs |        |   literals  +     |        |  Access           |
  |  (request fields, | -----> |   expressions over| -----> |  Evaluation(s)    |
  |   tokens, schema) |        |   the inputs      |        |  (SARC)           |
  +-------------------+        +-------------------+        +-------------------+
~~~
{: #fig-coaz-spine title="The COAZ model"}

COAZ deliberately separates two concerns:

- The **output** side is fixed. Every COAZ mapping produces a request to the
  AuthZEN Authorization API — an Access Evaluation request for a single decision
  or an Access Evaluations request for several, selected by the mapping's
  envelope ({{mapping}}). The SARC structure, the semantics of defaults and
  overrides, and the decision response all belong to {{AUTHZEN}} and are
  identical for every protocol.

- The **input** side is specialized. The set of available input variables, the
  location where a mapping is stored, and the way errors are reported back to
  the caller all depend on the protocol, and are defined by a COAZ *profile*.
  Expressions over those inputs are written, by default, in Common Expression
  Language {{CEL}} ({{expression-contract}}).

This specification defines the output-side model and the conformance contract that
every profile fulfils. It does not, by itself, define a mapping for any
protocol. Companion profiles — such as the COAZ Profile for the Model Context
Protocol {{COAZMCP}} — bind this framework to a concrete information model.

## Requirements Notation and Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 {{RFC2119}} {{RFC8174}}
when, and only when, they appear in all capitals, as shown here.

## Terminology

This specification uses the following terms:

COAZ:
: Compatible with OpenID AuthZEN (pronounced "cozy"). The framework defined by
  this specification for mapping an information model into an AuthZEN Authorization
  API request.

Profile:
: A specification that binds this framework to a specific protocol or interface
  by fulfilling the conformance requirements of {{conformance}}. Examples
  include profiles for the Model Context Protocol, HTTP APIs, and OpenAPI.

Operation:
: A unit of work in the specific protocol or interface that requires an
  independent authorization decision from the AuthZEN PDP.

Information Model:
: The set of data associated with an operation that a profile makes available
  to a mapping, such as request fields, message parameters, and security
  tokens.

Input Variable:
: A named element of the information model, exposed to expressions by a profile
  (for example, a variable holding a request's parameters or a variable holding
  decoded token claims).

Mapping:
: A declarative description of how to construct an AuthZEN Authorization API
  request from an operation's input variables, consisting of an envelope that
  names the AuthZEN API to call and a template for that API's request body.
  Each value in a mapping is either a literal or an expression.

Envelope:
: The single top-level member of a mapping. Its key names the AuthZEN API
  (`evaluation` or `evaluations`) to which the constructed request is sent, and
  its value is the template for that API's request body. See {{mapping}}.

Literal:
: A value in a mapping that is used verbatim, as a constant, without reference
  to any input variable.

Expression:
: A value in a mapping that is computed by evaluating it, in the profile's
  expression language ({{expression-contract}}), against the operation's input
  variables.

PDP:
: Policy Decision Point, as defined in {{AUTHZEN}}. A service that evaluates
  authorization requests and returns access decisions.

PEP:
: Policy Enforcement Point, as defined in {{AUTHZEN}}. The component that
  constructs the AuthZEN request from a mapping, calls the PDP, and enforces
  the decision.

Default Mapping:
: A mapping defined by a profile that applies to an operation when no other
  mapping has been supplied for it. OPTIONAL; see {{default-declared}}.

Declared Mapping:
: A mapping supplied by an authority that describes an operation (for example,
  a server advertising a mapping for a specific operation). OPTIONAL; see
  {{default-declared}}.

# The COAZ Model {#model}

## Overview

A COAZ mapping is a template, corresponding to a distinct operation, for an
AuthZEN Authorization API request, in which any value MAY be replaced by an
expression over the operation's input variables. To authorize an operation, a
PEP:

1. Populates the input variables defined by the applicable profile from the
   incoming operation (see {{inputs}}).

2. Selects the mapping that applies to the operation (see {{default-declared}}).

3. Resolves every value in the mapping: literals are taken verbatim;
   expressions are evaluated against the input variables (see
   {{literals-expressions}} and {{expression-contract}}).

4. Constructs the AuthZEN request from the resolved values and sends it to the
   API named by the mapping's envelope (see {{construction}}).

5. Enforces the returned decisions.

## Information Model and Input Variables {#inputs}

A profile MUST define the information model it exposes to mappings as a set of
named input variables. Expressions reference these variables by name. The
framework does not mandate any particular variables; naming and contents are
entirely profile-defined. For example, a profile for a request/response
protocol might expose a variable for the request and a variable for the
caller's authorization token.

A profile MUST specify, for each input variable, its name, the source from
which the PEP populates it, and its structure, so that a mapping author knows
exactly which fields an expression can reference and what they will contain.

## The Mapping {#mapping}

A COAZ mapping is a JSON {{RFC8259}} object with exactly one top-level member,
its **envelope**. The envelope's key names the AuthZEN Authorization API to
which the constructed request is sent, and its value is a template shaped
exactly as that API's request body. This framework defines two envelope keys:

`evaluation`:
: The value is a template for an Access Evaluation request as defined in
  Section 6 of {{AUTHZEN}}: a single authorization decision, expressed with
  `subject`, `action`, and `resource` fields and an OPTIONAL `context` field.

`evaluations`:
: The value is a template for an Access Evaluations request as defined in
  Section 7 of {{AUTHZEN}}: one or more authorization decisions, expressed with OPTIONAL
  top-level `subject`, `action`, `resource`, and `context` defaults and an
  `evaluations` array whose entries MAY each contain their own `subject`,
  `action`, `resource`, and `context` fields.

A mapping with no top-level member, more than one top-level member, or an
envelope key not defined by this framework or by the applicable profile is
malformed, and a PEP MUST treat it as a mapping error ({{errors}}). Future
versions of this framework, and individual profiles, MAY define additional
envelope keys corresponding to other AuthZEN APIs; a PEP MUST treat an envelope
key it does not support as a mapping error rather than ignore it.

The framework does not redefine the request structures or their semantics. The
meaning of each field and — for the `evaluations` envelope — the rules by which
per-entry fields override top-level defaults are exactly as defined in
Sections 6 and 7 of {{AUTHZEN}}. In particular, custom attributes of a `subject`, `resource`, or
`action` MUST be nested under that object's `properties` key as defined by
{{AUTHZEN}}, rather than added as sibling keys; `context` is a free-form object
and is the exception. COAZ's primary addition to these structures is that any
leaf value MAY be an expression rather than a literal (a profile MAY also
designate trust-anchored fields; see {{trust-anchored}}).

## Example Mappings {#example-mappings}

This section is non-normative. The examples use an illustrative profile that
exposes two input variables — `request`, holding the operation's parameters,
and `token`, holding the caller's validated token claims — and the framework's
defaults: CEL as the expression language and the leading-`$` discriminator of
{{literals-expressions}}.

An operation requiring a single decision is mapped with the `evaluation`
envelope. Literals (here `identity`, `read`, and `document`) and expressions
appear side by side:

~~~ json
{
  "evaluation": {
    "subject": { "type": "identity", "id": "$token.sub" },
    "action": { "name": "read" },
    "resource": { "type": "document", "id": "$request.document_id" }
  }
}
~~~
{: #fig-example-evaluation title="Mapping using the evaluation envelope"}

An expression can also embed literal text, using the expression language's own
operators rather than any additional mapping syntax. In CEL this is string
concatenation: the value `"$'urn:doc:' + request.document_id"` resolves to the
literal prefix `urn:doc:` followed by the value of `request.document_id`. The
leading `$` marks the whole value as an expression; the embedded literal uses
ordinary CEL single-quoted string syntax.

An operation requiring several decisions — here, a move that must be authorized
as a `read` of the source and a `write` of the destination — is mapped with the
`evaluations` envelope. The two decisions are entries in the `evaluations`
array, and the shared `subject` sits at the top level of the request body,
applying to both per the default semantics of {{AUTHZEN}}:

~~~ json
{
  "evaluations": {
    "subject": { "type": "identity", "id": "$token.sub" },
    "evaluations": [
      { "action": { "name": "read" },
        "resource": { "type": "folder", "id": "$request.source" } },
      { "action": { "name": "write" },
        "resource": { "type": "folder", "id": "$request.destination" } }
    ]
  }
}
~~~
{: #fig-example-evaluations title="Mapping using the evaluations envelope"}

## Literals and Expressions {#literals-expressions}

Every leaf value in a mapping is either a literal or an expression:

- A **literal** is used verbatim as a constant in the constructed request.

- An **expression** is evaluated, in the profile's expression language, against
  the operation's input variables, and its result is used in the constructed
  request.

The default discriminator, which a profile SHOULD use, is the `$` prefix:

- A string value whose first character is `$` is an expression; the text
  following the `$` is the expression itself.

- Any other value — a string not beginning with `$`, or any number, boolean,
  null, list, or map — is a literal.

- A string value beginning with `$$` is a literal whose text begins with `$`:
  the leading `$$` denotes a single literal `$`. Doubling applies only to a
  leading `$`; a `$` anywhere else in a string has no special meaning and does
  not mark an expression.

A profile MAY define a different discriminator where the default conflicts
with its environment. Any discriminator MUST distinguish a literal from an
expression unambiguously for every leaf value, and MUST include an escape
mechanism such that any literal value — including one whose text resembles an
expression — can be represented. The distinction MUST be lossless.

This framework does not use the terms "static" or "dynamic" to describe values.
A field reference such as "the request's path" is an expression, not a literal,
because it is computed from an input variable. Only constants are literals.

## The Expression Contract {#expression-contract}

The default expression language for COAZ is Common Expression Language {{CEL}},
and a profile SHOULD use it, so that mappings look and behave the same across
protocols. A profile MAY designate a different expression language where CEL is
a poor fit for its environment; a profile that does so MUST name the language
it uses. Regardless of the language, every COAZ expression MUST satisfy the
following contract, which is what allows the rest of this framework to remain
language-neutral:

1. An expression is evaluated against the input variables defined by the
   profile, and only those variables.

2. An expression MUST evaluate to a single JSON value — a scalar (string,
   number, boolean, or null), a list, or a map — or to the distinguished value
   **absent**. A value is used as the value of the field in which the expression
   appears; **absent** causes that field to be omitted from the constructed
   request entirely.

A profile MUST specify how an expression yields **absent**, so that mapping
authors can distinguish "field deliberately omitted" from "field present with a
null value." When the expression language is CEL, the default is CEL optional
selection: the `.?` operator yields **absent** when the selected key is
missing, while plain field selection on a missing key is an evaluation error.

The framework relies on {{AUTHZEN}} for which fields are required: `subject`,
`action`, and `resource` are required for every evaluation, and `context` is
optional. If an expression yields **absent** or null for a required field, the
PEP cannot construct a valid request; this is a mapping error (see {{errors}}).

A value that an expression returns is always a single field value, including
when it is a list or a map. Returning a list SHALL NOT cause the request to
fan out into multiple evaluations. The number of decisions requested MUST be
determined solely by the mapping's envelope — one for `evaluation`, and the
number of entries in the `evaluations` array for `evaluations` (see
{{construction}}) — not by the type of a value an expression returns.

## Constructing the AuthZEN Request {#construction}

A PEP MUST construct, from the resolved mapping, the AuthZEN request named by
the mapping's envelope, as defined in {{AUTHZEN}}, and send it to the
corresponding API: the Access Evaluation API for an `evaluation` envelope, or
the Access Evaluations API for an `evaluations` envelope.

A PDP used with COAZ MUST support the Access Evaluation API. Support for the
Access Evaluations API is additionally required wherever mappings use the
`evaluations` envelope. A PEP whose PDP does not support the Access Evaluations
API MAY instead satisfy an `evaluations` mapping by issuing one Access
Evaluation request per entry of the constructed request — applying the
top-level defaults to each entry exactly as {{AUTHZEN}} defines for the Access
Evaluations request — and permitting the operation only if every decision is a
permit.

For an `evaluations` envelope, the top-level and per-entry fields of the
constructed request carry exactly the default and override semantics defined by
{{AUTHZEN}}. COAZ does not define any additional merge behavior.

A profile MUST state which envelope keys it permits ({{conformance}}).

## Default and Declared Mappings {#default-declared}

A profile MAY support either or both of the following sources of mappings. This
capability is OPTIONAL; a profile that supports neither requires every operation
to carry its own mapping by some profile-defined means.

- **Default mappings.** A profile MAY define one or more mappings that apply to
  operations when no declared mapping has been supplied. A profile that defines
  default mappings MUST enumerate the operations in scope and MUST explicitly
  identify any operations that are *not* authorized by COAZ (pass-through
  operations), so that the absence of a mapping is never interpreted as an
  implicit deny.

- **Declared mappings.** A profile MAY allow an authority that describes an
  operation to supply a mapping for it. A profile that supports declared
  mappings MUST define who may author them, where they are carried, and how a
  declared mapping relates to any default mapping for the same operation (for
  example, whether it overrides the default).

As a non-normative illustration, using the same illustrative profile as
{{example-mappings}}: a profile for an HTTP API might define a default mapping
that authorizes any request from its method and path,

~~~ json
{
  "evaluation": {
    "subject": { "type": "identity", "id": "$token.sub" },
    "action": { "name": "$request.method" },
    "resource": { "type": "http_route", "id": "$request.path" }
  }
}
~~~
{: #fig-example-default title="An illustrative default mapping for an HTTP API"}

while allowing the authority that describes a specific route (for example, its
OpenAPI definition) to declare a mapping that overrides the default for that
route with domain-specific semantics:

~~~ json
{
  "evaluation": {
    "subject": { "type": "identity", "id": "$token.sub" },
    "action": { "name": "approve" },
    "resource": { "type": "expense_report", "id": "$request.path_params.report_id" }
  }
}
~~~
{: #fig-example-declared title="An illustrative declared mapping for one route"}

## Trust-Anchored Fields {#trust-anchored}

Inputs to a COAZ mapping are considered to be untrusted, because they may be
provided by the same entity whose operation is being
authorized. Allowing such a mapping to set the fields that establish *identity*
would let the authorized party assert who the subject is, inverting the trust
model.

To prevent this, and to prevent mapping developers from accidentally trusting 
inputs to the mapping, a profile MAY designate certain request fields as
**trust-anchored**: their value MUST be derived from the PEP's trusted inputs
(such as an independently verifiable authorization token), not asserted by a mapping. A trust-anchored
field MAY be as specific as a single identifying attribute — for example, the
subject's identifier — leaving the remaining attributes of the same object
available to a declared mapping. A profile that admits declared mappings from a
party other than the PEP MUST specify which fields are trust-anchored.

A profile MUST require the PEP to enforce each trust-anchored field by one of:

- **Verification.** The mapping sets the field, and the PEP verifies that its
  resolved value matches the corresponding trusted input, treating a mismatch as
  a mapping error. This keeps the field's provenance visible in the mapping.

- **Substitution.** The PEP sets the field from its trusted inputs, ignoring any
  value a declared mapping supplied.

Sibling fields that are not trust-anchored remain available to the mapping. An
attribute does not become trustworthy merely by appearing in the constructed
request: a profile and its deployments MUST treat any attribute that originates
from a declared mapping — including non-trust-anchored attributes of an object
whose identifier is trust-anchored — as untrusted input, and policy MUST NOT rely
on such an attribute as authoritative for identity or privilege.

## Discoverability {#discoverability}

A profile MAY define a mechanism by which a caller can obtain, in advance of
invoking an operation, the mapping that will be applied to it. This enables a
caller to understand how authorization will be performed and to shape its
request accordingly. Discoverability is OPTIONAL and is not always achievable:
some protocols provide no channel through which a mapping can be advertised.
Profiles MUST NOT assume discoverability unless they define a mechanism for it.

# Denials and Errors {#errors}

COAZ defines three categories of outcome in which a PEP refuses an operation.
An authorization denial is not an error: it is the normal course of policy
enforcement. It is categorized alongside the two error categories only because
it shares their consequence — the operation does not proceed. The framework
defines the categories and their meaning; the transport used to report each
category to the caller is profile-defined, because it depends on the protocol.

Mapping Error:
: The PEP cannot construct a valid AuthZEN request from the mapping and the
  operation's inputs — for example, an expression references a non-existent
  field, an expression fails to evaluate, the mapping is malformed, or a
  required field is missing. The PEP MUST NOT permit the operation.

Authorization Denial:
: The PDP returns a deny decision for one or more requested decisions. This is
  the normal operation of policy enforcement, not a fault. The PEP MUST NOT
  permit the operation.

PDP Communication Error:
: The PEP cannot reach the PDP or receives an invalid or unparseable response.
  The PEP MUST NOT permit the operation.

In all three categories the PEP MUST fail closed: the operation MUST NOT proceed
unless an explicit permit decision is obtained for every decision requested by
the constructed request.

# Profile Conformance Requirements {#conformance}

A specification conforms to this framework as a COAZ profile if, and only if, it
specifies all of the following:

1. **Information model.** The named input variables it exposes to expressions,
   and, for each, its source and structure ({{inputs}}).

2. **Mapping location.** Where a mapping is stored or carried for an operation,
   and how the PEP obtains it.

3. **Literal/expression discriminator.** Whether the profile uses the default
   `$` discriminator and `$$` escape of {{literals-expressions}}, or the
   alternative unambiguous syntax and escape mechanism it defines.

4. **Expression language.** The expression language used — CEL {{CEL}} unless
   the profile designates otherwise — satisfying the expression contract of
   {{expression-contract}}.

5. **Envelopes.** The envelope keys it permits in mappings, drawn from those
   defined in {{mapping}} or by the profile itself ({{construction}}).

6. **Operations in scope.** The set of operations the profile authorizes and,
   where a default mapping is provided, the explicit set of pass-through
   operations ({{default-declared}}).

7. **Default mapping behavior.** The default mappings it defines, if any, or a
   statement that it defines none ({{default-declared}}).

8. **Declared mapping behavior.** Whether declared mappings are permitted, who
   authors them, where they are carried, and how they relate to default
   mappings ({{default-declared}}).

9. **Trust-anchored fields.** Where declared mappings are permitted from a party
   other than the PEP, the fields that are trust-anchored, and whether each is
   enforced by verification or substitution ({{trust-anchored}}).

10. **Error transport.** The mechanism by which each category of {{errors}} is
    reported to the caller.

11. **Discoverability.** The discoverability mechanism it defines, if any
    ({{discoverability}}). OPTIONAL.

A profile MUST NOT redefine the AuthZEN request structures, the semantics of
defaults and overrides, or the envelope rule of {{construction}}, all of which
are fixed by this framework and {{AUTHZEN}}.

# Security Considerations

## Externalized Authorization

This framework moves authorization logic out of the implementation of the
protected operation. Decisions are delegated to an AuthZEN PDP, so security
logic lives apart from business logic, policy is managed in one place, and
enforcement is consistent across operations and protocols.

## Fail-Closed Enforcement

As required by {{errors}}, a PEP MUST fail closed. A mapping error, a denial, or
a PDP communication failure all result in the operation being refused. Profiles
and deployments MUST NOT define fallbacks that permit an operation in the
absence of an explicit permit decision.

## Mapping Integrity

A mapping determines how an operation is authorized; tampering with it can
weaken or bypass authorization. A PEP SHOULD validate that a mapping is
well-formed and that its expressions reference only defined input variables
before relying on it. Where mappings are supplied by a party other than the PEP
(for example, declared mappings), the trust placed in that party MUST be
considered in the threat model.

## Transport Security

All communication between the PEP and the PDP MUST use TLS, as specified in the
transport requirements of {{AUTHZEN}}.

## Deployment Coverage

If no PEP in an operation's path evaluates the applicable mapping, no AuthZEN
authorization occurs and access control falls back to whatever other mechanisms
are in place. Deployments SHOULD be validated to confirm that COAZ mappings are
consumed by an appropriate enforcement point for every in-scope operation.

# IANA Considerations

This specification has no IANA actions.

--- back

# Relationship to Other Specifications

## OpenID AuthZEN Authorization API

This framework is built directly on the OpenID AuthZEN Authorization API
{{AUTHZEN}}. A COAZ mapping is a template for an Access Evaluation or Access
Evaluations request, selected by its envelope, and COAZ defers entirely to
{{AUTHZEN}} for the structure of that request, the semantics of its defaults
and overrides, and the form of the decision response.
COAZ adds only the projection from an arbitrary information model into that
request.

## COAZ Profiles

This specification is the common foundation for a family of profiles, each of which
binds the framework to a specific protocol or interface by fulfilling the
conformance requirements of {{conformance}}. The COAZ Profile for the Model
Context Protocol {{COAZMCP}} is the reference profile. Profiles for HTTP APIs
{{RFC9110}} and for OpenAPI-described routes {{OPENAPI}} are anticipated.

# Design Considerations

## The Request Envelope

A mapping names the AuthZEN API it targets through a single outer key rather
than assuming one API for all mappings. The Access Evaluation API is the
baseline capability of every AuthZEN PDP, so the common case — one operation,
one decision — asks no more of the PDP than {{AUTHZEN}} itself requires. The
Access Evaluations API is engaged only by mappings that genuinely need several
decisions for a single operation. The envelope also leaves room for growth:
future versions of this framework, or individual profiles, can bind additional
keys to other AuthZEN APIs without changing the shape of existing mappings,
and a PEP treats an envelope key it does not support as a mapping error, so
unknown request types fail closed.

## One Output, Many Inputs

The central design choice of COAZ is to fix the output and vary the input. The
AuthZEN request is the same regardless of the source protocol, so PDPs, policy
authors, and tooling work identically across protocols. Only the projection
from each protocol's information model differs, and that projection is exactly
what a profile specifies.

## Literals and Expressions, Not Static and Dynamic

COAZ describes values as either literals or expressions. It avoids the
"static/dynamic" framing because a field reference — which appears to be a
simple mapping — is in fact computed from an input variable and is therefore an
expression. Reserving "literal" for true constants keeps the model precise and
avoids the contradiction of a "static" mapping that is full of computed values.

## A Default Language, an Overridable Contract

The framework names CEL as its default expression language so that mappings
look the same across profiles and a mapping author carries one skill between
them. Alongside the default it fixes an expression *contract*, so that a
profile whose environment genuinely cannot host a CEL evaluator can substitute
another language without destabilizing the rest of the model: the contract in
{{expression-contract}} defines exactly what any replacement must guarantee.
The same reasoning applies to the default `$` discriminator and `$$` escape of
{{literals-expressions}}: one default syntax across profiles, overridable only
where a protocol's environment forces it.

# Acknowledgements

The authors would like to thank the members of the OpenID AuthZEN Working Group
for their ongoing work on the Authorization API standard, and Martin Besozzi
for the original proposal on AuthZEN integration for fine-grained authorization
that motivated this line of work.

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
