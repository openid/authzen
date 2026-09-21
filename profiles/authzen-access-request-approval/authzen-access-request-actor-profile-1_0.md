---
title: "AuthZEN Actor Delegation Profile - Draft 1"
abbrev: "ARAP Actor"
category: std
ipr: none

docname: authzen-access-request-actor-profile-1_0
workgroup: OpenID AuthZEN
consensus: true
v: 3
stand_alone: true
pi: [toc, sortrefs, symrefs, private]
keyword:
  - authorization
  - access request
  - delegation
  - agents

author:
  -
    name: Karl McGuinness
    org: Independent
    email: public@karlmcguinness.com

normative:
  RFC8693:
  ARAP:
    title: "AuthZEN Access Request and Approval Profile 1.0"
    target: "https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html"
    author:
      -
        ins: K. McGuinness
        name: Karl McGuinness
    date: 2026

--- abstract

This profile defines how a Policy Enforcement Point that acts on behalf of upstream principals conveys the acting party and the origin of an Access Request under the AuthZEN Access Request and Approval Profile, and how the Access Request Service verifies a claimed actor chain before using it.

--- middle

# Introduction

This companion to the AuthZEN Access Request and Approval Profile {{ARAP}} defines the `client.actor` and `client.source` members of an Access Request submission, the delegation model they express, and the verification an Access Request Service applies to a claimed actor chain.  The base profile's rules that reference these members remain there: the PEP preserves the actor identity when it submits, the Access Request Service does not treat unverified actor content as authorization input, and structural comparison excludes `subject.properties.act` because the PEP may carry the actor here instead.

# Requirements Notation and Conventions

{::boilerplate bcp14-tagged}

The terms PEP, PDP, Subject, Resource, Action, Context, Access Request, and Access Request Service are used as defined by {{ARAP}}.

# Delegation and Acting Parties {#delegation}

A PEP often acts for upstream principals: an application for a user, an Authorization Server for a client and user, an agent runtime for an agent and user, or a Security Token Service for an upstream caller.

This profile does not define a new Subject shape for actor delegation.  Implementations SHOULD follow the conventions defined in {{?I-D.mcguinness-oauth-actor-profile}}, which standardizes an `act` claim representing the immediate actor with required `sub` and `iss` members and a RECOMMENDED `sub_profile` member (taking values such as `ai_agent`, `service`, or `user`).  Nested `act` objects represent multi-hop delegation chains.  The canonical actor identifier is the (`iss`, `sub`) pair regardless of which carrier expresses it.

Under this profile:

* The AuthZEN Authorization API `subject` carries the principal on whose behalf the operation is performed.
* `client.actor` (defined in {{client-actor-source}}) carries the immediate actor and MAY include a nested `act` claim that walks the delegation chain from the immediate actor outward toward the Subject.

Approval routing at the Access Request Service MAY consider any identity in the chain (for example, routing approval to the principal's owner, the agent's deployment owner, or a delegated approver).  This profile otherwise leaves routing policy unconstrained; it requires that the necessary identities be representable in the submission and verifiable by the service before routing decisions are taken.

Cross-implementation interoperability for delegated flows depends on adoption of a common actor convention.  Deployments and profiles that depend on a specific actor convention SHOULD document the Subject shape, the actor convention used, and the credential format the Access Request Service accepts as proof of the chain.

## Client Actor and Source {#client-actor-source}

