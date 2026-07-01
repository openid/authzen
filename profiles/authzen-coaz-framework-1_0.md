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

informative:
  RFC8259:
  RFC9110:
  COAZMCP:
    title: "COAZ Profile for Model Context Protocol"
    target: https://openid.net/specs/authzen-mcp-profile-1_0.html
    date: 2026
  CEL:
    title: "Common Expression Language"
    target: https://cel.dev/
    author:
      -
        name: Google
    date: 2024
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
operation are projected, through a declarative mapping, into an AuthZEN Access
Evaluations request expressed using the Subject-Action-Resource-Context (SARC)
model. Mapping values are either literal constants or expressions evaluated
against the operation's inputs, enabling both fixed field-to-field mappings and
dynamic, computed mappings. This framework does not define a mapping for any
specific protocol; instead it defines the common model and a conformance
contract that individual COAZ *profiles* - for example a profile for the Model
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
   any information model        a declarative mapping        an AuthZEN request
  +-------------------+        +-------------------+        +-------------------+
  |  operation inputs |        |   literals  +     |        |  Access           |
  |  (request fields, | -----> |   expressions over| -----> |  Evaluations      |
  |   tokens, schema) |        |   the inputs      |        |  (SARC)           |
  +-------------------+        +-------------------+        +-------------------+
