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

This specification defines an OAuth binding for the AuthZEN Access Request and Approval Profile in which an approved access request completes as an issued OAuth access token.  When an Authorization Server evaluates a token request as an AuthZEN Access Evaluation and the decision is denied but requestable, the Authorization Server resolves it through an access request and completes by issuing an access token that carries the approved authorization.  The asynchronous wait is carried by the OAuth Deferred Token Response: the Authorization Server returns a deferral code, and the client polls the token endpoint until a token is issued or the request is denied.  The binding adds no new OAuth grant type or protocol parameter; it composes the Deferred Token Response, Rich Authorization Requests, and the Access Request and Approval Profile.

--- middle

# Introduction

The AuthZEN Access Request and Approval Profile {{ARAP}} defines how a denied but requestable authorization decision is resolved out of band and re-evaluated.  It defines a single completion mode, `reevaluate`, in which the Policy Decision Point (PDP) remains authoritative at enforcement time, and it explicitly leaves completion modes that bind approval to a specific issuance flow, such as OAuth token issuance where the issued token is itself the decision representation, to a downstream profile.

This specification is that downstream profile for OAuth 2.1 {{I-D.ietf-oauth-v2-1}}.  It defines a **token issuance completion mode**: a client requests a token, the Authorization Server (AS) evaluates the request as an AuthZEN Access Evaluation {{AuthZEN}}, and when the decision is denied but requestable the AS resolves it through an {{ARAP}} access request and completes by issuing an access token that carries the approved authorization.

The asynchronous wait is carried by the OAuth Deferred Token Response {{I-D.gerber-oauth-deferred-token-response}} (DTR): rather than returning a token or an error, the AS returns a `deferral_code`, and the client polls the token endpoint until the token is issued or the request is denied.

The binding adds no new OAuth grant type and no new protocol parameters.  It rides on DTR (`completion_mode=deferred` and the deferred grant type) over any originating grant, including Token Exchange {{RFC8693}}, and uses Rich Authorization Requests {{RFC9396}} (RAR) to carry both the requested and the approved authorization.

# Requirements Notation and Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 {{!RFC2119}} {{!RFC8174}} when, and only when, they appear in all capitals, as shown here.

# Design Goals

- **OAuth-native completion.**  In this mode the issued access token is the decision representation.  Authorization is exercised by presenting the token to a resource server, not by carrying an AuthZEN decision object on the wire.
- **Compose, do not reinvent.**  The asynchronous transport is DTR, the fine-grained request and grant are RAR, and the approval lifecycle is {{ARAP}}.  This profile only binds them; it defines no new endpoints, grant types, or parameters.
- **The decision stays behind the AS.**  The token request carries a RAR request, the AS maps it to an AuthZEN evaluation internally, and the issued token carries the approved grant.  The token never carries an AuthZEN request or decision object (see {{relationship}}).
- **Least privilege.**  The issued token's granted authorization (`authorization_details`, and `scope` if used) reflects the approved access and MUST NOT broaden the originating request.  The token SHOULD be audience-restricted to the intended resource using resource indicators {{RFC8707}}, so a narrowly approved token is not presentable at an unintended resource server.
- **Authority model: an issuance-time decision, bounded by token lifetime.**  {{ARAP}}'s base model keeps the PDP authoritative at enforcement through per-call re-evaluation.  A token issuance completion mode necessarily moves the authoritative decision to issuance time: the AS evaluates, issues a bearer token, and a resource server later validates that token, possibly offline.  This profile therefore trades per-call re-evaluation for an issuance-time decision bounded by the token's lifetime.  Deployments preserve currency with short token lifetimes and token introspection, the issued access token's lifetime MUST NOT exceed the approval expiry the Access Request Service recorded, and the approval bounds the whole credential rather than a single token (see {{completion}}).

# Terminology

This profile uses the roles of {{AuthZEN}} and {{ARAP}}, mapped onto OAuth:

Authorization Server (AS):
: The OAuth Authorization Server.  In this profile the AS acts as (or fronts) the AuthZEN PDP for the token request and is the token issuer.  Any OAuth token-issuing endpoint can play this role, so approval is gated wherever the token is requested: a single AS, the identity provider (IdP) or Resource Authorization Server (RAS) in an ID-JAG {{?I-D.ietf-oauth-identity-assertion-authz-grant}} chain, or a resource server that issues its own tokens.

