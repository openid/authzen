---
title: "AuthZEN Extensibility Model - Draft 1"
abbrev: "authzen-extensibility"
category: std
date: 2026-10-13
ipr: none
docname: authzen-extensibility-model-1_0
consensus: true
workgroup: OpenID AuthZEN
keyword:
  - authorization
  - AuthZEN
  - extensibility
  - extensions
  - profiles
  - negotiation
stand_alone: true
smart_quotes: no
pi: [toc, sortrefs, symrefs, private]
author:
  -
    fullname: Alexandre Babeanu
    organization: Indykite
    email: alex.babeanu@indykite.com
  -
    fullname: Karl McGuinness
    organization: Independent
    email: public@karlmcguinness.com
normative:
  RFC2119:
  RFC8174:
  RFC8126:
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
  EXT-PROPOSAL:
    title: "AuthZEN Extensibility Model (Draft 2, proposal)"
    target: https://gist.github.com/mcguinness/caab9ff46a8b0123cfa84645e9a60a7f
    author:
      -
        name: Karl McGuinness
    date: 2026
  OBLIGATIONS-CORE:
    title: "AuthZEN Obligations Core"
    target: https://openid.github.io/authzen/authzen-obligations-core-1_0.html
    author:
      -
        name: Alexandre Babeanu
        org: Indykite
    date: 2026
  STANDARD-TYPES-PROFILE:
    title: "AuthZEN Obligations Core: Standard Types Profile"
    target: https://openid.github.io/authzen/authzen-obligations-standard-types-profile-1_0.html
    author:
      -
        name: Alexandre Babeanu
        org: Indykite
    date: 2026
  ARAP:
    title: "AuthZEN Access Request and Approval Profile"
    target: https://github.com/openid/authzen/blob/main/profiles/authzen-access-request-approval/authzen-access-request-approval-profile-1_0.md
    author:
      -
        name: OpenID AuthZEN Working Group
    date: 2026

--- abstract

The OpenID AuthZEN Authorization API leaves the decision context, and much of the request context, without normative semantics. That openness lets the ecosystem add obligations, advice, access requests, partial evaluation, and other features, but without a shared model every addition must invent its own conventions and answer the same safety questions differently. This specification defines the contract for extending AuthZEN. It defines the kinds of specification that extend AuthZEN (extensions, profiles, and transport bindings), the extension surface, the processing strengths of extension members and the handling of unknown members, and the invariants that every addition must preserve. It also defines the `supported_mandatory_extensions` request context member. An Enforcing PEP uses this member to commit to the fail-closed processing of an extension's mandatory-to-understand members, and a PDP relies on it before emitting them. Finally, the specification defines what every extension specification must state, and establishes the registries that keep extension identifiers from colliding.

--- middle

# Introduction

The OpenID AuthZEN Authorization API {{AUTHZEN}} carries a `context` object in both the request and the decision. The request `context` "represents the environment of the access evaluation request", and is explicitly allowed to carry "Capabilities of the PEP". The decision `context` is open-ended. When a decision permits access, "if the PEP does not understand information in the `context` response object, the PEP MAY choose to reject the decision". Receivers "MUST ignore unknown fields present in request or response bodies".

This openness is deliberate, and it has let the ecosystem add obligations, advice, access requests, and partial evaluation on top of AuthZEN. But {{AUTHZEN}} gives no shared model for how to add such features. Each addition therefore reinvents its conventions, and answers the safety questions differently. The sharpest of those questions is: **what may a producer rely on a consumer doing with an element the consumer does not understand?**

This specification answers that question and the others that follow from it. It defines:

- the kinds of specification that extend AuthZEN, and how they depend on one another ({{kinds}});
- the extension surface, that is, where extension members may appear ({{surface}});
- processing strengths, the core baseline for unknown members, and the rule that a PDP returns a plain DENY when it cannot rely on a mandatory element being enforced ({{processing}});
- capability declarations, their placement, and the two-level negotiation model, including the `supported_mandatory_extensions` opt-in ({{negotiation}});
- the invariants that every extension, profile, and transport binding preserves ({{invariants}});
- what every extension specification must define ({{extension-requirements}}), and what profiles and transport bindings must define ({{profile-requirements}});
- the registries that keep identifiers from colliding ({{iana-considerations}}).

This specification is itself an extension in the sense of {{kinds}}: it adds the `supported_mandatory_extensions` member and its processing rules. Every other extension that defines mandatory-to-understand members depends on it.

This specification is based on the AuthZEN Extensibility Model proposal {{EXT-PROPOSAL}}.

## Requirements Notation and Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 {{RFC2119}} {{RFC8174}}
when, and only when, they appear in all capitals, as shown here.

## Terminology

