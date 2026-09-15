---
title: "AuthZEN Profile for OAuth 2.0 Token Issuance - Draft 1"
abbrev: "AuthZEN Token Issuance"
category: std
ipr: none

docname: authzen-oauth-token-issuance-1_0
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

author:
 -
    fullname: "Omri Gazitt"
    organization: "Independent"
    email: "ogazitt@gmail.com"

normative:
  RFC6749:
  RFC7519:
  RFC8693:
  RFC9396:
  AUTHZEN:
    title: "Authorization API 1.0"
    target: "https://openid.net/specs/authorization-api-1_0-final.html"
    date: 2026-01-11
    author:
      - ins: "OpenID Foundation AuthZEN Working Group"
        org: "OpenID Foundation"

informative:
  RFC7515:
  RFC7643:
  RFC8176:
  RFC8707:
  RFC9068:
  RFC9126:
  RFC9470:
  RFC9700:
  I-D.brossard-oauth-rar-authzen:
  I-D.gerber-oauth-deferred-token-response:
  I-D.ietf-oauth-identity-chaining:
  I-D.ietf-oauth-identity-assertion-authz-grant:
  I-D.ietf-oauth-transaction-tokens:
  ARAP:
    title: "AuthZEN Access Request and Approval Profile 1.0"
    target: "https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0"
    date: 2026-07-27
    author:
      - ins: K. McGuinness
        name: "Karl McGuinness"
        org: "Independent"
  GRANTMGMT:
    title: "Grant Management for OAuth 2.0"
    target: "https://openid.bitbucket.io/fapi/oauth-v2-grant-management.html"
    date: 2026-06-26
    author:
      - ins: T. Lodderstedt
        name: "Torsten Lodderstedt"
        org: "yes.com"
      - ins: S. Low
        name: "Stuart Low"
        org: "Biza.io"
      - ins: D. Postnikov
        name: "Dima Postnikov"
        org: "Independent"
  ZANZIBAR:
    title: "Zanzibar: Google's Consistent, Global Authorization System"
    target: "https://www.usenix.org/conference/atc19/presentation/pang"
    date: 2019
    author:
      - ins: R. Pang
      - ins: R. Caceres
      - ins: M. Burrows

--- abstract

Numerous OAuth 2.0 specifications define a moment at which an authorization
server decides whether to issue a security token, and each of them declares
the decision itself to be a matter of local policy that is out of scope.
The result is that a decision common to every OAuth deployment has no
interoperable expression.

This document defines a profile for using the OpenID AuthZEN Authorization
API to externalize that decision to a Policy Decision Point. It specifies
how the inputs to a token issuance request map onto AuthZEN's mandatory
five-tuple, how a Policy Decision Point response may shape the issued token,
and how a Policy Decision Point advertises support for the profile.

The mapping is complete for grants whose request names a single party,
including the authorization code and client credentials grants. Companion
documents bind the grant families that add structure this document does not
model, the token exchange family first among them.

--- middle

# Introduction

Consider the moment an OAuth 2.0 authorization server (AS) has authenticated
a client, validated a grant, and must decide whether to mint a token - and
if so, with what scopes, what audience, what lifetime, and what claims.
Every specification that defines such a moment models its inputs in careful
detail and then stops short of the decision.

{{RFC8693}}, which defines OAuth 2.0 Token Exchange, is explicit that the
decision to issue is governed by policy it does not define. The
specifications built on top of it inherit that seam: identity chaining
({{I-D.ietf-oauth-identity-chaining}}), identity assertion authorization
grants ({{I-D.ietf-oauth-identity-assertion-authz-grant}}), and transaction
tokens ({{I-D.ietf-oauth-transaction-tokens}}) each describe an
"administrator-defined policy" or equivalent without describing how such a
policy is expressed, evaluated, or externalized.

Leaving the decision to local policy is the correct choice for those
documents. But it means that the single most security-relevant step in token
issuance is, today, an implementation detail - expressed in vendor-specific
rules engines, inline hooks, and scripting extensions that do not port
between authorization servers and cannot be reasoned about by anything
outside the AS.

{{AUTHZEN}} defines an interoperable API between a Policy Enforcement Point
(PEP) and a Policy Decision Point (PDP). This document profiles that API for
the token issuance moment, casting the **authorization server as a PEP**.

## Design Goals {#design-goals}

**One mechanism, many issuance moments.** The decision point is
structurally identical across grant types: a party is asking for a token,
naming a target and some set of privileges. This document defines that
mapping once. Bindings ({{companions}}) supply what is specific to a given
grant or token type, and are expected to be short.

**Interoperability at the level of policy, not just wire format.**
{{AUTHZEN}} makes exactly five fields mandatory in an evaluation request:
`subject.type`, `subject.id`, `action.name`, `resource.type`, and
`resource.id`. Everything else - the `properties` bag on each entity, and the
`context` object - is optional. That asymmetry is deliberate. It is what
allows one request shape to be understood by policy engines with very
different internal models: attribute- and policy-based engines that evaluate
expressions over arbitrary input, and relationship-based engines in the style
of {{ZANZIBAR}} that reason over a typed graph of subjects, relations, and
objects.

The five-tuple has a shape every conforming PDP can be expected to read the
same way; a free-form bag does not, and a profile that carried its
decision-critical inputs there would nominally use AuthZEN while leaving each
PDP to infer the semantics on its own.

This document therefore adopts a design rule:

> The five-tuple is the primary information model target. Every input on
> which the decision depends MUST be expressed in it. `properties` and
> `context` carry advisory input only, and a conforming mapping MUST be
> implementable by a PDP that reads only the five-tuple.

The rule is applied throughout and is not re-argued at each mapping.

**Least surprise for the AS.** The profile does not ask the AS to surrender
decisions it is authoritative for. A PDP may narrow what is issued; it may
not broaden it, re-subject it, or re-target it ({{no-broadening}}).

## Scope

This document covers **token issuance**: the decision made by an
authorization server at its token endpoint, before a token is minted. It
does not address enforcement at a resource server, which is the ordinary
case AuthZEN already serves and requires no profile.

The framework decides an **issuance gate**. Where a deployment's policy
depends on quantitative or transactional constraints - a payment amount, a
rate limit - those flow in as advisory context and out as token shaping
({{shaping}}), to be enforced by downstream policy enforcement points. Any
conforming PDP can adjudicate the gate, because the gate is expressed
entirely in the five-tuple. Whether a given PDP also adjudicates the context
is a property of that deployment and is not something this profile
guarantees. Stating that boundary is what keeps the design rule above from
overpromising.

## Requirements Language

{::boilerplate bcp14-tagged}

# Terminology

This document uses the terms Authorization Server, Client, Resource Server,
access token, and scope from {{RFC6749}}; Policy Decision Point (PDP),
Policy Enforcement Point (PEP), Subject, Action, Resource, and Context from
{{AUTHZEN}}.

Issuance target:
: The audience of the access being granted - the party the issued token
  authorizes its bearer to act against. Usually the value the AS intends for
  the token's `aud` claim.

Gate tuple:
: An evaluation request whose action expresses *issuance authority* - whether
  the subject may obtain a token of a given type for the issuance target.
  See {{gate-and-scope}}.

Scope tuple:
: An evaluation request whose action is a requested scope, expressing
  *access authority*. See {{gate-and-scope}}.

# Architecture {#architecture}

~~~ ascii-art
+--------+           +----------------------+        +-------+
| Client |           | Authorization Server |        |  PDP  |
+---+----+           |        (PEP)         |        +---+---+
    |                +----------+-----------+            |
    | 1. token req              |                        |
    +-------------------------->|                        |
    |                           | 2. authn client,       |
    |                           |    validate grant      |
    |                           |                        |
    |                           | 3. evaluation request  |
    |                           +----------------------->|
    |                           |                        |
    |                           | 4. decision + shaping  |
    |                           |<-----------------------+
    |                           |                        |
    |                           | 5. mint per decision   |
    |                           |    and shaping         |
    | 6. token response         |                        |
    |<--------------------------+                        |
~~~

Step 2 is unchanged from the underlying grant: the AS remains solely
responsible for authenticating the client, validating the grant or subject
token, and verifying any proof of possession. The PDP is consulted only
after those checks succeed. A PDP permit does not substitute for any of
them.

