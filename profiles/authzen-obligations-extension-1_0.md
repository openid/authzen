---
title: "AuthZEN Obligations Extension - Draft 1"
abbrev: "authzen-obligations-ext"
category: std
date: 2026-10-06
ipr: none
docname: authzen-obligations-extension-1_0
consensus: true
workgroup: OpenID AuthZEN
keyword:
  - authorization
  - obligations
  - AuthZEN
  - extensibility
  - policy enforcement
stand_alone: true
smart_quotes: no
pi: [toc, sortrefs, symrefs, private]
author:
  -
    fullname: Alexandre Babeanu
    organization: Indykite
    email: alex.babeanu@indykite.com
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
  AUTHZEN-EXT:
    title: "AuthZEN Extensibility Model"
    target: https://gist.github.com/mcguinness/caab9ff46a8b0123cfa84645e9a60a7f
    author:
      -
        name: Karl McGuinness
    date: 2026
informative:
  RFC8259:
  XACML:
    title: "eXtensible Access Control Markup Language (XACML) Version 3.0"
    target: http://docs.oasis-open.org/xacml/3.0/xacml-3.0-core-spec-os-en.html
    author:
      -
        name: OASIS
    date: 2013
  ARAP:
    title: "AuthZEN Access Request and Approval Profile"
    target: https://github.com/openid/authzen/blob/main/profiles/authzen-access-request-approval/authzen-access-request-approval-profile-1_0.md
    author:
      -
        name: OpenID AuthZEN Working Group
    date: 2026
  OBLIGATIONS-PROFILE:
    title: "AuthZEN Obligations Profile"
    target: https://openid.github.io/authzen/authzen-obligations-profile-1_0.html
    author:
      -
        name: Alexandre Babeanu
        org: Indykite
    date: 2026

--- abstract

This specification defines the AuthZEN Obligations Extension, a reusable, use-case-neutral extension of the OpenID AuthZEN Authorization API. The extension defines the `obligations` member. A Policy Decision Point (PDP) uses this member to attach one or more mandatory, machine-readable actions to an authorization decision. The specification defines the Obligation object, the member's mandatory-to-understand processing strength and fail-closed rule, and the handling of unknown and absent members for permits, denials, Search results, and side effects. It also defines the opt-in and negotiation mechanism by which a Policy Enforcement Point (PEP) commits to enforcing obligations, the binding requirements for that decision-relevant state, composition with other extensions, discovery, and the AuthZEN Obligation Types registry. The extension follows the AuthZEN Extensibility Model. Concrete Obligation Types for common use cases are defined separately, by profiles such as the AuthZEN Obligations Profile.

--- middle

# Introduction

The OpenID AuthZEN Authorization API {{AUTHZEN}} defines a simple, protocol-agnostic API. A Policy Enforcement Point (PEP) uses it to submit an authorization query to a Policy Decision Point (PDP), and receives back a decision object whose primary member is a boolean `decision` field. In many real-world deployments, a binary allow/deny decision is insufficient. The PDP frequently needs to require the PEP to take additional, mandatory actions as a condition of, or companion to, the decision it renders. Examples include logging an access for accountability, notifying a third party, forcing a step-up authentication, or transforming data before returning it.

These requirements are commonly grouped under the term "obligations" in prior authorization standards such as {{XACML}}. This specification defines an analogous mechanism that is native to AuthZEN. Obligations are carried exclusively inside existing, open-ended members of AuthZEN responses, so the mechanism remains interoperable with implementations of the base AuthZEN specification that are unaware of it. A PDP returns obligations only to a PEP that has explicitly opted in to enforcing them, as defined in {{negotiation}}.

This specification does not attempt to define a general-purpose workflow or orchestration language. Obligations are intentionally coarse-grained, declarative instructions. How a PEP actually performs an obligation (e.g., which SMTP relay it uses to send a notification) is implementation-specific and out of scope.

## Relationship to Profiles {#structure}

Following the AuthZEN Extensibility Model {{AUTHZEN-EXT}}, this document is an extension. It defines reusable surface and processing rules, and does not depend on any particular Obligation Type. It defines only one type, the bilateral `custom` type ({{obligation-custom}}).

Profiles select this extension and define Obligation Types for particular use cases, together with their conformance requirements. The AuthZEN Obligations Profile {{OBLIGATIONS-PROFILE}} is one such profile. It defines the Normative Obligation Types `step-up`, `notification`, and `session_termination`. Other profiles MAY build on this extension and define their own Obligation Types, without adopting the Obligations Profile.

Some non-normative examples in this document use Obligation Types defined in {{OBLIGATIONS-PROFILE}}. They do so for illustration only, and implementing this extension does not require implementing those types.

## Requirements Notation and Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 {{RFC2119}} {{RFC8174}}
when, and only when, they appear in all capitals, as shown here.

## Terminology

This specification uses the terms "Policy Enforcement Point" (PEP), "Policy Decision Point" (PDP), "subject", "resource", "action", and "context" as defined in {{AUTHZEN}}. It uses the terms "extension", "profile", "advisory", and "mandatory-to-understand" as defined in {{AUTHZEN-EXT}}. Additionally, this specification uses the following terms:

Obligation:

: A mandatory instruction, expressed as a JSON object, that a PDP returns to a PEP alongside an authorization decision. The PEP MUST execute the instruction in order to properly enforce that decision.

Obligation Type:

: A unique, registered identifier (the `type` member of an Obligation object) that determines the semantics of an Obligation and the meaning of its type-specific properties.