Access Request Service (ARS):
: The {{ARAP}} role that runs the approval workflow.  The AS submits the access request to it and tracks resolution.  It is internal to the AS deployment and not exposed to the client.

Client:
: The OAuth client (an agent, or a Policy Enforcement Point acting for one) that makes the token request and polls for completion.

Resource Server (RS):
: The server that accepts the issued access token and enforces the authorization it carries.  In this profile the RS is the enforcement point: it validates the token, possibly offline, rather than re-evaluating against a PDP per call.

This profile also uses `completion_mode`, `deferral_code`, and the deferred grant type from {{I-D.gerber-oauth-deferred-token-response}}, and `authorization_details` from {{RFC9396}}.

# Protocol Overview

~~~ ascii-art
+--------+                         +---------------------+        +------------------+
| Client |                         | Authorization Server|        |  Access Request  |
|        |                         |   (PDP + issuer)    |        |  Service (ARS)   |
+---+----+                         +----------+----------+        +--------+---------+
    |                                         |                            |
    | 1. token request                        |                            |
    |    completion_mode=deferred             |                            |
    |    authorization_details (RAR)          |                            |
    |---------------------------------------->|                            |
    |                                         | evaluate (AuthZEN);        |
    |                                         | denied but requestable     |
    |                                         |--------------------------->|
    |                                         |   submit access request    |
    | 2. authorization_pending                |                            |
    |    deferral_code, expires_in, interval  |                            |
    |<----------------------------------------|                            |
    |                                         |   ... out-of-band approval |
    | 3. poll (grant_type=deferred)           |                            |
    |---------------------------------------->|                            |
    |    authorization_pending                |                            |
    |<----------------------------------------|                            |
    |                                         |   approved                 |
    |                                         |<---------------------------|
    |                                         | re-evaluate with approval; |
    |                                         | issue token                |
    | 4. access_token (+ authorization_details)                            |
    |<----------------------------------------|                            |
~~~

# Discovery

An AS that supports the Deferred Token Response advertises `deferred_token_response_supported` in its authorization server metadata ({{I-D.gerber-oauth-deferred-token-response}}).  In a multi-issuer topology, each token-issuing party (a single AS, the IdP and the RAS in an ID-JAG chain, or a resource server that issues its own tokens) advertises this independently in its own metadata.  A client participates by including `completion_mode=deferred` on its token request and being prepared for any of three outcomes: a synchronous token response, a deferred response (`authorization_pending` with a `deferral_code`), or an error.  This profile defines no additional discovery metadata.  Whether a given token request is evaluated as an AuthZEN Access Evaluation and may be deferred for approval is an AS policy decision and is not separately advertised.

# Requesting and Completing a Deferred Token

## Initial token request

The client makes an ordinary token request and signals deferred completion with `completion_mode=deferred` ({{I-D.gerber-oauth-deferred-token-response}}).  The requested authorization is expressed with `authorization_details` ({{RFC9396}}), with `scope`, or with both.  The AS maps the request to an AuthZEN Access Evaluation and evaluates it against its PDP, as described in {{authzen-integration}}.  The AS resolves as follows:

- **Allow.**  The AS returns the originating grant's normal token response synchronously.
- **Deny, not requestable.**  The AS returns a synchronous token-endpoint error: `invalid_authorization_details` ({{RFC9396}}) when the denial concerns the requested `authorization_details`, `invalid_scope` when it concerns requested `scope`, and otherwise `invalid_grant`.  `access_denied`, `authorization_pending`, and the other Deferred Token Response error codes are reserved for the deferred path and MUST NOT be returned here.
- **Deny, requestable, client offered `completion_mode=deferred`.**  The AS MUST NOT issue a token.  It submits an {{ARAP}} access request on the client's behalf, binds it to a `deferral_code`, and returns the DTR deferred response (`authorization_pending` with `deferral_code`, `expires_in`, and `interval`).
- **Deny, requestable, but `completion_mode` did not include `deferred`.**  The client required synchronous handling, so the AS MUST NOT defer.  It returns the same synchronous denial error it would for a non-requestable denial (above); the requestable nature is not exposed.  A client that wishes to obtain access through approval MUST offer `completion_mode=deferred`.