# Deployment Considerations {#deployment}

## Colocation and Latency {#colocation}

A token endpoint can be a very high volume path. Multi-tenant authorization
servers operate at request rates that leave a per-request budget in the low
milliseconds, and an issuance decision that added a round trip to a remote
service would not be deployable at that scale.

This profile does not add one. {{AUTHZEN}} specifies a request and response
contract between a Policy Enforcement Point and a Policy Decision Point; it
does not specify where the Policy Decision Point runs. The PDP of
{{architecture}} may be embedded in the authorization server's own process,
loaded as a module or as a WebAssembly component, resident on the same host,
or reached over a network. Conformance to this profile is a property of the
messages exchanged and not of the topology that carries them, and
deployments with the strictest budgets are expected to evaluate in process
or on the same host. Step 3 of {{architecture}} is drawn as an arrow because
it is a request, not because it is a hop.

{{AUTHZEN}} was first written for the authorization decisions a resource
server makes on every request, where the budget is tighter still. The time
an authorization server spends on an issuance decision is amortized across
the life of the token it issues, usually minutes or hours.

## Decisions That Cannot Be Made Synchronously {#deferred}

Some issuance decisions cannot complete within the time a token request will
wait, at any topology. A policy may call for human review, for an
out-of-band approval, or for a check against a system whose own latency is
unbounded.

This document defines no mechanism for those, and does not need to.
{{I-D.gerber-oauth-deferred-token-response}} defines a deferred token
response, in which an authorization server that cannot answer immediately
returns a deferral code and the client retrieves the outcome later. An AS
implementing both may treat a decision it cannot obtain synchronously as a
deferral rather than as a denial, evaluate it out of band, and apply the
response of {{shaping}} to the token it eventually issues. Delay does not
relax {{no-broadening}}: a decision that arrives late constrains the issued
token exactly as one that arrives promptly would.

## The Seam Inside the Authorization Server {#as-seam}

{{architecture}} draws grant validation and the issuance decision as separate
steps. Deployed authorization servers rarely separate them. Credential
handling, grant validation, session and consent state, and token minting are
commonly one subsystem, and the values this profile needs are spread across
it.

For many implementations the work of adopting this profile will be finding or
creating a single point in the issuance path where all of the fields of
{{request}} are available, rather than the mapping itself. This profile says
what those values are, not where an implementation keeps them.

# Forming the Evaluation Request {#request}

## Subject {#subject}

`subject` identifies the party the issued token will represent.

`subject.type` MUST be one of the registered values in {{iana-types}}:

* `user` - a natural person.
* `client` - an OAuth client acting on its own behalf.
* `workload` - a non-human software identity, such as a workload with a
  cryptographic identity document.

`subject.id` MUST be the identifier the AS intends to place in the issued
token's subject claim. Where the AS applies a transformation to subject
identifiers - pairwise or pseudonymous identifiers, or a mapping from an
external identity to a local account - that transformation MUST be applied
*before* the evaluation request is constructed, so that the identifier the
PDP authorizes is the identifier the token carries.

## Resource {#resource}

For the gate and scope tuples of {{gate-and-scope}}, `resource.type` MUST be
`audience` and each `resource.id` MUST be an issuance target. Authorization
detail tuples name their resource differently, as {{rar-tuple}} sets out.

A single registered type is used rather than a type per kind of target
(service, trust domain, peer authorization server) because the type names
the *protocol role* the target plays, not a guess at its nature. Policies
written against `audience` port across deployments; policies written against
locally invented type names do not.

The **requested targets** of a request are the values it carries in a
`resource` parameter in the sense of {{RFC8707}}, in an `audience` parameter
where the binding defines one, or in both. Where the request carries neither,
the AS's default audience for the grant is the sole requested target.

### One Target Is the Preferred Shape {#one-target}

A request SHOULD name a single target.

This profile does not introduce that preference; it inherits it.
{{RFC8707}} Section 5 encourages using only a single `resource` parameter,
observing that a token valid at several protected resources "can be used by
any one of those resources to access any of the others", so that multiple
audiences presuppose a high degree of trust among the recipients.
{{RFC9700}} Section 4.10.2 describes the same practice from the other
direction: an access token is bound to a specific resource server, so a
client reaching several obtains a token for each.

An AS MAY reject a request naming more than one target. {{RFC8707}} Section 5
anticipates this, noting that an authorization server may be unwilling or
unable to fulfill such a request. Where the AS does reject one, the
requirements of {{composition}} do not arise.

### Several Targets {#several-targets}

A request may nonetheless name more than one: {{RFC8707}} Section 2 permits
the `resource` parameter to appear multiple times, and {{RFC8693}} Section 2.1
permits the same of `audience` and `resource` in a token exchange request. An
AS that accepts such a request has more than one issuance target, and whether
the subject may reach each of them is a separate question.

Because the information model of {{AUTHZEN}} carries exactly one resource per
evaluation, a request naming several targets MUST be expressed as several
evaluations rather than as one evaluation naming a compound target. The
tuples of {{gate-and-scope}} are formed once for each requested target, and
`resource` is carried on the individual evaluation object, overriding the
top-level default as {{AUTHZEN}} Section 7.1.1 provides.

This is also what makes the `audience` constraining key of {{shaping}}
reachable. That key narrows a *set* of targets, and a set can only be
narrowed if the request was able to put more than one member in it.

{{ex-rar-two}} shows a two-target request on the wire.

## Actions: Gate, Scope, and Authorization Detail Tuples {#gate-and-scope}

Token issuance asks two questions that are frequently conflated:

1. May this subject obtain *a token of this kind* for this target? This is
   **issuance authority**, and in delegation scenarios, delegation
   authority.
2. May this subject exercise *this scope* at this target? This is **access
   authority**.

These are distinct privileges. {{RFC8693}} defines a `may_act` claim
precisely because the authority to act on another party's behalf is not the
same as the authority to access a resource. A subject may legitimately be
permitted to hold an access token for an API while being forbidden from
minting a delegated grant aimed at that same API.

Because AuthZEN's information model provides exactly one action per
evaluation, these two questions MUST be expressed as separate evaluations
rather than as two interpretations of one `action.name`.

A request carrying `authorization_details` ({{RFC9396}}) asks the second
question in a richer vocabulary than a scope string, and gets a third tuple
shape ({{rar-tuple}}) rather than a reinterpretation of the second.

### Gate Tuple {#gate-tuple}

A gate tuple is an evaluation whose `action.name` has three colon-separated
segments:

~~~
issue:<token-type>:<grant-type>
~~~

where `<token-type>` and `<grant-type>` are short names registered in
{{iana-actions}}. `issue:access_token:authorization_code` is the authority to
mint an access token under `grant_type=authorization_code`;
`issue:id_token:authorization_code` and `issue:refresh_token:token_exchange`
read the same way. The last segment always names the grant, never a second
token type.

The `issue:` prefix is reserved. A deployment MUST NOT use a scope value
beginning with `issue:` as a scope tuple action. {{ex-cc}} shows a gate tuple
in a request.

The grant is part of the action because nothing else in the tuple determines
it. The same subject, audience, and token type arise from an authorization
code request and from its later refresh, and from a client requesting a token
for itself and that same client exchanging for one. A policy that
distinguishes those cases -
requiring fresh authorization at a high-value audience, or permitting a
client to hold a token but not to exchange for one - has nothing to attach
to unless the grant is in the five-tuple.

Neither segment subsumes the other. A single authorization code request may
mint an access token, a refresh token, and an ID token, which are separately
gateable; and a token exchange selects its output through
`requested_token_type`, so its token type is a variable of the request.
Together the two segments name one privilege: what may be minted, and by
what means.

### Action Name Portability {#action-portability}

Short names registered under {{iana-actions}} MUST match
`[a-z][a-z0-9_]{0,20}`. A composed gate action name is therefore at most 49
characters.

The bound exists for portability. Relationship-based engines commonly
validate relation identifiers against a restricted grammar, admitting a small
character set within a modest length limit. A PDP built on such an engine can
canonicalize an action name defined by this document by replacing each `:`
with a character the grammar admits, conventionally `_`. The bound above is
what makes that transformation total: any registered name survives it, so a
policy written against these names ports without being rewritten.

Carrying a grant type URI verbatim would not survive it. The composed action
name would exceed the length limits such grammars impose before any question
of characters arose.

