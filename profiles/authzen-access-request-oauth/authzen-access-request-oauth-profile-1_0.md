---
title: "AuthZEN Access Request OAuth Profile - Draft 1"
abbrev: "AROP"
category: std

docname: authzen-access-request-oauth-profile-1_0
submissiontype: IETF
workgroup: OpenID AuthZEN
consensus: true
v: 3
keyword:
  - authorization
  - OAuth
  - access token
  - deferred token response
  - CIBA
  - backchannel authentication
  - transaction authorization challenge
  - rich authorization requests
  - AI agent
  - access request
  - approval workflow
  - just-in-time access
  - fine-grained authorization

venue:
#  group: "OpenID AuthZEN Working Group"
#  type: "Working Group"
#  mail: "openid-specs-authzen@lists.openid.net"
#  arch: "https://lists.openid.net/pipermail/openid-specs-authzen/"

author:
  -
    name: Karl McGuinness
    org: Independent
    email: public@karlmcguinness.com

normative:
  I-D.ietf-oauth-v2-1:
  RFC9396:
  RFC9449:
  RFC8705:
  RFC8693:
  RFC7009:
  RFC8707:
  I-D.gerber-oauth-deferred-token-response:
  I-D.rosomakho-oauth-txn-challenge:
    title: "OAuth Transaction Authorization Challenge"
    target: "https://datatracker.ietf.org/doc/draft-rosomakho-oauth-txn-challenge/"
    author:
      -
        ins: Y. Rosomakho
        name: Yaroslav Rosomakho
      -
        ins: B. Campbell
        name: Brian Campbell
      -
        ins: K. McGuinness
        name: Karl McGuinness
      -
        ins: P. Kasselman
        name: Pieter Kasselman
    date: 2026-06-25
  OIDC-CIBA:
    title: "OpenID Connect Client-Initiated Backchannel Authentication Flow - Core 1.0"
    target: "https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html"
    author:
      -
        ins: G. Fernandez
        name: Gonzalo Fernandez Rodriguez
      -
        ins: F. Walter
        name: Florian Walter
      -
        ins: A. Nennker
        name: Axel Nennker
      -
        ins: D. Tonge
        name: Dave Tonge
      -
        ins: B. Campbell
        name: Brian Campbell
    date: 2021-09-01
  AuthZEN:
    title: "Authorization API 1.0"
    target: "https://openid.github.io/authzen/"
    author:
      -
        ins: O. Gazitt
        name: Omri Gazitt
      -
        ins: D. Brossard
        name: David Brossard
      -
        ins: A. Tulshibagwale
        name: Atul Tulshibagwale
    date: 2026-04-29
  ARAP:
    title: "AuthZEN Access Request and Approval Profile"
    target: "https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html"
    author:
      -
        ins: K. McGuinness
        name: Karl McGuinness
    date: 2026

--- abstract

This specification defines an OAuth binding for the AuthZEN Access Request and Approval Profile in which an approved access request completes as an issued OAuth access token.  When a request is evaluated as an AuthZEN Access Evaluation and the decision is denied but requestable, the denial is resolved through an access request and completes by issuing an access token that carries the approved authorization.  The asynchronous wait is carried by an existing OAuth asynchronous authorization mechanism; this profile defines three transport bindings: the OAuth Deferred Token Response, Client-Initiated Backchannel Authentication (CIBA), and the OAuth Transaction Authorization Challenge.  The binding adds no new OAuth grant type, endpoint, or protocol parameter of its own; it composes these mechanisms with Rich Authorization Requests and the Access Request and Approval Profile.

--- middle

# Introduction

The AuthZEN Access Request and Approval Profile {{ARAP}} defines how a denied but requestable authorization decision is resolved out of band and re-evaluated.  It defines a single completion mode, `reevaluate`, in which the Policy Decision Point (PDP) remains authoritative at enforcement time, and it explicitly leaves completion modes that bind approval to a specific issuance flow, such as OAuth token issuance where the issued token is itself the decision representation, to a downstream profile.

This specification is that downstream profile for OAuth 2.1 {{I-D.ietf-oauth-v2-1}}.  It defines a **token issuance completion mode**: a request is evaluated as an AuthZEN Access Evaluation {{AuthZEN}}, and when the decision is denied but requestable it is resolved through an {{ARAP}} access request and completes by issuing an access token that carries the approved authorization.

The completion semantics are the same regardless of how the asynchronous wait is carried: the issued access token is the decision representation, the authoritative decision is made at issuance time, and the issued credential is bounded by the recorded approval expiry.  What varies is the OAuth mechanism that carries the request and the wait.  This profile defines three transport bindings:

- **Deferred Token Response** {{I-D.gerber-oauth-deferred-token-response}} (DTR): the client makes a token request, and rather than returning a token or an error the Authorization Server (AS) returns a `deferral_code`; the client polls the token endpoint until the token is issued or the request is denied.
- **Client-Initiated Backchannel Authentication** {{OIDC-CIBA}} (CIBA): the client makes a backchannel authentication request, the AS returns an `auth_req_id`, and approval is obtained out of band from a decoupled party; the client polls the token endpoint (or is notified) until completion.
- **Transaction Authorization Challenge** {{I-D.rosomakho-oauth-txn-challenge}} (transaction challenge): a protected resource returns a signed challenge for an operation it cannot authorize from the presented token; the client presents the challenge to the AS, the AS obtains approval and issues a transaction-scoped token, and the client re-presents that token to the resource.

These bindings also differ in where the requestable denial originates.  In {{ARAP}} the Policy Enforcement Point (PEP) and PDP roles can be deployed in more than one place, and all of the following are valid: the AS evaluates and defers its own token request (AS as PEP); a protected resource asserts the requestable denial as a signed challenge that the AS consumes (resource as PEP); or both apply policy, the resource asserting the challenge and the AS additionally evaluating before it issues.  This profile accommodates all three placements.

