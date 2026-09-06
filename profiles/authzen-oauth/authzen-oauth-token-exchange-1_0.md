---
title: "AuthZEN Binding for OAuth 2.0 Token Exchange - Draft 1"
abbrev: "AuthZEN Token Exchange Binding"
category: std
ipr: none

docname: authzen-oauth-token-exchange-1_0
workgroup: OpenID AuthZEN
consensus: true
v: 3
stand_alone: true
smart_quotes: no
pi: [toc, sortrefs, symrefs, private]
keyword:
 - oauth
 - authorization
 - authzen
 - policy
 - token exchange
 - delegation

author:
 -
    fullname: "Omri Gazitt"
    organization: "Independent"
    email: "ogazitt@gmail.com"

normative:
  RFC6749:
  RFC8693:
  RFC8707:
  AUTHZEN:
    title: "Authorization API 1.0"
    target: "https://openid.net/specs/authorization-api-1_0-final.html"
    date: 2026-01-11
    author:
      - ins: "OpenID Foundation AuthZEN Working Group"
        org: "OpenID Foundation"
  ISSUANCE: I-D.gazitt-oauth-authzen-issuance

informative:
  RFC8705:
  RFC9068:
  RFC9449:
  I-D.ietf-oauth-identity-chaining:
  I-D.ietf-oauth-identity-assertion-authz-grant:
  I-D.ietf-oauth-transaction-tokens:
  ZANZIBAR:
    title: "Zanzibar: Google's Consistent, Global Authorization System"
    target: "https://www.usenix.org/conference/atc19/presentation/pang"
    date: 2019
    author:
      - ins: R. Pang
      - ins: R. Caceres
      - ins: M. Burrows

--- abstract

OAuth 2.0 Token Exchange (RFC 8693) defines the moment at which an
authorization server decides whether one party may obtain a token to act as,
or on behalf of, another. It states that the decision is governed by policy,
and does not define that policy. The specifications layered on top of it -
identity chaining, identity assertion authorization grants, and transaction
tokens - inherit the same seam.

This document binds those flows to the AuthZEN profile for OAuth 2.0 token
issuance. It specifies how a token exchange request is derived into AuthZEN
evaluation requests, how the authority of the requesting party is expressed
as a decision distinct from the authority being delegated, and what each of
the token types layered on token exchange contributes to that mapping.

--- middle

# Introduction

{{RFC8693}} generalizes a family of operations in which a party presents one
token and asks for another. The specification is precise about the inputs -
`subject_token`, `actor_token`, `audience`, `resource`, `scope`,
`requested_token_type` - and about the shape of the result, including the
`act` claim that records a delegation chain and the `may_act` claim that
authorizes one party to become the actor for another.

It is deliberately silent about the decision. Section 2.2.1 conditions a
successful response on the request meeting "all policy and other criteria of
the authorization server", and defines neither the policy nor the criteria.

{{ISSUANCE}} defines a framework for externalizing that class of decision to
a Policy Decision Point (PDP) using {{AUTHZEN}}, casting the authorization
server (AS) as a Policy Enforcement Point. That document is directly
implementable for grants whose request names a single party and a single
target. Token exchange names two parties, and several of its members name two
levels of target; supplying that structure is what this document does. It
covers:

* token exchange as defined in {{RFC8693}};
* identity chaining across trust domains
  ({{I-D.ietf-oauth-identity-chaining}});
* identity assertion authorization grants
  ({{I-D.ietf-oauth-identity-assertion-authz-grant}}), referred to here as
  ID-JAG;
* transaction tokens ({{I-D.ietf-oauth-transaction-tokens}}), referred to
  here as Txn-Tokens.

These are treated together because they are one grant with four sets of
parameters. Each names a subject, a requesting party, a target, and a set of
privileges, and each arrives at the same undefined decision.

## What This Document Adds

The framework maps a generic issuance request onto AuthZEN's mandatory
five-tuple. Token exchange adds one structural element the framework does
not have: **a second party**. Every other issuance flow decides what a
subject may obtain. A token exchange decides what a *requesting party* may
obtain *as, or on behalf of,* a subject.

That second party is not decoration. {{RFC8693}} introduces `may_act`
precisely because the authority to become another party's actor is a
distinct privilege, and Section 4.4 identifies the party whose authority is
in question as "the client (or party identified in the `actor_token`)".
This document's central normative content is that this second privilege is
evaluated as its own tuple, so that any conforming PDP - including a
relationship-based engine in the style of {{ZANZIBAR}}, which reads it
directly as an edge between two named entities - can adjudicate it
({{actor-gate}}).