## Idempotent submission

A token request is not inherently idempotent, so a client that retries an initial request (for example after a lost response or a restart) could otherwise cause the AS to open a second access request and issue a second `deferral_code` for one intent.  To prevent duplicate approvals, the AS SHOULD treat a repeated requestable-denial request from the same client for the same requested authorization (the same `authorization_details` and `scope`) as the same request and return the existing `deferral_code` rather than open a new access request.  This deduplication is best-effort; a client that requires exactness SHOULD send a stable request identifier where its grant or a deployment profile provides one.

## The deferral code

The `deferral_code` is the continuation handle and binds the pending access request in AS state.  It is not authority: possessing a `deferral_code` does not authorize anything, and the AS issues a token only after the issuance-time re-evaluation in {{completion}}.  Per {{I-D.gerber-oauth-deferred-token-response}} the `deferral_code` is sender-constrained (see {{sender-constraining}}) and is redeemed at most once: once a token is issued for it, a subsequent redemption MUST fail with `invalid_grant`.

## Polling and completion {#completion}

The client polls the token endpoint with the deferred grant type (`urn:ietf:params:oauth:grant-type:deferred`) and the `deferral_code`, no faster than `interval`, and backs off on a `slow_down` response per {{I-D.gerber-oauth-deferred-token-response}}.  Where the AS supports the DTR client callback notification, the client MAY rely on it in addition to polling; polling remains the authoritative completion path.  On resolution the AS re-evaluates the original request with the approval as an input (the {{ARAP}} `approval` object, carried at `context.approval` in the AS's internal evaluation) and:

- **Approved.**  The AS issues the originating grant's token response.  The granted authorization (`authorization_details`, and `scope` if used) carries the approved access, which MUST NOT broaden the originating request, and the access token lifetime MUST NOT exceed the recorded approval expiry.

  The approval bounds the credential, not a single token.  In this completion mode the AS SHOULD NOT issue a refresh token; if it does, the refresh token and every access token derived from it MUST be bounded by the recorded approval expiry, and a refresh after that expiry MUST fail with `invalid_grant` and requires a new access request.  Likewise, a token issued by this profile MUST NOT be exchanged ({{RFC8693}}) into a credential that is longer-lived or broader than the approval.
- **Terminal denial, cancellation, or expiry.**  The AS returns `access_denied` (or `expired_token` once the `deferral_code` lifetime has elapsed), per {{I-D.gerber-oauth-deferred-token-response}}.

The issued access token is the decision representation.  This is the token issuance completion mode that {{ARAP}} defers to a downstream profile.  Because completion is the issued token, this mode is not surfaced to the client as an {{ARAP}} `result.mode` value; the OAuth token response is the result.

## Submission input

The Deferred Token Response carries no in-band interaction channel.  Inputs the access request needs are supplied either in the initial token request (for example as `authorization_details` fields) or out of band at the Access Request Service (for example through the {{ARAP}} `form_url` or `request_schema_url`).  This profile defines no new in-band input mechanism.

# AuthZEN Integration {#authzen-integration}

The AS evaluates the token request by calling its PDP through the AuthZEN Access Evaluation API {{AuthZEN}}, and uses the {{ARAP}} requestable-denial and re-evaluation extensions to drive deferral and completion.  These AuthZEN messages are exchanged between the AS and its PDP and never appear on the OAuth wire; the client sees only the OAuth token request and the deferred or final token response.  For how the {{ARAP}} lifecycle constructs map to the OAuth wire, see {{mapping}}.

## Constructing the Access Evaluation

The AS builds the Access Evaluation request from the token request:

| OAuth token request | AuthZEN Access Evaluation |
|---|---|
| The principal the token will act as (`client_credentials`: the client; Token Exchange: the `subject_token` subject; authorization code: the end user) | `subject` (with the agent in `subject.properties.act`) |
| Each `authorization_details` object, and any `scope` values | one or more `resource` and `action` pairs |
| Client identity, sender-constraining key, `resource` indicator {{RFC8707}}, and request metadata | `context` members |

The structural mapping above is fixed.  The semantic interpretation of a given `authorization_details` `type` (and of named scopes) into AuthZEN `resource` and `action` values is deployment- or vocabulary-defined, and interoperating parties MUST agree on it.  The agent acting for the principal is conveyed in `subject.properties.act` and `context.client_id`.

A fine-grained read request (read access to one customer record) maps to an evaluation such as:

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

A token request may carry several `authorization_details` (and scopes), which the AS evaluates together; it MAY use the AuthZEN Evaluations (bulk) API for this.  This profile treats the request as a unit: if any requested authorization is requestable-denied and the client offered `completion_mode=deferred`, the AS defers the whole request and issues the full requested set on approval.  Partial issuance (issuing the allowed subset immediately and deferring the rest) is not defined by this profile.

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

The AS submits the access request using this binding material, binds the resulting {{ARAP}} task to a `deferral_code`, and returns the DTR deferred response.  A `decision: false` with no `context.access_request` is a non-requestable denial and maps to the synchronous OAuth error in the Initial token request rules.

## Re-evaluation and issuance

On approval, the AS re-evaluates the same request with the {{ARAP}} `approval` object at `context.approval`:

~~~ json
{
  "subject": {
    "type": "user",
    "id": "alice@example.com",
    "properties": { "act": { "sub": "agent-7" } }
  },
  "resource": { "type": "customer_records", "id": "c-4815" },
  "action": { "name": "read" },
  "context": {
    "approval": { "id": "ar_123", "approved_until": "2026-06-13T12:00:00Z" }
  }
}
~~~

A `decision: true` response authorizes issuance: the AS issues the access token whose granted `authorization_details` reflect the approved `resource` and `action`, with a lifetime bounded by `approved_until`.  A `decision: false` at re-evaluation maps to `access_denied` on the next poll; obtaining access then requires a new token request.

# Examples

These examples are non-normative.  The deferral, polling, and completion are identical regardless of which party issues the token; what varies is the originating grant carrying `completion_mode=deferred` and which token-issuing party gates the approval.  The examples show approval gated at the AS (Token Exchange, Authorization Code, Refresh Token), at either authorization server in an ID-JAG chain (the IdP that issues the ID-JAG or the RAS that redeems it), and at a resource server that issues its own tokens.  All are valid.  The first example shows the full flow; the others show the distinctive initial request and name the deferring party.

## Token Exchange (approval at the AS)

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

The AS evaluates the request, gets a denied-but-requestable decision, submits an access request, and returns a deferred response:

~~~ json
{
  "error": "authorization_pending",
  "deferral_code": "8d67dc78-7faa-4d41-aabd-67707b374255",
  "expires_in": 10800,
  "interval": 60
}
~~~

The client polls until the record's data owner resolves the request out of band:

~~~ http
POST /token HTTP/1.1
Host: as.example.com
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ...

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adeferred
&deferral_code=8d67dc78-7faa-4d41-aabd-67707b374255
~~~

On approval the AS re-evaluates and issues an access token carrying the approved authorization, with a lifetime bounded by the approval expiry:

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

If the request is denied or cancelled, the poll returns `access_denied` and no token is issued.

## Authorization Code (approval at the AS)

A user authorizes an agent through the authorization code flow, requesting fine-grained authority with `authorization_details` at the authorization endpoint.  When the agent exchanges the code, the AS finds the requested action needs manager approval and defers.

~~~ http
POST /token HTTP/1.1
Host: as.example.com
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ...

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fagent.example%2Fcallback
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
&completion_mode=deferred
~~~

The requested `authorization_details` were carried on the authorization request and are bound to the code, so they are not repeated here.  The AS returns a deferred response and the agent polls and completes as above.

## Refresh Token (approval at the AS)

A long-running agent holds a refresh token scoped to one project.  When it refreshes to reach a resource outside that scope, the AS defers for the new resource owner's approval rather than issuing immediately.

~~~ http
POST /token HTTP/1.1
Host: as.example.com
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ...

grant_type=refresh_token
&refresh_token=8xLOxBtZp8
&completion_mode=deferred
&authorization_details=%5B%7B%22type%22%3A%22documents%22%2C%22actions%22%3A%5B%22read%22%5D%2C%22locations%22%3A%5B%22https%3A%2F%2Ffiles.example%2Fprojects%2Fatlas%2Fspec.pdf%22%5D%7D%5D
~~~

The AS returns a deferred response and the agent polls and completes as above.  Any token the AS ultimately issues remains scoped to the approved resource and bounded by the new approval's expiry, and the refresh token cannot be used to broaden or extend it (see {{completion}}).

## Identity Assertion Authorization Grant, ID-JAG (approval at the IdP or the RAS)

An ID-JAG flow has two token issuers, and approval may be gated at either.

The agent first obtains an ID-JAG from the enterprise identity provider (IdP) by Token Exchange.  The **IdP** may defer here, gating issuance of the ID-JAG itself:

~~~ http
POST /token HTTP/1.1
Host: idp.acme.example
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ...

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange
&requested_token_type=urn%3Aietf%3Aparams%3Aoauth%3Atoken-type%3Aid-jag
&audience=https%3A%2F%2Fcrm.acme.example
&subject_token=...&subject_token_type=urn%3Aietf%3Aparams%3Aoauth%3Atoken-type%3Aid_token
&completion_mode=deferred
&authorization_details=%5B%7B%22type%22%3A%22crm%22%2C%22actions%22%3A%5B%22export%22%5D%2C%22locations%22%3A%5B%22https%3A%2F%2Fcrm.acme.example%2Fcontacts%22%5D%7D%5D
~~~

Alternatively the IdP issues the ID-JAG synchronously and the **Resource Authorization Server (RAS)** defers when the agent redeems it (`grant_type=jwt-bearer`, `assertion`) for an access token:

~~~ http
POST /oauth2/token HTTP/1.1
Host: crm.acme.example
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ...

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer
&assertion=eyJhbGciOiJFUzI1Ni... (the ID-JAG)
&completion_mode=deferred
&authorization_details=%5B%7B%22type%22%3A%22crm%22%2C%22actions%22%3A%5B%22export%22%5D%2C%22locations%22%3A%5B%22https%3A%2F%2Fcrm.acme.example%2Fcontacts%22%5D%7D%5D
~~~

In both placements the deferring party returns the same `authorization_pending` deferred response, and the agent polls and completes the same way.

## Resource Server (approval at the RS)

Some resources issue their own access tokens, acting as their own authorization server.  The agent requests a token directly from the resource, which gates approval itself before issuing:

~~~ http
POST /token HTTP/1.1
Host: files.acme.example
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ...

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange
&completion_mode=deferred
&authorization_details=%5B%7B%22type%22%3A%22files%22%2C%22actions%22%3A%5B%22delete%22%5D%2C%22locations%22%3A%5B%22https%3A%2F%2Ffiles.acme.example%2Fprojects%2Fq4%22%5D%7D%5D
&subject_token=...&subject_token_type=...
~~~

The resource returns a deferred response and the agent polls and completes as above; here the resource server is the party that gates and records the approval.

# Mapping to the Access Request and Approval Profile {#mapping}

The OAuth wire surface replaces several {{ARAP}} constructs; the rest map directly.  For how the OAuth token request maps to AuthZEN Access Evaluation messages, see {{authzen-integration}}.

| ARAP construct | OAuth binding in this profile |
|---|---|
| Requestable denial (`context.access_request`) | The AS's internal trigger to defer.  Not surfaced to the client. |
| Access request submission | Performed by the AS on the client's behalf during evaluation of the token request. |
| Idempotency key | Best-effort dedup by client and requested authorization (see {{completion}} and Idempotent submission). |
| Task handle | The DTR `deferral_code`. |
| Task Status Endpoint and polling | Polling the token endpoint with the deferred grant type. |
| Callback completion | The optional DTR client callback notification. |
| `approval` object (`context.approval`) | Input to the AS's issuance-time re-evaluation. |
| `reevaluate` completion mode | Replaced by token issuance (this profile's completion mode). |
| `binding_token` / `evaluation_id` | Bound to the `deferral_code` in AS state; not exposed to the client. |
| `approved_until` | Upper bound on the issued access token lifetime. |
| Denial reason and `next_action` | OAuth error codes (`access_denied`, `expired_token`). |

# Sender-Constraining and Cancellation {#sender-constraining}

Per {{I-D.gerber-oauth-deferred-token-response}}, the `deferral_code` and the issued access token are sender-constrained using DPoP {{RFC9449}} or mutual TLS {{RFC8705}}; a public client MUST present DPoP on the initial token request, and every polling and revocation request MUST carry proof of possession for the same key.

To cancel a pending request, the client revokes the `deferral_code` at the revocation endpoint {{RFC7009}} (with `token_type_hint` set to `urn:ietf:params:oauth:token-type:deferral-code`, the type defined by {{I-D.gerber-oauth-deferred-token-response}}).  The AS MUST cancel the underlying access request.

# Privacy Considerations

- The requested and approved `authorization_details` can carry sensitive data (account numbers, amounts, resource identifiers).  Parties MUST apply data minimization and protect them in transit and at rest.
- The AS MUST NOT expose the approver's identity, internal approval state, or {{ARAP}} binding material to the client; the client sees only the `deferral_code` and the eventual token or error.
- `error_description` and any human-readable text returned with a deferred or error response MUST be minimized and MUST NOT leak approver identity or internal policy detail, consistent with {{I-D.gerber-oauth-deferred-token-response}}.

# Security Considerations

- **A deferred response is not a grant.**  `authorization_pending` with a `deferral_code` is not access.  Denial remains denial: the AS issues a token only after the issuance-time re-evaluation, and a non-requestable or terminally denied request yields an OAuth error, never a token.
- **Issuance-time decision, bounded by lifetime.**  Because the authoritative decision is made at issuance and the resource server may validate the token offline, deployments MUST bound the access token lifetime by the approval expiry and SHOULD keep lifetimes short and use token introspection where current revocation matters.  Refresh tokens and token exchange MUST NOT be used to extend an approval beyond its recorded expiry (see {{completion}}); otherwise the approval bound is defeated.
- **Least privilege and audience.**  The issued authorization MUST reflect the approved access and MUST NOT broaden the originating request, and the token SHOULD be audience-restricted to the intended resource using resource indicators {{RFC8707}} so an approved token cannot be replayed at an unintended resource server.
- **Request integrity.**  Because the requested `authorization_details` drive a fine-grained authorization decision, deployments SHOULD protect them in transit and from tampering, for example with Pushed Authorization Requests {{?RFC9126}} or a signed request, so the request the AS evaluates is the one the client intended.
- **The deferral code is not authority.**  It is opaque, sender-constrained, and bound to the client it was issued to; it is usable only at the token and revocation endpoints.
- **The decision stays behind the AS.**  The token request carries a RAR request and the issued token carries the approved grant; neither carries an AuthZEN request or decision object, which keeps the decision engine off the client surface and avoids substitution or replay of decision payloads.

# Relationship to Other Specifications {#relationship}

- {{ARAP}}: this profile is its OAuth token issuance completion mode.  {{ARAP}} owns the requestable denial, access request, approval, and audit lifecycle; this profile binds completion to OAuth token issuance.
- {{I-D.gerber-oauth-deferred-token-response}}: the asynchronous transport.  This profile adds no new grant type; it uses DTR's `completion_mode`, deferred grant, and polling.
- {{RFC9396}}: carries the requested authorization in the token request and the approved authorization in the issued token.
- {{RFC8693}}: Token Exchange is a natural originating grant for on-behalf-of agent flows, and DTR can defer it; this profile composes with it unchanged.
- {{?I-D.brossard-oauth-rar-authzen}}: that draft places an AuthZEN request and response inside `authorization_details`.  This profile deliberately does not.  The decision stays behind the AS and the token carries the approved grant, not the evaluation.
- {{?RFC8628}}: the Device Authorization Grant solves a related asynchronous case for the same end user; DTR (and therefore this profile) does not assume the approver is the requesting user, which is the agentic case this profile targets.

# IANA Considerations

This profile defines no new OAuth grant types, parameters, or error codes; it reuses {{I-D.gerber-oauth-deferred-token-response}} and {{RFC9396}}.  It requests no IANA registrations.  Any `authorization_details` type used by a deployment is registered per {{RFC9396}}.