The binding adds no new OAuth grant type, endpoint, or protocol parameter of its own.  The deferred grant belongs to DTR, the backchannel endpoint and CIBA grant belong to CIBA, and the transaction authorization endpoint belongs to the transaction challenge draft; this profile only binds them to the {{ARAP}} lifecycle and uses Rich Authorization Requests {{RFC9396}} (RAR) to carry both the requested and the approved authorization.

# Requirements Notation and Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 {{!RFC2119}} {{!RFC8174}} when, and only when, they appear in all capitals, as shown here.

# Design Goals

- **OAuth-native completion.**  In this mode the issued access token is the decision representation.  Authorization is exercised by presenting the token to a resource server, not by carrying an AuthZEN decision object on the wire.
- **Compose, do not reinvent.**  The asynchronous transport is an existing OAuth mechanism (DTR, CIBA, or the transaction challenge), the fine-grained request and grant are RAR, and the approval lifecycle is {{ARAP}}.  This profile only binds them; it defines no new endpoints, grant types, or parameters of its own.
- **One completion model, several transports.**  The resolution outcomes, the issuance-time decision, the least-privilege constraint, and the approval-bounded lifetime are defined once and shared by all three bindings (see {{completion}}).  A binding section specializes only the transport surface: how the request enters, the name of the continuation handle, where the client polls or is notified, and how completion is delivered (see {{bindings}}).
- **The decision is not carried on the wire.**  The request carries a RAR request (or, in the transaction challenge binding, a resource-signed challenge), the evaluating party maps it to an AuthZEN evaluation internally, and the issued token carries the approved grant.  No AuthZEN request or decision object travels between the client and the AS (see {{relationship}}).
- **Least privilege.**  The issued token's granted authorization (`authorization_details`, and `scope` if used) reflects the approved access and MUST NOT broaden the originating request.  The token SHOULD be audience-restricted to the intended resource using resource indicators {{RFC8707}}, so a narrowly approved token is not presentable at an unintended resource server.
- **Authority model: an issuance-time decision, bounded by token lifetime.**  {{ARAP}}'s base model keeps the PDP authoritative at enforcement through per-call re-evaluation.  A token issuance completion mode necessarily moves the authoritative decision to issuance time: the AS evaluates, issues a bearer token, and a resource server later validates that token, possibly offline.  This profile therefore trades per-call re-evaluation for an issuance-time decision bounded by the token's lifetime.  Deployments preserve currency with short token lifetimes and token introspection, the issued access token's lifetime MUST NOT exceed the approval expiry the Access Request Service recorded, and the approval bounds the whole credential rather than a single token (see {{completion}}).

# Terminology

This profile uses the roles of {{AuthZEN}} and {{ARAP}}, mapped onto OAuth:

Authorization Server (AS):
: The OAuth Authorization Server and the token issuer.  In the DTR and CIBA bindings the AS also acts as (or fronts) the AuthZEN PDP for the request.  In the transaction challenge binding the AS consumes a requestable denial asserted by a protected resource, and MAY additionally apply its own policy before issuing.  Any OAuth token-issuing endpoint can play this role, so approval is gated wherever the token is requested: a single AS, the identity provider (IdP) or Resource Authorization Server (RAS) in an ID-JAG {{?I-D.ietf-oauth-identity-assertion-authz-grant}} chain, or a resource server that issues its own tokens.

Access Request Service (ARS):
: The {{ARAP}} role that runs the approval workflow.  The evaluating party submits the access request to it and tracks resolution.  It is internal to the deployment and not exposed to the client.

Policy Enforcement Point (PEP):
: The {{ARAP}} role that detects the requestable denial.  In this profile the PEP may be the AS (DTR, CIBA), a protected resource that asserts a signed challenge (transaction challenge), or both.

Client:
: The OAuth client (an agent, or a Policy Enforcement Point acting for one) that makes the request and polls for, or is notified of, completion.

Resource Server (RS):
: The server that accepts the issued access token and enforces the authorization it carries.  In this profile the RS is the enforcement point at the time of use: it validates the token, possibly offline, rather than re-evaluating against a PDP per call.  In the transaction challenge binding the RS additionally originates the requestable denial as a signed challenge.

Continuation handle:
: The opaque value that binds the pending access request in the issuer's state and that the client redeems to obtain the token.  Each binding names it differently: the DTR `deferral_code`, the CIBA `auth_req_id`, and the transaction challenge `transaction_authorization_id`.

This profile also uses `authorization_details` from {{RFC9396}}, and the transport-specific parameters of {{I-D.gerber-oauth-deferred-token-response}}, {{OIDC-CIBA}}, and {{I-D.rosomakho-oauth-txn-challenge}} as defined in the binding sections.

# Protocol Overview

Across all three bindings the shape is the same: an asynchronous authorization request, a pending response carrying a continuation handle, a wait resolved out of band, and completion as an issued access token.  The diagram shows the common flow; the binding sections give the per-transport entry point, handle, and completion surface.

~~~ ascii-art
+--------+                         +---------------------+        +------------------+
| Client |                         | Authorization Server|        |  Access Request  |
|        |                         |   (issuer + PDP)    |        |  Service (ARS)   |
+---+----+                         +----------+----------+        +--------+---------+
    |                                         |                            |
    | 1. asynchronous authorization request   |                            |
    |    (RAR authorization_details)          |                            |
    |---------------------------------------->|                            |
    |                                         | evaluate (AuthZEN);        |
    |                                         | denied but requestable     |
    |                                         |--------------------------->|
    |                                         |   submit access request    |
    | 2. pending: continuation handle,        |                            |
    |    expires_in, interval                 |                            |
    |<----------------------------------------|                            |
    |                                         |   ... out-of-band approval |
    | 3. poll (or notification)               |                            |
    |---------------------------------------->|                            |
    |    pending                              |                            |
    |<----------------------------------------|                            |
    |                                         |   approved                 |
    |                                         |<---------------------------|
    |                                         | re-evaluate with approval; |
    |                                         | issue token                |
    | 4. access_token (+ authorization_details)                            |
    |<----------------------------------------|                            |