The remainder is the derivation of the framework's inputs from each
specification's parameters, and the small number of invariants that each
specification places beyond a PDP's reach.

## Requirements Language

{::boilerplate bcp14-tagged}

# Terminology

This document uses the terms of {{RFC6749}}, {{RFC8693}}, {{AUTHZEN}}, and
{{ISSUANCE}}. In particular, *gate tuple* and *scope tuple* are used as
defined in {{ISSUANCE}}.

Exchange subject:
: The party the issued token will represent: the party whose identifier the
  AS intends to place in the issued token's subject claim. Derived in
  {{subject}}.

Requesting party:
: The party asking for the token, on whose own authority the exchange
  depends. This is the party identified by `actor_token` where one is
  present, and the authenticated client otherwise. Derived in
  {{requesting-party}}.

Issuance target:
: As in {{ISSUANCE}}: the audience of the access being granted.

# Applicability

This binding applies to a request at the token endpoint whose `grant_type`
is `urn:ietf:params:oauth:grant-type:token-exchange`, and to the assertion
grants used to redeem an ID-JAG ({{id-jag}}).

The AS performs the evaluation described here only after it has completed
every validation the underlying specification requires: authenticating the
client, validating the `subject_token` and any `actor_token` and confirming
their issuers are trusted, and verifying any proof of possession. A permit
from a PDP does not substitute for any of these. This restates
{{ISSUANCE}}'s architecture and is repeated because token exchange is the
flow in which the temptation to conflate the two is greatest: the PDP is
being asked whether a delegation is *permitted*, never whether the presented
tokens are *valid*.

# Forming the Evaluation Request

## Subject {#subject}

The exchange subject is derived from `subject_token`, interpreted according
to `subject_token_type`:

| Value of subject_token_type | Exchange subject |
|---|---|
| `access_token`, `id_token`, `jwt` | The subject of the presented token |
| `refresh_token` | The subject the refresh token was issued for |
| `saml1`, `saml2` | The subject of the assertion |
| `self_signed`, `unsigned_json` | See {{txn-tokens}} |

`subject.type` MUST be `user` where the exchange subject is a natural person
and `workload` where it is a non-human software identity, per the registry
established by {{ISSUANCE}}.

`subject.id` MUST be the identifier the AS intends to place in the issued
token's subject claim, as {{ISSUANCE}} requires. In token exchange this
ordering constraint has teeth, because the subject identifier frequently
changes during the exchange: an AS receiving a token from a peer trust
domain resolves the foreign subject to a local account, and an AS issuing
pairwise identifiers computes one per audience. Any such resolution MUST be
performed **before** the evaluation request is constructed.

An AS that evaluated against the incoming identifier and then issued a token
bearing a resolved one would obtain a decision about a subject that does not
appear in the token it mints.

## Requesting Party {#requesting-party}

The requesting party is:

1. the party identified by `actor_token`, interpreted according to
   `actor_token_type`, where an `actor_token` is present; otherwise
2. the authenticated client.

`subject.type` for the requesting party MUST be `client` where it is an
OAuth client identified by a client identifier, and `workload` where it is a
software identity presenting a credential such as an X.509 certificate
({{RFC8705}}) or a workload identity document.

The requesting party is derived in both delegation and impersonation. It is
in the impersonation case - where the issued token carries no `act` claim
and the requesting party is therefore invisible in the result - that
evaluating its authority matters most, because nothing downstream can
recover it.

## Actions {#actions}

A token exchange request produces gate tuples and scope tuples as defined in
{{ISSUANCE}}, which requires a gate tuple on every request. This binding
produces **two**, because a token exchange has two parties whose authority
is in question.

Both carry the same `action.name`, of the form
`issue:<token-type>:token_exchange`, where the token type short name is the
one registered for the value of `requested_token_type` ({{iana-actions}}).
The grant segment is `token_exchange` throughout, since that is the grant
this binding applies to; it is what distinguishes these tuples from those a
direct request by the same party for the same target would produce.

Where `requested_token_type` is absent, {{RFC8693}} directs the AS to its
default, and the short name for that default type is used.

### Subject Gate Tuple

The AS MUST include a gate tuple whose subject is the exchange subject.

### Requesting Party Gate Tuple {#actor-gate}

