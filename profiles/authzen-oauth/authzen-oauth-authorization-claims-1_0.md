---
title: "AuthZEN Profile for Authorization Claims in JWT Access Tokens - Draft 1"
abbrev: "AuthZEN Authorization Claims"
category: std
ipr: none

docname: authzen-oauth-authorization-claims-1_0
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
 - claims
 - search

author:
 -
    fullname: "Omri Gazitt"
    organization: "Independent"
    email: "ogazitt@gmail.com"

normative:
  RFC6749:
  RFC7519:
  RFC7643:
  RFC9068:
  AUTHZEN:
    title: "Authorization API 1.0"
    target: "https://openid.net/specs/authorization-api-1_0-final.html"
    date: 2026-01-11
    author:
      - ins: "OpenID Foundation AuthZEN Working Group"
        org: "OpenID Foundation"
  ISSUANCE: I-D.gazitt-oauth-authzen-issuance

informative:
  I-D.gazitt-oauth-authzen-token-exchange:

--- abstract

RFC 9068 recommends that an authorization server placing group memberships,
roles, or entitlements in a JWT access token draw those claims from the SCIM
user schema. It says what the claims are named and how their values are
encoded, and it does not say where an authorization server obtains them. In
deployments today they come from a directory, a database, or a
vendor-specific hook, and the question they answer is an authorization
question asked of something that is not the authorization system.

This document profiles the Resource Search API of the OpenID AuthZEN
Authorization API for that purpose. It binds each authorization claim to a
search, defines how a search result set becomes a claim value, and requires
that a search result never influence whether a token is issued or what
authority it conveys. It may be applied on its own, by an authorization
server that externalizes claim enrichment but not its issuance decision, or
alongside the companion framework document that externalizes the decision.

--- middle

# Introduction

{{RFC9068}} Section 2.2.3.1 describes the authorization attributes an
authorization server (AS) commonly places in a JWT access token beyond the
delegated authority the grant itself conveys: the group memberships, roles,
and entitlements a resource server is expected to consult. It recommends the
`groups`, `roles`, and `entitlements` attributes of the user schema of
{{RFC7643}} as the claim types, and registers all three as JWT claims.

What it does not describe is where the values come from. An AS populating
`groups` is answering the question "which groups does this subject belong
to." That is an authorization question, and in most deployments it is
answered by a directory query, a database join, or a proprietary extension
point rather than by the system that holds the deployment's authorization
policy.

{{AUTHZEN}} answers questions of exactly that shape. Its Resource Search API
returns the resources of a given type on which a given subject may perform a
given action. Given a subject and a `member` action, the resources of type
`group` it returns are the groups the subject is a member of.

This document defines the bindings that make that correspondence
interoperable, and the rules an AS follows to turn a search result into a
claim.

## Why a Search {#division}

{{AUTHZEN}} defines a Search API for enumerating one leg of a tuple given the
other two, and enumerating what a subject holds is that operation exactly.

The alternative would be to obtain these claims as a side effect of an
evaluation, attaching the enumeration to the response context of a decision
the AS was making anyway. {{ISSUANCE}} defines a `claims` key that could be
used that way, and declines to route these claims through it. An evaluation
response is the answer to the question the request asked, and an AS asking
whether a token may be issued has not asked what its subject belongs to. A
purpose-built operation exists for the second question, so the second
question is asked with it.

So the AS makes each call for what it is for, and composes the results. The
consequence is worth stating at the outset: **this document asks nothing of a
PDP that {{AUTHZEN}} does not already require.** The searches it specifies
are ordinary Resource Search requests carrying registered type and action
names, and a PDP answering them is not required to know that their results
will reach a token. Everything specified here is a rule for the authorization
server.

## Composition with the Issuance Framework {#relationship}

This document is independent of {{ISSUANCE}}. An AS that does not externalize
its issuance decision may still externalize claim enrichment, and for such an
AS everything in this document applies unchanged; the decision to issue is
simply its own.

Where both are used, they compose as follows:

* The decision governs. A token is minted only if the gate of {{ISSUANCE}}
  permits it, and no search result contributes to that decision
  ({{ordering}}).
* Enrichment is discardable. Where the gate denies, any search results the AS
  has obtained are discarded and no claim is rendered from them.

{{ISSUANCE}} defines no vocabulary this document extends, and this document
defines none of its own, so the two interact only through that ordering.

Where the grant is a member of the token exchange family,
{{I-D.gazitt-oauth-authzen-token-exchange}} determines the subject, and the
searches of this document follow it ({{search-subject}}).

## Requirements Language

{::boilerplate bcp14-tagged}

# Terminology

This document uses the terms Authorization Server, Client, Resource Server,
access token, and scope from {{RFC6749}}; Policy Decision Point (PDP), Policy
Enforcement Point (PEP), Subject, Action, Resource, and Context from
{{AUTHZEN}}; and gate tuple and scope tuple from {{ISSUANCE}}.

Authorization claim:
: One of the claims of {{RFC9068}} Section 2.2.3.1 - `groups`, `roles`, and
  `entitlements` - or any other claim whose value enumerates what a subject
  holds.

Claim binding:
: The association of an authorization claim with an AuthZEN resource type and
  action name, such that a Resource Search over that type and action
  enumerates the claim's members. See {{bindings}}.

Bound claim:
: An authorization claim for which the AS has a claim binding configured, and
  which it will therefore attempt to populate on the token it is about to
  issue.

# Applicability

This document applies to an authorization server that populates one or more
authorization claims in a token it issues by querying an AuthZEN PDP.
Implementing {{ISSUANCE}} is not a prerequisite. The two address different
halves of an issuance, a deployment may adopt either without the other, and
{{relationship}} governs the case where it adopts both.

The bindings of {{bindings}} are keyed by claim name and say nothing about
token type. An AS that places the same claims in an artifact other than a JWT
access token may use them, though {{RFC9068}}, which is what makes these
particular claim names interoperable, governs access tokens.

# Architecture {#architecture}

~~~ ascii-art
+--------+           +----------------------+        +-------+
| Client |           | Authorization Server |        |  PDP  |
+---+----+           |        (PEP)         |        +---+---+
    |                +----------+-----------+            |
    | 1. token req              |                        |
    +-------------------------->|                        |
    |                           | 2. evaluate (ISSUANCE) |
    |                           +----------------------->|
    |                           |                        |
    |                           | 3. search: groups      |
    |                           +----------------------->|
    |                           | 4. search: roles       |
    |                           +----------------------->|
    |                           |                        |
    |                           | 5. decision            |
    |                           |<-----------------------+
    |                           | 6. result sets         |
    |                           |<-----------------------+
    |                           |                        |
    |                           | 7. if permitted, mint  |
    |                           |    and render claims   |
    | 8. token response         |                        |
    |<--------------------------+                        |
~~~

Steps 3 and 4 are drawn as concurrent with step 2 because {{ordering}}
permits it. They are semantically after it: their results are discarded if
step 5 denies.

Step 2 is one request under {{ISSUANCE}}, ordinarily a batch. Each bound
claim is a separate search, because a Resource Search names one resource type
and {{AUTHZEN}} defines no batch form for searches.

# Claim Bindings {#bindings}

## Membership as an Action {#relations}

A claim binding names an AuthZEN action. The names this document registers -
`member`, `assignee`, `holder` - describe how a subject relates to a resource
rather than an operation the subject performs on it.

Nothing in {{AUTHZEN}} requires otherwise. An action names something asserted
of a subject and a resource together, and "Alice is a member of engineering"
fills the three positions of a tuple as readily as "Alice may read document
7" does. How a deployment's PDP arrives at either answer is its own affair.

The names are consequently meaningful in an evaluation as well as in a
search, which is what makes a search result checkable. {{AUTHZEN}} Section
8.1 states that a search result, used in a subsequent evaluation, SHOULD
yield a permit; an AS or an auditor can verify any member of a rendered claim
by evaluating the corresponding tuple.

## Registered Bindings {#registered}