The guarantee covers only the vocabulary this document defines. Scope values
are carried verbatim ({{scope-tuple}}) and routinely contain characters no
such grammar admits; mapping them remains internal to the PDP.

### Scope Tuple {#scope-tuple}

A scope tuple is an evaluation whose `action.name` is a single requested
scope value, carried verbatim.

Scope values are not transformed into policy-engine relation names by the
AS. Any such mapping is internal to the PDP. This keeps `action.name` a
stable interface: the AS reports what the client asked for, and the PDP
decides what that means in its own policy vocabulary.

{{ex-downscope}} shows three scope tuples behind a gate, one of them denied.

### Authorization Detail Tuple {#rar-tuple}

Where the request carries `authorization_details` ({{RFC9396}}), each entry
in the array yields one or more evaluations.

An entry is a product, not a single permission. {{RFC9396}} Section 2.2:
"When different common data fields are used in combination, the permissions
the client requests are the product of all the values. The object represents
a request for all `actions` values listed within the object to be used at all
`locations` values listed within the object for all `datatypes` values listed
within the object." Figure 6 of that document is the client's escape hatch: a
client that does not want the whole product sends several entries instead.
Asking the PDP one question per cell therefore asks exactly the questions the
entry poses, and asking fewer answers a coarser question than the client
asked.

The AS forms one evaluation per cell:

| RAR member | AuthZEN |
|---|---|
| `type` | `resource.type` |
| each `locations` value | `resource.id` |
| each `actions` value | `action.name`, leading segments |
| each `datatypes` value | `action.name`, final segment |

`action.name` is the `actions` value alone where the entry has no
`datatypes`, and the `actions` value and the `datatypes` value joined by a
colon otherwise, the datatype last:

~~~
<action>
<action>:<datatype>
~~~

The datatype is recovered as the segment following the final colon. An AS
MUST NOT form a compound name where the `datatypes` value itself contains a
colon; such an entry is decomposed on `locations` and `actions` only, and its
datatype axis is narrowed on the response side alone ({{rar-response}}).

These names cannot be confused with the gate names of {{gate-tuple}}. A gate
tuple always names a resource whose type is `audience`; an authorization
detail tuple never does, because `resource.type` is the entry's own `type`.
The two may name the same `resource.id` and remain distinct questions, which
{{ex-rar-one}} shows.

{{ex-rar-two}} shows an entry decomposing into the four cells of a two by two
product, and one of them denied.

Only `type` is REQUIRED of an entry ({{RFC9396}} Section 2), so an axis may
be absent:

| Absent member | Substituted |
|---|---|
| `locations` | Each requested target of {{resource}} |
| `actions` | The reserved name `authorization_detail` |
| `datatypes` | No compounding; `action.name` is the action alone |

Substituting the requested targets for an absent `locations` continues the
audience restriction the member itself performs. {{RFC9396}} Section 12
describes `locations` as preventing unintended client authorizations "through
audience restriction", and Section 9.1 recommends that an AS minting a JWT
access token filter the authorization details to the specific audience. Where
an entry names no location, the request's own targets are the audience it is
restricted to.

`privileges` and `identifier` are not decomposed. Section 2.2's product
sentence names actions, locations, and datatypes, so whether `privileges`
multiplies is unstated, and `identifier` is a scalar with no multiplicity.

Nor does the decomposition reach a type that carries its multiplicity in
type-specific members rather than in the common data fields - a consent
object enumerating individual permissions, for instance. Such an entry
yields one evaluation per location. This is the prevailing shape in deployed
open banking profiles, so it is not a corner case.

An undecomposed member is not shown to the PDP, and a PDP cannot narrow
against a value it was not sent. What it can still do is narrow by policy:
knowing the subject, the type, and the location, it may return an entry
whose `datatypes` or type-specific members are the most this subject may
ever reach there. Such an entry is still subject to the structural check of
{{rar-response}}, so a PDP that returns more than was requested has its
decision rejected rather than trimmed. Narrowing against the request itself
remains the AS's own obligation under {{RFC9396}} Section 6.

Decomposing the entry is also what makes the structural check of
{{rar-response}} derivable rather than asserted. An entry whose `locations`,
`actions`, and `datatypes` are subsets of the request's is exactly an entry
reassembled from cells the PDP permitted.

### Gate Tuples Are Always Present {#gate-required}

An AS MUST include a gate tuple in every evaluation request it forms under
this profile. A binding MAY require more than one ({{composition}}).

The floor is therefore two evaluations for a single-target request naming
scopes, and one for a single-target request naming none. Deployments are
expected to write issuance policy
for every token type and grant combination their AS can produce; a PDP that
advertises support for this profile renders a decision on any registered gate
action it is sent ({{discovery}}), so an AS never has to predict which
combinations a given PDP has policy for.

## Context

The `context` object carries advisory input. A conforming PDP MUST be able
to render a decision without it.

The following keys are defined by this document; bindings may define more:

| Key | Type | Value |
|---|---|---|
| `client_id` | string | The authenticated client identifier |
| `acr` | string | Authentication context class of the subject |
| `amr` | array of strings | Authentication methods, per {{RFC8176}} |
| `auth_time` | integer | Time of authentication, as in {{RFC7519}} |
| `cnf` | object | Confirmation method of the presented credential |
| `jti` | string | Identifier of the token the AS intends to mint ({{correlation}}) |

The single-type rule of {{envelope}} applies here as well: each key above has
one JSON type, and bindings defining further context keys MUST state a type
for each.

Per {{design-goals}}, any input on which the decision genuinely depends
belongs in the five-tuple, not here. The grant type is the worked example:
it is decision-critical, so it is a segment of the gate action name
({{gate-tuple}}) and does not appear in `context` at all.

### Correlation {#correlation}

An operator running an authorization server against a separately operated
policy decision point has two decision logs and no defined way to join them.
An AS MAY include in `context` the `jti` of the token it intends to mint, so
that the record the PDP writes and the token the AS issues carry the same
identifier.

It is a MAY because of an ordering problem: at evaluation time the token does
not exist, so an AS that sends a `jti` has allocated it in advance, and on a
denial that identifier is spent on a token that is never issued. Whether to
pre-allocate, and what to do with identifiers spent on denied requests, is an
implementation matter for the AS and is outside the scope of this document.
An AS that does not pre-allocate omits the key.

Supplying `jti` as an input does not disturb the reservation in {{claims}}.
The AS remains authoritative for the claim, and a PDP MUST NOT set it in the
response.

## Batching and Result Composition {#composition}

### Forming the Batch {#batch}

For each requested target ({{resource}}), the AS forms:

- a gate tuple ({{gate-tuple}}), and
- one scope tuple ({{scope-tuple}}) for each requested scope,

each carrying that target as its `resource`. Where the request carries
`authorization_details`, the AS also forms the authorization detail tuples of
{{rar-tuple}}, which carry a resource of their own.

This document produces one gate tuple per target. Bindings may produce more:
the token exchange family evaluates the authority of the requesting party
separately from that of the subject, and so produces two per target.

Where a request yields more than one tuple, the AS MUST use the Access
Evaluations API of {{AUTHZEN}} with `options.evaluations_semantic` set to
`execute_all`, and MUST place gate tuples at the leading indices of the
`evaluations` array, beginning at index 0. The response lists decisions in
request order ({{AUTHZEN}} Section 7.2), so the AS recovers which target,
scope, or authorization detail cell each decision belongs to by position.

A request reduces to a single evaluation only when it names one target, no
scopes, and no authorization details, in which case the gate tuple stands
alone. {{ex-no-scopes}} is that case, and {{ex-cc}} the smallest batch.

`execute_all` is required because a denial must be able to narrow the grant
rather than fail it. {{AUTHZEN}} evaluation semantics are selected per request
and cannot mark an individual batch item as a precondition, so the composition
rules below are enforced by the AS. This is well within the PEP's role - the
AS is already interpreting per-item results in order to downscope.

### The Batch Carries Only the Residue {#residue}

Before forming the batch, an AS MUST apply the reductions it is itself
authoritative for, and MUST form tuples only for what survives them.