~~~
{: #fig-coaz-spine title="The COAZ model"}

COAZ deliberately separates two concerns:

- The **output** side is fixed. Every COAZ mapping produces an AuthZEN Access
  Evaluations request. The SARC structure, the semantics of defaults and
  overrides, and the decision response all belong to {{AUTHZEN}} and are
  identical for every protocol.

- The **input** side is specialized. The set of available input variables, the
  syntax used to write mappings, the location where a mapping is stored, and
  the way errors are reported back to the caller all depend on the protocol.
  These are defined by a COAZ *profile*.

This document defines the output-side model and the conformance contract that
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
  this document for mapping an information model into an AuthZEN Authorization
  API request.

Profile:
: A specification that binds this framework to a specific protocol or interface
  by fulfilling the conformance requirements of {{conformance}}. Examples
  include profiles for the Model Context Protocol, HTTP APIs, and OpenAPI.

Information Model:
: The set of data associated with an operation that a profile makes available
  to a mapping, such as request fields, message parameters, and security
  tokens.

Input Variable:
: A named element of the information model, exposed to expressions by a profile
  (for example, a variable holding a request's parameters or a variable holding
  decoded token claims).

Mapping:
: A declarative description, structured as an AuthZEN Access Evaluations
  request, of how to construct that request from an operation's input
  variables. Each value in a mapping is either a literal or an expression.

Literal:
: A value in a mapping that is used verbatim, as a constant, without reference
  to any input variable.

Expression:
: A value in a mapping that is computed by evaluating it, in a profile-defined
  expression language, against the operation's input variables.

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

A COAZ mapping is a template, shaped exactly as an AuthZEN Access Evaluations
request, in which any value MAY be replaced by an expression over the
operation's input variables. To authorize an operation, a PEP:

1. Populates the input variables defined by the applicable profile from the
   incoming operation (see {{inputs}}).

2. Selects the mapping that applies to the operation (see {{default-declared}}).

3. Resolves every value in the mapping: literals are taken verbatim;
   expressions are evaluated against the input variables (see
   {{literals-expressions}} and {{expression-contract}}).

4. Constructs an AuthZEN Access Evaluations request from the resolved values
   (see {{construction}}) and sends it to the PDP.

5. Enforces the returned decisions.

## Information Model and Input Variables {#inputs}

A profile MUST define the information model it exposes to mappings as a set of
named input variables. Expressions reference these variables by name. The
framework does not mandate any particular variables; naming and contents are
entirely profile-defined. For example, a profile for a request/response
protocol might expose a variable for the request and a variable for the
caller's authorization token.

A profile MUST specify, for each input variable, its name, the source from
which the PEP populates it, and its structure, so that mapping authors can
write expressions against it deterministically.

## The Mapping {#mapping}

A COAZ mapping is a JSON {{RFC8259}} object structured as an AuthZEN Access
Evaluations request. It MAY contain the top-level `subject`, `action`,
`resource`, and `context` fields, and an `evaluations` array whose entries MAY
each contain their own `subject`, `action`, `resource`, and `context` fields.

The framework does not redefine this structure or its semantics. The meaning of
the top-level fields, the meaning of the per-entry fields, and the rules by
which per-entry fields override top-level defaults are exactly as defined for
the Access Evaluations request in {{AUTHZEN}}. In particular, custom attributes
of a `subject`, `resource`, or `action` MUST be nested under that object's
`properties` key as defined by {{AUTHZEN}}, rather than added as sibling keys;
`context` is a free-form object and is the exception. COAZ's primary addition to
this structure is that any leaf value MAY be an expression rather than a literal
(a profile MAY also designate trust-anchored fields; see {{trust-anchored}}).

## Literals and Expressions {#literals-expressions}

Every leaf value in a mapping is either a literal or an expression:

- A **literal** is used verbatim as a constant in the constructed request.

- An **expression** is evaluated, in the profile's expression language, against
  the operation's input variables, and its result is used in the constructed
  request.

A profile MUST define an unambiguous discriminator that distinguishes a literal
from an expression for every leaf value. A profile MUST also define an escape
mechanism such that any literal value — including one whose text resembles an
expression — can be represented unambiguously. The framework does not mandate
any particular syntax for this discriminator or escape; it requires only that
the distinction be lossless.

This framework does not use the terms "static" or "dynamic" to describe values.
A field reference such as "the request's path" is an expression, not a literal,
because it is computed from an input variable. Only constants are literals.

## The Expression Contract {#expression-contract}

A profile MUST designate an expression language (for example, Common Expression
Language {{CEL}} for a message-oriented protocol, or another language better
suited to a different environment). Regardless of the language chosen, every
COAZ expression MUST satisfy the following contract, which is what allows the
rest of this framework to remain language-neutral:

1. An expression is evaluated against the input variables defined by the
   profile, and only those variables.

2. An expression MUST evaluate to a single JSON value — a scalar (string,
   number, boolean, or null), a list, or a map — or to the distinguished value
   **absent**. A value is used as the value of the field in which the expression
   appears; **absent** causes that field to be omitted from the constructed
   request entirely.

A profile MUST specify how an expression yields **absent** (for example, via the
expression language's optional-value semantics), so that mapping authors can
distinguish "field deliberately omitted" from "field present with a null value."

The framework relies on {{AUTHZEN}} for which fields are required: `subject`,
`action`, and `resource` are required for every evaluation, and `context` is
optional. If an expression yields **absent** or null for a required field, the
PEP cannot construct a valid request; this is a mapping error (see {{errors}}).

A value that an expression returns is always a single field value, including
when it is a list or a map. Returning a list SHALL NOT cause the request to
fan out into multiple evaluations. The number of evaluations in the constructed
request MUST be determined solely by the number of entries in the mapping's
`evaluations` array (see {{construction}}), not by the type of a value an
expression returns.

## Constructing the AuthZEN Request {#construction}

A PEP MUST construct an AuthZEN Access Evaluations request, as defined in
{{AUTHZEN}}, from the resolved mapping. COAZ uses the Access Evaluations API
exclusively; a single authorization check is expressed as an `evaluations`
array with one entry. A PDP used with COAZ MUST support the Access Evaluations
API.

The top-level and per-entry fields of the constructed request carry exactly the
default and override semantics defined by {{AUTHZEN}}. COAZ does not define any
additional merge behavior.

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

# Error Categories {#errors}

COAZ defines three categories of error that a PEP can encounter. The framework
defines the categories and their meaning; the transport used to report each
category to the caller is profile-defined, because it depends on the protocol.

Mapping Error:
: The PEP cannot construct a valid AuthZEN request from the mapping and the
  operation's inputs — for example, an expression references a non-existent
  field, an expression fails to evaluate, the mapping is malformed, or a
  required field is missing. The PEP MUST NOT permit the operation.

Authorization Denial:
: The PDP returns a deny decision for one or more evaluations. The PEP MUST NOT
  permit the operation.

PDP Communication Error:
: The PEP cannot reach the PDP or receives an invalid or unparseable response.
  The PEP MUST NOT permit the operation.

In all three categories the PEP MUST fail closed: the operation MUST NOT proceed
unless an explicit permit decision is obtained for every evaluation in the
constructed request.

# Profile Conformance Requirements {#conformance}

A specification conforms to this framework as a COAZ profile if, and only if, it
specifies all of the following:

1. **Information model.** The named input variables it exposes to expressions,
   and, for each, its source and structure ({{inputs}}).

2. **Mapping location.** Where a mapping is stored or carried for an operation,
   and how the PEP obtains it.

3. **Literal/expression discriminator.** The unambiguous syntax that
   distinguishes a literal from an expression, together with the escape
   mechanism required by {{literals-expressions}}.

4. **Expression language.** The expression language used, satisfying the
   expression contract of {{expression-contract}}.

5. **Operations in scope.** The set of operations the profile authorizes and,
   where a default mapping is provided, the explicit set of pass-through
   operations ({{default-declared}}).

6. **Default mapping behavior.** The default mappings it defines, if any, or a
   statement that it defines none ({{default-declared}}).

7. **Declared mapping behavior.** Whether declared mappings are permitted, who
   authors them, where they are carried, and how they relate to default
   mappings ({{default-declared}}).

8. **Trust-anchored fields.** Where declared mappings are permitted from a party
   other than the PEP, the fields that are trust-anchored, and whether each is
   enforced by verification or substitution ({{trust-anchored}}).

9. **Error transport.** The mechanism by which each error category of
   {{errors}} is reported to the caller.

10. **Discoverability.** The discoverability mechanism it defines, if any
    ({{discoverability}}). OPTIONAL.

A profile MUST NOT redefine the AuthZEN request structure, the semantics of
defaults and overrides, or the requirement to use the Access Evaluations API,
all of which are fixed by this framework and {{AUTHZEN}}.

# Security Considerations

## Externalized Authorization

This framework promotes the externalization of authorization logic from the
implementation of the protected operation. By delegating decisions to an
AuthZEN PDP, implementers separate security logic from business logic, enabling
centralized policy management and consistent enforcement across operations and
protocols.

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

This document has no IANA actions.

--- back

# Relationship to Other Specifications

## OpenID AuthZEN Authorization API

This framework is built directly on the OpenID AuthZEN Authorization API
{{AUTHZEN}}. A COAZ mapping is a template for an Access Evaluations request, and
COAZ defers entirely to {{AUTHZEN}} for the structure of that request, the
semantics of its defaults and overrides, and the form of the decision response.
COAZ adds only the projection from an arbitrary information model into that
request.

## COAZ Profiles

This document is the common foundation for a family of profiles, each of which
binds the framework to a specific protocol or interface by fulfilling the
conformance requirements of {{conformance}}. The COAZ Profile for the Model
Context Protocol {{COAZMCP}} is the reference profile. Profiles for HTTP APIs
{{RFC9110}} and for OpenAPI-described routes {{OPENAPI}} are anticipated.

# Design Considerations

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

## Profile-Chosen Expression Languages

By fixing an expression *contract* rather than an expression *language*, the
framework lets each profile choose the language best suited to its environment
while keeping request construction language-neutral. A message-oriented profile
may choose Common Expression Language {{CEL}}; a gateway-oriented profile may
choose another language. The contract in {{expression-contract}} is what makes
this substitution safe.

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