This document registers the following bindings in the registry established in
{{iana-bindings}}:

| Claim | `resource.type` | `action.name` |
|---|---|---|
| `groups` | `group` | `member` |
| `roles` | `role` | `assignee` |
| `entitlements` | `entitlement` | `holder` |

Reading the first row: the members of the `groups` claim are the identifiers
of the resources of type `group` on which the subject may perform the action
`member`.

Each action name matches the grammar {{ISSUANCE}} defines for registered
action names, `[a-z][a-z0-9_]{0,30}`. They are not composed with the `issue:`
prefix, which {{ISSUANCE}} reserves for gate actions.

> **Editor's note.** `member` is the settled choice of the three. It is the
> name {{RFC7643}} uses, and it is what schema languages call this
> association in their own examples. `assignee` and `holder` are less
> settled: a role or an entitlement is variously said to be assigned to,
> granted to, or held by a subject, and a single name could serve for both
> claims, with the resource type carrying the distinction. Distinct names are
> registered here on the theory that policy is easier to read when names
> differ where the concepts do. Implementer feedback is invited.

## Deployment Configuration {#configuration}

A deployment that uses action names other than the registered ones
configures the AS with the names it uses. The registered bindings are
defaults, not constraints on a deployment's policy vocabulary.

They earn their place by being defaults. An AS and a PDP from different
implementers, neither configured for the other, interoperate on these three
claims only because both arrive at `group`/`member` without being told. A
deployment that overrides a binding has taken on the configuration burden
knowingly, which is a reasonable trade and a poor default.

A deployment MAY also bind a claim this document does not register, using a
binding registered under {{iana-bindings}} or one local to the deployment. A
local binding is not interoperable and SHOULD NOT use a claim name registered
in the JSON Web Token Claims registry for some other purpose.

# Forming the Search Request {#request}

For each bound claim, the AS forms one Resource Search request as defined in
Section 8.5 of {{AUTHZEN}}.

## Subject {#search-subject}

The `subject` of every search MUST be the same entity as the subject of the
gate tuple of {{ISSUANCE}}: the same `type` and the same `id`, the latter
being the identifier the AS intends to place in the issued token's subject
claim.

The requirement is not merely for tidiness. A claim enumerating what a
subject holds is only true of the subject the token names, and any identifier
transformation the AS applies - pairwise identifiers, resolution of a foreign
identity to a local account - MUST therefore be applied before the search is
formed, exactly as {{ISSUANCE}} requires of the evaluation.

Where {{I-D.gazitt-oauth-authzen-token-exchange}} applies, the subject is the
exchange subject and never the requesting party. The token represents the
subject, and a claim enumerating the requesting party's holdings would assert
of the subject something that is not true of it.

## Action and Resource

`action.name` MUST be the action name of the claim binding, and
`resource.type` MUST be its resource type. The `resource` object carries no
`id`; Section 8.5.1 of {{AUTHZEN}} states that the identifier of the entity
being searched for is omitted, and is ignored if present.

## Context {#search-context}

An AS SHOULD convey in the search `context` the same values it conveys on the
evaluation request under {{ISSUANCE}}. It MAY additionally convey:

| Key | Type | Value |
|---|---|---|
| `audience` | array of strings | The issuance targets of the token being minted |

The type is an array for the same reason {{ISSUANCE}} makes its `audience`
shaping key an array: the value is a set, and a set has one JSON rendering
here.

This key exists because {{RFC9068}} scopes its authorization claims to the
target, describing roles and groups "relevant to the resource being accessed"
and entitlements "for the targeted resource," while a Resource Search has no
slot to say so. Its mandatory entities are the subject, the action, and the
type of the resource being enumerated; the resource identifier position is
the answer, not an input. There is no second resource.

The consequence is that this is advisory input, and this document does not
pretend otherwise. A PDP MAY use it to scope the result set and MAY ignore
it, so an AS MUST NOT assume the returned set has been filtered by target,
and MUST NOT represent the resulting claim to itself as target-scoped. A
deployment that requires the scoping to be honored registers a binding whose
resource type distinguishes the target, which puts the distinction in the
type slot where a PDP must read it.