Those reductions already exist. {{RFC6749}} Section 3.3 permits an AS to
issue a token whose scope is narrower than the one requested. {{RFC9396}}
Section 6 is stronger still: the AS "checks whether the underlying grant ...
or the client's policy ... allows the issuance of an access token with the
requested authorization details", and refuses with
`invalid_authorization_details` where it does not. Neither is introduced
here; this profile only fixes their order relative to the PDP call.

The reason to fix that order is {{no-broadening}}. A PDP may narrow what is
issued and may not broaden it, so a permit on something the AS had already
decided to refuse cannot change the outcome. Asking anyway writes a decision
into the PDP's record that corresponds to no issued authority, which is
worse than not asking: the two logs the profile is otherwise careful to let
an operator join ({{correlation}}) stop agreeing.

The batch therefore expresses the request as the AS is prepared to grant it,
and the PDP narrows from there.

### The Batch Is Bounded {#bounded}

What remains after that reduction is still sized by the client. An AS MUST
bound the number of evaluations it will form for a single token request, and
MUST reject a request that would exceed the bound.

This document does not specify the value. {{RFC9126}} Section 2.3 is the
precedent: it directs an AS to answer an oversized pushed request with 413
and an over-frequent client with 429, and names no number for either. The
bound that is right for a deployment depends on its PDP, and a number written
here would be wrong somewhere.

The error is the one belonging to the parameter that overran the bound:
`invalid_authorization_details` ({{RFC9396}} Section 6), `invalid_scope`
({{RFC6749}}), or, for token exchange requests, `invalid_target`
({{RFC8693}}). Where more than one contributed, any of them is correct.
`invalid_request` is not, because it does not tell the client what to
shorten.

### A Denied Gate Removes a Target {#gate-denial}

A gate tuple governs one target. Where its decision is `false`, that target
is removed from the request: the AS MUST NOT name it in the audience of any
token it issues, and MUST disregard the scope tuples formed for it and any
authorization detail tuple naming it as `resource.id`.

Where every target is removed, the AS MUST fail the request and MUST NOT
issue a token. For token exchange requests the appropriate error is
`invalid_target` ({{RFC8693}}).

An AS MAY instead fail the whole request when any gate is denied.
{{one-target}} already permits it to refuse a multi-target request outright,
and an AS unwilling to issue a token for a subset of what was asked for is
exercising the same discretion later. {{ex-rar-two}} closes on what a denied
gate would have removed from the batch shown there.

Where one target was requested, both rules coincide: a denied gate fails the
request.

### A Denied Scope Must Narrow Every Target {#scope-denial}

A scope tuple governs one scope at one target. A scope is carried in the
issued token only where it was permitted at *every* surviving target. The AS
reports the reduced set in the `scope` response parameter, as {{RFC6749}}
already requires.

This intersection is not introduced here. {{RFC9068}} Section 2.2.3 requires
that "all the individual scope strings in the `scope` claim MUST have meaning
for the resources indicated in the `aud` claim"; the plural is the operative
part. Section 3 of the same document requires that an AS "MUST NOT issue a
JWT access token if the authorization granted by the token would be
ambiguous". A scope permitted at one audience and denied at another, carried
in a token naming both, is that ambiguity exactly: no recipient can determine
whether the scope was granted for itself or for the other.

An AS that wants a scope to survive at one target and not another issues a
token per target, which is the shape {{one-target}} prefers in the first
place.

Where the request named scopes and none survive, and no authorization detail
entry survives either, the AS MUST fail the request rather than issue an
empty token, even though the gate permitted it. A permitted gate authorizes a
token of that kind to exist; it does not authorize an empty one.

{{ex-downscope}} shows a partial denial narrowing a single-target request.

### A Denied Cell Narrows an Entry {#rar-denial}

An authorization detail tuple governs one cell of one entry. The AS
reassembles each entry from the cells that were permitted, so that a denied
cell narrows the entry rather than failing it.

The surviving cells of an entry need not be expressible as one entry, since
an entry is a product and the survivors need not be a rectangle. Where they
are not, the AS reassembles them as several entries of the same `type`, which
is the shape Figure 6 of {{RFC9396}} defines for a client wanting exactly
this. An AS MUST NOT instead widen the result to the smallest single entry
containing the survivors, which would return a cell the PDP denied.
{{ex-rar-two}} works through such a split.

Where an entry's `locations` was absent and its tuples were therefore fanned
across several targets, a cell survives only where it was permitted at every
surviving target, for the reason given in {{scope-denial}}.

An entry with no surviving cells is dropped. Where the request carried
`authorization_details` and no entry survives, the AS MUST fail the request
with `invalid_authorization_details`, which {{RFC9396}} Section 6 already
defines for a token request whose authorization details the AS will not
grant.

Reassembly is what the AS does absent a `authorization_details` key in the
response. Where the PDP returns one, it replaces the reassembled array and is
checked against the request as {{rar-response}} requires.

# Processing the Evaluation Response {#shaping}

A PDP MAY return, in the response `context`, information that shapes the
token the AS issues.

## The `issuance` Envelope {#envelope}

All keys defined by this profile appear within a single `issuance` member of
the response `context`:

~~~ json
{
  "decision": true,
  "context": {
    "reason_admin": { "200": "matched policy P-4471" },
    "issuance": {
      "token_lifetime": 300,
      "claims": { "groups": ["engineering"] }
    }
  }
}
~~~

An AS implementing this profile MUST process `context.issuance` and MUST
ignore unrecognized members outside it, preserving the advisory character
that {{AUTHZEN}} gives response context generally.

The examples of {{examples}} carry the envelope on live responses:
`token_lifetime` in {{ex-cc}}, `claims` in {{ex-downscope}}, and
`granted_scope` in {{ex-no-scopes}}.

Every key defined below has exactly one JSON type, and bindings that define
further keys MUST do the same. Where the corresponding OAuth or JWT
construct admits more than one - `aud` is the notable case, per Section
4.1.3 of {{RFC7519}} - this profile picks one rather than carrying the
polymorphism forward. An AS validates the response context before acting on
it, and a union type costs more to validate, to schematize, and to project
into a typed representation than the shorthand saves.

## Mandatory-to-Understand {#mtu}

{{AUTHZEN}}, in the definitions of the `decision` values in its Decision
section, states that where a PEP does not understand information in the
response context, the PEP MAY reject the decision. That permission is
appropriate for a general-purpose API in which response context is advisory.
It is not sufficient here, because the consequences are asymmetric:

* Ignoring a key that **narrows** the grant yields a token **broader than
  the PDP authorized** - a silent privilege escalation.
* Ignoring a key that **adds** information yields a token narrower than
  intended - a functional shortfall, not a security failure.

This profile therefore adopts the following rule, from which the treatment
of every key below is derived:

> A response-context key is mandatory-to-understand if and only if ignoring
> it would produce a token broader than the PDP authorized. For such keys,
> an AS that does not understand and apply the key MUST treat the permit as
> a denial.

## No Broadening {#no-broadening}

A PDP MUST NOT return a shaping value that grants access the AS would not
otherwise have granted, and an AS MUST reject a decision that attempts it.

The PDP decides whether and how much; it does not decide what else. Without
this rule, an evaluation of `files.read` could return a token bearing
`admin`, and the token would assert a privilege no evaluation ever
considered.

## Constraining Keys

The keys in this section are mandatory-to-understand under {{mtu}}.

### `granted_scope`

A space-delimited string in the syntax of the `scope` parameter of
{{RFC6749}}, giving the scope set the AS is authorized to grant.

`granted_scope` MUST be a subset of the scopes the AS would otherwise have
granted - the requested scopes, or for a request naming none, the AS's
default set for that client and target. The AS MUST reject the decision
otherwise.

Its principal use is the gate-only evaluation, where there are no scope
tuples and this key is how a PDP answers "permit, and grant this set."
Enumerating a grantable set is a search operation rather than a check; a PDP
unable to perform it returns a bare permit and the AS falls back to its own
defaults, which is a safe degradation.

Where scope tuples are present, the per-item decisions already express
downscoping, and a PDP SHOULD NOT also return `granted_scope`.

### `token_lifetime`

A non-negative integer number of seconds, interpreted as a **ceiling**. The
AS MUST issue a token whose lifetime is the lesser of this value and the
lifetime it would otherwise have used. It is never a floor: a PDP cannot
extend a token's life beyond the AS's own policy.

