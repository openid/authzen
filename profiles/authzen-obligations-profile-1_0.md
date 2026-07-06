---
title: "AuthZEN Profile for Obligations - Draft 1"
abbrev: "authzen-obligations"
category: std
date: 2026-07-03
ipr: none
docname: authzen-obligations-profile-1_0
consensus: true
workgroup: OpenID AuthZEN
keyword:
  - authorization
  - obligations
  - AuthZEN
  - fine-grained authorization
  - policy enforcement
stand_alone: true
smart_quotes: no
pi: [toc, sortrefs, symrefs, private]
author:
  -
    fullname: Alexandre Babeanu
    organization: Indykite
    email: alex@indykite.com
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
  OPENID-CORE:
    title: "OpenID Connect Core 1.0"
    target: https://openid.net/specs/openid-connect-core-1_0.html
    author:
      -
        name: Nat Sakimura
      -
        name: John Bradley
      -
        name: Michael B. Jones
      -
        name: Breno de Medeiros
      -
        name: Chuck Mortimore
    date: 2014
informative:
  RFC8259:
  XACML:
    title: "eXtensible Access Control Markup Language (XACML) Version 3.0"
    target: http://docs.oasis-open.org/xacml/3.0/xacml-3.0-core-spec-os-en.html
    author:
      -
        name: OASIS
    date: 2013
  OIDC-LOGOUT:
    title: "OpenID Connect Front-Channel and Back-Channel Logout 1.0"
    target: https://openid.net/specs/openid-connect-frontchannel-1_0.html
    author:
      -
        name: OpenID Foundation
    date: 2022
  SSF:
    title: "OpenID Shared Signals Framework Specification 1.0"
    target: https://openid.net/specs/openid-sharedsignals-framework-1_0-final.html
    author:
      -
        name: A. Tulshibagwale
      -
        name: T. Capalli
      -
        name: M. Scurtescu
      -
        name: A. Backman
      -
        name: J. Bradley
      -
        name: S. Miel

--- abstract

This specification defines a profile of the OpenID AuthZEN Authorization API for expressing obligations. It introduces a standardized mechanism, called the Obligations Profile, by which a Policy Decision Point (PDP) can attach one or more mandatory, machine-readable actions to an authorization decision. A Policy Enforcement Point (PEP) that receives such a decision MUST perform every attached action in order to honor it. This profile defines the Obligation object model, PEP compliance semantics for PERMIT and DENY decisions and for Search-shaped requests, a set of Normative Obligation Types ready for immediate implementation, and a discovery and negotiation mechanism by which PDPs and PEPs establish which Obligation Types they mutually support.

--- middle

# Introduction

The OpenID AuthZEN Authorization API {{AUTHZEN}} defines a simple, protocol-agnostic API by which a Policy Enforcement Point (PEP) submits an authorization query to a Policy Decision Point (PDP) and receives back a decision object whose primary member is a boolean `decision` field. In many real-world deployments, a binary allow/deny decision is insufficient: the PDP frequently needs to require the PEP to take additional, mandatory actions as a condition of, or companion to, the decision it renders.

Common examples include:

- **Logging and Accountability**: recording access attempts, especially for sensitive data (e.g., logging that a doctor accessed a patient's medical record under emergency conditions).
- **Notifications**: triggering alerts or sending emails (e.g., notifying a manager of an unauthorized access attempt).
- **Multi-Factor Authentication / Trust Elevation**: redirecting a user to an additional authentication step after an initial decision (e.g., requiring a higher assurance authentication method).
- **Data Transformation**: watermarking a document before it is returned to a user, or masking PII or other sensitive attributes in fetched data.
- **Requesting Human Approval**: for human-in-the-loop use cases, where a human must approve an action or an access request before it is considered final.

These requirements are commonly grouped under the term "obligations" in prior authorization standards such as {{XACML}}. This specification, the AuthZEN Obligations Profile, defines an analogous, but AuthZEN-native, mechanism. It is designed to be backward compatible with implementations of the base AuthZEN specification that are unaware of this profile: obligations are carried exclusively inside the existing, open-ended `context` member of an AuthZEN response, and PDPs that do not implement this profile simply never populate that member with obligations.

This profile does not attempt to define a general-purpose workflow or orchestration language. Obligations are intentionally coarse-grained, declarative instructions; how a PEP actually performs an obligation (e.g., which SMTP relay it uses to send a notification) is implementation-specific and out of scope.

## Requirements Notation and Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 {{RFC2119}} {{RFC8174}}
when, and only when, they appear in all capitals, as shown here.

## Terminology

This specification uses the terms "Policy Enforcement Point" (PEP), "Policy Decision Point" (PDP), "subject", "resource", "action", and "context" as defined in {{AUTHZEN}}. Additionally, this specification uses the following terms:

Obligation:

: A mandatory instruction, expressed as a JSON object, that a PDP returns to a PEP alongside an authorization decision, and which the PEP MUST execute in order to properly enforce that decision.

Obligation Type:

: A unique, IANA-registered identifier (the `type` member of an Obligation object) that determines the semantics of an Obligation and the meaning of its type-specific members.

Normative Obligation Type:

: An Obligation Type defined by this specification, with fixed, standardized semantics and member names, intended to be interoperably implementable without further bilateral agreement between PDP and PEP implementers.

Custom Obligation:

: An Obligation whose `type` is `custom`, whose semantics are defined bilaterally between a specific PDP and PEP implementation and are out of scope of this specification.

Obligations Metadata:

: An extension to AuthZEN PDP metadata (see {{AUTHZEN}}) by which a PDP advertises the Obligation Types it is capable of issuing.

# Design Overview

This profile makes the following core design choices:

1. Obligations are OPTIONALLY added by the PDP to the `context` member of an AuthZEN response, under a reserved key, `obligations`. A PDP that has nothing to say about obligations simply omits this key; existing AuthZEN PEPs are unaffected.

2. Obligations MAY be attached to a response regardless of the value of the `decision` field. That is, a PDP MAY return obligations alongside `"decision": true` (PERMIT) or `"decision": false` (DENY). In both cases, the obligations are mandatory.

3. A PEP that receives obligations it cannot or does not understand MUST treat the overall response as a DENY, regardless of the original value of `decision`. The single exception is defined in {{search-requests}} for Search-shaped requests, where the PEP instead filters, rather than withholds, results.

4. A companion discovery mechanism ({{metadata-extension}}) and negotiation mechanism ({{negotiation}}) allow PDPs and PEPs to establish, ahead of any given decision request, which Obligation Types are mutually supported, reducing the likelihood of an unenforceable decision at runtime.

# The Obligation Object {#obligation-object}

Obligations are carried as a JSON array under the `obligations` key of the AuthZEN response `context` object:

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
{: #fig-obligations-envelope title="Obligations carried in the response context"}

Each element of the `obligations` array is a JSON object (an "Obligation object") with the following members:

id:

: REQUIRED. A String. Uniquely identifies this Obligation instance within the enclosing response `context`. This allows a PEP to unambiguously report success or failure of individual obligations (e.g., in logs) when more than one Obligation is returned.

type:

: REQUIRED. A String. A unique, IANA-registered identifier for the type of obligation being requested, drawn from the "AuthZEN Obligation Types" registry defined in {{iana-obligation-types}}, or the literal value `custom` (see {{obligation-custom}}).

properties:

: REQUIRED. A JSON object containing obligation type-specific properties. The additional members are defined per Obligation Type; see {{normative-obligation-types}} for the members required by each Normative Obligation Type, and {{obligation-custom}} for `custom` obligations.

The relative order of elements in the `obligations` array carries no normative meaning; a PEP MUST be capable of executing obligations in any order, or concurrently, unless a future profile or bilateral agreement specifies otherwise. All obligations present in a given response are mandatory and independent: partial execution is addressed in {{non-compliance}}.

# PEP Compliance Semantics

## Obligations on PERMIT Decisions

When a PDP returns `"decision": true` together with one or more Obligation objects, the grant of access is conditioned on the PEP executing every returned Obligation. If the PEP executes all returned obligations successfully, it MUST honor the decision and grant access. If the PEP cannot, or does not, comply with one or more of the returned obligations (see {{non-compliance}} for what "cannot comply" means), the PEP MUST treat the response as though `"decision": false` had been returned, and MUST NOT grant access.

## Obligations on DENY Decisions

When a PDP returns `"decision": false` together with one or more Obligation objects, the PEP MUST still deny access, and MUST, in addition, execute every returned Obligation. Obligations on a DENY decision are commonly used for accountability purposes (e.g., logging a denied access attempt, or notifying a security team of a suspicious request) and do not change the outcome of the access decision; they are additive requirements on the PEP's handling of the denial.

## Obligations and Search Requests {#search-requests}

{{AUTHZEN}} defines a Search-shaped interaction in which a PEP asks a PDP to filter a candidate set of resources, subjects, or actions down to those for which access is permitted, rather than evaluating a single subject/resource/action tuple. Withholding an entire Search response because the PEP cannot comply with an obligation attached to one or more of the individual results would be disproportionate, denying the requestor visibility into data they may otherwise be entitled to see.

Accordingly, for Search requests: if the PDP returns per-result Obligations and the PEP cannot comply with an Obligation attached to a given result, the PEP MUST exclude only that result from the returned result set. The PEP MUST NOT withhold the entire Search response, and MUST continue to return every other result for which either no Obligation was returned, or all attached Obligations were executed successfully.

The following non-normative example showcases an AuthZEN Resource Search result, where the first element requires a Step-Up authentication. The PEP must enforce this step-action before it can display this data element. In this example, the second resource element doesn't have any obligations attached, the PEP can therefore return this data item to the requesting Client right away.

~~~ json
{
  "page": {
    "count": 2,
    "total": 102
  },
  "context": {
    "query_execution_time_ms": 42
  },
  "results": [
    {
      "type": "account",
      "id": "123",
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
- The PEP recognizes and implements the `type`, but the Obligation instance is malformed (e.g., missing a REQUIRED type-specific member) or refers to a resource or action the PEP is unable to perform (e.g., a `step-up` obligation specifying an `acr_value` the PEP's authentication system does not support).
- The PEP attempted to execute the Obligation and the execution failed (e.g., a `notification` obligation whose transmission failed after retries).

When a PEP cannot comply with one or more Obligations in a response (outside of the Search case in {{search-requests}}), the PEP MUST:

1. Treat the overall response as a DENY, regardless of the value of the `decision` member that was returned.
2. Nonetheless execute every Obligation in the response that it DOES understand and is able to execute, notably including any `notification` or logging-type obligations, so that accountability and auditability are preserved even when the access itself is not granted.

A PDP that anticipates a PEP may be unable to satisfy an Obligation it would otherwise be required to issue for a given decision MAY, at its own discretion and based on its internal policy, choose instead to issue a DENY decision outright (with or without its own accompanying Obligations), rather than issuing a PERMIT it expects the PEP cannot lawfully enforce. This specification does not mandate how a PDP makes that choice; it is informed by the negotiation mechanism of {{negotiation}}, when used.

# Normative Obligation Types {#normative-obligation-types}

This section defines the initial set of Normative Obligation Types. Each is registered in the IANA "AuthZEN Obligation Types" registry ({{iana-obligation-types}}).

## step-up {#obligation-step-up}

The `step-up` obligation requires the PEP to force the requesting subject through an additional authentication step before the associated decision may be considered enforceable, so that the subject's authenticated session reaches a specified level of assurance.

Obligation-specific members:

acr_value:

: REQUIRED. A String. The Authentication Context Class Reference {{OPENID-CORE}} that the requesting subject MUST achieve. The PEP MUST cause the subject to re-authenticate, or otherwise establish, an authenticated context satisfying this value before honoring the decision. Example: `urn:com:example:loa:3`.

amr_values:

: OPTIONAL. A JSON array of case-sensitive Strings identifying the Authentication Methods References {{OPENID-CORE}} that MUST be used during the re-authentication. Implementers SHOULD register these values with IANA where a suitable registry is available. Example: `["mfa", "hwk"]`.

The following is a non-normative example of a `step-up` obligation:

~~~ json
{
  "type": "step-up",
  "id": "obl-1",
  "properties": {
    "acr_value": "urn:com:example:loa:3",
    "amr_values": ["mfa", "hwk"]
  }
}
~~~
{: #fig-obligation-step-up title="Non-normative example of a step-up obligation"}

## notification {#obligation-notification}

The `notification` obligation requires the PEP to transmit a message to a destination. This specification is transport-agnostic: the destination MAY be an email address, a phone number, a pub/sub topic, a webhook, or any other implementation-meaningful identifier.

Obligation-specific members:

to:

: REQUIRED. A String. An implementation-specific identifier for the destination of the notification (e.g., an email address such as `manager@example.com`, or a queue/topic name). The identifier MUST be unique and meaningful within the deploying implementer's environment.

body:

: REQUIRED. A String. The payload of the notification message.

topic:

: OPTIONAL. A String. A short, high-level subject or purpose for the message, e.g., an email subject line, or a routing topic identifier for a pub/sub transport.

The following is a non-normative example of a `notification` obligation:

~~~ json
{
  "type": "notification",
  "id": "obl-2",
  "properties": {
    "to": "manager@example.com",
    "topic": "Unauthorized access attempt",
    "body": "User jdoe attempted to access patient record 4471 outside of business hours."
  }
}
~~~
{: #fig-obligation-notification title="Non-normative example of a notification obligation"}

## session_termination {#obligation-session-termination}

The `session_termination` obligation requires the PEP to initiate whatever flow is necessary to terminate all active sessions belonging to the specified subject, including, where the deployment spans a federation, sessions established at other participating parties (e.g., via {{OIDC-LOGOUT}} front-channel or back-channel logout mechanisms, or via a {{SSF}} implementation).

Obligation-specific members:

subject:

: REQUIRED. A String. The unique identifier of the subject whose sessions MUST be terminated.

The following is a non-normative example of a `session_termination` obligation:

~~~ json
{
  "type": "session_termination",
  "id": "obl-3",
  "properties": {
    "subject": "jdoe@example.com"
  }
}
~~~
{: #fig-obligation-session-termination title="Non-normative example of a session_termination obligation"}

## custom {#obligation-custom}

The `custom` Obligation Type allows a PDP and a tightly-coupled PEP to exchange Obligation instances whose semantics are agreed bilaterally and are out of scope of this specification. A `custom` Obligation MAY carry any additional members beyond `type` and `id`.

PDP implementers SHOULD prefer a registered Normative Obligation Type, or register a new Obligation Type per {{iana-obligation-types}}, over `custom` wherever interoperability across independently developed PEPs is desired. A PEP that does not recognize the specific semantics intended for a given `custom` Obligation instance MUST treat it as an Obligation it "cannot comply" with, per {{non-compliance}}.

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

# Discovery: PDP Metadata Extension {#metadata-extension}

{{AUTHZEN}} defines a metadata discovery mechanism by which a PEP learns the capabilities of a PDP. This profile adds a new metadata member, `supported_obligations`, an array of Strings, each of which MUST be either an Obligation Type registered per {{iana-obligation-types}}, or the literal value `custom`, that the PDP is capable of issuing.

A PDP that implements this profile MUST include `supported_obligations` in its metadata document. A PDP that supports no obligations, or does not implement this profile, MAY omit the member entirely; its absence is equivalent to an empty array.

The following is a non-normative example of a metadata fragment:

~~~ json
{
  "supported_obligations": [
    "step-up",
    "notification",
    "session_termination",
    "custom"
  ]
}
~~~
{: #fig-metadata-example title="Example PDP metadata advertising supported obligation types"}

# Negotiation: PEP-Declared Obligation Support {#negotiation}

Because a PDP's decision may need to differ depending on which Obligation Types the requesting PEP is actually able to execute, this profile allows a PEP to declare, on a per-request basis, the Obligation Types it supports, by including an `supported_obligations` array in the `context` member of the AuthZEN request:

~~~ json
{
  "subject": { "...": "..." },
  "resource": { "...": "..." },
  "action": { "...": "..." },
  "context": {
    "supported_obligations": ["notification", "step-up"]
  }
}
~~~
{: #fig-request-negotiation title="PEP declaring supported obligation types in a request"}

Every value in a request's `supported_obligations` array MUST be drawn from the set the PDP has itself advertised via its `supported_obligations` metadata ({{metadata-extension}}); a PDP MUST ignore any value in a request that it did not itself advertise as supported, treating the request as though that value were absent.

Inclusion of this member is OPTIONAL. A PDP MUST treat the absence of `supported_obligations` in a request as no information about PEP capability, and remains free to return any Obligation Types it deems necessary for the decision; the PEP compliance semantics of {{obligation-object}} through {{non-compliance}} continue to apply unconditionally in that case.

Declaring `supported_obligations` in a request is advisory to the PDP's policy evaluation; it does not by itself change the AuthZEN response contract. A PDP MAY use this information to avoid issuing an Obligation Type the PEP has declared it cannot execute -- for example, by issuing a DENY outright, by selecting a different, supported Obligation Type that achieves an equivalent policy goal, or by proceeding to issue the unsupported Obligation Type anyway, if its own internal policy requires it regardless of PEP capability, in accordance with {{non-compliance}}.

# Protocol Flow

A conformant deployment of this profile proceeds as follows:

1. The PEP retrieves PDP metadata and inspects `supported_obligations` to learn which Obligation Types the PDP may issue.
2. The PEP, when it submits an AuthZEN decision or Search request, MAY include its own `supported_obligations` array in the request `context`, restricted to values the PDP advertised in step 1.
3. The PDP evaluates policy and constructs its response. If its policy requires one or more mandatory PEP actions as a condition of, or companion to, the decision, it includes them as Obligation objects under `context.obligations` in the response, per {{obligation-object}}, regardless of whether `decision` is `true` or `false`.
4. The PEP inspects any returned Obligations and applies the compliance rules of {{non-compliance}}: executing every Obligation it is able to; treating the response as DENY if it cannot comply with any Obligation (except for Search requests, where it instead excludes only the non-compliant result, per {{search-requests}}); and executing every Obligation it does understand even when treating the response as a DENY.

# Examples

## Example: PERMIT with a Data Transformation Obligation

The following is a non-normative example of an AuthZEN response granting access to a document, conditioned on the PEP applying a watermark before returning it:

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
{: #fig-example-grant-transform title="PERMIT response with a data transformation obligation"}

## Example: DENY with a Step-Up Obligation

The following is a non-normative example of an AuthZEN response denying access until the subject completes step-up authentication:

~~~ json
{
  "decision": false,
  "context": {
    "obligations": [
      {
        "type": "step-up",
        "id": "obl-1",
        "properties": {
          "acr_value": "urn:com:example:loa:3",
          "amr_values": ["mfa"]
        }
      }
    ]
  }
}
~~~
{: #fig-example-deny-stepup title="DENY response with a step-up obligation"}

A PEP capable of driving the subject through step-up authentication MAY re-submit the request after the subject achieves the required ACR; until then, access remains denied.

## Example: Search Response with an Unsupported Obligation

The following is a non-normative example of a Search response listing three candidate resources, where the second carries an Obligation the PEP does not support:

~~~json
{
  "page": {
    "count": 2,
    "total": 102
  },
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
      "obligations": [
        {
          "type": "notification",
          "id": "obl-2",
          "properties": {
            "to": "manager@example.com",
            "topic": "Protected Document Access",
            "body": "User AliceSmith attempted to read Document "doc-2" from Europe."
          }
        }
      ]
    },
    {
      "type": "Document",
      "id": "doc-3"
    }
  ]
}
~~~
{: #fig-example-search title="Search response with a per-result obligation"}

A PEP unable to perform a notification mid-Search MUST return `doc-1` and `doc-3` to the requestor, and MUST exclude `doc-2`, per {{search-requests}}.

## Example: Metadata Discovery Response

~~~ json
{
  "policy_decision_point": "https://pdp.example.com",
  "supported_obligations": [
    "step-up",
    "notification",
    "session_termination"
  ]
}
~~~
{: #fig-example-metadata title="Example PDP metadata document"}

## Example: PEP-Declared Support in a Request

~~~ json
{
  "subject": { "type": "user", "id": "jdoe" },
  "resource": { "type": "record", "id": "patient-4471" },
  "action": { "name": "view" },
  "context": {
    "supported_obligations": ["notification"]
  }
}
~~~
{: #fig-example-negotiation title="Request declaring PEP-supported obligation types"}

# Security Considerations

Obligations that are silently dropped or only partially executed by a non-conformant PEP can create a false sense of enforcement (e.g., an access is granted, and appears in the PDP's policy audit as having been logged or watermarked, while the PEP in fact failed to do so). Implementers of PDPs that rely on Obligations for critical controls (accountability logging, step-up authentication, or data transformation) SHOULD, where possible, independently verify or audit PEP compliance out-of-band, rather than relying solely on the PEP's self-reported behavior, since this profile has no built-in mechanism for a PEP to attest, within the AuthZEN protocol itself, that an Obligation was in fact executed.

A malicious or compromised PDP could attempt to abuse the `notification` Obligation Type to cause a PEP to relay attacker-controlled content to an arbitrary destination (e.g., using the PEP's trusted mail relay to send spam or phishing content). PEPs SHOULD treat `to` and `body` values in `notification` Obligations as untrusted input, and SHOULD apply the same validation, rate-limiting, and content-safety controls they would apply to any other externally influenced message-sending operation.

The negotiation mechanism of {{negotiation}} is advisory only. A PEP MUST NOT assume that declaring `supported_obligations` in a request guarantees the PDP will avoid issuing an unsupported Obligation Type; the PDP retains discretion per {{negotiation}}, and the PEP MUST still be prepared to apply the compliance rules of {{non-compliance}} to any response it receives, including one containing Obligation Types it did not declare support for.

# Privacy Considerations

`notification` Obligations, and `custom` Obligations built for similar purposes, may carry personal data (e.g., a subject's identifier or the details of the resource accessed) in their `body` or other members. Implementers SHOULD apply data minimization to the content of such Obligations, and SHOULD ensure that transport and storage of Obligation content, both at the PDP and at the PEP, is protected commensurate with the sensitivity of the data it may describe.

# IANA Considerations

## AuthZEN Obligation Types Registry {#iana-obligation-types}

IANA is requested to create a new registry titled "AuthZEN Obligation Types" under a to-be-determined "AuthZEN Parameters" registry group. Registration requests are evaluated under the Specification Required policy {{RFC8126}}.

Each registration MUST include:

- Obligation Type name (the `type` value)
- A short description
- A reference to the specification defining the type's members and semantics
- Change controller

## Initial Registry Contents

This specification requests the following initial registrations:

| Type | Description | Reference |
|---|---|---|
| step-up | Requires the PEP to force the subject through additional authentication to reach a specified ACR. | {{obligation-step-up}} |
| notification | Requires the PEP to transmit a message to a destination. | {{obligation-notification}} |
| session_termination | Requires the PEP to terminate all sessions of a subject. | {{obligation-session-termination}} |
| custom | Reserved for bilaterally agreed obligations outside this specification's scope. | {{obligation-custom}} |
{: #tab-iana-registrations title="Initial AuthZEN Obligation Types registrations"}

# Acknowledgements {#acknowledgements numbered="false"}

The author acknowledges the OpenID AuthZEN Working Group for the base specification upon which this profile builds, and prior obligation-bearing access-control models (notably {{XACML}}) for informing the design of this profile's Obligation object model.