The AS MUST include a second gate tuple whose subject is the requesting
party ({{requesting-party}}), with the same `action.name` and the same
resource as the subject gate tuple.

This tuple is the interoperable expression of the question {{RFC8693}}
Section 4.4 poses: whether the client, or the party named in the
`actor_token`, is authorized to engage in the requested delegation or
impersonation. Expressing it as a five-tuple rather than as a property of
the subject's tuple is what puts it within reach of any conforming PDP: a
relationship-based engine adjudicates it directly, as the relation between a
named subject and a named object, without having to be told how to project a
property bag into one.

The two gate tuples ask different questions and both MUST be permitted:

* the subject gate asks whether a token of this kind may exist for this
  subject and this target at all;
* the requesting party gate asks whether this party may be the one to obtain
  it.

Where the requesting party and the exchange subject are the same entity -
a client exchanging a token it obtained for itself - the two gate tuples are
identical, and the AS MAY include only one.

### `may_act` Is Not a Substitute

Where the `subject_token` carries a `may_act` claim, the AS MUST convey it
as advisory context ({{context}}) and MUST NOT treat its presence as
satisfying the requesting party gate tuple, nor its absence as denying it.

`may_act` is an assertion made by the issuer of the subject token at the
time that token was minted. The gate tuple is a decision rendered by policy
at the time of the exchange. Substituting the first for the second would
reintroduce, one layer down, exactly the staleness that consulting a PDP at
issuance exists to address. An ABAC-class PDP is free to consume `may_act`
from context and require the requesting party to appear in it; that is a
policy choice made at the PDP, which is where it belongs.

### Scope Tuples

Scope tuples are formed as in {{ISSUANCE}}, one per requested scope value,
carried verbatim.

The subject of every scope tuple MUST be the exchange subject, not the
requesting party. Scope expresses access authority, and in both delegation
and impersonation the access being exercised is the subject's. A requesting
party cannot acquire access the subject does not have by asking for it on
the subject's behalf; its own privilege is the right to act as the subject
at all, which the gate tuple decides.

{{txn-tokens}} defines an additional requirement for Txn-Tokens, whose
governing specification makes the requesting workload's authority
scope-dependent.

## Resource {#resource}

`resource.type` MUST be `audience` and `resource.id` MUST be the issuance
target, as in {{ISSUANCE}}. Where the request carries an `audience`
parameter, or a `resource` parameter in the sense of {{RFC8707}}, that value
determines the issuance target.

Where the request names more than one target, the AS MUST fan the tuples out
across targets: each gate tuple and each scope tuple is evaluated once per
named target.

### Two-Level Evaluation for Chained Grants {#two-level}

Some members of this family issue an artifact that is consumed by one party
in order to obtain access at another. An ID-JAG is presented to a peer
authorization server, but the access it describes is at a resource behind
that server. The artifact's own audience and the audience of the access
being granted are different values, and both are decision-critical: the
first governs delegation into a trust domain, the second governs reach
within it.

Where the two differ, the AS MUST perform a **two-level evaluation**,
producing tuples at both:

* **Level 1**, with `resource.id` set to the consumer of the issued artifact
  - the peer authorization server. Gate tuples appear only at this level.
* **Level 2**, with `resource.id` set to each resource identifier named by
  the request under {{RFC8707}}. Scope tuples are produced at both levels,
  and authorization detail tuples only here: an entry describes access at a
  resource rather than delegation to the consumer of the artifact. Where an
  entry omits `locations`, the targets {{ISSUANCE}} substitutes are the
  level-2 resources.

A denial at level 1 is a refusal to delegate into that trust domain and is
fatal.

A denial at level 2 narrows what the issued artifact may name, and how
depends on which tuple was denied. A denied scope tuple removes that scope
from the artifact entirely, even where other level-2 resources permitted it,
which is the intersection {{ISSUANCE}} requires. A denied authorization
detail cell narrows only its own entry at its own location, because a cell
names the location it applies to.

The intersection is forced here by redemption rather than by {{RFC9068}}. An
ID-JAG carries the level-2 resources in a `resource` claim and its scopes in
a flat `scope` claim, with no pairing between them, and
{{I-D.ietf-oauth-identity-assertion-authz-grant}} has the resource
authorization server process both and grant any subset it decides on. A
scope the identity provider's PDP permitted at one resource and denied at
another would therefore reach redemption with the denial no longer visible,
and could be granted for the resource that denied it. An AS whose deployment
needs a scope to survive at one level-2 resource and not another issues one
ID-JAG per resource, or expresses the distinction in
`authorization_details`, where the location is part of the cell.