A value of `0` MUST be treated as a denial rather than as an instruction to
mint an already-expired token.

### `audience`

An array of strings, narrowing the set of targets for which the token may be
issued. Every value MUST be the `resource.id` of the evaluation on which it
was returned, so the array is either that single target or empty. An
evaluation is a decision about one target, and this key lets a PDP withhold
that target while still permitting the request; it does not let one
evaluation speak for another.

An empty array therefore withdraws the target that evaluation was about,
with the same effect as the denied gate of {{gate-denial}}. Where no target
survives, the AS MUST fail the request; for token exchange requests the
appropriate error is `invalid_target` ({{RFC8693}}).

The value is an array even when it names a single target, per the
single-type rule above. An AS remains free to render a single-element set as
a bare string in the token's own `aud` claim, where {{RFC7519}} permits it.

### `authorization_details` {#rar-response}

An array in the syntax of {{RFC9396}}, replacing - not merged with - the
authorization details of the request.

Where the PDP returns nothing, the AS reassembles the entries itself from the
cells its authorization detail tuples ({{rar-tuple}}) permitted. The key
exists for the narrowing the cells cannot express: within a type-specific
member, or along an axis {{rar-tuple}} does not decompose.

Replacement admits arbitrary structured narrowing, which is what a PDP
filtering rich authorization requests needs, but "narrower" is not decidable
for arbitrary authorization detail types. This profile therefore requires:

* **Structural check, always.** Every returned entry MUST be covered by a
  single entry of the request: there MUST exist a request entry with the same
  `type` whose `locations`, `actions`, and `datatypes` members are supersets
  of the returned entry's. Several returned entries MAY be covered by the same
  request entry, which is the shape {{rar-denial}} produces. The AS MUST
  reject the decision if any returned entry is covered by no request entry, or
  is covered only by several of them taken together. Where a request carries
  `read` on `contacts` in one entry and `write` on `photos` in another, as
  Figure 6 of {{RFC9396}} does, an entry returning `read` on `photos` is
  within the union of the two and within neither, and names a permission the
  client did not request.
* **Absent members.** A member absent from the covering request entry
  constrains nothing, and a returned entry MAY carry a member the request
  omitted: the client asked for the entry unrestricted along that axis, so
  any value the PDP supplies narrows it, which is the policy narrowing
  {{rar-tuple}} describes. `locations` is the exception, since
  {{rar-tuple}} substitutes the requested targets where it is absent. A
  returned entry MUST NOT name a location that is neither in the covering
  request entry nor a requested target of {{resource}}.
* **Type-specific members.** For members beyond those defined in
  {{RFC9396}}, the AS MUST either apply a validator specific to that
  authorization details type or reject the decision. An AS MUST NOT pass
  unvalidated structure into an issued token.

### `crit`

An array of strings naming members of `claims` ({{claims}}) that are
themselves mandatory-to-understand. The name and semantics are taken from
the `crit` header parameter of {{RFC7515}}: an AS that does not understand
and apply a named member MUST treat the permit as a denial.

`crit` exists because the static classification in this section is
incomplete. A member of `claims` is normally safe to drop, and is
occasionally the constraint that made the permit safe.

Consider a PDP that permits a payment and returns:

~~~ json
{
  "decision": true,
  "context": {
    "issuance": {
      "claims": { "max_transfer_eur": 500 },
      "crit": [ "max_transfer_eur" ]
    }
  }
}
~~~

The ceiling is enforced by the resource server, which reads it from the
token. An AS that drops the claim issues a token that says nothing about a
limit: the resource server has nothing to enforce, and a decision that
authorized 500 euros has become an authorization for any amount. No
statically classified key catches this, because the scope, lifetime,
audience, and authorization details are all exactly what the PDP allowed and
the claim is the only thing that made them safe.

An AS may drop a claim for ordinary reasons, most often because it emits only
claim names on an allowlist. The vocabulary is domain-specific, so neither
party can settle the question in advance, and the AS learns at response time
that it cannot carry the claim. `crit` is what makes that a denial rather
than a silent broadening.

## Decorating Keys

### `claims` {#claims}

An object whose members are claim names, in the sense of {{RFC7519}}, and
the values to be included in the issued token. This is the mechanism by
which attributes computed during the decision itself reach the token: a
ceiling the policy derived while evaluating a limit, a risk tier that
determined the outcome, a structured result a binding defines.

It is not the mechanism for enumerating what a subject holds. For the group
memberships, roles, and entitlements that {{RFC9068}} describes for JWT
access tokens, drawn from the schema of {{RFC7643}}, the search operations of
{{AUTHZEN}} answer the question directly, and the companion profile in
{{companions}} specifies how an AS calls them and composes the results. A PDP
MAY return such a claim in `claims` where its policy computes one.

Members of `claims` are advisory under {{mtu}}: an AS that drops them issues
a less capable token. A PDP that requires a member to be honored MUST name
it in `crit`.

A PDP MUST NOT set, and an AS MUST reject a response that sets, any of the
following claims:

| Reserved | Rationale |
|---|---|
| `iss`, `iat`, `jti` | Provenance, for which the AS is authoritative |
| `sub` | It is `subject.id`, an input to the decision |
| `aud` | It is `resource.id`, an input to the decision |
| `exp`, `nbf` | Expressed by `token_lifetime` |
| `scope` | Expressed by `granted_scope` |
| `client_id` | Established by client authentication |
| `cnf` | Derived from a proof of possession the AS verified |
| `act` | Delegation chain, constructed by the AS |
| `authorization_details` | Has its own key and narrowing rules |
| `may_act` | Confers future delegation authority; broadening by construction |

The entries for `sub` and `aud` rest on stronger ground than the rest. Both
are inputs to the five-tuple; a PDP that could rewrite either would cause the
AS to issue a token corresponding to a decision that was never evaluated.
Re-subjecting a token is a fresh issuance, not an attenuation of an existing
one, and MUST be evaluated as such.

## Aggregation Across a Batch {#aggregation}

An Access Evaluations response in {{AUTHZEN}} carries no top-level context;
each element of the `evaluations` array is a decision with its own optional
context. Token shaping, however, is a property of the token: there is one
lifetime, one claim set, one authorization details array for the token being
minted, while this profile fans scopes, targets, and authorization detail
cells out across many evaluations.

An AS MUST therefore compose per-item shaping as follows:

| Key | Aggregation |
|---|---|
| `token_lifetime` | Minimum over permitted items |
| `granted_scope` | Union over permitted items, intersected with what the AS would otherwise grant and with the surviving scopes of {{scope-denial}} |
| `audience` | The surviving targets of {{gate-denial}}, less any target whose item returned an empty array |
| `authorization_details` | Union of entries, then the per-entry structural check, intersected with the entries reassembled under {{rar-denial}} |
| `claims` | Merge; see below |
| `crit` | Union |

Shaping keys appearing in the context of a **denied** item MUST be ignored.

Where two permitted items return different values for the same member of
`claims`, the AS MUST reject the decision. There is no general narrowing
merge for arbitrary JSON values, and choosing one arbitrarily could
broaden the result. Identical values are not a conflict. A PDP SHOULD return
token-level shaping on a single item to avoid the situation.

# Discovery {#discovery}

A PDP supporting this profile MUST advertise the capability URN registered
in {{iana-capability}} in the `capabilities` member of its metadata document,
retrievable at `/.well-known/authzen-configuration`:

~~~ json
{
  "policy_decision_point": "https://pdp.example.com",
  "access_evaluation_endpoint":
      "https://pdp.example.com/access/v1/evaluation",
  "access_evaluations_endpoint":
      "https://pdp.example.com/access/v1/evaluations",
  "capabilities": [
    "urn:openid:authzen:capability:token-issuance"
  ]
}
~~~

The URN asserts support for the request mapping and response vocabulary of
this document. It is not a statement about the content of the PDP's policy,
and a PDP MUST NOT be read as claiming to hold rules for any particular
issuance. What a deployment's policy permits is disclosed only through
decisions. This is the same line
{{I-D.ietf-oauth-identity-assertion-authz-grant}} draws for
`authorization_grant_profiles_supported`, which indicates that a server
implements a profile's processing rules and not that any particular issuer,
client, subject, or audience will be accepted.