Obligations Extension:

: The extension defined by this specification, identified by the extension identifier `obligations`.

Custom Obligation:

: An Obligation whose `type` is `custom`. Its semantics are defined bilaterally between a specific PDP and PEP implementation, and are out of scope of this specification.

Enforcing PEP:

: The PEP that will actually enforce the decision returned by the PDP. The Enforcing PEP is not necessarily the immediate caller of the PDP's API, for example when the request passes through a gateway or other intermediary.

Adopting PEP:

: An Enforcing PEP that has listed the `obligations` extension identifier in the `supported_mandatory_extensions` member of the request context ({{opt-in}}), and so has committed to the fail-closed processing of this extension for that request.

# Design Overview

This specification makes the following core design choices:

1. Obligations are carried in the `context` member of an AuthZEN decision, under the `obligations` key. In Search responses, they are carried in the top-level response `context`, in the `context` of individual results, or both ({{search-requests}}). When a decision carries no obligations, the PDP omits the key, and the response is an ordinary core AuthZEN response.

2. The `obligations` member is **mandatory-to-understand** ({{processing-strength}}). The core AuthZEN default is that an unknown member is ignorable. A PDP therefore returns obligations only to an Adopting PEP, that is, a PEP that has explicitly listed `obligations` in `supported_mandatory_extensions` in the request context. When policy requires an obligation that the Enforcing PEP has not committed to enforcing, the PDP returns a plain core DENY instead ({{pdp-outcome}}).

3. Obligations MAY be attached to a response regardless of the value of the `decision` field. In both cases, the obligations are mandatory for an Adopting PEP.

4. An Adopting PEP that cannot comply with an obligation MUST treat a PERMIT as a DENY. A DENY remains a DENY, and the PEP still executes every obligation it can. For Search requests, the PEP excludes only the results to which the obligation applies ({{search-requests}}). The handling of unknown members and values is defined separately for permits, denials, Search results, and side effects ({{unknown-handling}}).

5. The opt-in signal and the per-type capability declaration change the response a PDP returns. They are therefore decision-relevant state, and MUST be authenticated and bound to the request ({{binding}}).

6. A PDP advertises its support for the extension, and the Obligation Types it can issue, through its AuthZEN metadata ({{metadata-extension}}).

# Extension Identifier and Processing Strength {#processing-strength}

The Obligations Extension is identified by the extension identifier `obligations`. A party uses this identifier in the `supported_mandatory_extensions` request context member ({{opt-in}}). The extension is also identified by the capability URN `urn:openid:authzen:capability:obligations` in PDP metadata ({{metadata-extension}}).

The `obligations` member, wherever it appears, is **mandatory-to-understand**. An Adopting PEP that does not understand an Obligation, or cannot apply it, MUST treat a PERMIT as a DENY, as defined in {{non-compliance}}.

Under the core AuthZEN processing rules, a receiver MUST ignore members it does not understand. For a permit, a PEP that does not understand information in the decision context MAY reject the decision. Mandatory-to-understand semantics therefore bind only a PEP that has adopted this extension. A PDP MUST NOT rely on them against a PEP that has not adopted it. The rules in {{pdp-outcome}} ensure that a PDP never relies on them in that way.

The processing strength of the `obligations` member is fixed. A future revision MUST NOT change it to advisory under the same identifier ({{iana-considerations}}).

# Extension Surface {#extension-surface}

The Obligations Extension adds the following members to the AuthZEN protocol. Each member is a registered, namespaced extension member ({{iana-considerations}}). The presence of a member is itself the signal that the extension applies.