Where the request names no {{RFC8707}} resource, level 2 does not exist and
the evaluation is single-level.

## Context {#context}

In addition to the keys defined by {{ISSUANCE}}, an AS implementing this
binding SHOULD convey the following in the request `context`. All are
advisory: a PDP MUST be able to render a decision from the five-tuple alone.

| Key | Type | Value |
|---|---|---|
| `subject_token_type` | string | The `subject_token_type` parameter, verbatim |
| `actor_token_type` | string | The `actor_token_type` parameter, if present |
| `subject_token` | object | Selected validated claims of the subject token, such as `iss`, `acr`, `amr`, and `auth_time` |
| `act` | object | The `act` claim of the subject token, if present, conveying an existing delegation chain |
| `may_act` | object | The `may_act` claim of the subject token, if present |
| `cnf` | object | The confirmation method of the presented credential, where the exchange is sender-constrained under {{RFC8705}} or {{RFC9449}} |

Each key has one JSON type, as {{ISSUANCE}} requires of context keys defined
by a binding.

`requested_token_type` is not among them. It determines the token type
segment of the gate action name, so it is already in the five-tuple, and
repeating it in `context` would give a PDP two places to read the same fact
and a way for them to disagree. `subject_token_type` and `actor_token_type`
describe the credentials presented, not the token requested, and remain
advisory.

An AS MUST NOT place raw token strings in `context`. Only claims the AS has
already validated are conveyed, and only those a deployment's policies
consume. The subject token may carry claims about a party that has not
authorized their disclosure to the PDP.

## Batch Composition {#composition}

Except where a request names no scopes and the two gate tuples coincide
({{actor-gate}}), the AS uses the Access Evaluations API of {{AUTHZEN}} as
{{ISSUANCE}} specifies, with `options.evaluations_semantic` set to
`execute_all`.

{{ISSUANCE}} requires gate tuples to occupy the leading indices of the
`evaluations` array. Here that ordinarily means indices 0 and 1, in the order
given in {{actions}}: the subject gate first, then the requesting party gate.
Scope tuples follow. The AS MUST fail the request without issuing a token if
either gate is denied.

Narrowing is the ordinary outcome of a scope denial, and matches
{{I-D.ietf-oauth-identity-assertion-authz-grant}}, which states that granted
scopes may be a subset of those requested. Where a deployment instead intends
the requested privileges to be granted whole, it does not vary the evaluations
semantic to obtain that: it fails the request when any scope tuple is denied.

A short-circuiting semantic is not used, because it may return a truncated
`evaluations` array while the aggregation rules of {{ISSUANCE}} are defined
over the complete set of per-item results. Composing those results is the AS's
work here in any case: {{AUTHZEN}} selects the semantic per request rather
than per item, so the fatality of a gate denial is enforced by the AS and not
by the PDP. Retaining every per-item result also preserves the record of which
privilege was refused, which is what an operator needs when a request fails.

# Token Type Bindings

## Access Tokens and Refresh Tokens

No additional derivation is required. The mapping of {{ISSUANCE}} and the
preceding sections is complete for an exchange whose
`requested_token_type` is `urn:ietf:params:oauth:token-type:access_token` or
`urn:ietf:params:oauth:token-type:refresh_token`.

## Identity Chaining

{{I-D.ietf-oauth-identity-chaining}} composes two token endpoint requests:
an exchange at the authorization server of trust domain A yielding an
authorization grant for trust domain B, and the redemption of that grant at
B's authorization server.

Each leg is an independent issuance decision and is evaluated independently,
against the PDP of the trust domain whose authorization server is
performing it. Neither AS relies on the other's evaluation. This follows
from the specification's own model, in which each domain remains
authoritative for its own policy, and it is what the profile is for: the
first leg decides whether authority may leave domain A, the second decides
what authority it acquires in domain B.

The first leg is a two-level evaluation under {{two-level}} where the
request names {{RFC8707}} resources. The second leg is an ordinary
single-level evaluation whose exchange subject is the local account the
foreign subject resolved to, per {{subject}}.

{{I-D.ietf-oauth-identity-chaining}} notes that a request may be denied due
to policy, for instance where a trust relationship is not established. Under
this binding, the existence of the trust relationship remains a
precondition the AS validates; the PDP decides what is permitted across a
relationship that already exists.