Advertising the capability is accordingly a commitment to the request shapes
this profile can produce. A PDP that advertises it MUST render a decision for
a gate tuple naming any action name composable from the short names
registered in {{iana-actions}}, and MUST NOT reject the evaluation on the
grounds that it holds no policy for that action. Denying is a decision; a
protocol error is not. The same applies to a batch that mixes a gate tuple
with scope tuples, which is the ordinary shape of a request naming scopes
({{composition}}).

The obligation matters because the gate vocabulary is a product of two
registries and grows as bindings register short names. An AS pairs the token
type it is about to mint with the grant it received; it cannot know which
pairings a given deployment's policy anticipated, and must not have to.

For the same reason, this profile defines one capability URN rather than one
per token type and grant combination. Finer granularity would oblige the AS
to predict what the PDP has policy for, which the rule above exists to avoid,
and would publish the shape of a deployment's issuance policy in an
unauthenticated metadata document. Capability granularity in this profile
tracks vocabulary, not policy. An extension that adds response vocabulary
registers its own URN, since an AS must understand what it is asked to
enforce; one that adds only advisory context keys or new registered action
names does not, since a PDP ignores a context key it does not recognize and
the rule above already obliges it to decide any registered gate action.

An operator enabling a new grant or token type nonetheless has a real
question to answer: whether the deployment's policy anticipates the gate
actions the AS is about to start sending, or whether every such request will
be denied. That question is about policy content, so its answer belongs on
the authenticated evaluation surface rather than in metadata; {{AUTHZEN}}
notes that an unauthenticated PDP can be probed for the shape of its policy.
The Action Search API of {{AUTHZEN}} answers it directly: a search for a
representative subject and an `audience` resource returns the action names
policy would permit, and gate actions among them indicate the issuances the
deployment is prepared for. This is a deployment-time check, not a
per-request one, and nothing in this profile requires it.

# Error Mapping

| Condition | Authorization server behavior |
|---|---|
| Gate tuple denied | Fail the request; do not issue |
| All scope tuples denied | Fail the request; `invalid_scope` |
| Some scope tuples denied | Issue with the permitted subset; report via `scope` |
| Target denied or empty audience set | `invalid_target` ({{RFC8693}}) |
| No authorization detail entry survives | `invalid_authorization_details` ({{RFC9396}}) |
| Batch would exceed the bound of {{bounded}} | The error of the parameter that overran it |
| Shaping key violates {{no-broadening}} | Treat as denial; fail the request |
| Unknown `crit` member | Treat as denial; fail the request |
| PDP unreachable or malformed response | Fail closed; do not issue |

Reason information returned by a PDP is diagnostic and intended for the
operator of the AS. An AS MUST NOT relay PDP reason strings to the client,
as they may disclose policy structure to a party that is not authorized to
learn it.

Where a PDP returns a denial accompanied by authentication requirements -
the step-up pattern of {{AUTHZEN}}, in which the required `acr` and `amr`
values are named - an AS SHOULD surface the requirement to the client. This
document does not define that mapping, and neither end of it is presently
specified. {{AUTHZEN}} illustrates the pattern in a non-normative example
rather than defining the response context keys that carry it, leaving a
profile nothing normative to reference; and on the OAuth side,
`insufficient_user_authentication` in {{RFC9470}} is defined for resource
servers rather than for the token endpoint, where no equivalent signal
exists. This is an open item, and closing it requires work in both
specifications.

# Examples {#examples}

The first example below is shown in full, framed against the HTTPS JSON
binding of {{AUTHZEN}}. The remaining examples show only the JSON payload.
Each is referenced from the section that specifies the rule it exercises.

The transport is a property of the deployment, not of this profile: an
evaluation carrying the mapping defined here is the same evaluation whatever
binding conveys it. Where the HTTPS JSON binding is in use, the request URL
is the PDP's `access_evaluations_endpoint`, or `access_evaluation_endpoint`
for a request that reduces to a single evaluation, as published in the PDP's
metadata; the paths shown below are the defaults that apply when metadata
provides no value.

## Client Credentials, One Scope {#ex-cc}

One scope is requested, so the request is one gate tuple ({{gate-tuple}}) and
one scope tuple ({{scope-tuple}}). This is the floor: two evaluations, so the
Access Evaluations API. One target is shared by both, so `resource` is carried
once at the top level; the examples below that need a resource per evaluation
carry it there instead, as {{several-targets}} provides.

~~~ http-message
POST /access/v1/evaluations HTTP/1.1
Host: pdp.example.com
Content-Type: application/json
Authorization: Bearer <token>

{
  "subject":  { "type": "client", "id": "svc-reporting" },
  "resource": {
    "type": "audience",
    "id": "https://telemetry.example"
  },
  "context": { "client_id": "svc-reporting" },
  "evaluations": [
    {
      "action": {
        "name": "issue:access_token:client_credentials"
      }
    },
    { "action": { "name": "telemetry.write" } }
  ],
  "options": { "evaluations_semantic": "execute_all" }
}
~~~

~~~ http-message
HTTP/1.1 200 OK
Content-Type: application/json

{
  "evaluations": [
    {
      "decision": true,
      "context": { "issuance": { "token_lifetime": 900 } }
    },
    { "decision": true }
  ]
}
~~~

## Authorization Code, Downscoping {#ex-downscope}

Three scopes are requested. The gate leads at index 0 and `execute_all`
allows the AS to issue the permitted subset of the rest, per
{{scope-denial}}.

~~~ json
{
  "subject":  { "type": "user", "id": "U0405936" },
  "resource": {
    "type": "audience",
    "id": "https://api.example/files"
  },
  "context": {
    "client_id": "chatterbox",
    "acr": "urn:example:loa:2"
  },
  "evaluations": [
    {
      "action": {
        "name": "issue:access_token:authorization_code"
      }
    },
    { "action": { "name": "files.read"   } },
    { "action": { "name": "files.write"  } },
    { "action": { "name": "files.delete" } }
  ],
  "options": { "evaluations_semantic": "execute_all" }
}
~~~

~~~ json
{
  "evaluations": [
    { "decision": true },
    {
      "decision": true,
      "context": {
        "issuance": { "claims": { "groups": ["engineering"] } }
      }
    },
    { "decision": true },
    {
      "decision": false,
      "context": { "reason_admin": { "403": "policy P-118" } }
    }
  ]
}
~~~

The AS issues a token bearing `files.read files.write`, a `groups` claim,
and reports the reduced scope set in the token response.

Had the same subject arrived at the same audience with the same scopes on a
refresh, index 0 would have read
`issue:access_token:refresh_token`, and a policy that requires fresh
authorization here could deny it while leaving the scope tuples untouched.

## No Scopes Requested {#ex-no-scopes}

No scopes and no default set, so the gate tuple stands alone ({{batch}}). This
is the only shape this document produces that is a single evaluation, and it is
therefore the only one sent to the Access Evaluation API rather than the
Access Evaluations API: the payload is a bare evaluation with no
`evaluations` array, and under the HTTPS JSON binding it is a `POST` to
`/access/v1/evaluation`.

~~~ json
{
  "subject":  { "type": "client", "id": "svc-reporting" },
  "action":   {
    "name": "issue:access_token:client_credentials"
  },
  "resource": {
    "type": "audience",
    "id": "https://telemetry.example"
  },
  "context": { "client_id": "svc-reporting" }
}
~~~

~~~ json
{
  "decision": true,
  "context": {
    "issuance": {
      "granted_scope": "telemetry.write",
      "token_lifetime": 900
    }
  }
}
~~~

## Authorization Details, One Entry {#ex-rar-one}

The token request below carries one authorization details entry naming one
location, one action, and one datatype. Line breaks in the request body are
for display only, and the value of `authorization_details` is form encoded on
the wire ({{RFC9396}} Section 2.1); it is shown decoded in the block that
follows.

~~~ http-message
POST /token HTTP/1.1
Host: as.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&resource=https%3A%2F%2Fexample.com%2Fcustomers
&authorization_details=...
~~~

~~~ json
[
  {
    "type": "customer_information",
    "locations": [ "https://example.com/customers" ],
    "actions": [ "read" ],
    "datatypes": [ "contacts" ]
  }
]
~~~