## Endpoint Selection

Where the HTTPS binding of {{AUTHZEN}} is in use, the request is sent to the
`search_resource_endpoint` published in the PDP's metadata, or to
`/access/v1/search/resource` where metadata provides no value.

Section 9.1.1 of {{AUTHZEN}} states that the absence of an endpoint parameter
is sufficient for a PEP to determine that the PDP does not support the
corresponding API. An AS whose PDP publishes metadata without
`search_resource_endpoint`, and which has not been configured with an
endpoint out of band, MUST NOT attempt the searches; every bound claim then
fails under {{failure}}. This is a deployment error rather than a request
error, and an AS SHOULD detect it at configuration time rather than at the
token endpoint.

# Ordering {#ordering}

**An AS MUST NOT include an enrichment claim in a token it does not issue,
and MUST NOT treat a search result as authorizing anything.** In particular,
an AS MUST NOT derive the `scope` claim, the audience, or
`authorization_details` from search results, and MUST NOT allow a search
result to affect whether it issues a token or what authority that token
conveys. Where {{ISSUANCE}} is in use, this means a search result never
affects the gate or scope decisions.

An AS MAY nonetheless issue the searches concurrently with whatever it does
to decide, discarding their results if it decides not to issue.

The two statements are compatible, and it is worth being precise about why,
because they look like a contradiction. The ordering is semantic: search
results are inputs to claim construction and to nothing else, so no ordering
of the calls in time can make one an input to the decision. The concurrency
is a performance affordance: the calls are independent, and running them in
sequence would add their latencies together on the token endpoint's critical
path.

Two consequences follow for a deployment that takes the affordance. It
performs work it may discard, so the cost of a denied request rises by the
cost of the searches. And its PDP receives searches for subjects who never
receive a token, so search volume at the PDP is not a measure of tokens
issued, and neither logs nor rate limits should be read as though it were.

# Rendering the Claim {#rendering}

A Search API response, per Section 8.3 of {{AUTHZEN}}, carries a `results`
array of entities of the type searched for, each an object with a `type` and
an `id`. A claim value is a JSON array. This section defines the mapping
between them.

## From Results to Claim Members {#members}

The value of a bound claim MUST be a JSON array of strings, each member being
the `id` of one result object, and every result contributing exactly one
member.

{{RFC9068}} recommends encoding these claims according to the guidance of
{{RFC7643}}, whose corresponding attributes are multi-valued and complex:
each value is an object with a `value` sub-attribute carrying the identifier,
and, depending on the attribute, `$ref`, `display`, `type`, and `primary`
sub-attributes carrying a reference, a human-readable label, and
classification.

An AuthZEN search result supplies exactly one of those: the identifier, in
`id`. The `type` field of a result is invariant across the response by
construction, since the search named it and Section 8.3 of {{AUTHZEN}}
requires results to be of that type alone, so it carries no per-member
information. The remaining sub-attributes have no source in a search result
and could only be fabricated or fetched from a system this profile does not
define. A conforming complex rendering would therefore be an array of
single-member objects, conveying what an array of strings conveys, in a claim
that is carried on every request the token is presented with.

This document accordingly renders the array of identifiers directly. The
recommendation in {{RFC9068}} is a SHOULD, and this document deviates from it:
the profile emits the `value` sub-attribute of each SCIM value and omits an
enclosing object that would have nothing else in it. An AS that must produce
the complex form for a resource server that requires it is not prevented from
doing so, but it is then rendering something this profile does not define,
and a resource server cannot infer which form to expect from the presence of
this profile.

## Type Mismatch {#type-mismatch}

An AS MUST reject a result whose `type` does not equal the `resource.type` it
searched for, and MUST treat the response as a failed search under
{{failure}} rather than filtering the offending results and proceeding.

## Duplicates and Order {#dedup}