## Identity Assertion Authorization Grant {#id-jag}

An ID-JAG is issued by an identity provider's authorization server and
redeemed at an application's authorization server.

**Issuance.** The `requested_token_type` is
`urn:ietf:params:oauth:token-type:id-jag`, so the gate tuples carry
`action.name` of `issue:id_jag:token_exchange`. The issued grant's audience
is the
resource authorization server, while
{{I-D.ietf-oauth-identity-assertion-authz-grant}} makes the {{RFC8707}}
`resource` subset a policy decision in its own right. The AS MUST therefore
perform a two-level evaluation under {{two-level}}.

`scope` is OPTIONAL in an ID-JAG request. Where it is absent, the request
produces gate tuples and no scope tuples, and a PDP that wishes to grant a
specific set returns `granted_scope` in the response context, as
{{ISSUANCE}} defines. This is the case the framework's gate tuple exists
for: without it, a scopeless ID-JAG request would produce no evaluation at
all.

{{I-D.ietf-oauth-identity-assertion-authz-grant}} has the identity provider
evaluate policy for each requested authorization detail, and permits it to
modify, filter, or omit them. Under this binding the unit is finer than the
entry, since {{ISSUANCE}} decomposes each entry into one tuple per cell, and
the three operations have distinct sources. An entry is omitted where every
one of its cells is denied. An entry is filtered where only some are, which
may require returning it as several entries of one `type` rather than one.
Modification beyond what the cells can express comes from the
`authorization_details` shaping key of {{ISSUANCE}}, subject to that key's
structural check.

**Redemption.** The application's authorization server presents the ID-JAG
as an assertion grant. This is an ordinary single-level evaluation. Its
exchange subject is the local account produced by the subject resolution
that {{I-D.ietf-oauth-identity-assertion-authz-grant}} requires, and its
requesting party is the client authenticated at that endpoint - which is a
different party from the client that obtained the grant. Evaluating it is
the point: redemption is where an application's own authorization server
decides what the asserted identity may do locally.

Where a deployment is multi-tenant, the AS SHOULD convey the tenant
identifier in `context`. A deployment whose decisions genuinely depend on
tenancy SHOULD instead encode the tenant in `resource.id`, so that the
dependency is visible in the five-tuple.

## Transaction Tokens {#txn-tokens}

{{I-D.ietf-oauth-transaction-tokens}} defines a Transaction Token Service
(TTS) that mints short-lived tokens carrying a call chain's originating
context. Its issuance decision is the one this profile addresses, and the
specification states directly that the authorization policy determining
issuance is out of scope for it.

Txn-Tokens differ from the rest of the family in four ways that the binding
must account for.

**There is no `actor_token`.** The requesting party is the workload that
authenticated to the TTS, typically with a credential under {{RFC8705}} or
a workload identity document. It is derived under rule 2 of
{{requesting-party}} with `subject.type` of `workload`.

**The requesting workload's authority is scope-dependent.** The
specification requires the TTS to determine whether the requesting workload
is authorized to obtain a Txn-Token *with the requested values*, not merely
whether it may obtain one. For `requested_token_type` of
`urn:ietf:params:oauth:token-type:txn_token`, the AS MUST therefore include
scope tuples for the requesting party in addition to those for the exchange
subject. Both sets MUST be permitted for the corresponding scope to be
granted. This is the one place in this document where the requesting party
is evaluated for access authority rather than only for issuance authority,
and it is required because the governing specification asks for it.

**Subject derivation is ambiguous for self-signed and unsigned subject
tokens.** Where `subject_token_type` is
`urn:ietf:params:oauth:token-type:self_signed` or
`urn:ietf:params:oauth:token-type:unsigned_json`, the presented token is not
an authority on identity. The AS MUST determine whether the request is on
behalf of a user, in which case the exchange subject is that user and the
AS MUST have an independent basis for believing the assertion, or on the
workload's own behalf, in which case the exchange subject is the requesting
workload itself and the two gate tuples coincide. An AS MUST NOT accept a
user identity from an unsigned subject token without such a basis. The PDP
cannot detect this error, because it sees only the identifier it is given.