The entry has one cell, so the batch is the gate tuple and one authorization
detail tuple. The two name the same URI and are still distinct evaluations:
the gate asks whether a token may be issued for that audience, and the
authorization detail tuple asks whether this subject may read contacts at
that API. `resource.type` is what separates them.

~~~ json
{
  "subject": { "type": "user", "id": "U0405936" },
  "context": {
    "client_id": "chatterbox"
  },
  "evaluations": [
    {
      "action": {
        "name": "issue:access_token:authorization_code"
      },
      "resource": {
        "type": "audience",
        "id": "https://example.com/customers"
      }
    },
    {
      "action": { "name": "read:contacts" },
      "resource": {
        "type": "customer_information",
        "id": "https://example.com/customers"
      }
    }
  ],
  "options": { "evaluations_semantic": "execute_all" }
}
~~~

~~~ json
{
  "evaluations": [
    { "decision": true },
    { "decision": true }
  ]
}
~~~

Every cell was permitted, so the entry reassembles to itself and the AS
issues a token carrying the requested `authorization_details` unchanged.

## Authorization Details Across Two Targets {#ex-rar-two}

Here the request names two issuance targets, and its single entry names two
locations and two datatypes. One action across two locations and two
datatypes is four cells, and two targets is two gate tuples, so the batch is
six evaluations. Gate tuples lead, per {{batch}}.

~~~ json
[
  {
    "type": "customer_information",
    "locations": [
      "https://example.com/customers",
      "https://eu.example.com/customers"
    ],
    "actions": [ "read" ],
    "datatypes": [ "contacts", "photos" ]
  }
]
~~~

No top-level `resource` is shown, because no one resource is shared: each
evaluation carries its own.

~~~ json
{
  "subject": { "type": "user", "id": "U0405936" },
  "context": {
    "client_id": "chatterbox"
  },
  "evaluations": [
    {
      "action": {
        "name": "issue:access_token:authorization_code"
      },
      "resource": {
        "type": "audience",
        "id": "https://example.com/customers"
      }
    },
    {
      "action": {
        "name": "issue:access_token:authorization_code"
      },
      "resource": {
        "type": "audience",
        "id": "https://eu.example.com/customers"
      }
    },
    {
      "action": { "name": "read:contacts" },
      "resource": {
        "type": "customer_information",
        "id": "https://example.com/customers"
      }
    },
    {
      "action": { "name": "read:photos" },
      "resource": {
        "type": "customer_information",
        "id": "https://example.com/customers"
      }
    },
    {
      "action": { "name": "read:contacts" },
      "resource": {
        "type": "customer_information",
        "id": "https://eu.example.com/customers"
      }
    },
    {
      "action": { "name": "read:photos" },
      "resource": {
        "type": "customer_information",
        "id": "https://eu.example.com/customers"
      }
    }
  ],
  "options": { "evaluations_semantic": "execute_all" }
}
~~~

The PDP permits both gates and denies one cell, photos at the European
location.

~~~ json
{
  "evaluations": [
    { "decision": true },
    { "decision": true },
    { "decision": true },
    { "decision": true },
    { "decision": true },
    {
      "decision": false,
      "context": { "reason_admin": { "403": "residency R-4" } }
    }
  ]
}
~~~

Three of the four cells survive, and three cells are not a product, so the
entry cannot reassemble into one. The AS returns two entries of the same
type, as {{rar-denial}} requires:

~~~ json
[
  {
    "type": "customer_information",
    "locations": [ "https://example.com/customers" ],
    "actions": [ "read" ],
    "datatypes": [ "contacts", "photos" ]
  },
  {
    "type": "customer_information",
    "locations": [ "https://eu.example.com/customers" ],
    "actions": [ "read" ],
    "datatypes": [ "contacts" ]
  }
]
~~~

Both gates permitted, so both targets remain in the audience. Had the second
gate been denied instead, {{gate-denial}} would have removed that target and
the AS would have disregarded both evaluations naming it, denied or not,
leaving the first entry alone and no second entry at all.

# Relationship to Companion Documents {#companions}

This document defines the mapping and the shaping vocabulary, and registers
short names for the grant types listed in {{iana-actions}}. For a grant whose
request names a single party, that is everything an AS needs; the client
credentials and authorization code examples above are complete, and no
companion document is required to implement them.

A binding is required where a grant family adds structure this document does
not model. The token exchange family adds two such things: a request names a
second party, the requesting party, whose authority is separately at stake;
and several of its members issue an artifact whose own audience differs from
the audience of the access it describes. Bindings are therefore expected for
that family - including identity chaining, identity assertion authorization
grants, and transaction tokens - and a profile describing the use of AuthZEN
search operations to populate the authorization claims of {{RFC9068}}.

Bindings specify the subject derivation for their grant, any additional
context keys, the token type short names they register, and any invariants
of their own that a PDP cannot override.

## Related Work {#related}

Two other efforts place an AuthZEN Policy Decision Point behind an
authorization server.

{{I-D.brossard-oauth-rar-authzen}} carries an AuthZEN request and response
inside `authorization_details`, placing the evaluation on the OAuth wire. It
has expired. This document does not adopt that approach: the evaluation
stays between the authorization server and its Policy Decision Point, and
the client sees only an OAuth response. {{rar-tuple}} covers the same
territory the other way round, deriving the evaluation from the
authorization details the client already sends rather than asking the client
to construct one.

{{ARAP}} defines what happens when a Policy Decision Point denies a request
but marks the denial as requestable: the enforcement point submits an access
request, an approval is obtained out of band, and a fresh evaluation is
performed so that the Policy Decision Point remains authoritative at
enforcement time. That profile deliberately does not bind the loop to OAuth,
requiring instead that a separate profile define a completion mode
appropriate to the flow. The AuthZEN Working Group's Access Request OAuth
Profile supplies that completion mode, and it governs the same moment as
this document.

The two divide along the value of `decision`. The approval work specifies
the deny path: a requestable denial becomes an asynchronous approval, and
issuance follows the re-evaluation. This document specifies the allow path:
how the evaluation request is formed, and how a permit may narrow what is
issued. The approval work therefore already establishes that response
`context` shapes issuance; it does so for approval state, where this
document does so for the granted authorization.

Because both must construct an evaluation request from an OAuth token
request, that construction is shared surface, and its treatment in the
approval profiles is deliberately brief, being incidental to their subject.
Where the two overlap, this document is intended to supply the detail rather
than to compete, and aligning the two is expected work.

{{GRANTMGMT}} approaches the same authorization from the other end. Its
grant query response reports a grant as `scopes`, `claims`, and
`authorization_details`, which is the set of constraining keys of
{{shaping}} seen after the fact: this document specifies how a
Policy Decision Point shapes those at issuance, and grant management
specifies how a client reads and manages them afterwards. Its `scopes`
member pairs each scope value with the resource indicators it applies to,
which is the same per-target scoping the scope tuple of {{scope-tuple}}
produces. Section 8.2 of that document records that the addressibility of
individual grant components is unresolved, and the decomposition of
{{rar-tuple}} bears on it, since a cell of an authorization details entry is
addressable by construction.

# Security Considerations

## Fail Closed {#fail-closed}

Every failure of the profile - an unreachable PDP, a malformed response, a
shaping value that violates {{no-broadening}}, an unrecognized `crit`
member - MUST result in no token being issued. A PDP that cannot be
consulted is not an authorization to proceed.

Because the PDP is on the token issuance path, its availability becomes the
AS's availability. Deployments should consider caching of decisions, local
policy fallback that is explicitly configured rather than implicit, and the
latency budget of the token endpoint.

## Request Amplification {#amplification}

One token request becomes many evaluations. A client controls the scopes it
asks for, the targets it names, and the size of every `authorization_details`
entry, and {{rar-tuple}} turns each entry into the product of its common data
fields. That product is the legitimate meaning of a RAR entry, not an abuse of
it; the feature becomes a burden only when it is used to excess. An AS that
does not bound the fan-out lets an authenticated but unprivileged client
impose disproportionate work on the PDP, and through the PDP on every other
tenant of it.

{{residue}} and {{bounded}} are the two controls, and they are independent of
each other. The first removes what the AS was never going to grant; the second
caps what remains. An AS SHOULD also track fan-out per client over time. A
per-request cap does not bound the rate at which maximum-size requests can be
submitted, and a rate limit does not bound the cost of a single request;
neither substitutes for the other.