The `client` object of an Access Request submission ([Additional Request Members](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#submission-additional-information)) has two further members:

  * `actor`: OPTIONAL.  Object identifying the immediate actor on whose behalf the PEP submits the Access Request, when that actor differs from the Subject or when the deployment needs to audit the actor separately.  The following members are defined; implementations MAY include additional members.
    * `id`: REQUIRED.  String.  Stable identifier for the actor.
    * `issuer`: OPTIONAL.  String.  Issuer, authority, tenant, or identity provider for the actor identifier.
    * `type`: OPTIONAL.  String.  Actor category, such as `user`, `service`, `workload`, or `ai_agent`.
    * `act`: OPTIONAL.  Object.  Nested actor representing the next link in a delegation chain, following the conventions in {{?I-D.mcguinness-oauth-actor-profile}}.  Each `act` carries `sub` and `iss` (corresponding to `id` and `issuer` in the immediate actor) and optionally `sub_profile`; nesting represents the chain from the immediate actor outward toward the Subject.  See {{delegation}}.
  * `source`: OPTIONAL.  Object.  Audit-trail context describing where the request originated.  The following members are defined; implementations MAY include additional members.
    * `session_id`: OPTIONAL.  String.  Identifier of a bounded interaction context that produced the request, such as a chat or agent conversation, a web or mobile application session, a CLI invocation, or a long-running workflow thread.  This is an audit-origin identifier and is distinct from any authentication or authorization session associated with the caller.
    * `external_url`: OPTIONAL.  HTTPS URI.  URL of an external system (ticket, document, dashboard, chat thread) that motivated the request.
    * `integration_id`: OPTIONAL.  String.  Identifier of an upstream integration or workflow that produced the request.

## Actor Chain Verification {#actor-source-verification}

When authenticating a submission, the Access Request Service:

* When the submission claims an actor or actor chain in `client.actor`, MUST verify that the authenticated caller's credential authorizes the entire claimed chain, not only the immediate actor.  Mechanisms commonly used to provide such authorization include {{RFC8693}} OAuth 2.0 Token Exchange (where the access token names the Subject as the on-behalf-of party and the chain via `act` claims), signed assertions from a trusted issuer, or deployment-specific authentication policies.
* MUST reject submissions whose claimed chain cannot be verified against the caller's credential or against trusted issuers identified in the deployment.

Unverified `client.actor` content MAY be retained as audit metadata only; the rule that it is not authorization input is stated in the base profile's [Submission Processing](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#submission-processing).

# Interaction with the Base Profile

The base profile states three rules that reference the members defined here; this profile does not restate them.

* A PEP preserves the actor identity conveyed in the denied evaluation's Subject, either in the submission's `subject` or normalized to `client.actor` ([Construct the Submission](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#pep-construct)).
* An Access Request Service does not rely on `client.actor` or `client.source` as authorization input unless it has independently verified them ([Submission Processing](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#submission-processing)).
* Structural comparison for denial binding and approval scope excludes `subject.properties.act` ([Structural Comparison](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#structural-comparison)).

# Security Considerations

**PEP acting on behalf of the Subject.** Accepting unverified actor claims would let a PEP assert authority it cannot demonstrate.  {{actor-source-verification}} governs chain verification; the base profile's endpoint protection requires caller authorization to submit or view the request for the supplied Subject, Resource, and Action.

The identity-binding questions the base profile records for the caller, requester, and client apply to the acting party as well; this profile does not resolve them.

# Privacy Considerations

The privacy considerations of {{ARAP}} apply.  `client.source` identifiers (`session_id`, `external_url`, `integration_id`) can link an Access Request to a conversation, application session, or external record; deployments populate them where audit policy requires and protect them as they protect approver and workflow details.

# IANA Considerations

This specification makes no requests of IANA.

# OpenID Foundation Registry Considerations

## AuthZEN Access Request Member Names Registry {#member-names}

This specification registers the following entries in the AuthZEN Access Request Member Names registry established by {{ARAP}}.

| Name | Extension Point | Description |
|---|---|---|
| `actor` | `client` | Immediate actor on whose behalf the PEP submits the Access Request, with an optional nested `act` chain. |
| `source` | `client` | Audit-trail context describing where the request originated. |
| `session_id` | `client.source` | Identifier of a bounded interaction context that produced the request (chat or agent conversation, application session, CLI invocation, workflow thread). |
| `external_url` | `client.source` | URL of an external system that motivated the request. |
| `integration_id` | `client.source` | Identifier of an upstream integration or workflow that produced the request. |

Change Controller for all entries: OpenID Foundation AuthZEN Working Group.  Specification Document for all entries: This document.

--- back

# Examples

## Submission by an Agent Runtime

This non-normative submission is made by an agent runtime acting for a user.  The runtime supplies `client.actor` so the Access Request Service can route approval to the agent's owner, and `client.source` to record the originating session.

~~~ http
POST /access/v1/requests HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Content-Type: application/json
Idempotency-Key: 9c1f5d12-2a18-4cba-8a5e-e0e8e2b6b5c7

{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "resource": {
    "type": "tool",
    "id": "crm.search_accounts"
  },
  "action": {
    "name": "invoke"
  },
  "context": {
    "business_justification": "Assembling Q2 renewal report for customer ACME-1042"
  },
  "requested_access": {
    "requested_until": "2026-05-19T15:00:00Z"
  },
  "client": {
    "id": "renewal_assistant",
    "actor": {
      "id": "agent_renewal_assistant_v3",
      "issuer": "https://agents.example.com",
      "type": "ai_agent"
    },
    "source": {
      "session_id": "session_01HX69WJ8Q0K7P4F0V0K9D6Z7N"
    }
  },
  "denial": {
    "evaluation_id": "eval_01HX6A9D2M7N0F4G3K2T9P1B8X",
    "evaluated_at": "2026-05-12T15:00:00Z",
    "expires_at": "2026-05-12T15:10:00Z",
    "reason": "agent_authority_missing",
    "binding_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0.eyJldmFsdWF0aW9uX2lkIjoiZXZhbF8wMUhYNkE5RDJNN04wRjRHM0syVDlQMUI4WCIsImNsYXNzIjoiY3JtX3Rvb2xzIn0.aGFzaA",
    "template": "agent_tool_class_approval"
  }
}
~~~

# Document History

-00

* Extracted actor delegation, the `client.actor` and `client.source` members, and actor-chain verification from the AuthZEN Access Request and Approval Profile without changing their force or conditions.