**Transaction context may originate at the PDP.** The specification makes
the TTS authoritative for the transaction context of the token it mints, and
permits that context to be derived from the request details. A PDP is a
legitimate source for that derivation. Where a deployment uses one, the
transaction context is carried as a member of the `claims` shaping key of
{{ISSUANCE}}, and the TTS remains authoritative: it MUST validate the
returned value before minting, and its own determination prevails.

A PDP that asserts a quantitative ceiling in transaction context is
asserting a constraint that a downstream enforcement point is expected to
apply, and dropping it would broaden what the token effectively authorizes.
A PDP asserting such a value MUST name the claim in `crit`, per {{ISSUANCE}}.

Requests for replacement Txn-Tokens are a second issuance moment with the
same tuple shape and require no additional machinery. The invariants that
{{I-D.ietf-oauth-transaction-tokens}} places on a replacement - that it MUST
NOT expand scope, and MUST NOT modify the transaction identifier, subject,
or audience - are preconditions the TTS enforces. **A PDP cannot waive
them.** A permit authorizes a replacement within those bounds; it does not
authorize one outside them.

# Processing the Response

The response processing rules of {{ISSUANCE}} apply without change,
including the no-broadening rule, the mandatory-to-understand
classification, the reserved claim list, and the aggregation rules for
composing per-item shaping across a batch.

Two consequences of that framework are worth restating here, because token
exchange is where they bind hardest.

**`sub` and `aud` are reserved.** A PDP cannot rewrite the subject or the
audience of the issued token. In a family of flows whose entire purpose is
to produce a token for a different audience, or bearing a different subject
identifier, than the one presented, the temptation to let the PDP perform
that transformation is real. It must be resisted: re-subjecting a token is a
fresh issuance rather than an attenuation of an existing one, and must be
evaluated as such. The AS decides the transformation and evaluates the
result, as {{subject}} requires.

**`act` and `may_act` are reserved.** The delegation chain of the issued
token is constructed by the AS from parties it authenticated. A PDP that
could write `act` could fabricate a delegation history; a PDP that could
write `may_act` could confer delegation authority that no evaluation
considered, which is broadening by construction.

# Error Mapping

The mapping of {{ISSUANCE}} applies, refined for the errors of {{RFC8693}}:

| Condition | Authorization server behavior |
|---|---|
| Subject gate tuple denied | Fail; `invalid_request` |
| Requesting party gate tuple denied | Fail; `invalid_request` |
| All scope tuples denied | Fail; `invalid_scope` |
| Some scope tuples denied | Issue with the permitted subset; report via `scope` |
| Level 1 denied in a two-level evaluation | Fail; `invalid_target` |
| Every target denied, or shaping empties the target set | Fail; `invalid_target` |
| Requested token type not permitted | Fail; `invalid_request` |
| PDP unreachable or response malformed | Fail closed; do not issue |

An AS MUST NOT distinguish, in the error returned to the client, between a
denial of the subject gate and a denial of the requesting party gate. The
difference tells the requesting party whether its own authority or the
subject's was lacking, which is information about the subject's authority
that the requesting party has not been authorized to learn. Both are
reported as `invalid_request`, and the distinction is recorded where
{{ISSUANCE}} directs PDP reason information: in the AS's own logs.

# Discovery

This binding registers no capability URN of its own. A PDP advertises support
for the URN of {{ISSUANCE}}, and nothing further is negotiated.

Nothing further is needed. A capability URN identifies response vocabulary,
because an AS must understand what it is asked to enforce, and this binding
adds none: it uses the shaping keys of {{ISSUANCE}} unchanged. The context
keys of {{context}} are advisory, and a PDP that does not recognize one
ignores it. The gate action names registered in {{iana-actions}} are covered
by {{ISSUANCE}}'s rule that a PDP advertising the issuance capability renders
a decision on any registered gate action, so an AS never has to discover
which members of this family a deployment's policy anticipates.

An operator enabling one of these grants for the first time - ID-JAG on an AS
that previously performed only ordinary exchanges, say - can check whether
policy anticipates the new gate action before turning it on, using the Action
Search API of {{AUTHZEN}} as {{ISSUANCE}} describes.

# Examples

The first example below is shown in full, framed against the HTTPS JSON
binding of {{AUTHZEN}}; the second shows only the JSON payload. As
{{ISSUANCE}} notes, the transport is a property of the deployment, and where
the HTTPS JSON binding is in use the request URL is the PDP's
`access_evaluations_endpoint` where its metadata publishes one. Both requests
here carry two gate tuples, so neither reduces to a single evaluation.