{{AUTHZEN}} Section 11.7 places a matching obligation on the PDP, which
"SHOULD apply reasonable protections to avoid common attacks tied to request
payload size, the number of requests ... or memory consumption". An AS MUST
NOT rely on it. Those protections take the form of the PDP shedding requests,
and a request the PDP sheds is one the AS must fail closed on ({{fail-closed}}),
so leaning on them converts an amplification attack into an outage.

## The Policy Decision Point as a Trust Dependency

A PDP that can shape tokens can narrow every grant an AS issues, and a
compromised PDP can deny service. The constraints in this document bound the
damage in the other direction: because no shaping key may broaden a grant,
because `sub`, `aud`, and `cnf` are reserved, and because the AS validates
every constraining key before applying it, a compromised PDP cannot cause an
AS to issue a token for a different subject, aimed at a different audience,
bound to a different key, or bearing a privilege that no evaluation
considered.

This is why the reservations in {{claims}} are normative rather than
advisory. An implementation that passed PDP-supplied claims into a token
without checking them against that list would give the PDP the ability to
mint arbitrary identities.

## Integrity of the Decision Response

The `crit` mechanism relies on the response arriving intact. An attacker
able to strip `crit` from a response is also able to change `decision` to
`true`, so `crit` does not extend the attack surface beyond what transport
protection between the AS and the PDP must already cover. It is not a
substitute for that protection, and deployments requiring non-repudiation of
decisions should use the response signing mechanisms of {{AUTHZEN}}.

## Privacy

Evaluation requests carry subject identifiers, client identifiers, targets,
and authentication context to the PDP, and do so on every token issuance.
Where the PDP is operated by a party other than the operator of the AS, this
is a disclosure of authentication and access patterns for every user of the
system.

Requiring that identifier transformations be applied before the request is
constructed ({{subject}}) means that a PDP
receiving pairwise or pseudonymous identifiers sees only the identifier the
token itself will carry, rather than a durable global identifier. Deployments
sensitive to this should prefer such identifiers.

Where `context` conveys authentication context or device posture, deployments
should include only what their policies actually consume. The design rule of
{{design-goals}} already bounds how much that ought to be.

# IANA Considerations

This document has no IANA actions. OpenID Foundation registry requests are
listed in {{oidf-registries}}.

# OpenID Foundation Registry Considerations {#oidf-registries}

## AuthZEN Policy Decision Point Capabilities Registry {#iana-capability}

This specification requests registration of the following PDP capability in
the AuthZEN Policy Decision Point Capabilities Registry.

Capability Name:
: `token-issuance`

Capability URN:
: `urn:openid:authzen:capability:token-issuance`

Capability Description:
: Support for the OAuth 2.0 token issuance profile, comprising the request
  mapping and the `issuance` response context vocabulary.

Change Controller:
: OpenID Foundation AuthZEN Working Group

Specification Document:
: This document.

The capability URN registered above uses the `urn:openid:authzen:` namespace
administered by the OpenID Foundation, rather than the `urn:ietf:params:authzen:`
sub-namespace that {{AUTHZEN}} registers for capabilities. This is an OpenID
Foundation profile convention, and {{ARAP}} follows it for
`urn:openid:authzen:capability:access-request`. The `capabilities` array
remains a list of URNs as defined by {{AUTHZEN}}.

## AuthZEN Token Issuance Entity Types Registry {#iana-types}

This specification requests creation of a new registry: the AuthZEN Token
Issuance Entity Types registry, which tracks the `type` values this profile
gives the subject and resource of an issuance evaluation. Registration policy
is Specification Required. Initial entries:

| Type | Applies to | Description |
|---|---|---|
| `user` | subject | A natural person |
| `client` | subject | An OAuth client acting on its own behalf |
| `workload` | subject | A non-human software identity |
| `audience` | resource | The audience of the access being granted |

Change Controller for all initial entries: OpenID Foundation AuthZEN Working
Group. Specification Document for all initial entries: This document.

## AuthZEN Token Issuance Action Names Registry {#iana-actions}

This specification requests creation of a new registry: the AuthZEN Token
Issuance Action Names registry, which tracks the two short-name vocabularies
from which action names in the reserved `issue:` space are composed.
Registration policy is Specification Required.

A gate action name is `issue:<token-type>:<grant-type>`, so the registry
grows with the number of token types plus the number of grant types, not
with their product. The combinations that are meaningful in a deployment are
a matter of policy, not of registration.

Every short name MUST match `[a-z][a-z0-9_]{0,20}`, which holds any composed
action name to 49 characters. {{action-portability}} gives the reason: this
bound is what lets the name be transformed mechanically into a relation
identifier that relationship-based engines accept. Registrants
should note that the hyphen is excluded deliberately, and that a short name
therefore differs from the corresponding URI wherever that URI contains one.

Token type short names, initially:

| Short name | Token type |
|---|---|
| `access_token` | `urn:ietf:params:oauth:token-type:access_token` |
| `refresh_token` | `urn:ietf:params:oauth:token-type:refresh_token` |
| `id_token` | `urn:ietf:params:oauth:token-type:id_token` |

Grant type short names, initially:

| Short name | Grant type |
|---|---|
| `authorization_code` | `authorization_code` |
| `client_credentials` | `client_credentials` |
| `refresh_token` | `refresh_token` |
| `token_exchange` | `urn:ietf:params:oauth:grant-type:token-exchange` |
| `device_code` | `urn:ietf:params:oauth:grant-type:device_code` |
| `jwt_bearer` | `urn:ietf:params:oauth:grant-type:jwt-bearer` |
| `saml2_bearer` | `urn:ietf:params:oauth:grant-type:saml2-bearer` |

Change Controller for all initial entries: OpenID Foundation AuthZEN Working
Group. Specification Document for all initial entries: This document.

Registrations MUST give the URI or parameter value the short name
corresponds to, and MUST state which of the two vocabularies they join.
Names outside the `issue:` prefix are not registered here, since scope values
and the action names of {{rar-tuple}} are carried verbatim and are not
registered vocabularies.

This document reserves one further name outside the `issue:` prefix:
`authorization_detail`, which {{rar-tuple}} substitutes for the action of an
authorization details entry that names none.

--- back

# Acknowledgments
{:numbered="false"}

This work was motivated in part by Karl McGuinness, whose initiative to
bridge OAuth and AuthZEN - in {{ARAP}} and its OAuth completion mode -
established that a Policy Decision Point belongs behind the token endpoint,
and that the response of such a Policy Decision Point may legitimately shape
what is issued. This document takes up the other half of that decision.

Thanks also to the participants in the OpenID AuthZEN interoperability
events, whose December 2025 identity provider scenario demonstrated AuthZEN
search operations populating token claims, and to the members of the AuthZEN
Working Group and the OAuth Working Group.

# Document History
{:numbered="false"}

Draft 1 continues the individual Internet-Draft
`draft-gazitt-oauth-authzen-issuance`, whose `-01` made the changes below.

## Since -00
{:numbered="false"}

* A request may now name several issuance targets. The single-target MUST in
  {{resource}} becomes a SHOULD inherited from {{RFC8707}} Section 5 and
  {{RFC9700}} Section 4.10.2, and {{several-targets}} says how tuples are
  formed per target, how a denied gate removes one, and why a scope survives
  only where it was permitted at every surviving target.
* Requested `authorization_details` now reach the PDP. {{rar-tuple}}
  decomposes an entry along the product of {{RFC9396}} Section 2.2 into one
  evaluation per location, action, and datatype, with the datatype carried as
  a trailing segment of `action.name`.
* {{residue}} orders the AS's own reductions before the PDP call, so the batch
  carries only what the AS would otherwise grant.
* {{bounded}} requires an AS to bound the size of the batch without naming a
  bound, and {{amplification}} covers the attack.
* `crit` is unilateral. The enforcement point capability declaration and the
  precondition that gated `crit` on it are removed, so this profile no longer
  uses `context.issuance` on the request leg at all.
* The structural check of {{rar-response}} tests a returned entry against a
  single covering request entry rather than against the union of the
  same-type entries, and a member absent from the request entry no longer
  causes rejection.
* Added worked examples of both authorization details shapes, cross-references
  between the rules and the examples that exercise them, and a Related Work
  paragraph on {{GRANTMGMT}}.