This specification uses the terms "Policy Enforcement Point" (PEP), "Policy Decision Point" (PDP), "subject", "resource", "action", "context", and "decision" as defined in {{AUTHZEN}}. Additionally, this specification uses the following terms:

Extension:

: A specification that adds reusable AuthZEN semantics or surface, as defined in {{kinds}}.

Profile:

: A specification that selects, constrains, and composes the core specification and extensions for a use case, and defines conformance, as defined in {{kinds}}.

Protocol Integration Profile:

: A profile that composes AuthZEN with another application protocol, such as OAuth or MCP.

Transport Binding:

: A specification that serializes AuthZEN over a transport, such as HTTPS or gRPC.

Extension Member:

: A registered, namespaced member that an extension adds to a named object of the protocol ({{surface}}).

Producer:

: The party that emits an extension member. For decision-context members, the producer is the PDP.

Consumer:

: The party that receives and processes an extension member. For decision-context members, the consumer is the PEP.

Processing Strength:

: The property of an extension member that determines what a producer may rely on a consumer doing with it. It is either Advisory or Mandatory-to-Understand ({{strengths}}).

Advisory:

: A processing strength. A consumer that does not understand an advisory member MAY ignore it, and remains conformant.

Mandatory-to-Understand:

: A processing strength. An Adopting PEP that does not understand a mandatory-to-understand member, or cannot apply it, MUST treat a PERMIT as a DENY.

Extension Identifier:

: A registered identifier for an extension that defines mandatory-to-understand members. It is the value a PEP lists in `supported_mandatory_extensions` ({{opt-in}}).

Enforcing PEP:

: The PEP that will actually enforce the decision returned by the PDP. The Enforcing PEP is not necessarily the immediate caller of the PDP's API, for example when the request passes through a gateway or other intermediary.

Adopting PEP:

: An Enforcing PEP that has listed a given extension's identifier in `supported_mandatory_extensions` for a request. A PEP is an Adopting PEP only with respect to the extensions it lists, and only for that request.

Capability Declaration:

: A member of the request `context` by which a PEP declares what it can process, as opposed to an authorization attribute that describes the subject, resource, action, or environment ({{capabilities}}).

# Kinds of Specification {#kinds}

AuthZEN is extended by three kinds of specification.

**Extension.** An extension adds reusable AuthZEN semantics or surface. Examples include a new request or decision-context member, a metadata field, an enumerated type, or an endpoint, together with the normative rules for producing and consuming it. An extension is use-case neutral. It is defined once, against the Authorization API, independently of any transport.

**Profile.** A profile selects, constrains, and composes the core specification and extensions for a use case, and defines conformance. A profile is use-case specific. A protocol integration profile is a profile that composes AuthZEN with another application protocol. Beyond serialization, a protocol integration profile MAY also define lifecycle, security, error, and enforcement semantics that a plain use-case profile does not.

**Transport binding.** A transport binding serializes AuthZEN over a transport. It preserves the abstract semantics of the core specification and its extensions. It necessarily defines transport-specific authentication, errors, serialization, retries, and integrity behavior.

Profiles and transport bindings depend on extensions. Extensions MUST NOT depend on profiles or transport bindings.

A single document MAY define both an extension and a profile of it. Such a document MUST state clearly which parts are the reusable extension and which are the use-case profile. Obligations illustrate the split. The `obligations` member and its fail-closed rule are the reusable extension, defined in {{OBLIGATIONS-CORE}}. The vocabulary of obligation types, such as `step-up`, together with its conformance requirements, is a profile, defined in {{STANDARD-TYPES-PROFILE}}.

# Extension Surface {#surface}

Extensibility is a recursive rule, not a fixed list. Any named object in the protocol MAY carry registered, namespaced extension members. The presence of a registered extension member is itself the signal that the extension applies.

Named objects include, but are not limited to:

- the request;
- the `subject`, `resource`, and `action` objects, and their `properties`;
- the request `context` and the decision `context`;
- batch `options`, and the members of each evaluation in a batch request;
- the Search response `context` and Search result objects;
- PDP metadata;
- objects defined by profiles, such as the task and result objects of {{ARAP}}, callback documents, and catalog documents.

Transport bindings extend their own surfaces, such as headers and error types, under the same registration discipline ({{iana-considerations}}).

An extension MUST NOT redefine, or change the meaning of, the core members `subject`, `resource`, `action`, and `decision`. An extension MAY add members to these objects, subject to the rules of this specification.

# Processing Strength and Unknown Handling {#processing}

## Core Baseline {#core-baseline}

Under {{AUTHZEN}}, a receiver MUST ignore unknown fields. For a PERMIT, a PEP that does not understand information in the decision `context` MAY reject the decision. The core default is therefore **ignorable**, with fail-closed behavior permitted but not required.