## Delegation With an Actor Token

A gateway workload exchanges a user's access token for a token aimed at a
partner API, acting on the user's behalf. Two gate tuples and one scope
tuple result.

~~~ http-message
POST /token HTTP/1.1
Host: as.example
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&subject_token=eyJ...
&subject_token_type=urn:ietf:params:oauth:token-type:access_token
&actor_token=eyJ...
&actor_token_type=urn:ietf:params:oauth:token-type:jwt
&requested_token_type=urn:ietf:params:oauth:token-type:access_token
&audience=https%3A%2F%2Fapi.partner.example
&scope=read%3Adocs
~~~

~~~ http-message
POST /access/v1/evaluations HTTP/1.1
Host: pdp.example.com
Content-Type: application/json
Authorization: Bearer <token>

{
  "resource": {
    "type": "audience",
    "id": "https://api.partner.example"
  },
  "context": {
    "client_id": "gateway-client",
    "may_act": { "sub": "spiffe://cluster/ns/prod/sa/gateway" }
  },
  "evaluations": [
    {
      "subject": { "type": "user", "id": "alice@example.com" },
      "action":  {
        "name": "issue:access_token:token_exchange"
      }
    },
    {
      "subject": {
        "type": "workload",
        "id": "spiffe://cluster/ns/prod/sa/gateway"
      },
      "action":  {
        "name": "issue:access_token:token_exchange"
      }
    },
    {
      "subject": { "type": "user", "id": "alice@example.com" },
      "action":  { "name": "read:docs" }
    }
  ],
  "options": { "evaluations_semantic": "execute_all" }
}
~~~

A relationship-based PDP reads the second tuple as an edge between
`workload:spiffe://cluster/ns/prod/sa/gateway` and
`audience:https://api.partner.example` under the relation
`issue_access_token_token_exchange`. No property bag is consulted, and the
relation is distinct from the one that would govern the gateway obtaining a
token for itself under the client credentials grant.

~~~ http-message
HTTP/1.1 200 OK
Content-Type: application/json

{
  "evaluations": [
    { "decision": true },
    { "decision": true },
    {
      "decision": true,
      "context": {
        "issuance": {
          "token_lifetime": 300,
          "claims": { "groups": ["eng", "sre"] }
        }
      }
    }
  ]
}
~~~

The AS issues an access token for `https://api.partner.example` bearing
`scope` of `read:docs`, an `act` claim naming the gateway, a `groups` claim,
and a lifetime no greater than 300 seconds.

## Scopeless ID-JAG, Two Levels

An ID-JAG request naming a resource but no scopes. Two gate tuples at level
1, no scope tuples anywhere, and the PDP supplies the grantable set.

~~~ json
{
  "context": { "client_id": "chatterbox-idp-7f3a" },
  "evaluations": [
    {
      "subject":  { "type": "user", "id": "U0405936" },
      "action":   { "name": "issue:id_jag:token_exchange" },
      "resource": {
        "type": "audience",
        "id": "https://as.app.example"
      }
    },
    {
      "subject":  { "type": "client", "id": "chatterbox-idp-7f3a" },
      "action":   { "name": "issue:id_jag:token_exchange" },
      "resource": {
        "type": "audience",
        "id": "https://as.app.example"
      }
    }
  ],
  "options": { "evaluations_semantic": "execute_all" }
}
~~~

~~~ json
{
  "evaluations": [
    {
      "decision": true,
      "context": {
        "issuance": {
          "granted_scope": "files.read",
          "token_lifetime": 300
        }
      }
    },
    { "decision": true }
  ]
}
~~~

The AS mints an ID-JAG naming `files.read` and the requested resource. Had
the PDP returned a bare permit, the AS would have fallen back to its own
default scope set for that client and target, which is a safe degradation:
a PDP unable to enumerate a grantable set is not thereby able to broaden
one.

# Security Considerations

The considerations of {{ISSUANCE}} apply in full, including fail-closed
behavior, the treatment of the PDP as a trust dependency, and the privacy
consequences of consulting a PDP on every issuance.

## Impersonation Is the Dangerous Case

An impersonation exchange produces a token indistinguishable from one issued
to the subject directly. Nothing downstream can determine that a different
party obtained it, which means no downstream enforcement point can apply
policy to the requesting party's involvement. The requesting party gate
tuple of {{actor-gate}} is the only point at which that party's authority is
evaluated at all.