~~~

In the transaction challenge binding the requestable denial originates at a protected resource, which returns a signed challenge to the client before step 1; the client then presents that challenge to the AS, and after completion re-presents the issued token to the resource (see {{binding-txn}}).

# Discovery

The mechanism a client uses is the one the issuer advertises, and each transport advertises independently in authorization server metadata.  This profile defines no additional discovery metadata of its own; whether a given request is evaluated as an AuthZEN Access Evaluation and may be deferred for approval is a policy decision and is not separately advertised.

- **DTR.**  The AS advertises `deferred_token_response_supported` ({{I-D.gerber-oauth-deferred-token-response}}).  A client participates by including `completion_mode=deferred` on its token request and being prepared for a synchronous token, a deferred response, or an error.
- **CIBA.**  The AS advertises a `backchannel_authentication_endpoint` and `backchannel_token_delivery_modes_supported` ({{OIDC-CIBA}}); a client uses the delivery mode (`poll`, `ping`, or `push`) the AS supports.
- **Transaction challenge.**  The AS advertises a `transaction_authorization_endpoint`, and the protected resource advertises the keys it signs challenges with (`txn_challenge_jwks_uri`) and its signing algorithms, per {{I-D.rosomakho-oauth-txn-challenge}}.  Unlike the other two bindings, this introduces a trust relationship in which the AS validates challenges signed by the resource (see {{security}}).

In a multi-issuer topology, each token-issuing party (a single AS, the IdP and the RAS in an ID-JAG chain, or a resource server that issues its own tokens) advertises its supported mechanisms independently in its own metadata.

# Common Processing {#completion}

This section defines the resolution outcomes and completion semantics shared by all three bindings.  The binding sections ({{bindings}}) specialize only the transport surface.  For how the request maps to an AuthZEN Access Evaluation, see {{authzen-integration}}.

## Resolution outcomes

The evaluating party resolves an asynchronous authorization request as follows:

- **Allow.**  The transport's normal success response is returned synchronously (a token, for the request mechanisms that issue one directly).
- **Deny, not requestable.**  A synchronous error is returned in the transport's error form: at the token endpoint, `invalid_authorization_details` ({{RFC9396}}) when the denial concerns the requested `authorization_details`, `invalid_scope` when it concerns requested `scope`, and otherwise `invalid_grant`.  The pending and terminal-denial codes (`authorization_pending`, `access_denied`, `expired_token`, `slow_down`) are reserved for the deferred path and MUST NOT be returned here.
- **Deny, requestable.**  The evaluating party MUST NOT issue a token.  It submits an {{ARAP}} access request on the client's behalf, binds it to a continuation handle, and returns the transport's pending response (carrying the handle, `expires_in`, and `interval`).
- **Deny, requestable, but the client did not opt into asynchronous completion.**  Where a binding requires the client to signal that it can handle a deferred outcome (DTR's `completion_mode=deferred`), and the client did not, the evaluating party MUST NOT defer.  It returns the same synchronous denial error it would for a non-requestable denial; the requestable nature is not exposed.  A client that wishes to obtain access through approval MUST opt in.

## Idempotent submission

An asynchronous authorization request is not inherently idempotent, so a client that retries an initial request (for example after a lost response or a restart) could otherwise cause the issuer to open a second access request and issue a second continuation handle for one intent.  To prevent duplicate approvals, the issuer SHOULD treat a repeated requestable-denial request from the same client for the same requested authorization (the same `authorization_details` and `scope`, or the same challenge `txn` in the transaction binding) as the same request and return the existing handle rather than open a new access request.  This deduplication is best-effort; a client that requires exactness SHOULD send a stable request identifier where its transport provides one.

## Continuation handle

The continuation handle is the redemption handle and binds the pending access request in the issuer's state.  It is not authority: possessing a handle does not authorize anything, and a token is issued only after the issuance-time re-evaluation below.  The handle is sender-constrained (see {{sender-constraining}}) and is redeemed at most once: once a token is issued for it, a subsequent redemption MUST fail with `invalid_grant`.

## Polling and completion

The client redeems the continuation handle at the binding's completion endpoint, no faster than `interval`, and backs off on a `slow_down` response.  Where a binding offers a notification channel (the DTR client callback, CIBA `ping`), the client MAY rely on it in addition to polling; polling remains the authoritative completion path.  A binding MAY also deliver the token directly rather than by redemption (CIBA `push`), in which case there is no polling to be authoritative over.  On resolution the evaluating party re-evaluates the original request with the approval as an input (the {{ARAP}} `approval` object, carried at `context.approval` in the internal evaluation) and:

- **Approved.**  The issuer issues the access token.  The granted authorization (`authorization_details`, and `scope` if used) carries the approved access, which MUST NOT broaden the originating request, and the access token lifetime MUST NOT exceed the recorded approval expiry.

  The approval bounds the credential, not a single token.  In this completion mode the issuer SHOULD NOT issue a refresh token; if it does, the refresh token and every access token derived from it MUST be bounded by the recorded approval expiry, and a refresh after that expiry MUST fail with `invalid_grant` and requires a new access request.  Likewise, a token issued by this profile MUST NOT be exchanged ({{RFC8693}}) into a credential that is longer-lived or broader than the approval.
- **Terminal denial, cancellation, or expiry.**  The issuer returns `access_denied` (or `expired_token` once the handle lifetime has elapsed).

The issued access token is the decision representation.  This is the token issuance completion mode that {{ARAP}} defers to a downstream profile.  Because completion is the issued token, this mode is not surfaced to the client as an {{ARAP}} `result.mode` value; the OAuth token response is the result.

## Access request input

These transports carry no in-band interaction channel for the approval itself.  Inputs the access request needs are supplied either in the initial request (for example as `authorization_details` fields, or CIBA's `binding_message`) or out of band at the Access Request Service (for example through the {{ARAP}} `form_url` or `request_schema_url`).  This profile defines no new in-band input mechanism.

# AuthZEN Integration {#authzen-integration}

The requestable denial and re-evaluation are driven through the AuthZEN Access Evaluation API {{AuthZEN}} and the {{ARAP}} extensions.  These AuthZEN messages are exchanged between the evaluating party and its PDP and never appear on the OAuth wire; the client sees only the OAuth request and the pending or final response.  For how the {{ARAP}} lifecycle constructs map to the OAuth wire, see {{mapping}}.

## Where the requestable denial originates

{{ARAP}} allows the PEP and PDP roles to be deployed in more than one place, and this profile supports three placements:

- **AS as PEP (DTR, CIBA).**  The AS evaluates the request against its PDP, derives the requestable denial itself, and defers.
- **Resource as PEP (transaction challenge).**  A protected resource detects that the presented token cannot authorize the operation, asserts the requestable denial as a signed `transaction_challenge`, and the AS treats the validated challenge as the requestable-denial signal rather than re-deriving the decision from scratch.
- **Both.**  The resource asserts the challenge and the AS additionally evaluates against its own PDP before issuing, so the decision is the conjunction of resource policy and AS policy.

In every placement the access request, approval, and issuance-time re-evaluation are the same; only the origin of the requestable denial differs.

## Constructing the Access Evaluation

The evaluating party builds the Access Evaluation request from the OAuth request (or the challenge):

| OAuth request | AuthZEN Access Evaluation |
|---|---|
| The principal the token will act as (`client_credentials`: the client; Token Exchange: the `subject_token` subject; authorization code: the end user; CIBA: the party in `login_hint`; transaction challenge: the actor in the challenge `act`, when present) | `subject` (with the agent in `subject.properties.act`) |
| Each `authorization_details` object, and any `scope` values | one or more `resource` and `action` pairs |
| Client identity, sender-constraining key, `resource` indicator {{RFC8707}}, and request metadata | `context` members |

The structural mapping above is fixed.  The semantic interpretation of a given `authorization_details` `type` (and of named scopes) into AuthZEN `resource` and `action` values is deployment- or vocabulary-defined, and interoperating parties MUST agree on it.  The agent acting for the principal is conveyed in `subject.properties.act` and `context.client_id`.

A fine-grained read request (read access to one customer record) maps to an evaluation whose `subject` carries the user and the acting agent, with the record as `resource` and `read` as `action`; the worked trace in {{example-dtr}} shows the full Access Evaluation request and the PDP's response.

A request may carry several `authorization_details` (and scopes), which the evaluating party evaluates together; it MAY use the AuthZEN Evaluations (bulk) API for this.  This profile treats the request as a unit: if any requested authorization is requestable-denied and the client opted into asynchronous completion, the whole request is deferred and the full requested set is issued on approval.  Partial issuance (issuing the allowed subset immediately and deferring the rest) is not defined by this profile.

## Requestable denial

When the PDP denies but the denial is requestable, it returns `decision: false` with an {{ARAP}} `context.access_request` and denial-binding material (`context.evaluation_id` or a `binding_token`):

~~~ json
{
  "decision": false,
  "context": {
    "evaluation_id": "ev_9f2c8a1b",
    "reason": "approval_required",
    "access_request": { "expires_at": "2026-06-13T12:00:00Z" }
  }
}
~~~

The example above carries `context.evaluation_id`, which the Access Request Service resolves against the PDP's recorded evaluation; this fits a deployment where the Access Request Service shares the PDP's state.  Where the Access Request Service is a separate service from the PDP, it cannot trust the submitting party's claim that a denial occurred, so the denial instead carries a PDP-signed `binding_token` in `context.access_request` that the service verifies cryptographically; `evaluation_id` is then optional:

~~~ json
{
  "decision": false,
  "context": {
    "reason": "approval_required",
    "access_request": {
      "expires_at": "2026-06-13T12:00:00Z",
      "binding_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0..."
    }
  }
}
~~~

The evaluating party submits the access request using this binding material, binds the resulting {{ARAP}} task to a continuation handle, and returns the transport's pending response.  A `decision: false` with no `context.access_request` is a non-requestable denial and maps to the synchronous error in {{completion}}.  In the transaction challenge binding the resource has already asserted the requestable denial as a signed challenge; the AS validates the challenge and submits the access request from it (and MAY additionally evaluate against its own PDP).

## Re-evaluation and issuance

On approval, the evaluating party re-evaluates the same request with the {{ARAP}} `approval` object at `context.approval` (the re-evaluation request, the task it resolves, and the resulting decision are shown in {{example-dtr}}).  A `decision: true` response authorizes issuance: the issuer issues the access token whose granted `authorization_details` reflect the approved `resource` and `action`, with a lifetime bounded by `approved_until`.  A `decision: false` at re-evaluation maps to `access_denied` on the next poll; obtaining access then requires a new request.

# Transport Bindings {#bindings}

Each binding specializes the {{completion}} model onto one OAuth asynchronous mechanism.  The completion semantics (issuance-time decision, least privilege, approval-bounded lifetime) are identical; the table summarizes what differs, and the subsections give the detail.

| | Deferred Token Response | CIBA | Transaction Challenge |
|---|---|---|---|
| Origin of requestable denial | AS (PDP) | AS (PDP) | Protected resource (signed challenge) |
| Entry point | Token endpoint | Backchannel authentication endpoint | Transaction authorization endpoint |
| Client opt-in signal | `completion_mode=deferred` | Use of the backchannel endpoint | `Accept-Txn-Challenge` to the resource |
| Continuation handle | `deferral_code` | `auth_req_id` | `transaction_authorization_id` |
| Completion endpoint | Token endpoint (deferred grant) | Token endpoint, CIBA grant (`poll`, `ping`); client notification endpoint (`push`) | Transaction authorization endpoint |
| Notification (optional) | DTR client callback | CIBA `ping` (`push` delivers the token directly) | none |
| Completion | Access token response | Access token response | Access token response, re-presented to the resource |
| Denial / expiry | `access_denied` / `expired_token` | `access_denied` / `expired_token` | `access_denied` / `expired_token` |

## Deferred Token Response {#binding-dtr}

The client makes an ordinary token request and signals deferred completion with `completion_mode=deferred` ({{I-D.gerber-oauth-deferred-token-response}}).  The requested authorization is expressed with `authorization_details` ({{RFC9396}}), with `scope`, or with both.  The AS maps the request to an AuthZEN Access Evaluation and resolves per {{completion}}.  On a requestable denial it binds the access request to a `deferral_code` and returns the DTR deferred response (`authorization_pending` with `deferral_code`, `expires_in`, and `interval`).

The client polls the token endpoint with the deferred grant type (`urn:ietf:params:oauth:grant-type:deferred`) and the `deferral_code`, and completes per {{completion}}.  This binding rides on any originating grant, including Token Exchange {{RFC8693}}, the authorization code grant, and the refresh token grant.

## Client-Initiated Backchannel Authentication {#binding-ciba}

CIBA {{OIDC-CIBA}} is purpose-built for decoupled approval: the device that consumes the token (the agent) is separate from the device on which the user authenticates and approves.  This profile uses that decoupling for the agentic case in which the principal approves their own agent's elevation out of band, on their own authentication device, while the agent waits.

In CIBA the user identified by `login_hint`, `login_hint_token`, or `id_token_hint` is the user the AS authenticates and whose identity the issued tokens represent; CIBA does not natively let one party approve a token that acts as a different principal.  This binding therefore maps the hint to the principal the issued token acts as, and the approving party is that same principal.  Deployments that need a different party (a data owner or manager) to approve should use the DTR or transaction challenge binding, where the approver is the {{ARAP}} workflow's resolver and is unrelated to OAuth authentication.  Per {{OIDC-CIBA}} the request carries the `openid` scope; the requested authorization is carried in `authorization_details` (and any additional `scope`), and a `binding_message` MAY convey the operation to the user.

The AS maps the request to an AuthZEN Access Evaluation and resolves per {{completion}}.  On a requestable denial it binds the access request to the CIBA `auth_req_id` and returns it with `expires_in` and (optionally) `interval`.  In the `poll` and `ping` delivery modes the client redeems the `auth_req_id` at the token endpoint with the CIBA grant type (`urn:openid:params:grant-type:ciba`); in `ping` the AS first notifies the client's notification endpoint that the result is ready, and in `push` the AS instead delivers the tokens directly to that endpoint with no token-endpoint redemption.  A client using `ping` or `push` MUST supply a `client_notification_token` on the backchannel authentication request ({{OIDC-CIBA}}).  Where the client polls, polling remains the authoritative completion path as in {{completion}}.  In every mode completion is an access token carrying the approved `authorization_details`, bounded by the approval expiry.

## Transaction Authorization Challenge {#binding-txn}

In this binding the protected resource is the PEP.  When the resource determines that the token presented for an operation does not authorize it, it returns HTTP 401 with a `WWW-Authenticate` challenge carrying a signed `transaction_challenge` (a JWS whose claims include `txn`, `authorization_details`, the resource as `iss`, the AS as `aud`, and a human-readable `reason`), per {{I-D.rosomakho-oauth-txn-challenge}}.  The client signals that it understands challenges with the `Accept-Txn-Challenge` header.  The challenge is the resource's assertion of a requestable denial, signed so the client cannot forge or broaden the requested operation.

The client presents the challenge to the AS at the `transaction_authorization_endpoint`.  The AS validates the challenge against the resource's signing keys, treats it as the requestable-denial signal (and MAY additionally evaluate against its own PDP), submits the {{ARAP}} access request, and resolves per {{completion}}.  On a requestable denial the AS returns a pending response carrying a `transaction_authorization_id`, `expires_in`, `interval`, and an optional `authorization_uri` for interactive approval; the client polls the same endpoint with the `transaction_authorization_id`.

On approval the AS issues an access token that carries the challenge's `txn` and `authorization_details` and is audience-restricted to the resource.  The client re-presents this token to the resource, which validates that the token's `txn` matches the challenge, that the audience identifies the resource, and that the granted `authorization_details` authorize the operation.  Because the resource originates and consumes the `txn`, this binding is the one case where completion is not "client holds token, done": the token is evidence re-presented to the resource that originated the challenge.  Resources SHOULD treat these tokens as single-use for non-idempotent or high-impact operations.

# Examples

These examples are non-normative.  Together they cover the three PEP placements of {{authzen-integration}}: the AS as PEP (the DTR and CIBA examples, where the AS derives the requestable denial), the resource as PEP (the transaction challenge example, where the resource asserts it), and both (the closing variant of the transaction challenge example, where the AS also applies its own policy).  The first example also shows the AS's internal AuthZEN evaluation, marked as off the OAuth wire, so the binding to {{AuthZEN}} and {{ARAP}} is visible end to end; the other examples show only the client-visible OAuth exchange.

## DTR: Token Exchange (AS as PEP) {#example-dtr}

An agent acting on behalf of a user requests fine-grained access to a single protected resource.  The `authorization_details` (shown decoded for readability) scopes the request to one record:

~~~ json
[ { "type": "customer_records", "actions": ["read"], "locations": ["https://crm.example/customers/c-4815"] } ]
~~~

~~~ http
POST /token HTTP/1.1
Host: as.example.com
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ...

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange
&completion_mode=deferred
&authorization_details=%5B%7B%22type%22%3A%22customer_records%22%2C%22actions%22%3A%5B%22read%22%5D%2C%22locations%22%3A%5B%22https%3A%2F%2Fcrm.example%2Fcustomers%2Fc-4815%22%5D%7D%5D
&subject_token=...&subject_token_type=...
~~~

Internally, and never on the OAuth wire, the AS maps this to an AuthZEN Access Evaluation and calls its PDP:

~~~ json
{
  "subject": {
    "type": "user",
    "id": "alice@example.com",
    "properties": { "act": { "sub": "agent-7" } }
  },
  "resource": { "type": "customer_records", "id": "c-4815" },
  "action": { "name": "read" },
  "context": { "client_id": "agent-7", "dpop_jkt": "0ZcOCORZ..." }
}
~~~

The PDP returns a denied-but-requestable decision:

~~~ json
{
  "decision": false,
  "context": {
    "evaluation_id": "ev_9f2c8a1b",
    "reason": "approval_required",
    "access_request": { "expires_at": "2026-06-13T12:00:00Z" }
  }
}
~~~

Here the Access Request Service shares the PDP's state, so the denial binds by `evaluation_id`; a separate-service Access Request Service would instead receive a PDP-signed `binding_token` ({{authzen-integration}}).  The AS submits the {{ARAP}} access request on the agent's behalf, echoing the denial-binding material (authentication to the Access Request Service is omitted for brevity):

~~~ http
POST /access/v1/requests HTTP/1.1
Host: pdp.example.com
Content-Type: application/json
Idempotency-Key: 7b8d0f0d-65a1-4af1-9fd3-a684f08a5d14

{
  "subject": {
    "type": "user",
    "id": "alice@example.com",
    "properties": { "act": { "sub": "agent-7" } }
  },
  "resource": { "type": "customer_records", "id": "c-4815" },
  "action": { "name": "read" },
  "denial": {
    "evaluation_id": "ev_9f2c8a1b",
    "expires_at": "2026-06-13T12:00:00Z",
    "reason": "approval_required"
  }
}
~~~

The Access Request Service accepts it and returns a pending task:

~~~ http
HTTP/1.1 202 Accepted
Content-Type: application/json
Location: https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ

{
  "task": {
    "id": "arq_01HX4Y3AJZ",
    "status": "pending",
    "status_endpoint": "https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ"
  }
}
~~~

The AS binds this task to a `deferral_code` and returns the deferred response to the client:

~~~ json
{
  "error": "authorization_pending",
  "deferral_code": "8d67dc78-7faa-4d41-aabd-67707b374255",
  "expires_in": 10800,
  "interval": 60
}
~~~

The client polls the token endpoint until the record's data owner resolves the request out of band:

~~~ http
POST /token HTTP/1.1
Host: as.example.com
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ...

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adeferred
&deferral_code=8d67dc78-7faa-4d41-aabd-67707b374255
~~~

Behind the AS, the data owner approves and the task reaches a terminal state, which the AS reads from the Task Status Endpoint:

~~~ http
GET /access/v1/requests/arq_01HX4Y3AJZ HTTP/1.1
Host: pdp.example.com
~~~

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "task": { "id": "arq_01HX4Y3AJZ", "status": "approved" },
  "result": {
    "approval": { "id": "ar_123", "approved_until": "2026-06-13T18:00:00Z" }
  }
}
~~~

The task completes with the `approval`.  Under this profile the completion mode is token issuance, not {{ARAP}}'s `reevaluate` (see {{mapping}}), so the result is the issued token rather than a client-facing `result.mode`; the AS re-evaluates the original request itself with the approval at `context.approval`:

~~~ json
{
  "subject": {
    "type": "user",
    "id": "alice@example.com",
    "properties": { "act": { "sub": "agent-7" } }
  },
  "resource": { "type": "customer_records", "id": "c-4815" },
  "action": { "name": "read" },
  "context": { "approval": { "id": "ar_123", "approved_until": "2026-06-13T18:00:00Z" } }
}
~~~

The PDP now allows it:

~~~ json
{ "decision": true }
~~~

The AS issues an access token carrying the approved authorization, with a lifetime bounded by the recorded `approved_until`:

~~~ json
{
  "access_token": "eyJ...",
  "token_type": "DPoP",
  "expires_in": 900,
  "authorization_details": [
    { "type": "customer_records", "actions": ["read"], "locations": ["https://crm.example/customers/c-4815"] }
  ]
}
~~~

If the data owner denies the request, the task reaches `denied`, the AS's re-evaluation returns `decision: false`, the poll returns `access_denied`, and no token is issued.

The flow above is independent of the originating grant and of which party gates approval.  The same DTR exchange applies when the agent redeems an authorization code (the `authorization_details` bound to the code drive the decision), when it uses a refresh token to reach a resource outside its current scope, and when the gate sits at a resource server that issues its own tokens (contrast {{binding-txn}}, where the resource asserts a signed challenge rather than issuing a token).  In an ID-JAG {{?I-D.ietf-oauth-identity-assertion-authz-grant}} chain there are two issuers and approval may be gated at either: the identity provider may defer when it issues the ID-JAG, or the Resource Authorization Server may defer when the agent redeems it.  In every case the deferring party returns the same `authorization_pending` response, and the agent polls and completes as shown.

## CIBA: decoupled self-approval (AS as PEP)

An agent acting for Alice needs to export a CRM report, an action that requires Alice's explicit approval.  The agent makes a backchannel authentication request naming Alice (the principal the token will act as) with `login_hint`, and conveying the operation to her with `binding_message`; CIBA prompts Alice on her own authentication device while the agent waits:

~~~ http
POST /backchannel-authn HTTP/1.1
Host: as.example.com
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ...

scope=openid
&login_hint=alice%40example.com
&binding_message=Export+CRM+contacts
&authorization_details=%5B%7B%22type%22%3A%22crm%22%2C%22actions%22%3A%5B%22export%22%5D%2C%22locations%22%3A%5B%22https%3A%2F%2Fcrm.example%2Fcontacts%22%5D%7D%5D
~~~

The AS evaluates the request, gets a denied-but-requestable decision, submits an access request, and returns:

~~~ json
{
  "auth_req_id": "1c266114-a1be-4252-8ad1-04986c5b9ac1",
  "expires_in": 300,
  "interval": 5
}
~~~

The agent redeems the `auth_req_id` at the token endpoint once the owner approves out of band:

~~~ http
POST /token HTTP/1.1
Host: as.example.com
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ...

grant_type=urn%3Aopenid%3Aparams%3Agrant-type%3Aciba
&auth_req_id=1c266114-a1be-4252-8ad1-04986c5b9ac1
~~~

Before approval the token endpoint returns `authorization_pending`; on approval it returns an access token carrying the approved authorization, bounded by the approval expiry:

~~~ json
{
  "access_token": "eyJ...",
  "token_type": "DPoP",
  "expires_in": 900,
  "id_token": "eyJ...",
  "authorization_details": [
    { "type": "crm", "actions": ["export"], "locations": ["https://crm.example/contacts"] }
  ]
}
~~~

If Alice declines, or the request expires, the poll returns `access_denied` or `expired_token` and no token is issued.

## Transaction challenge: resource-initiated (RS and both as PEP)

An agent already holds a token for a CRM but attempts a high-impact deletion the token does not authorize.  The resource returns a signed challenge:

~~~ http
DELETE /customers/c-4815 HTTP/1.1
Host: crm.example
Authorization: DPoP eyJ...
Accept-Txn-Challenge: ?1
~~~

~~~ http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: DPoP error="transaction_authorization_required",
  transaction_challenge="eyJ0eXAiOiJ0eG4tYXV0aHotY2hhbGxlbmdlK2p3dC... (signed JWT)"
~~~

The agent presents the challenge to the AS:

~~~ http
POST /txn-authorization HTTP/1.1
Host: as.example.com
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ...

client_id=agent-7
&transaction_challenge=eyJ0eXAiOiJ0eG4tYXV0aHotY2hhbGxlbmdlK2p3dC...
~~~

Here the binding to {{AuthZEN}} differs from the DTR example: the AS does not derive the requestable denial itself, it arrives as the resource-signed challenge.  The AS validates the challenge's signature, treats its `authorization_details` and `txn` as the requestable-denial signal (mapping them to an AuthZEN evaluation only if it also applies its own policy, the "both" case below), submits the access request, and returns a pending response:

~~~ json
{
  "transaction_authorization_id": "txn-authz-abc123",
  "expires_in": 300,
  "interval": 5,
  "authorization_uri": "https://as.example.com/txn-authorization/txn-authz-abc123"
}
~~~

The agent polls the transaction authorization endpoint with the `transaction_authorization_id`.  On approval the AS issues a transaction-scoped token carrying the challenge's `txn`, which the agent re-presents on the original operation:

~~~ json
{
  "access_token": "eyJ...",
  "token_type": "DPoP",
  "expires_in": 120,
  "authorization_details": [
    { "type": "customer_records", "actions": ["delete"], "locations": ["https://crm.example/customers/c-4815"] }
  ]
}
~~~

The resource validates that the token's `txn` matches the challenge and that the granted `authorization_details` authorize the deletion before performing it.

In this example the resource is the sole PEP and the AS acts only on the validated challenge.  A **both as PEP** deployment adds one step: after validating the challenge, the AS additionally evaluates the operation against its own PDP before issuing, so issuance requires both the resource's challenge and an AS allow.  If the AS's own evaluation is itself a requestable denial, the same access request resolves both; if it is a non-requestable denial, the AS returns `access_denied` and issues nothing.  The wire exchange the agent sees is unchanged.

# Mapping to the Access Request and Approval Profile {#mapping}

The OAuth wire surface replaces several {{ARAP}} constructs; the rest map directly.  For how the OAuth request maps to AuthZEN Access Evaluation messages, see {{authzen-integration}}.

| ARAP construct | OAuth binding in this profile |
|---|---|
| Requestable denial (`context.access_request`) | The trigger to defer: derived by the AS (DTR, CIBA) or asserted by a protected resource as a signed challenge (transaction challenge).  Not surfaced to the client as an AuthZEN object. |
| Access request submission | Performed by the evaluating party on the client's behalf during evaluation. |
| Idempotency key | Best-effort dedup by client and requested authorization, or by challenge `txn` (see {{completion}}). |
| Task handle | The continuation handle: `deferral_code` (DTR), `auth_req_id` (CIBA), or `transaction_authorization_id` (transaction challenge). |
| Task Status Endpoint and polling | Polling the binding's completion endpoint: the token endpoint (DTR, CIBA) or the transaction authorization endpoint. |
| Callback completion | The optional DTR client callback, or CIBA `ping` notification or `push` delivery (both via the client notification endpoint). |
| `approval` object (`context.approval`) | Input to the issuance-time re-evaluation. |
| `reevaluate` completion mode | Replaced by token issuance (this profile's completion mode). |
| `binding_token` / `evaluation_id` | Bound to the continuation handle in issuer state; not exposed to the client. |
| `approved_until` | Upper bound on the issued access token lifetime. |
| Denial reason and `next_action` | OAuth error codes (`access_denied`, `expired_token`). |

# Sender-Constraining and Cancellation {#sender-constraining}

The continuation handle and the issued access token are sender-constrained using DPoP {{RFC9449}} or mutual TLS {{RFC8705}}; a public client MUST present DPoP on the initial request, and every polling, redemption, and cancellation request MUST carry proof of possession for the same key.  DTR specifies this for the `deferral_code` ({{I-D.gerber-oauth-deferred-token-response}}); the same requirement applies to the CIBA `auth_req_id` and the `transaction_authorization_id` in this profile.  The CIBA binding does not have OAuth public clients in this sense: {{OIDC-CIBA}} requires the client to authenticate to the backchannel authentication endpoint with its registered method, and DPoP sender-constrains the `auth_req_id` and issued token on top of that.

To cancel a pending request:

- **DTR.**  The client revokes the `deferral_code` at the revocation endpoint {{RFC7009}} (with `token_type_hint` set to `urn:ietf:params:oauth:token-type:deferral-code`).  The AS MUST cancel the underlying access request.
- **CIBA and transaction challenge.**  These transports define no client-driven cancellation; the pending request resolves on approval, denial, or expiry of its handle.  In all bindings the access request MUST be cancelled when its handle expires.

# Privacy Considerations

- The requested and approved `authorization_details` (and, in the transaction binding, the signed challenge) can carry sensitive data (account numbers, amounts, resource identifiers).  Parties MUST apply data minimization and protect them in transit and at rest.
- The evaluating party MUST NOT expose the approver's identity, internal approval state, or {{ARAP}} binding material to the client; the client sees only the continuation handle and the eventual token or error.  A CIBA `login_hint` or `binding_message` MUST NOT echo approver detail back to the client beyond what the client supplied.
- `error_description` and any human-readable text returned with a pending or error response MUST be minimized and MUST NOT leak approver identity or internal policy detail.

# Security Considerations {#security}

- **A pending response is not a grant.**  A pending response carrying a continuation handle is not access.  Denial remains denial: a token is issued only after the issuance-time re-evaluation, and a non-requestable or terminally denied request yields an OAuth error, never a token.
- **Issuance-time decision, bounded by lifetime.**  Because the authoritative decision is made at issuance and the resource server may validate the token offline, deployments MUST bound the access token lifetime by the approval expiry and SHOULD keep lifetimes short and use token introspection where current revocation matters.  Refresh tokens and token exchange MUST NOT be used to extend an approval beyond its recorded expiry (see {{completion}}); otherwise the approval bound is defeated.
- **Least privilege and audience.**  The issued authorization MUST reflect the approved access and MUST NOT broaden the originating request, and the token SHOULD be audience-restricted to the intended resource using resource indicators {{RFC8707}} so an approved token cannot be replayed at an unintended resource server.  In the transaction binding the token is audience-restricted to the challenging resource and bound to the challenge `txn`, which the resource validates before acting.
- **Request integrity.**  Because the requested `authorization_details` drive a fine-grained authorization decision, deployments SHOULD protect them in transit and from tampering, for example with Pushed Authorization Requests {{?RFC9126}} or a signed request, so the request that is evaluated is the one the client intended.  In the transaction binding the challenge is signed by the resource, so the client cannot forge or broaden the requested operation; the AS MUST validate the challenge signature against the resource's keys before acting on it.
- **The continuation handle is not authority.**  It is opaque, sender-constrained, and bound to the client it was issued to; it is usable only at the binding's completion (and, for DTR, revocation) endpoint.
- **The decision is not carried on the wire.**  The request carries a RAR request (or a resource-signed challenge) and the issued token carries the approved grant; neither carries an AuthZEN request or decision object, which keeps the decision engine off the client surface and avoids substitution or replay of decision payloads.

# Relationship to Other Specifications {#relationship}

- {{ARAP}}: this profile is its OAuth token issuance completion mode.  {{ARAP}} owns the requestable denial, access request, approval, and audit lifecycle; this profile binds completion to OAuth token issuance and supports the AS, a protected resource, or both as the PEP.
- {{I-D.gerber-oauth-deferred-token-response}}: an asynchronous transport for this profile.  It adds no new grant type; the binding uses DTR's `completion_mode`, deferred grant, and polling.
- {{OIDC-CIBA}}: an asynchronous transport built for decoupled approval, where the approving party need not be the client; the binding uses the backchannel endpoint, the CIBA grant, and `auth_req_id`.
- {{I-D.rosomakho-oauth-txn-challenge}}: a resource-initiated asynchronous transport in which the protected resource asserts the requestable denial as a signed challenge; the binding uses the transaction authorization endpoint and the `txn`-bound token.
- {{RFC9396}}: carries the requested authorization in the request and the approved authorization in the issued token.
- {{RFC8693}}: Token Exchange is a natural originating grant for on-behalf-of agent flows, and DTR can defer it; this profile composes with it unchanged.
- {{?I-D.brossard-oauth-rar-authzen}}: that draft places an AuthZEN request and response inside `authorization_details`.  This profile deliberately does not.  The decision stays behind the evaluating party and the token carries the approved grant, not the evaluation.
- {{?RFC8628}}: the Device Authorization Grant solves a related asynchronous case for the same end user; these transports (and therefore this profile) do not assume the approver is the requesting user, which is the agentic case this profile targets.

# IANA Considerations

This profile defines no new OAuth grant types, parameters, endpoints, or error codes; it reuses {{I-D.gerber-oauth-deferred-token-response}}, {{OIDC-CIBA}}, {{I-D.rosomakho-oauth-txn-challenge}}, and {{RFC9396}}.  It requests no IANA registrations.  Any `authorization_details` type used by a deployment is registered per {{RFC9396}}.
