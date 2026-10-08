---
title: "AuthZEN Obligations Profile - Draft 1"
abbrev: "authzen-obligations"
category: std
date: 2026-10-06
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
    email: alex.babeanu@indykite.com
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
  OBLIGATIONS-EXT:
    title: "AuthZEN Obligations Extension"
    target: https://openid.github.io/authzen/authzen-obligations-extension-1_0.html
    author:
      -
        name: Alexandre Babeanu
        org: Indykite
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
  AUTHZEN-EXT:
    title: "AuthZEN Extensibility Model"
    target: https://gist.github.com/mcguinness/caab9ff46a8b0123cfa84645e9a60a7f
    author:
      -
        name: Karl McGuinness
    date: 2026
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

This specification defines the AuthZEN Obligations Profile. The profile selects the AuthZEN Obligations Extension, by which a Policy Decision Point (PDP) attaches mandatory, machine-readable actions to an authorization decision. It defines a set of Normative Obligation Types for common use cases: step-up authentication, notification, and session termination. These types are ready for immediate implementation. The profile also defines the conformance requirements for PDPs and PEPs that implement them.

--- middle

# Introduction

The AuthZEN Obligations Extension {{OBLIGATIONS-EXT}} defines how a Policy Decision Point (PDP) attaches obligations to an AuthZEN {{AUTHZEN}} decision. Obligations are mandatory actions that a Policy Enforcement Point (PEP) must perform in order to honor the decision. The extension defines the Obligation object, its fail-closed processing, the opt-in and negotiation mechanism, and the "AuthZEN Obligation Types" registry. However, it intentionally defines no Obligation Types for specific use cases.

This profile fills that gap for common use cases, several of which are familiar from prior authorization standards such as {{XACML}}:

- **Multi-Factor Authentication / Trust Elevation**: requiring the subject to complete an additional authentication step that reaches a higher level of assurance ({{obligation-step-up}}).
- **Notifications and Accountability**: alerting a manager, a security team, or the person whose data was accessed ({{obligation-notification}}).
- **Session Termination**: ending all sessions of a subject, for example in response to suspicious activity ({{obligation-session-termination}}).

## Relationship to the Obligations Extension {#structure}

Following the AuthZEN Extensibility Model {{AUTHZEN-EXT}}, this document is a profile. It selects and constrains the Obligations Extension, defines a type vocabulary, and defines conformance. All processing rules are defined in {{OBLIGATIONS-EXT}} and apply unchanged. These include the Obligation object, PEP compliance on PERMIT and DENY decisions, the handling of Search results, non-compliance, unknown-member handling, the PDP outcome rules, binding, and discovery. This profile does not relax any of them.

The profile carries mandatory-to-understand elements only through the Obligations Extension. It is therefore adopted on the wire by opting in to that extension, by listing `obligations` in `supported_mandatory_extensions` in the request context. It requires no separate negotiation signal. Whether a party implements a given type of this profile is reflected in the `supported_obligations` values it advertises (PDP) or declares (PEP).

## Requirements Notation and Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 {{RFC2119}} {{RFC8174}}
when, and only when, they appear in all capitals, as shown here.

## Terminology

This specification uses the terms "Policy Enforcement Point" (PEP), "Policy Decision Point" (PDP), "subject", "resource", "action", and "context" as defined in {{AUTHZEN}}. It uses the terms "Obligation", "Obligation Type", "Obligations Extension", "Enforcing PEP", and "Adopting PEP" as defined in {{OBLIGATIONS-EXT}}. Additionally, this specification uses the following term:

Normative Obligation Type:

: An Obligation Type defined by this profile. It has fixed, standardized semantics and member names, and is intended to be interoperably implementable without further bilateral agreement between PDP and PEP implementers.

# Conformance {#conformance}

A PDP conforms to the Obligations Profile if it:

- implements the Obligations Extension {{OBLIGATIONS-EXT}};
- lists, in its `supported_obligations` metadata, each Normative Obligation Type it can issue;
- emits each Normative Obligation Type only with the members, and in the circumstances, defined for that type in {{normative-obligation-types}}.

A PEP conforms to the Obligations Profile if it:

- implements the Obligations Extension, and lists `obligations` in `supported_mandatory_extensions` on every request for which it is the Enforcing PEP;
- lists in `supported_obligations` exactly the Normative Obligation Types (and `custom`, where applicable) that it implements;
- implements each Normative Obligation Type it lists, as defined in {{normative-obligation-types}}.

# Normative Obligation Types {#normative-obligation-types}

This section defines the Normative Obligation Types. Each is registered in the "AuthZEN Obligation Types" registry established by {{OBLIGATIONS-EXT}} ({{iana-considerations}}).