| Member | Location | Direction | Defined in |
|---|---|---|---|
| `obligations` | Decision `context` (Access Evaluation; each Decision of an Access Evaluations response) | PDP to PEP | {{obligation-object}} |
| `obligations` | Search response `context`, and the `context` of individual Search result objects | PDP to PEP | {{search-requests}} |
| `context` | Individual result objects of a Search response | PDP to PEP | {{search-requests}} |
| `supported_mandatory_extensions` (entry `obligations`) | Request `context` | PEP to PDP | {{opt-in}} |
| `supported_obligations` | Request `context` | PEP to PDP | {{item-negotiation}} |
| `supported_obligations` | PDP metadata | PDP to PEP | {{metadata-extension}} |
| `urn:openid:authzen:capability:obligations` | PDP metadata `capabilities` | PDP to PEP | {{metadata-extension}} |
{: #tab-extension-surface title="Members defined or used by the Obligations Extension"}

The Obligations Extension does not redefine or change the meaning of any core member. In particular, the meaning of `decision` is unchanged. A PDP-issued PERMIT remains a PERMIT on the wire. The fail-closed rule of {{non-compliance}} governs only how an Adopting PEP enforces that decision.

# The Obligation Object {#obligation-object}

Obligations are carried as a JSON array under the `obligations` key of the AuthZEN decision `context` object:

~~~ json
{
  "decision": true,
  "context": {
    "obligations": [
      {
        "id": "...",
        "type": "...",
        "properties": { "...": "..." }
      }
    ]
  }
}
~~~
{: #fig-obligations-envelope title="Obligations carried in the decision context"}

The value of `obligations` MUST be a non-empty JSON array. Each element of the array is a JSON object (an "Obligation object") with the following members:

id:

: REQUIRED. A String. Uniquely identifies this Obligation instance within the enclosing Decision or Search response. In a Search response, an obligation that the PDP repeats from the top-level `context` into a per-result `context` keeps the same `id` ({{search-requests}}). This allows a PEP to unambiguously report success or failure of individual obligations (e.g., in logs) when more than one Obligation is returned.

type:

: REQUIRED. A String. A unique, registered identifier for the type of obligation being requested. The value is drawn from the "AuthZEN Obligation Types" registry ({{iana-obligation-types}}), or is the literal value `custom` ({{obligation-custom}}).

properties:

: REQUIRED. A JSON object containing properties specific to the Obligation Type. The members of this object are defined by the specification of each Obligation Type.

The relative order of elements in the `obligations` array carries no normative meaning. A PEP MUST be capable of executing obligations in any order, or concurrently, unless the definition of an Obligation Type, or a bilateral agreement, specifies otherwise. All obligations present in a given decision are mandatory and independent. Partial execution is addressed in {{non-compliance}}.

## Defining Obligation Types {#defining-types}

A specification that defines a new Obligation Type MUST define:

- the members of its `properties` object, and which of them are REQUIRED;
- what it means for a PEP to comply with the type;
- its handling of unrecognized members of `properties` and of unrecognized values, if that handling differs from the default in {{unknown-handling}}.

Such a specification registers the type in the "AuthZEN Obligation Types" registry ({{iana-obligation-types}}).

## custom {#obligation-custom}

The `custom` Obligation Type allows a PDP and a tightly coupled PEP to exchange Obligation instances whose semantics are agreed bilaterally and are out of scope of this specification. The `properties` of a `custom` Obligation MAY carry any members. The bilateral agreement defines how unrecognized members are handled.

PDP implementers SHOULD prefer a registered Obligation Type over `custom`, or register a new Obligation Type per {{iana-obligation-types}}, wherever interoperability across independently developed PEPs is desired. `custom` is subject to {{pdp-outcome}} like any other type. A PDP MUST NOT emit it unless the Adopting PEP listed `custom` in `supported_obligations`. A PEP that does not recognize the specific semantics intended for a given `custom` Obligation instance MUST treat it as an Obligation it cannot comply with ({{non-compliance}}).

The following is a non-normative example of a `custom` obligation used to request document watermarking:

~~~ json
{
  "type": "custom",
  "id": "obl-4",
  "properties": {
    "vendor": "example-dlp-suite",
    "action": "watermark",
    "watermark_text": "CONFIDENTIAL - jdoe@example.com - 2026-07-03"
  }
}
~~~
{: #fig-obligation-custom title="Non-normative example of a custom obligation"}

# Adoption and Negotiation {#negotiation}

The Obligations Extension uses two levels of negotiation, as described in {{AUTHZEN-EXT}}. The first is a coarse, safety-critical opt-in, by which the Enforcing PEP commits to the extension's fail-closed processing. The second is a fine, per-type declaration, by which the PEP lists the Obligation Types it can execute.

## Support Opt-In: supported_mandatory_extensions {#opt-in}

An Enforcing PEP that adopts the Obligations Extension MUST include the extension identifier `obligations` in the `supported_mandatory_extensions` array of the request `context`:

~~~ json
{
  "subject": { "type": "user", "id": "alice@example.com" },
  "resource": { "type": "account", "id": "acct-123" },
  "action": { "name": "read" },
  "context": {
    "supported_mandatory_extensions": ["obligations"],
    "supported_obligations": ["step-up", "notification"]
  }
}
~~~
{: #fig-request-opt-in title="Enforcing PEP opting in to the Obligations Extension"}

By listing `obligations`, the PEP makes a stronger claim than an ordinary capability advertisement. It asserts that it will not grant access if it cannot understand or enforce an obligation in the response, and that it will apply the rules of {{pep-compliance}} and {{unknown-handling}}. A PEP MUST NOT list `obligations` unless it implements those rules.

The opt-in refers to the Enforcing PEP, which may not be the immediate caller of the PDP. Requirements for intermediaries are defined in {{binding}}.

`supported_mandatory_extensions` is defined by {{AUTHZEN-EXT}}, not by this specification. The following rules from that model apply:

- A PDP that understands `supported_mandatory_extensions` but does not implement an extension listed in it treats that entry as a no-op. It MUST NOT reject the request merely because the PEP listed an extension the PDP does not implement.
- A PDP that does not understand `supported_mandatory_extensions` ignores it, sees no adoption, and therefore never emits obligations. This is the safe outcome.

## Item Negotiation: supported_obligations {#item-negotiation}

An Adopting PEP SHOULD also include a `supported_obligations` array in the request `context`. The array lists the Obligation Types (including `custom`, where applicable) that the PEP is able to execute. Each value MUST be an Obligation Type registered per {{iana-obligation-types}}, or the literal value `custom`, and SHOULD be drawn from the set the PDP advertises in its `supported_obligations` metadata ({{metadata-extension}}). A PDP MUST ignore any value in a request's `supported_obligations` that it did not itself advertise, treating the request as though that value were absent. It MUST NOT reject the request because of such a value.

`supported_obligations` is advisory with respect to safety. Listing a type does not by itself make it safe for a PDP to emit an obligation of that type. Only the opt-in of {{opt-in}} does that. However, `supported_obligations` does constrain which types a PDP emits to an Adopting PEP, as defined in {{pdp-outcome}}. When an Adopting PEP omits `supported_obligations`, the PDP MUST treat the omission as an empty array.

The PDP SHOULD NOT treat `supported_mandatory_extensions` or `supported_obligations` as authorization attributes. They are protocol declarations, and SHOULD influence only which obligations the PDP emits and whether it must fall back to a DENY, as defined in {{pdp-outcome}}. They MUST NOT be used to widen access in any other way.

## PDP Outcome {#pdp-outcome}

When evaluating a request, the PDP MUST determine its outcome as follows:

| Condition | PDP outcome |
|---|---|
| Policy requires no obligation | Ordinary core decision, without an `obligations` member. |
| Policy requires one or more obligations, and the request does not list `obligations` in `supported_mandatory_extensions` | Plain core DENY, without an `obligations` member. |
| The request lists `obligations` in `supported_mandatory_extensions`, but an Obligation Type that policy requires is not listed in `supported_obligations` | Plain core DENY, unless the PDP can satisfy the same policy goal with a type the PEP did list (see below). The DENY carries no obligation of an unlisted type. |
| The request lists `obligations` in `supported_mandatory_extensions`, and every Obligation Type that policy requires is listed in `supported_obligations` | The decision that policy dictates (PERMIT or DENY), together with the required obligations. |
{: #tab-pdp-outcome title="PDP outcome by adoption and item support"}

Consequently:

- A PDP MUST NOT include an `obligations` member in any response, whether PERMIT or DENY, to a request whose Enforcing PEP has not listed `obligations` in `supported_mandatory_extensions`. The PDP MUST NOT omit a policy-required obligation and return a PERMIT. It MUST return a plain core DENY instead.
- A PDP MUST NOT emit, to an Adopting PEP, an obligation whose type the PEP did not list in `supported_obligations`. Where policy permits, the PDP MAY instead select a different Obligation Type that achieves an equivalent policy goal and that the PEP did list.
- When policy requires an obligation on a DENY that the PDP cannot emit under these rules (for example, an accountability notification), the decision remains DENY. The PDP MUST NOT assume that the side effect will be performed. It SHOULD fulfill the policy goal by other means under its own control, for example by recording the event in its own audit log.

## Placement by Endpoint {#placement}

Declarations are always carried in the request `context`. Placement therefore differs by endpoint as follows:

| Endpoint | Where the PEP declares | Behavior |
|---|---|---|
| Access Evaluation | Request `context` | The declarations apply to the single evaluation. |
| Access Evaluations (batch) | Top-level `context`, or per-evaluation `context` | The top-level `context` is a default that a per-evaluation `context` overrides rather than merges with. A PEP that sets a per-evaluation `context` MUST repeat `supported_mandatory_extensions` and `supported_obligations` in it, because the top-level declarations do not carry into an evaluation that supplies its own `context`. The PDP applies {{pdp-outcome}} to each evaluation separately, and returns obligations in the `context` of each individual Decision. |
| Search (subject, resource, action) | Request `context` | The declarations apply to the whole search. In the response, obligations in the top-level `context` apply to every result, and a per-result `context` overrides the top-level `context` for that result rather than merging with it ({{search-requests}}). |
| PDP metadata | Not per request | The PDP advertises the extension and the Obligation Types it can issue ({{metadata-extension}}). |
{: #tab-placement title="Placement of declarations by endpoint"}

The Access Evaluations response defines no top-level response context. This extension therefore defines no request-wide obligations for that endpoint. Every obligation belongs to exactly one Decision.

# PEP Compliance Semantics {#pep-compliance}

This section applies to an Adopting PEP.

## Obligations on PERMIT Decisions

When a PDP returns `"decision": true` together with one or more Obligation objects, the grant of access is conditional on the PEP executing every returned Obligation. If the PEP executes all returned obligations successfully, it MUST honor the decision and grant access. If the PEP cannot, or does not, comply with one or more of the returned obligations ({{non-compliance}}), it MUST treat the response as though `"decision": false` had been returned, and MUST NOT grant access.

Where an obligation must be satisfied before access is granted (for example, a step-up authentication), the PEP MUST NOT grant access until the obligation has been satisfied.

## Obligations on DENY Decisions

When a PDP returns `"decision": false` together with one or more Obligation objects, the PEP MUST still deny access, and MUST, in addition, execute every returned Obligation. Obligations on a DENY decision are commonly used for accountability purposes (e.g., logging a denied access attempt, or notifying a security team of a suspicious request). They do not change the outcome of the access decision. They are additional requirements on how the PEP handles the denial.

Obligations never widen a decision. A PEP MUST NOT treat the presence, or the successful execution, of an obligation attached to a DENY as granting access. For example, after completing a step-up authentication required by an obligation attached to a DENY, the PEP MAY submit a new request to the PDP. The new request carries the newly established authentication context as input, and access remains denied unless and until the PDP returns a new PERMIT.

## Obligations and Search Requests {#search-requests}

{{AUTHZEN}} defines Search-shaped interactions, in which the PDP returns the set of subjects, resources, or actions for which access is permitted, rather than evaluating a single subject/resource/action tuple. Withholding an entire Search response because the PEP cannot comply with an obligation attached to one or more individual results would be disproportionate. It would deny the requestor visibility into data they may otherwise be entitled to see.

For Search responses, obligations are placed as follows:

- **Top-level.** Obligations in the `obligations` member of the Search response's top-level `context` apply to every result in the response.
- **Per result.** A result object MAY carry its own `context` member, containing an `obligations` member, which applies to that result only. A per-result `context` overrides the top-level `context` for that result rather than merging with it. The obligations that apply to a result are therefore those in its own `context` if it has one, and those in the top-level `context` otherwise.

Because a per-result `context` replaces the top-level default, a PDP that sets a per-result `context` MUST repeat in it every top-level obligation that applies to that result, with the same `id`. A per-result `context` without an `obligations` member means that no obligation applies to that result. This mirrors the override rule for per-evaluation `context` in batch requests ({{placement}}).

This specification defines the `context` member of a Search result object as the per-result counterpart of the Search response `context`. Other extensions MAY define their own members within it.

The rules of {{pdp-outcome}} apply per result. A result whose inclusion requires an obligation that the PDP may not emit, under {{pdp-outcome}}, MUST be omitted from the results, exactly as if access to it had been denied.

The PEP executes each distinct Obligation, identified by its `id`, at most once per Search response, even when it applies to several results. For example, a top-level notification obligation results in one notification, not one per result.

If the PEP cannot comply with an Obligation, it MUST exclude every result to which that Obligation applies from the result set it returns. For a top-level Obligation, these are every result without its own `context`, and every result whose `context` repeats it. The PEP MUST NOT otherwise withhold the Search response, and MUST continue to return every other result for which either no Obligation applies, or all applicable Obligations were executed successfully.

The following non-normative example shows an AuthZEN Resource Search response. A top-level notification obligation applies to every result that has no `context` of its own. The first result overrides the top-level `context`: it requires only a step-up authentication, which the PEP must enforce before it can display that result. The second result has no `context`, so the top-level notification applies to it.

~~~ json
{
  "context": {
    "obligations": [
      {
        "type": "notification",
        "id": "obl-1",
        "properties": {
          "to": ["audit@example.com"],
          "body": "User jdoe listed accounts."
        }
      }
    ]
  },
  "results": [
    {
      "type": "account",
      "id": "123",
      "context": {
        "obligations": [
          {
            "type": "step-up",
            "id": "obl-2",
            "properties": {
              "acr_value": "urn:com:example:loa:3",
              "amr_values": ["mfa", "hwk"]
            }
          }
        ]
      }
    },
    {
      "type": "account",
      "id": "456"
    }
  ]
}
~~~
{: #fig-obligation-search-items title="Non-normative example of obligations in a Resource Search response"}

## Non-Compliance and Partial Compliance {#non-compliance}

A PEP "cannot comply" with an Obligation when any of the following is true:

- The PEP does not recognize the Obligation's `type` value.
- The PEP recognizes the `type` value but does not implement support for it.
- The Obligation instance is malformed. For example, it lacks a REQUIRED member, has a member of the wrong JSON type, or carries an unrecognized member in `properties` ({{unknown-handling}}).
- The Obligation refers to something the PEP is unable to perform. For example, a step-up obligation may specify an authentication context that the PEP's authentication system does not support.
- The PEP attempted to execute the Obligation and the execution failed (e.g., a notification whose transmission failed after retries).

When a PEP cannot comply with one or more Obligations in a decision (outside of the Search case in {{search-requests}}), the PEP MUST:

1. Treat the overall response as a DENY, regardless of the value of the `decision` member that was returned.
2. Nonetheless execute every Obligation in the decision that it does understand and is able to execute, notably including any notification or logging-type obligations, so that accountability and auditability are preserved even when the access itself is not granted.

The PEP SHOULD record each Obligation it could not comply with, identified by its `id` and `type`, in its own logs.

# Unknown, Malformed, and Absent Members {#unknown-handling}

This section defines how an Adopting PEP, and a PDP, handle unknown members, unknown values, and the absence of members. The handling is defined separately for permits, denials, Search results, and side effects. "More restrictive" is not applied as a general rule. Each case is defined explicitly.

| Situation | PERMIT | DENY | Search result |
|---|---|---|---|
| Unrecognized `type` value | Treat as DENY. Execute the other obligations. | Remains DENY. Execute the other obligations. The unrecognized obligation is not performed. | Exclude every result to which the obligation applies. |
| Recognized `type`, but unrecognized member in `properties` | Cannot comply, unless the type's definition declares the member ignorable. Treat as DENY. | Remains DENY. Execute the other obligations. | Exclude every result to which the obligation applies. |
| Recognized `type`, but unsupported value of a recognized property | Cannot comply. Treat as DENY. | Remains DENY. Execute the other obligations. | Exclude every result to which the obligation applies. |
| Malformed `obligations` member (not a non-empty array of objects) | Treat as DENY. | Remains DENY. | Exclude every result to which the member applies. |
| Unrecognized member of the Obligation object, outside `properties` | Ignore the member. | Ignore the member. | Ignore the member. |
| `obligations` member absent | Ordinary core PERMIT. | Ordinary core DENY. | Ordinary result. |
{: #tab-unknown-handling title="Adopting PEP handling of unknown, malformed, and absent members"}

Unrecognized members of the Obligation object outside `properties` are ignorable so that the object can evolve. A future revision of this extension MUST NOT add a member to the Obligation object, outside `properties`, whose being ignored would weaken enforcement. Such a change requires a new extension identifier.

**Side effects.** An obligation on a DENY, or an obligation that an Adopting PEP executes while treating a PERMIT as a DENY, is a required side effect. If the PEP cannot perform such a side effect, no more restrictive outcome is available, because the decision is already a DENY. In that case the PEP:

- MUST NOT grant access;
- MUST NOT retry the side effect indefinitely, and SHOULD apply a bounded retry policy appropriate to the Obligation Type;
- SHOULD record the failure, identified by the Obligation's `id` and `type`.

A PDP MUST NOT assume that a side effect was performed ({{security-considerations}}).

**Non-adopters.** Under core AuthZEN processing, a PEP that has not adopted this extension ignores the `obligations` member. It may therefore grant a PERMIT without executing any obligation, or deny without performing a required side effect. {{pdp-outcome}} prevents this, because the PDP never sends `obligations` to such a PEP.

**PDP-side handling.** A PDP handles unknown and absent request members as follows:

- An extension identifier in `supported_mandatory_extensions` that the PDP does not implement is a no-op ({{opt-in}}).
- A value in `supported_obligations` that the PDP did not advertise is ignored ({{item-negotiation}}).
- The absence of `supported_mandatory_extensions`, or the absence of `obligations` from it, means that the Enforcing PEP has not adopted the extension.
- The absence of `supported_obligations` from an Adopting PEP's request is equivalent to an empty array.

**Core interoperability.** In every case, the absence of the members defined by this extension reduces to a plain core AuthZEN allow or deny. A PEP or PDP that implements only the core specification remains interoperable with one that implements this extension.

# Binding of Decision-Relevant State {#binding}

The `supported_mandatory_extensions` and `supported_obligations` declarations change the response a PDP returns. An Adopting PEP may receive a PERMIT with obligations where a non-adopter would receive a DENY. These declarations, and the `obligations` member of the response, are therefore decision-relevant state, and the following requirements apply.

**Authentication and integrity of the opt-in.** The opt-in MUST be authenticated to the Enforcing PEP and integrity-protected in transit. Forgery is the dangerous case. If the opt-in is stripped, the PDP sees no adoption and returns a DENY, which is safe. If the opt-in is forged onto a request from a PEP that has not adopted the extension, the PDP emits obligations that the PEP ignores, and the PEP grants access. A PDP MUST honor the opt-in only when it can establish that the Enforcing PEP asserted it. Examples include a direct caller that is authenticated as the Enforcing PEP, or a request whose integrity and origin are otherwise verifiable.

**Intermediaries.** An intermediary (such as a gateway or aggregator) that is not itself the Enforcing PEP:

- MUST NOT add `obligations` to `supported_mandatory_extensions` on behalf of an Enforcing PEP that has not asserted it, and MUST NOT carry an opt-in established for one hop over to a different hop or a different Enforcing PEP;
- MUST NOT remove, alter, or drop any element of an `obligations` member in a response;
- MUST, if it cannot deliver obligations unchanged to an Adopting Enforcing PEP, treat any PERMIT that carries obligations as a DENY.

**Integrity of the response.** Removing obligations from a PERMIT in transit would turn a conditional grant into an unconditional one. The response MUST therefore be integrity-protected between the PDP and the Enforcing PEP.

**Caching and evaluation identity.** A PDP or PEP that caches decisions MUST include `supported_mandatory_extensions` and `supported_obligations` in the cache key. A cached decision MUST NOT be reused for a request with different declarations, or for a different Enforcing PEP. Where another profile binds an evaluation's identity to its request context, these declarations MUST be covered by that binding. An example is the `binding_hash` of {{ARAP}}.

# Composition {#composition}

**Core AuthZEN.** The Obligations Extension adds members only. It does not change the meaning of `subject`, `resource`, `action`, `context`, or `decision`.

**Batch evaluations.** Each Decision in an Access Evaluations response is processed independently. A PEP that treats one Decision as a DENY under {{non-compliance}} does not thereby affect the other Decisions. It also does not affect any short-circuit semantics already applied by the PDP.

**Requestable denials ({{ARAP}}).** A DENY MAY carry both `access_request` and `obligations` in its context. The PEP executes the obligations as required for a DENY ({{pep-compliance}}). Independently, it MAY pursue the access request. Neither member changes the meaning of the other, and the decision remains a DENY. A later re-evaluation that follows an approval is a new evaluation. Any obligations returned with its decision are subject to {{pdp-outcome}} for that request, based on the declarations in its request context.

**Advisory members.** Where another extension defines advisory members in the decision context (for example, advice), those members MUST NOT relax, replace, or override an obligation. When both are present, the obligations alone determine whether an Adopting PEP may grant a PERMIT.

**Other mandatory-to-understand extensions.** When a decision carries mandatory-to-understand members of several extensions, an Adopting PEP MUST satisfy the fail-closed rule of each. A PERMIT is honored only when every such rule permits it.

**Profiles.** A profile that defines Obligation Types (for example, {{OBLIGATIONS-PROFILE}}) MUST NOT relax any requirement of this extension. It MAY add conformance requirements, such as requiring a PEP to implement particular types.

# Discovery: PDP Metadata {#metadata-extension}

A PDP that implements the Obligations Extension MUST include the capability URN `urn:openid:authzen:capability:obligations` in the `capabilities` member of its metadata {{AUTHZEN}}. It MUST also include a `supported_obligations` metadata member. This member is an array of Strings, each of which MUST be an Obligation Type registered per {{iana-obligation-types}}, or the literal value `custom`, that the PDP is capable of issuing.

A PDP that does not implement this extension MAY omit both. The absence of `supported_obligations` is equivalent to an empty array.

The following is a non-normative example of a metadata fragment:

~~~ json
{
  "capabilities": [
    "urn:openid:authzen:capability:obligations"
  ],
  "supported_obligations": [
    "step-up",
    "notification",
    "custom"
  ]
}
~~~
{: #fig-metadata-example title="Example PDP metadata advertising the Obligations Extension"}

Discovery is the PDP-to-PEP direction. It lets a PEP check whether a PDP supports the extension before relying on it. Discovery is not an opt-in. A PDP MUST NOT treat a PEP as having adopted the extension on the basis of metadata or out-of-band configuration alone. Adoption is established only by the per-request signal of {{opt-in}}.

# Protocol Flow

A conformant deployment proceeds as follows:

1. The PEP retrieves PDP metadata. It checks for the capability URN `urn:openid:authzen:capability:obligations`, and inspects `supported_obligations` to learn which Obligation Types the PDP may issue.
2. When the Enforcing PEP submits an AuthZEN evaluation or Search request, it opts in by listing `obligations` in `supported_mandatory_extensions` in the request `context`. It also declares, in `supported_obligations`, the Obligation Types it can execute ({{negotiation}}). In a batch request, it repeats both declarations in every per-evaluation `context` it supplies.
3. The PDP evaluates policy and determines its outcome per {{pdp-outcome}}. If policy requires obligations and the Enforcing PEP has adopted the extension and supports the required types, the PDP includes them under `context.obligations` (or, for Search, in the top-level response `context` or in the `context` of the affected results), whether `decision` is `true` or `false`. Otherwise, it returns a plain core DENY, or omits the affected Search results.
4. The PEP applies {{pep-compliance}} and {{unknown-handling}}. It executes every Obligation it can. It treats a PERMIT as a DENY if it cannot comply with any Obligation, except for Search requests, where it instead excludes only the results to which that Obligation applies. It executes every Obligation it does understand even when treating the response as a DENY.

# Examples

## Example: PERMIT with a Custom Obligation

The following is a non-normative example of an AuthZEN response to an Adopting PEP that listed `custom` in `supported_obligations`. The response grants access to a document, on condition that the PEP applies a watermark before returning it:

~~~ json
{
  "decision": true,
  "context": {
    "obligations": [
      {
        "type": "custom",
        "id": "obl-1",
        "properties": {
          "vendor": "example-dlp-suite",
          "action": "watermark",
          "watermark_text": "jdoe@example.com - 2026-07-03T14:02:00Z"
        }
      }
    ]
  }
}
~~~
{: #fig-example-grant-transform title="PERMIT response with a custom obligation"}

## Example: Request from a PEP That Has Not Opted In

The following is a non-normative example of a request that carries no `supported_mandatory_extensions`:

~~~ json
{
  "subject": { "type": "user", "id": "jdoe" },
  "resource": { "type": "record", "id": "patient-4471" },
  "action": { "name": "view" }
}
~~~
{: #fig-example-no-opt-in-request title="Request without an opt-in"}

Suppose that policy would grant this access on condition of an obligation. Because the Enforcing PEP has not adopted the Obligations Extension, the PDP returns a plain core DENY ({{pdp-outcome}}):

~~~ json
{
  "decision": false
}
~~~
{: #fig-example-no-opt-in-response title="Plain core DENY returned to a PEP that has not opted in"}

## Example: Search Response with an Unsupported Obligation

The following is a non-normative example of a Search response listing three candidate resources, where the second carries an Obligation that the PEP is unable to execute:

~~~json
{
  "context": {
    "query_execution_time_ms": 42
  },
  "results": [
    {
      "type": "Document",
      "id": "doc-1"
    },
    {
      "type": "Document",
      "id": "doc-2",
      "context": {
        "obligations": [
          {
            "type": "notification",
            "id": "obl-2",
            "properties": {
              "to": ["manager@example.com"],
              "topic": "Protected Document Access",
              "body": "User AliceSmith attempted to read Document \"doc-2\" from Europe."
            }
          }
        ]
      }
    },
    {
      "type": "Document",
      "id": "doc-3"
    }
  ]
}
~~~
{: #fig-example-search title="Search response with a per-result obligation"}

A PEP that is unable to perform the notification MUST return `doc-1` and `doc-3` to the requestor, and MUST exclude `doc-2`, per {{search-requests}}.

## Example: Batch Request with a Per-Evaluation Context

In the following non-normative example, the second evaluation supplies its own `context`. That context replaces the top-level default, so it repeats the declarations:

~~~ json
{
  "subject": { "type": "user", "id": "jdoe" },
  "action": { "name": "view" },
  "context": {
    "supported_mandatory_extensions": ["obligations"],
    "supported_obligations": ["notification"]
  },
  "evaluations": [
    {
      "resource": { "type": "record", "id": "patient-4471" }
    },
    {
      "resource": { "type": "record", "id": "patient-4472" },
      "context": {
        "ip": "203.0.113.10",
        "supported_mandatory_extensions": ["obligations"],
        "supported_obligations": ["step-up"]
      }
    }
  ]
}
~~~
{: #fig-example-batch title="Batch request repeating declarations in a per-evaluation context"}

# Security Considerations {#security-considerations}

**Opt-in forgery.** The opt-in of {{opt-in}} is safety-critical. A forged opt-in on a request from a PEP that has not adopted the extension causes the PDP to emit obligations that the PEP ignores, so the PEP grants access unconditionally. Implementers MUST apply the authentication, integrity, and intermediary requirements of {{binding}}. A stripped opt-in fails safe.

**Response tampering.** Removing obligations from a PERMIT in transit converts a conditional grant into an unconditional one. Responses MUST be integrity-protected between the PDP and the Enforcing PEP ({{binding}}).

**Cache confusion.** A decision computed for an Adopting PEP MUST NOT be served from a cache to a PEP that has not adopted the extension, or to one with a different `supported_obligations`. Otherwise a PERMIT-with-obligations could reach a PEP that ignores the obligations ({{binding}}).

**Unverified execution.** Obligations that a non-conformant PEP silently drops, or executes only partially, can create a false sense of enforcement. For example, an access may be granted and appear in the PDP's policy audit as having been logged or watermarked, while the PEP in fact failed to do so. Listing `obligations` in `supported_mandatory_extensions` is a commitment by the PEP, not a proof of execution. This specification has no mechanism by which a PEP can attest, within the AuthZEN protocol itself, that an Obligation was executed. Implementers of PDPs that rely on Obligations for critical controls (accountability logging, step-up authentication, or data transformation) SHOULD, where possible, verify or audit PEP compliance independently and out of band, rather than relying solely on the PEP's self-reported behavior.

**Untrusted obligation content.** A malicious or compromised PDP could craft obligations that cause a PEP to perform harmful actions with its own privileges. PEPs SHOULD treat the `properties` of every Obligation as untrusted input, and SHOULD validate them as they would any other externally influenced instruction. Specifications that define Obligation Types SHOULD describe the type-specific risks.

**Defensive processing.** Even an Adopting PEP that has declared `supported_obligations` MUST be prepared to apply {{non-compliance}} and {{unknown-handling}} to any response it receives, including one that contains Obligation Types it did not declare. A misconfigured or non-conformant PDP may send such a response.

# Privacy Considerations

Obligations may carry personal data, for example a subject's identifier or the details of the resource accessed. Implementers SHOULD apply data minimization to the content of Obligations. They SHOULD also protect the transport and storage of Obligation content, both at the PDP and at the PEP, in proportion to the sensitivity of the data it may describe.

The `supported_obligations` declaration can reveal information about a PEP's deployment, for example which authentication or messaging capabilities it has. PDPs SHOULD NOT log or disclose these declarations beyond what is needed for decision-making and audit.

# IANA Considerations {#iana-considerations}

The Extensibility Model {{AUTHZEN-EXT}} expects separate registries for JSON member names, enumerated type identifiers, capability identifiers, and profile identifiers. The registrations below follow that separation. The processing strength of each member registered here is part of its registration, and is immutable. Changing a member from mandatory-to-understand to advisory, or the reverse, MUST be done by registering a new identifier, not by an in-place change.

## AuthZEN Obligation Types Registry {#iana-obligation-types}

IANA is requested to create a new registry titled "AuthZEN Obligation Types" under the "AuthZEN Parameters" registry group. Registration requests are evaluated under the Specification Required policy {{RFC8126}}.

Each registration MUST include:

- Obligation Type name (the `type` value)
- A short description
- A reference to the specification that defines the type's properties, its compliance semantics, and its handling of unknown properties and values (see {{defining-types}})
- Change controller

### Initial Registry Contents

This specification requests the following initial registration:

| Type | Description | Reference |
|---|---|---|
| custom | Reserved for bilaterally agreed obligations outside the scope of any registered type. | {{obligation-custom}} |
{: #tab-iana-registrations title="Initial AuthZEN Obligation Types registration"}

## AuthZEN Policy Decision Point Capabilities Registry

This specification requests registration of the following PDP capability in the "AuthZEN Policy Decision Point Capabilities" registry established by {{AUTHZEN}}.

Capability Name:
: `obligations`

Capability URN:
: `urn:openid:authzen:capability:obligations`

Capability Description:
: Indicates that the PDP implements the Obligations Extension, and may return obligations to an Enforcing PEP that has opted in.

Change Controller:
: OpenID Foundation AuthZEN Working Group
: mailto:openid-specs-authzen@lists.openid.net

Specification Document(s):
: This specification

## AuthZEN Policy Decision Point Metadata Registry

This specification requests registration of the following metadata parameter in the "AuthZEN Policy Decision Point Metadata" registry established by {{AUTHZEN}}.

Metadata Name:
: `supported_obligations`

Metadata Description:
: Array of the Obligation Types the PDP is capable of issuing.

Change Controller:
: OpenID Foundation AuthZEN Working Group
: mailto:openid-specs-authzen@lists.openid.net

Specification Document(s):
: {{metadata-extension}} of this specification

## Mandatory Extension Identifier

This specification defines the extension identifier `obligations` for use in the `supported_mandatory_extensions` request context member defined by {{AUTHZEN-EXT}}. When a registry of extension identifiers is established, this identifier is to be registered with a reference to this specification.

## JSON Member Names

When a registry of AuthZEN JSON member names is established, the following members are to be registered with a reference to this specification:

| Member | Location | Processing strength | Reference |
|---|---|---|---|
| `obligations` | Decision context; Search response context; Search result `context` | Mandatory-to-understand (for an Adopting PEP) | {{obligation-object}}, {{search-requests}} |
| `context` | Search result object | Container; the processing strength of each member is defined by the extension that defines it | {{search-requests}} |
| `supported_obligations` | Request context | Advisory | {{item-negotiation}} |
{: #tab-iana-members title="JSON members defined by the Obligations Extension"}

# Acknowledgements

The author acknowledges the OpenID AuthZEN Working Group for the base specification on which this document builds, and the AuthZEN Extensibility Model {{AUTHZEN-EXT}} for the extension structure it follows. The author also acknowledges prior obligation-bearing access-control models, notably {{XACML}}, for informing the design of the Obligation object model.