An implementation that omitted it - reasoning that the client was already
authenticated, or that `may_act` was present in the subject token - would
externalize the delegation decision in name only. Client authentication
establishes who is asking; it does not establish that they may ask for this.

## Chain Depth and Repeated Exchange

A token obtained by exchange may itself be exchanged. Each exchange is an
independent decision under this binding, so authority cannot be broadened by
iteration: every step is gated, and the scope tuples at each step are
bounded by what the AS would otherwise grant.

What repetition can accumulate is *lifetime*. A chain of exchanges, each
issuing a token whose lifetime is permitted at that moment, can keep
authority alive well past the point at which the original grant would have
expired. Deployments SHOULD convey the existing `act` chain in context so
that policy can act on chain depth, and SHOULD bound the lifetime of an
exchanged token by the remaining lifetime of the subject token. The second
is an AS responsibility: a `token_lifetime` shaping value is a ceiling and
never a floor, so a PDP cannot repair an AS that fails to apply it.

## Trust in the Subject Token Issuer

In cross-domain flows the subject token is issued by a party in another
trust domain, and the claims conveyed to the PDP as context originate there.
A PDP whose policy depends on those claims has extended trust to that
issuer. This is a further reason for the five-tuple rule: a decision that
depends only on the resolved local subject identifier, the requesting party,
the action, and the target depends on values the local AS established
itself.

## Denial Information Disclosure

Both the error mapping above and {{ISSUANCE}}'s prohibition on relaying PDP
reason strings exist to keep the requesting party from learning the shape of
a policy that governs a subject it is merely acting for. Deployments adding
diagnostics to token endpoint error responses should preserve this.

# IANA Considerations

This document has no IANA actions. OpenID Foundation registry requests are
listed in {{oidf-registries}}.

# OpenID Foundation Registry Considerations {#oidf-registries}

## AuthZEN Token Issuance Action Names Registry {#iana-actions}

This specification requests registration of the following token type short
names in the AuthZEN Token Issuance Action Names registry established by
{{ISSUANCE}}, whose registration policy is Specification Required. Change
Controller for all entries is the OpenID Foundation AuthZEN Working Group,
and the Specification Document is this document.

| Short name | Token type |
|---|---|
| `id_jag` | `urn:ietf:params:oauth:token-type:id-jag` |
| `txn_token` | `urn:ietf:params:oauth:token-type:txn_token` |
| `jwt` | `urn:ietf:params:oauth:token-type:jwt` |
| `saml1` | `urn:ietf:params:oauth:token-type:saml1` |
| `saml2` | `urn:ietf:params:oauth:token-type:saml2` |

The short names for `access_token`, `refresh_token`, and `id_token`, and the
`token_exchange` grant type short name that pairs with all of the above, are
registered by {{ISSUANCE}}.

`id_jag` uses an underscore where the token type URI uses a hyphen, as
{{ISSUANCE}} requires of every registered short name.

> **Editor's note.** These registrations depend on the corresponding token
> types being registered in the "OAuth URI" registry by their own
> specifications. `id-jag` and `txn_token` are requested by documents still
> in progress, and the short names above should be confirmed against the
> values those documents ultimately register.

--- back

# Acknowledgments
{:numbered="false"}

The separation of issuance authority from access authority, which this
document expresses as two gate tuples, was arrived at by working through the
protocol messages of {{I-D.ietf-oauth-identity-assertion-authz-grant}} and
{{I-D.ietf-oauth-transaction-tokens}}, and the resulting shape owes a great
deal to the care with which those documents model their inputs.

Thanks to the members of the OAuth Working Group and the OpenID AuthZEN
Working Group.

# Document History
{:numbered="false"}

Draft 1 continues the individual Internet-Draft
`draft-gazitt-oauth-authzen-token-exchange`, whose `-01` made the changes
below.

## Since -00
{:numbered="false"}

* Authorization details are narrowed by the cell rather than by the scope
  tuple, following the authorization detail tuple {{ISSUANCE}} now defines.
* {{two-level}} places authorization detail tuples at level 2 and says which
  targets are substituted for an entry that omits `locations`.
* A denied scope tuple at level 2 and a denied authorization detail cell at
  level 2 narrow different things, and the scope intersection is justified by
  what an ID-JAG loses at redemption rather than by {{RFC9068}}.
* Removed the enforcement point capability declaration from the examples,
  which {{ISSUANCE}} no longer defines.