Each type below is carried in the `properties` member of an Obligation object, as defined in {{OBLIGATIONS-EXT}}. Unless stated otherwise, an unrecognized member in the `properties` of a Normative Obligation Type means that the PEP cannot comply with the obligation. A PEP that cannot comply with an obligation applies the non-compliance rules of {{OBLIGATIONS-EXT}}: it treats a PERMIT as a DENY, keeps a DENY as a DENY while still executing the obligations it can, and, for Search, excludes only the results to which the obligation applies.

## step-up {#obligation-step-up}

The `step-up` obligation requires the PEP to force the requesting subject through an additional authentication step before the associated decision may be considered enforceable, so that the subject's authenticated session reaches a specified level of assurance.

Obligation-specific members:

acr_value:

: REQUIRED. A String. The Authentication Context Class Reference {{OPENID-CORE}} that the requesting subject MUST achieve. The PEP MUST cause the subject to re-authenticate, or otherwise establish, an authenticated context satisfying this value before honoring the decision. Example: `urn:com:example:loa:3`.

amr_values:

: OPTIONAL. A JSON array of case-sensitive Strings identifying the Authentication Methods References {{OPENID-CORE}} that MUST be used during the re-authentication. Implementers SHOULD register these values with IANA where a suitable registry is available. Example: `["mfa", "hwk"]`.

A PEP that does not support the requested `acr_value`, or one of the requested `amr_values`, cannot comply with the obligation.

On a PERMIT, the PEP MUST NOT grant access until the step-up has completed successfully. On a DENY, completing the step-up does not grant access. The PEP MAY submit a new request after the subject achieves the required authentication context, and access remains denied unless and until the PDP returns a new PERMIT to that request.

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

The `notification` obligation requires the PEP to transmit a message to one or more destinations. This specification is transport-agnostic. A destination MAY be an email address, a phone number, a pub/sub topic, a webhook, or any other identifier that is meaningful to the implementation.

Obligation-specific members:

to:

: REQUIRED. A JSON array of Strings, each an implementation-specific identifier for a destination of the notification (e.g., an email address such as `manager@example.com`, or a queue or topic name). The array MUST contain at least one element. Each identifier MUST be unique and meaningful within the deploying implementer's environment. The PEP MUST transmit the notification to every destination listed in the array. The obligation is satisfied only when transmission to all listed destinations succeeds. If transmission to any listed destination fails, the PEP cannot comply with the obligation. It MUST then treat the overall response as a DENY, regardless of whether the original `decision` was `true` or `false`.

body:

: REQUIRED. A String. The payload of the notification message.

topic:

: OPTIONAL. A String. A short, high-level subject or purpose for the message, e.g., an email subject line, or a routing topic identifier for a pub/sub transport.

### Notifying the Decision Subject {#decision-subject}

This profile defines the `decision_subject` request context member. It is an implementation-defined identifier for the entity that the authorization request pertains to, which is typically distinct from the requesting `subject` (for example, the patient whose record a doctor is requesting access to).

When the request includes `context.decision_subject`, the PDP SHOULD include that identifier as an additional destination in the `to` array of every `notification` obligation it issues for that decision, so that the decision subject is notified alongside any other configured destinations. This applies only if the identifier is (or resolves to) a valid notification destination, and if no PDP policy prevents such additional destinations.

### Examples

The following is a non-normative example of a `notification` obligation with a single destination:

~~~ json
{
  "type": "notification",
  "id": "obl-2",
  "properties": {
    "to": ["manager@example.com"],
    "topic": "Unauthorized access attempt",
    "body": "User jdoe attempted to access patient record 4471 outside of business hours."
  }
}
~~~
{: #fig-obligation-notification title="Non-normative example of a notification obligation"}

The following is a non-normative example of a `notification` obligation issued for a request that included a `context.decision_subject` of `patient-4471`, in addition to a statically configured destination:

~~~ json
{
  "type": "notification",
  "id": "obl-2b",
  "properties": {
    "to": ["manager@example.com", "patient-4471"],
    "topic": "Medical record accessed",
    "body": "User jdoe accessed patient record 4471 under emergency access provisions."
  }
}
~~~
{: #fig-obligation-notification-decision-subject title="Non-normative example of a notification obligation with a decision_subject destination"}

## session_termination {#obligation-session-termination}

The `session_termination` obligation requires the PEP to initiate whatever flow is necessary to terminate all active sessions belonging to the specified subject. Where the deployment spans a federation, this includes sessions established at other participating parties (e.g., via {{OIDC-LOGOUT}} front-channel or back-channel logout mechanisms, or via a {{SSF}} implementation).

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

# Examples

## Example: Request from a Conformant PEP

The following is a non-normative example of a request from a PEP that conforms to this profile and implements `notification` and `step-up`:

~~~ json
{
  "subject": { "type": "user", "id": "jdoe" },
  "resource": { "type": "record", "id": "patient-4471" },
  "action": { "name": "view" },
  "context": {
    "decision_subject": "patient-4471",
    "supported_mandatory_extensions": ["obligations"],
    "supported_obligations": ["notification", "step-up"]
  }
}
~~~
{: #fig-example-request title="Request from a PEP conforming to the Obligations Profile"}

## Example: PERMIT with a Notification Obligation

The following is a non-normative example of a response to the request above. It grants access on condition that the PEP notifies both a manager and the decision subject:

~~~ json
{
  "decision": true,
  "context": {
    "obligations": [
      {
        "type": "notification",
        "id": "obl-1",
        "properties": {
          "to": ["manager@example.com", "patient-4471"],
          "topic": "Medical record accessed",
          "body": "User jdoe accessed patient record 4471 under emergency access provisions."
        }
      }
    ]
  }
}
~~~
{: #fig-example-permit-notification title="PERMIT response with a notification obligation"}

## Example: DENY with a Step-Up Obligation

The following is a non-normative example of a response that denies access until the subject completes step-up authentication:

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

A PEP capable of driving the subject through step-up authentication MAY re-submit the request after the subject achieves the required ACR. Until the PDP returns a PERMIT to that new request, access remains denied.

## Example: Metadata Discovery Response

~~~ json
{
  "policy_decision_point": "https://pdp.example.com",
  "capabilities": [
    "urn:openid:authzen:capability:obligations"
  ],
  "supported_obligations": [
    "step-up",
    "notification",
    "session_termination"
  ]
}
~~~
{: #fig-example-metadata title="Metadata of a PDP that supports all Normative Obligation Types"}

# Security Considerations

The security considerations of {{OBLIGATIONS-EXT}} apply. In addition:

**Abuse of notification.** A malicious or compromised PDP could attempt to abuse the `notification` Obligation Type to make a PEP relay attacker-controlled content to an arbitrary destination (e.g., using the PEP's trusted mail relay to send spam or phishing content). PEPs SHOULD treat `to` and `body` values in `notification` Obligations as untrusted input. They SHOULD apply the same validation, rate-limiting, and content-safety controls they would apply to any other externally influenced message-sending operation.

**Abuse of session termination.** A malicious or compromised PDP could use `session_termination` to cause denial of service by logging users out. PEPs SHOULD verify that the `subject` to be terminated is related to the request being evaluated, or is otherwise within the PDP's authority, before initiating federated logout.

**Step-up downgrade.** A PEP MUST NOT satisfy a `step-up` obligation with an authentication context weaker than the requested `acr_value`. Where it cannot reliably determine whether a context satisfies the requested value, it cannot comply with the obligation.

# Privacy Considerations

The privacy considerations of {{OBLIGATIONS-EXT}} apply. In addition, `notification` Obligations may carry personal data in their `body` or other members, for example a subject's identifier or the details of the resource accessed. The `decision_subject` mechanism ({{decision-subject}}) sends such data to the person the request pertains to. Implementers SHOULD apply data minimization to notification content, and PDPs SHOULD ensure that policies adding `decision_subject` as a destination are consistent with the applicable privacy requirements.

# IANA Considerations {#iana-considerations}

## AuthZEN Obligation Types Registry

This specification requests the following registrations in the "AuthZEN Obligation Types" registry established by {{OBLIGATIONS-EXT}}:

| Type | Description | Reference |
|---|---|---|
| step-up | Requires the PEP to force the subject through additional authentication to reach a specified ACR. | {{obligation-step-up}} |
| notification | Requires the PEP to transmit a message to a destination. | {{obligation-notification}} |
| session_termination | Requires the PEP to terminate all sessions of a subject. | {{obligation-session-termination}} |
{: #tab-iana-registrations title="AuthZEN Obligation Types registrations"}

## JSON Member Names

When a registry of AuthZEN JSON member names is established, the following member is to be registered with a reference to this specification:

| Member | Location | Processing strength | Reference |
|---|---|---|---|
| `decision_subject` | Request context | Advisory | {{decision-subject}} |
{: #tab-iana-members title="JSON members defined by the Obligations Profile"}

# Acknowledgements

The author acknowledges the OpenID AuthZEN Working Group for the base specification on which this profile builds, and prior obligation-bearing access-control models, notably {{XACML}}, for informing the choice of Normative Obligation Types.