A result set is a set. An AS MUST remove duplicates, comparing `id` values as
JSON strings for exact equality, before rendering the claim. Duplicates are
expected rather than exceptional: {{AUTHZEN}} recommends that searches be
performed transitively, so a subject holding the same group through two paths
may be returned twice, and pagination admits repetition on its own account
({{pagination}}).

A JSON array is ordered and a set is not, so the order of the members carries
no meaning. A resource server MUST NOT attribute any to it.

An AS SHOULD nonetheless render members in an order that is stable across
issuances, so that two tokens issued for the same subject against unchanged
policy data differ only where the underlying facts differ. Sorting
ascending by Unicode code point is one way; preserving the PDP's response
order is another where the PDP's order is itself stable.

## Empty Result Sets {#empty}

Where a bound claim's search succeeds and returns no results, the AS MUST
include the claim with an empty array as its value. It MUST NOT omit the
claim.

The choice is observable, so it has to be made deliberately. Under this rule
the presence of a bound claim means the enumeration was performed, and its
absence means the claim was not populated. Had an empty result set also been
rendered as absence, a resource server could not distinguish "this subject
holds nothing" from "the enumeration did not happen."

# Pagination {#pagination}

A PDP MAY paginate a search response. Section 8.2 of {{AUTHZEN}} defines the
mechanism: a response that does not carry the entire result set includes a
`page` object with a non-empty opaque `next_token`, and the PEP retrieves the
next page by repeating the request with `page.token` set to that value, until
a response carries an empty `next_token`. Apart from the token, every value
in the request MUST remain identical across pages, and a PDP is entitled to
return an error if one changes.

Section 8.2 of {{AUTHZEN}} states that pagination does not guarantee an
atomic snapshot, and that consequently, if items are added or removed while
paginating, results MAY be repeated or omitted between pages. A claim
assembled from a paginated response is therefore a best-effort enumeration:
the AS deduplicates across the whole set of pages rather than within each
({{dedup}}), and an item added or removed mid-pagination may be reflected in
the claim or not.

An AS SHOULD bound the number of pages it will follow for a single claim, so
that an unexpectedly large enumeration does not stall the token endpoint, and
where that bound is exceeded it treats the search as failed under
{{failure}}. Reaching such a bound is a sign that the data belongs at the
resource server rather than in the token; see {{token-size}}.

# Failure Handling {#failure}

A bound claim's search fails if the PDP returns an error status, if the
response is malformed or contains a result of the wrong type
({{type-mismatch}}), if the page bound is exceeded ({{pagination}}), if the
request times out, or if the PDP cannot be reached.

Where a bound claim's search fails, the AS **MUST NOT** render the claim, and
**MUST NOT** substitute a default, a placeholder, or an empty array for it.
An empty array asserts that the subject holds nothing ({{empty}}), which a
failed search does not establish.

Whether the AS then issues a token without the claim, or issues none, is a
deployment decision, and this document specifies no default. An AS SHOULD
allow the choice to be configured per claim binding and per client, because
the correct answer differs by claim and by consumer: the absence of a claim
a resource server reads before granting access is a different event from the
absence of one used for display or personalization, and only the deployment
knows which it has.

> **Implementer's note.** Issuing the token without the claim is the common
> behavior in authorization servers that support enrichment today, and it is
> a defensible default: an enrichment dependency that is briefly unreachable
> should not take down every token issuance that names the claim. The case
> that argues the other way is a resource server that reads the claim as an
> input to an access decision and treats its absence as a value rather than
> as an absence. An AS cannot detect that from the request, so the choice
> belongs with the operator, stated rather than assumed, and the two
> behaviors should be nameable in configuration rather than implied by the
> product's default.

An AS MAY serve a bound claim from a cache of an earlier successful search. A
cache hit is not a failure. Cached results are subject to the staleness
discussed in {{consistency}}, and a deployment that caches SHOULD bound the
cache lifetime by the lifetime of the tokens the results are rendered into.

# Discovery

This document registers no capability URN.

{{ISSUANCE}} draws the line at response vocabulary: an extension that adds
keys an AS must understand and enforce registers a URN, and one that does not
relies on the mechanisms already in place. This document adds no response
vocabulary at all, and, as {{division}} notes, requires nothing of a PDP that
{{AUTHZEN}} does not already require. What an AS needs to discover is
therefore already discoverable:

* whether the PDP supports Resource Search at all is answered by the presence
  of `search_resource_endpoint` in its metadata, which Section 9.1.1 of
  {{AUTHZEN}} defines for exactly this purpose;
* what the bindings mean is answered by the registry of {{iana-bindings}},
  which is what makes an unconfigured pairing interoperate.

What remains is a question about the content of a deployment's policy: does
this PDP actually recognize `member` as an action on resources of type
`group`, or will a correctly formed search return nothing forever? As
{{ISSUANCE}} argues for the analogous question about gate actions, that
belongs on the authenticated evaluation surface rather than in an
unauthenticated metadata document, and the Action Search API of {{AUTHZEN}}
answers it: a search for the actions a representative subject may perform on
a representative resource of type `group` returns `member` where the binding
is live. This is a deployment-time check, and nothing in this document
requires it.

# Error Mapping

| Condition | Authorization server behavior |
|---|---|
| Gate evaluation denied ({{ISSUANCE}}) | Fail per {{ISSUANCE}}; discard results |
| Result of the wrong type | Treat as a failed search |
| Page bound exceeded | Treat as a failed search |
| Search endpoint not published | Treat as a failed search |
| Search failed | Do not render the claim; issue or fail per configuration |

A failed search that prevents issuance is a fault in the authorization
server's dependencies rather than a defect in the client's request, and the
token endpoint error codes of Section 5.2 of {{RFC6749}} all describe the
latter. No registered code fits. An AS SHOULD therefore respond with an HTTP
500 status, MUST NOT select a code that attributes the failure to the
client's request, and MUST NOT disclose which claim failed. {{ISSUANCE}}
names no code either for the case of a PDP that cannot be reached at all;
the two conditions are the same condition and should be answered together.

# Example

An authorization code request for two scopes, at a deployment that binds all
three registered claims. Only the JSON payloads are shown; as {{ISSUANCE}}
notes, the transport is a property of the deployment.

The token request:

~~~ http-message
POST /token HTTP/1.1
Host: as.example
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient.example%2Fcb
&scope=files.read+files.write
~~~

The AS forms the evaluation of {{ISSUANCE}} and the three searches, and MAY
send them concurrently. The evaluation:

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
    { "action": { "name": "files.read"  } },
    { "action": { "name": "files.write" } }
  ],
  "options": { "evaluations_semantic": "execute_all" }
}
~~~

The `groups` search, sent to the PDP's `search_resource_endpoint`:

~~~ json
{
  "subject":  { "type": "user", "id": "U0405936" },
  "action":   { "name": "member" },
  "resource": { "type": "group" },
  "context": {
    "client_id": "chatterbox",
    "acr": "urn:example:loa:2",
    "audience": ["https://api.example/files"]
  }
}
~~~

~~~ json
{
  "results": [
    { "type": "group", "id": "engineering" },
    { "type": "group", "id": "release-managers" }
  ]
}
~~~

The `roles` search differs only in its action and resource type:

~~~ json
{
  "subject":  { "type": "user", "id": "U0405936" },
  "action":   { "name": "assignee" },
  "resource": { "type": "role" },
  "context": {
    "client_id": "chatterbox",
    "acr": "urn:example:loa:2",
    "audience": ["https://api.example/files"]
  }
}
~~~

~~~ json
{
  "results": [
    { "type": "role", "id": "deployer" }
  ]
}
~~~

The `entitlements` search is formed the same way, with action `holder` and
resource type `entitlement`, and returns no results:

~~~ json
{
  "results": []
}
~~~

The evaluation permits the gate and both scopes:

~~~ json
{
  "evaluations": [
    { "decision": true },
    { "decision": true },
    {
      "decision": true,
      "context": { "issuance": { "token_lifetime": 3600 } }
    }
  ]
}
~~~

The AS mints the access token. Its payload:

~~~ json
{
  "iss": "https://as.example",
  "sub": "U0405936",
  "aud": "https://api.example/files",
  "client_id": "chatterbox",
  "iat": 1791000000,
  "exp": 1791003600,
  "scope": "files.read files.write",
  "groups": ["engineering", "release-managers"],
  "roles": ["deployer"],
  "entitlements": []
}
~~~

`entitlements` is present and empty because its search succeeded and returned
nothing ({{empty}}). Had it instead failed, the claim would be absent rather
than empty, and whether a token was issued at all would depend on how the
deployment has configured that binding ({{failure}}).

Had the gate been denied, the searches would have been performed and their
results discarded, and no token would have been issued ({{ordering}}).

# Security Considerations

Where {{ISSUANCE}} is also in use, its considerations apply in full.

## Enrichment Is Not Authorization

The rule of {{ordering}} is the security property this document rests on.
Section 8.1 of {{AUTHZEN}} is careful to say that a search result SHOULD, not
MUST, correspond to a permit, because a search and an evaluation may be
computed differently and may consider different variables. An AS that treated
a non-empty result set as a reason to issue would be relying on a guarantee
{{AUTHZEN}} declines to make, and would have replaced a decision with an
enumeration.

The concurrency permitted by {{ordering}} makes this easier to get wrong in
an implementation than in a specification. Search results become available
before the decision does, and an implementation that assembles a token as
results arrive can find itself with a nearly complete token and no decision.
The results are inputs to claim construction alone.

## No Consistency Across Calls {#consistency}

The decision and the searches are separate requests against data that may
change between them, so a token can carry a decision made against one state
and claims computed against another. An AS keeps the window narrow by
issuing the calls concurrently ({{ordering}}) and by bounding any cache
lifetime to the lifetime of the tokens the results are rendered into.

## Provenance and Freshness {#provenance}

A claim rendered by this profile carries no indication that it was rendered
by this profile. A resource server reading `groups` cannot distinguish a value
the AS obtained from a PDP at issuance from one cached at session
establishment or copied from an upstream token, and those have different
revocation behavior. What the profile improves is the AS's side of it: the
value now comes from a named PDP through a specified API rather than from an
unspecified directory, database, or hook. The token records none of that.

Nor is the instant at which the underlying state held establishable from the
token. An AS asserting that these were the subject's groups at 14:02 is making
two claims of different kinds in one artifact. The first, that it issued the
token, is authoritative because it issued it. The second is an account of what
a third party's state contained at a moment only the AS observed, and the AS
is the party whose caching and propagation behavior a resource server would be
trying to evaluate. Trusting an issuer does not make it a witness to its own
freshness.

This document therefore defines no provenance or freshness claim. A value the
AS asserts about its own timeliness would be relied on as though it were
verifiable, and it would not be. Meeting the requirement takes an attestation
from the party that holds the state, which is a signing relationship between
that party and the resource server rather than a claim an AS can mint.

The property is not created here. It holds for every authorization claim in an
{{RFC9068}} access token, and for `auth_time`, `acr`, and `amr` in an ID
Token, all of which are the issuer's account of an event only the issuer
observed. Where a resource server needs a decision against current state
rather than an account of past state, the surface for it is the one named in
{{token-size}}: call the PDP at request time, with the resource in hand.

## Token Size {#token-size}

A claim with thousands of members produces a token that may exceed the
header size limits of intermediaries on the path to the resource server, at
which point the failure moves from the AS to the network and becomes much
harder to diagnose. A deployment discovering that an enumeration is too large
to carry has learned that the claim is the wrong mechanism for that data, not
that it needs a larger token. The alternative is available and is the
ordinary AuthZEN deployment: the resource server consults the PDP directly at
request time, with the resource in hand, and asks a question whose answer is
one decision rather than an enumeration. Issuance-time claims and
request-time evaluation are complementary surfaces, and a claim that will not
fit in a token is a signal about which surface the deployment needs.

## Privacy

An authorization claim discloses to every party that receives the token the
complete enumeration of what the subject holds of that kind, including
memberships that have nothing to do with the audience the token is aimed at.
A group name can itself be sensitive, and a resource server needs only the
groups relevant to its own decisions.