The core default is not "fail-open". Fail-open would imply that the PEP is expected to permit access when it encounters something it does not understand. {{AUTHZEN}} implies no such expectation.

## Processing Strengths {#strengths}

Every extension member of the decision `context` has exactly one of the following processing strengths. An extension MAY also assign a processing strength to members in other locations.

Advisory:

: A consumer that does not understand the member MAY ignore it, and remains conformant. It MAY also reject a PERMIT that carries the member, as {{AUTHZEN}} permits. Either behavior is conformant.

Mandatory-to-Understand:

: An Adopting PEP that does not understand the member, or cannot apply it, MUST treat a PERMIT as a DENY.

Because the core default is ignorable, an extension cannot make a member mandatory-to-understand for a party that has not adopted the extension. Mandatory-to-understand semantics bind only a consumer that has adopted the defining extension. A producer MUST NOT rely on them against a party that has not adopted it.

The processing strength of a member is part of its registration, and is immutable ({{iana-considerations}}).

## Mandatory PDP Outcome {#pdp-outcome}

It follows from {{strengths}} that a PDP cannot simply attach a mandatory-to-understand element to a PERMIT and assume it will be enforced. When policy requires such an element and the PDP cannot establish that the Enforcing PEP has adopted the defining extension, the PDP MUST return a plain core DENY. It MUST NOT omit the element and return a PERMIT.

Adoption is established by the `supported_mandatory_extensions` opt-in ({{opt-in}}), refined by the extension's own item negotiation ({{item-negotiation}}). When evaluating a request, the PDP MUST determine its outcome as follows:

| Condition | PDP outcome |
|---|---|
| Policy requires no mandatory-to-understand element | Ordinary core decision. |
| Policy requires a mandatory-to-understand element, and the request does not list the defining extension in `supported_mandatory_extensions` | Plain core DENY. |
| The defining extension is listed in `supported_mandatory_extensions`, but the required item is not listed in the extension's item negotiation member (for example, `supported_obligations`) | Plain core DENY. |
| The defining extension is listed in `supported_mandatory_extensions`, and the required item is supported | The decision that policy dictates, together with the mandatory-to-understand element. |
{: #tab-pdp-outcome title="PDP outcome for mandatory-to-understand elements"}

A "plain core DENY" is a decision with `"decision": false` that carries no member of the extension whose adoption could not be established.

An extension MAY refine this table, for example by allowing the PDP to substitute an equivalent supported item. An extension MUST NOT relax it.

## Enforcing PEP and Intermediaries {#enforcing-pep}

The opt-in refers to the Enforcing PEP, which may not be the immediate caller of the PDP. A request may pass through gateways, aggregators, or other intermediaries, and a response may be forwarded to a PEP other than the one that called the PDP.

Intermediaries and downgrade paths MUST be handled so that an opt-in established for one hop is not assumed for another. In particular, an intermediary that is not itself the Enforcing PEP:

- MUST NOT add an extension identifier to `supported_mandatory_extensions` on behalf of an Enforcing PEP that has not asserted it;
- MUST NOT carry an opt-in established for one hop over to a different hop or a different Enforcing PEP;
- MUST NOT remove or alter mandatory-to-understand members of a response;
- MUST, if it cannot deliver mandatory-to-understand members unchanged to an Enforcing PEP that has adopted the defining extension, treat a PERMIT that carries them as a DENY.

This specification does not define how the Enforcing PEP is identified and authenticated when it is not the immediate caller. Transport bindings define how this is realized over their transport ({{profile-requirements}}).

## Unknown Handling per Extension and per Position {#unknown-handling}

Each extension MUST define, separately, how a consumer handles:

- an unknown member, and
- an unknown value of a known member.

For each of these, it MUST state the handling for a PERMIT, for a DENY, and for any side effect the member requests.

"More restrictive" is a useful design principle, but not a universal algorithm. The following examples show why each case needs its own rule:

| Element | Handling when not understood | Why |
|---|---|---|
| Unknown advice | Ignored. | Advice is advisory by definition. |
| Unknown reason code | Does not alter the decision. | A reason explains a decision; it does not change it. |
| Unknown retry hint | No retry is performed. | The safe reading of an unknown hint is to take no action. |
| Unknown obligation on a DENY | Remains a DENY; the requested side effect is not performed. | "Treat the PERMIT as a DENY" does not address a required side effect on a DENY. |
{: #tab-unknown-examples title="Examples of position-specific unknown handling"}

Some values have no ordering from permissive to restrictive at all. For those, the extension MUST state the handling explicitly rather than rely on a general principle.

# Capabilities and Negotiation {#negotiation}

## Capability Declarations Are Decision-Processing Inputs {#capabilities}

Capability declarations are not authorization attributes, such as an IP address or a device's compliance state. They are, however, inputs to decision processing, because they can change the response. For example, an Adopting PEP may receive a PERMIT with a mandatory obligation, where a PEP that has not adopted the extension would receive a DENY for the same request.

A producer MUST therefore bind, or otherwise account for, any capability declaration that changes the decision or its enforceability, in:

- decision cache keys;
- evaluation identity;
- signed-request protection;
- denial binding, where relevant;
- intermediary and downgrade handling ({{enforcing-pep}}).

For example, where {{ARAP}} computes a `binding_hash` over the subject, resource, action, and context of an evaluation, any capability declaration that affects the decision is part of that evaluation's identity, and MUST be covered by the hash.

Capability declarations MUST be clearly identifiable as protocol declarations, so that policies do not treat them as authorization attributes. A PDP SHOULD NOT use a capability declaration as an input to policy, other than to determine which extension members it may emit and whether it must fall back to a DENY.

## Placement {#placement}

{{AUTHZEN}} already lists "Capabilities of the PEP" as request context, and a PDP already advertises its own capabilities through the `capabilities` metadata member and the AuthZEN Policy Decision Point Capabilities Registry. Capability declarations are therefore carried:

- by the PEP, in the request `context`;
- by the PDP, in its metadata.

They are not carried in a new top-level request member, nor in the `options` of a batch request. This keeps the single, batch, and Search endpoints symmetric. A new top-level request member would break the AuthZEN 1.0 request contract, and would not remove the binding requirement of {{capabilities}} in any case.

Because the endpoints carry `context` differently, placement differs by endpoint as follows:

| Endpoint | Where the PEP declares capabilities | Behavior |
|---|---|---|
| Access Evaluation | Request `context` | One context. The declarations apply directly. |
| Access Evaluations (batch) | Request `context` (top-level or per-evaluation) | The top-level `context` is a default that a per-evaluation `context` overrides rather than merges with. A PEP that sets a per-evaluation `context` MUST repeat its declarations there, because the top-level declarations do not carry into an evaluation that supplies its own `context`. |
| Search (subject, resource, action) | Request `context` | One context. The declarations apply directly, as for a single evaluation. |
| PDP metadata | Not per request | The PDP advertises the extensions it supports through its `capabilities` metadata. This is the discovery direction, from PDP to PEP. A PEP uses it to check whether a PDP supports an extension before relying on it. |
{: #tab-placement title="Placement of capability declarations by endpoint"}

On the response side, the Access Evaluation decision and each Search response carry a `context`, so a PDP MAY return decision-relevant response signals there. An extension MAY also define members of individual Search results, as {{surface}} permits. The Access Evaluations response carries only a Decision for each evaluation, and defines no top-level response context. A request-wide response signal therefore has nowhere to go on that endpoint. Any extension that defines a response-side negotiation signal MUST account for this.

## Two Levels of Negotiation {#two-levels}

Negotiation takes place at two levels:

- **Support opt-in** (coarse): the Enforcing PEP commits to the mandatory-to-understand processing of an extension, using `supported_mandatory_extensions` ({{opt-in}}). This is the safety-critical signal.
- **Item negotiation** (fine): a party declares which specific items within an extension it can handle, using a member defined by that extension ({{item-negotiation}}). This is advisory with respect to safety.

## Support Opt-In: supported_mandatory_extensions {#opt-in}

This specification defines the `supported_mandatory_extensions` request context member.

supported_mandatory_extensions:

: OPTIONAL. A JSON array of Strings. Each String is an Extension Identifier registered in the "AuthZEN Extension Identifiers" registry ({{iana-extension-identifiers}}). The array MUST NOT contain duplicate values. By listing an Extension Identifier, the Enforcing PEP commits to the mandatory-to-understand processing of that extension's members for this request.

The following is a non-normative example of a request that opts in to the Obligations Core extension {{OBLIGATIONS-CORE}}:

~~~ json
{
  "subject": { "type": "user", "id": "alice@example.com" },
  "resource": { "type": "account", "id": "acct-123" },
  "action": { "name": "read" },
  "context": {
    "supported_mandatory_extensions": ["obligations"]
  }
}
~~~
{: #fig-opt-in title="Request opting in to an extension's mandatory-to-understand processing"}

### PEP Processing {#opt-in-pep}

Listing an extension in `supported_mandatory_extensions` is a stronger claim than ordinary capability advertisement. The PEP asserts that it will not grant access if it cannot understand or enforce a mandatory-to-understand element of that extension. Listing the extension switches on the extension's fail-closed rule for that PEP.

A PEP:

- MUST NOT list an extension unless it implements that extension's mandatory-to-understand processing in full;
- MUST list only extensions for which it is the Enforcing PEP, or for which it relays the authenticated assertion of the Enforcing PEP ({{enforcing-pep}});
- MAY list extensions that a given PDP does not support. A PEP may advertise a superset of what any one PDP supports.

### PDP Processing {#opt-in-pdp}

A PDP:

- MUST NOT emit a policy-required mandatory-to-understand element until the Enforcing PEP has listed the defining extension in `supported_mandatory_extensions`, and MUST apply {{pdp-outcome}};
- MUST treat an entry it does not implement as a no-op, since it cannot emit elements of an extension it does not support;
- MUST NOT reject a request merely because `supported_mandatory_extensions` lists an extension the PDP does not implement;
- MUST honor the opt-in only when it is authenticated to the Enforcing PEP and bound to the request ({{invariants}}, invariant 7).

### Self-Bootstrapping {#bootstrapping}

`supported_mandatory_extensions` is itself an advisory member. It needs no mandatory-to-understand handling, because it is self-bootstrapping: a PDP that does not understand it ignores it, sees no adoption, and therefore cannot rely on any mandatory-to-understand element. That is the safe outcome.

### Binding and Forgery {#opt-in-binding}

`supported_mandatory_extensions` is a decision-relevant self-assertion, and is subject to invariant 7 ({{invariants}}). It MUST be authenticated to the Enforcing PEP, and bound to the request.

Forgery is the dangerous case. A stripped signal fails safe: the PDP sees no adoption, and returns a DENY. A signal forged onto a request from a PEP that implements only the core specification makes the PDP emit a mandatory-to-understand element. That PEP then ignores the element, as {{AUTHZEN}} permits, and grants access.

## Item Negotiation {#item-negotiation}

An extension MAY define a request `context` member by which a party advertises which specific items within the extension it can handle. An example is `supported_obligations`, defined by {{OBLIGATIONS-CORE}}, which lists the obligation types a PEP can execute.

Item negotiation is advisory with respect to safety. It lets a producer avoid emitting an item that the consumer cannot handle, and so reduces unexpected denials. But even a supported item is safe to emit as mandatory-to-understand only once the defining extension is listed in `supported_mandatory_extensions`.

An extension that defines an item negotiation member:

- MUST define how its absence is read when the extension is listed in `supported_mandatory_extensions`;
- MUST define how a PDP handles values it does not recognize. It SHOULD require the PDP to ignore them, rather than reject the request;
- SHOULD place it in the request `context`, alongside `supported_mandatory_extensions`, so that it is bound with the opt-in.

## Negotiation Is Per Extension, Not Per Profile {#per-extension}

Negotiation takes place at the level of extensions, not profiles, because mandatory-to-understand is a property of an extension member rather than of a profile.

- A profile that carries a mandatory-to-understand element is adopted by opting in to that element's extension. It needs no separate signal.
- A profile that is entirely advisory, such as the requestable denial of {{ARAP}}, needs no negotiation at all.

Whether a party implements a given profile is a matter of discovery and routing, conveyed through metadata. It is not the safety gate that `supported_mandatory_extensions` provides. Conformance to a profile does not, by itself, count as adoption on the wire.

# Invariants {#invariants}

Every extension, profile, and transport binding MUST preserve all of the following invariants.

1. **Ignorable default and defined unknown handling.** Unknown members are ignorable, and a PEP MAY reject a PERMIT it does not understand. Each extension defines its handling of unknown members and unknown values for permits, denials, and side effects ({{unknown-handling}}). Mandatory-to-understand semantics bind only adopters. A producer MUST NOT rely on them against a party that has not adopted the defining extension. A PDP MUST return a plain core DENY when policy requires a mandatory-to-understand element that it cannot be sure will be enforced ({{pdp-outcome}}).

2. **Core interoperability and graceful absence.** A party that implements only the core specification remains interoperable. An extension MUST define how the absence of its members is read, and absence MUST reduce to a plain core PERMIT or DENY. Ignoring an extension MUST NOT break the base exchange.

3. **Enforce by defined semantics.** An artifact, such as an approval, a token, a cached or distributed decision, or a residual policy, MUST be enforced only according to its explicitly defined issuer, audience, scope, lifetime, binding, revocation, and verification semantics. A consumer MUST NOT infer authority merely from the presence of an artifact.

4. **No reinterpretation of the decision.** A PEP MUST NOT treat auxiliary members of the decision `context` as widening the accompanying `decision`. A DENY remains a DENY, unless a separate artifact, defined by a profile, has independently enforceable semantics. New, verified input may of course change the outcome of a later evaluation.

5. **Namespacing.** Identifiers are registered and namespaced so that they cannot collide, in the registries of {{iana-considerations}}.

6. **Composability.** Extensions compose without contradiction. Where two extensions can interact, the composition and any precedence MUST be defined. An example is an access-request response that also carries obligations.

7. **Binding of decision-relevant state.** Any capability declaration, including `supported_mandatory_extensions`, and any carried artifact that affects the decision or its enforceability MUST be integrity-protected, bound to the originating evaluation, and authenticated to the enforcing party. It then cannot be tampered with, downgraded, forged, or replayed against a different request or a different PEP.

# Requirements for Extension Specifications {#extension-requirements}

A specification that defines an AuthZEN extension MUST define:

1. **Elements.** The elements it adds, their schema, their location on the extension surface ({{surface}}), and the registries and namespaces it uses ({{iana-considerations}}).
2. **Processing strength.** The processing strength of each member, advisory or mandatory-to-understand ({{strengths}}).
3. **Mandatory-to-understand processing.** If any member is mandatory-to-understand:
   - its Extension Identifier, for use in `supported_mandatory_extensions` ({{opt-in}});
   - which PEP the opt-in refers to ({{enforcing-pep}});
   - the exact fail-closed behavior;
   - the PDP's outcome when adoption cannot be established, consistent with {{pdp-outcome}};
   - any item negotiation member, and its handling ({{item-negotiation}}).
4. **Unknown handling.** The handling of unknown members and unknown values, stated separately for permits, denials, and side effects ({{unknown-handling}}).
5. **Absence.** How the absence of its members is read, which by invariant 2 reduces to the core specification.
6. **Binding.** If it carries decision-relevant state, or an artifact that crosses a trust boundary: the integrity and binding rules required by invariant 7.
7. **Composition.** How it composes with the core specification, and with other known extensions (invariant 6).
8. **Placement.** For each endpoint it applies to, where its request and response members are carried, taking into account the differences described in {{placement}}.

An extension specification SHOULD include a summary table of the members it defines, with their location, direction, and processing strength. {{OBLIGATIONS-CORE}} is an example of an extension specification that meets these requirements.

# Requirements for Profiles and Transport Bindings {#profile-requirements}

A profile:

- MUST identify the extensions it selects;
- MUST NOT relax any requirement of the core specification, of this specification, or of the extensions it selects;
- MAY add constraints and conformance requirements, for example requiring a PEP to implement particular items of an extension;
- MUST NOT define a separate adoption signal for mandatory-to-understand elements, and relies instead on the opt-in of the extensions it selects ({{per-extension}});
- SHOULD register a profile identifier ({{iana-profile-identifiers}}), so that parties can advertise support for it in metadata.

A protocol integration profile additionally MUST define the lifecycle, security, error, and enforcement semantics of the integration that the composed protocol does not already define.

A transport binding:

- MUST preserve the abstract semantics of the core specification and of every extension, including processing strengths and the outcome of {{pdp-outcome}};
- MUST define transport-specific authentication, errors, serialization, retries, and integrity behavior;
- MUST define how invariant 7 is realized over that transport, in particular how `supported_mandatory_extensions` is authenticated to the Enforcing PEP and bound to the request;
- MUST register any transport-specific extension surface, such as headers or error types, under the discipline of {{iana-considerations}}.

# Examples (non-normative) {#examples}

## Request with Capability Declarations

Capability declarations are carried in the request `context`, alongside authorization inputs, but identifiable as protocol declarations. They are bound with the rest of the request. `supported_mandatory_extensions` is the coarse opt-in: the PEP commits to fail-closed processing of the Obligations Core extension {{OBLIGATIONS-CORE}}. `supported_obligations` is that extension's fine, advisory declaration of the obligation types the PEP can execute.

~~~ json
{
  "subject": { "type": "user", "id": "alice@example.com" },
  "resource": { "type": "account", "id": "acct-123" },
  "action": { "name": "read" },
  "context": {
    "ip": "203.0.113.10",
    "supported_mandatory_extensions": ["obligations"],
    "supported_obligations": ["step-up", "notification"]
  }
}
~~~
{: #fig-example-request title="Request with capability declarations"}

## PERMIT with a Mandatory-to-Understand Element

The following response uses the `step-up` obligation type of {{STANDARD-TYPES-PROFILE}}:

~~~ json
{
  "decision": true,
  "context": {
    "obligations": [
      {
        "type": "step-up",
        "id": "obl-1",
        "properties": {
          "acr_value": "urn:com:example:loa:3",
          "amr_values": ["mfa", "hwk"]
        }
      }
    ]
  }
}
~~~
{: #fig-example-mandatory title="PERMIT with a mandatory-to-understand obligation"}

The PDP emits this response only because the request listed `obligations` in `supported_mandatory_extensions` and `step-up` in `supported_obligations`. The PEP must perform the step-up before granting access. If it cannot, it treats the PERMIT as a DENY. Had the request not opted in, the PDP would have returned a plain core DENY ({{pdp-outcome}}).

## PERMIT with an Advisory Element

The following response carries an advisory `advice` member, as an extension might define it:

~~~ json
{
  "decision": true,
  "context": {
    "advice": [
      { "type": "notification", "message": "This account is flagged for review." }
    ]
  }
}
~~~
{: #fig-example-advisory title="PERMIT with advisory advice"}

A PEP that understands the advice MAY act on it. A PEP that does not understand it MAY ignore it and grant access, or MAY reject the decision. Both behaviors are conformant.

## Requestable DENY with Binding Material

The following response is a requestable denial, as defined by {{ARAP}}:

~~~ json
{
  "decision": false,
  "context": {
    "access_request": {
      "endpoint": "https://ars.example.com/requests",
      "expires_at": "2026-08-13T20:00:00Z",
      "binding_token": "eyJhbGciOiJFUzI1NiJ9..."
    }
  }
}
~~~
{: #fig-example-requestable title="Requestable DENY with bound binding material"}

The denial remains a denial (invariant 4). The `binding_token` is denial-binding material issued by the PDP. A PEP that supports access requests returns it unchanged to the Access Request Service, which verifies it against the PDP's published key. The token MUST therefore be integrity-protected and bound to this exact evaluation (invariant 7). An approval that comes back later travels in the opposite direction: from the Access Request Service, through the PEP, to the PDP, which verifies it at re-evaluation. A PEP that does not support access requests simply sees a DENY. Because the profile is advisory, it needs no negotiation ({{per-extension}}).

# Migration {#migration}

Before this specification, the AuthZEN Obligations Profile allowed a PDP to return obligations to a PEP that had given no indication that it would enforce them. Under this specification, adoption is an explicit, per-request signal. A PEP that does not send `supported_mandatory_extensions` is treated as not having adopted any extension, and receives a plain core DENY wherever policy requires a mandatory-to-understand element.

This is the safe direction of failure, but it is a change in behavior that existing deployments must make deliberately. Such deployments need to update their PEPs to send `supported_mandatory_extensions` before they upgrade their PDPs. Otherwise, requests that previously received a PERMIT with mandatory elements will receive a DENY. {{OBLIGATIONS-CORE}} describes the corresponding changes for obligations.

# Security Considerations {#security-considerations}

**Opt-in forgery.** `supported_mandatory_extensions` is safety-critical. A forged opt-in, on a request from a PEP that has not adopted the extension, causes the PDP to emit mandatory-to-understand elements that the PEP ignores. The PEP then grants access unconditionally. Implementers MUST authenticate the opt-in to the Enforcing PEP and bind it to the request (invariant 7). A stripped opt-in fails safe.

**Intermediaries and downgrade.** An opt-in established for one hop can be wrongly assumed for another, for example when a gateway forwards a response to a PEP that implements only the core specification. Intermediaries MUST follow {{enforcing-pep}}.

**Response tampering.** Removing a mandatory-to-understand element from a PERMIT in transit converts a conditional grant into an unconditional one. Responses that carry such elements MUST be integrity-protected between the PDP and the Enforcing PEP.

**Cache confusion.** A decision computed for a PEP that has adopted an extension MUST NOT be served from a cache to a PEP that has not, or to one with different item declarations. Cache keys MUST include every capability declaration that affects the decision ({{capabilities}}).

**Capability declarations as attributes.** A policy that treats a capability declaration as an authorization attribute can be manipulated by a PEP that over- or under-declares its capabilities. Capability declarations MUST be identifiable as protocol declarations, and SHOULD NOT be used as policy inputs other than to select which elements to emit ({{capabilities}}).

**Inferred authority.** A consumer that infers authority from the presence of an artifact, rather than from its defined verification semantics, can be tricked into granting access. Implementers MUST follow invariant 3.

**Commitment is not proof.** Listing an extension in `supported_mandatory_extensions` is a commitment by the PEP, not proof that it enforces the extension correctly. A PDP that relies on mandatory-to-understand elements for critical controls SHOULD, where possible, verify or audit enforcement independently.

# Privacy Considerations

Capability declarations can reveal information about a PEP's deployment, such as which extensions and which items it supports. Together, they can act as a fingerprint of the deployment. PDPs SHOULD NOT log or disclose capability declarations beyond what is needed for decision-making and audit.

Extensions that carry personal data in their members MUST describe the privacy implications in their own Privacy Considerations.

# IANA Considerations {#iana-considerations}

Identifiers of different kinds have different namespaces and registration requirements, and MUST NOT be combined in a single registry. This specification establishes registries for JSON member names, extension identifiers, and profile identifiers. Registries of enumerated type identifiers are established by the extensions that define them. Capability identifiers continue to use the AuthZEN Policy Decision Point Capabilities Registry established by {{AUTHZEN}}.

Each registry states the concrete representation of its identifiers. Identifiers registered by OpenID Foundation specifications MAY be short names. Third parties MUST use collision-resistant identifiers, such as absolute URIs or identifiers prefixed with a domain name they control.

**Processing strength is immutable.** The processing strength of a registered member is part of its registration, and cannot be changed. Changing a member from advisory to mandatory-to-understand, or the reverse, is a compatibility and security break, and MUST be done by registering a new identifier, not by changing the existing registration.

## AuthZEN JSON Members Registry {#iana-json-members}

IANA is requested to create a new registry titled "AuthZEN JSON Members" under the "AuthZEN Parameters" registry group. Registration requests are evaluated under the Specification Required policy {{RFC8126}}.

The registry records extension members added to named objects of the AuthZEN protocol ({{surface}}). Each registration MUST include:

- Member name
- Location: the named object on which the member appears (for example, request `context` or decision `context`)
- Processing strength: Advisory, Mandatory-to-Understand, or, for members outside the decision `context` that have none, "Not applicable"
- Extension Identifier, if the member is mandatory-to-understand
- Short description
- Change controller
- Reference to the defining specification

A member name MUST be unique within its location. Designated experts SHOULD reject a registration whose name is likely to be confused with a core member, or with another member in the same location.

### Initial Registry Contents

| Member | Location | Processing strength | Extension Identifier | Description | Reference |
|---|---|---|---|---|---|
| `supported_mandatory_extensions` | Request `context` | Advisory | (none) | Extensions whose mandatory-to-understand processing the Enforcing PEP commits to. | {{opt-in}} |
{: #tab-iana-json-members title="Initial AuthZEN JSON Members registration"}

## AuthZEN Extension Identifiers Registry {#iana-extension-identifiers}

IANA is requested to create a new registry titled "AuthZEN Extension Identifiers" under the "AuthZEN Parameters" registry group. Registration requests are evaluated under the Specification Required policy {{RFC8126}}.

The registry records the identifiers that a PEP lists in `supported_mandatory_extensions`. Only extensions that define at least one mandatory-to-understand member are registered. Each registration MUST include:

- Extension Identifier
- Short description
- The mandatory-to-understand members the extension defines, which MUST also be registered in the "AuthZEN JSON Members" registry
- Change controller
- Reference to the defining specification, which MUST meet the requirements of {{extension-requirements}}

Designated experts SHOULD verify that the defining specification states the fail-closed behavior, the PDP outcome when adoption cannot be established, and the unknown handling required by {{extension-requirements}}.

This specification makes no initial registrations. The `obligations` identifier is registered by {{OBLIGATIONS-CORE}}.

## AuthZEN Profile Identifiers Registry {#iana-profile-identifiers}

IANA is requested to create a new registry titled "AuthZEN Profile Identifiers" under the "AuthZEN Parameters" registry group. Registration requests are evaluated under the Specification Required policy {{RFC8126}}.

The registry records identifiers for profiles, protocol integration profiles, and transport bindings, which parties MAY use to advertise support in metadata. Each registration MUST include:

- Profile identifier: a URN in the `urn:openid:authzen:profile:` namespace for OpenID Foundation specifications, or an absolute URI for others
- Kind: Profile, Protocol Integration Profile, or Transport Binding
- The extensions the profile selects, by Extension Identifier or specification reference
- Short description
- Change controller
- Reference to the defining specification

A profile identifier is a discovery and routing aid. For example, {{STANDARD-TYPES-PROFILE}} registers `urn:openid:authzen:profile:obligations-standard-types`. It MUST NOT be listed in `supported_mandatory_extensions` ({{per-extension}}).

This specification makes no initial registrations.

## Registries of Enumerated Types

An extension that defines an enumerated set of type identifiers, such as obligation types, advice types, or reason codes, SHOULD establish its own registry for them. That registry MUST state the representation of its identifiers, and MUST be separate from the registries established here. {{OBLIGATIONS-CORE}}, which establishes the "AuthZEN Obligation Types" registry, is an example.

## AuthZEN Policy Decision Point Capabilities Registry

Extensions that a PDP advertises in its `capabilities` metadata register their capability URNs in the existing "AuthZEN Policy Decision Point Capabilities" registry {{AUTHZEN}}. This specification makes no registration in that registry. A PDP that understands `supported_mandatory_extensions` needs no capability URN to say so, because the signal is self-bootstrapping ({{bootstrapping}}).

# Acknowledgements

This specification is based on the AuthZEN Extensibility Model proposal {{EXT-PROPOSAL}}. The authors also acknowledge the OpenID AuthZEN Working Group for the base specification, and for the discussions of obligations, advice, and access requests that motivated this model.