{{search-context}} allows an AS to convey the issuance target so that a PDP
may scope the result set, but that input is advisory and a PDP may ignore it.
A deployment for which target scoping is a privacy requirement rather than an
optimization SHOULD bind claims whose resource type distinguishes the target,
so that the scoping is expressed where the PDP must honor it, and SHOULD
consider whether the claim belongs in the token at all.

The searches themselves also disclose to the PDP that a token is being minted
for a subject, on every issuance and, where the affordance of {{ordering}} is
taken, on issuances that never complete. {{ISSUANCE}} discusses the
disclosure of authentication and access patterns to a PDP operated by another
party; binding claims multiplies the number of requests that disclosure
travels in, without adding a new category of disclosed information.

# IANA Considerations

This document has no IANA actions. OpenID Foundation registry requests are
listed in {{oidf-registries}}.

# OpenID Foundation Registry Considerations {#oidf-registries}

## AuthZEN Token Issuance Entity Types Registry {#iana-types}

This specification requests registration of the following entity types in the
AuthZEN Token Issuance Entity Types registry established by {{ISSUANCE}},
whose registration policy is Specification Required. Change Controller for all
entries is the OpenID Foundation AuthZEN Working Group, and the Specification
Document is this document.

| Type | Applies to | Description |
|---|---|---|
| `group` | resource | A group whose members are subjects |
| `role` | resource | A role assignable to subjects |
| `entitlement` | resource | An entitlement held by subjects |

## AuthZEN Authorization Claim Bindings Registry {#iana-bindings}

This specification requests creation of a new registry: the AuthZEN
Authorization Claim Bindings registry, which records for each authorization
claim the AuthZEN Resource Search that enumerates its members. Registration
policy is Specification Required.

The registry has the following fields:

| Field | Description |
|---|---|
| Claim Name | The JWT claim name being bound |
| Resource Type | The `resource.type` of the search |
| Action Name | The `action.name` of the search |
| Change Controller | The registering specification's change controller |
| Specification Document(s) | Where the binding is defined |

Registrations MUST use a Claim Name already registered in the "JSON Web Token
Claims" registry established by {{RFC7519}}, MUST use an Action Name matching
`[a-z][a-z0-9_]{0,30}`, and MUST use a Resource Type registered in the
registry of {{iana-types}}. The grammar is the one {{ISSUANCE}} imposes on
the names it expects to be usable as relation identifiers, and
{{action-portability-note}} gives the reason it applies here too.

Initial entries:

| Claim Name | Resource Type | Action Name |
|---|---|---|
| `groups` | `group` | `member` |
| `roles` | `role` | `assignee` |
| `entitlements` | `entitlement` | `holder` |

The Change Controller for all three is the OpenID Foundation AuthZEN Working
Group and the Specification Document is this document, alongside Section 4.1.2
of {{RFC7643}} and Section 2.2.3.1 of {{RFC9068}}, which define the claims
themselves.

### Note on the Action Name Grammar {#action-portability-note}

Action names registered here are bounded by the same grammar {{ISSUANCE}}
applies to the short names it registers, so that the family keeps one rule
rather than two.

--- back

# Acknowledgments
{:numbered="false"}

Thanks to the participants in the OpenID AuthZEN interoperability events,
whose December 2025 identity provider scenario demonstrated AuthZEN search
operations populating token claims, and to the members of the AuthZEN Working
Group and the OAuth Working Group.

# Document History
{:numbered="false"}

Draft 1 continues the individual Internet-Draft
`draft-gazitt-oauth-authzen-claims`, whose `-01` made the changes below.

## Since -00
{:numbered="false"}

* Added {{provenance}}, stating that an enriched claim carries no indication
  of its own provenance and that the instant at which the underlying state
  held is not establishable from the token.
* Removed the search context's carve-out for the enforcement point capability
  declaration, and the declaration itself from the example, neither of which
  {{ISSUANCE}} defines any longer.
