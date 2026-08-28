---
title: "OpenID AuthZEN Subject-Side Access Challenge Profile 1.0"
abbrev: S-ARAP
docname: authzen-subject-side-access-challenge-1_0
category: std
ipr: none
consensus: true
v: 3
workgroup: OpenID AuthZEN
date: 2026-08-04
stand_alone: true
smart_quotes: no
pi: [toc, sortrefs, symrefs, private]
keyword:
  - authorization
  - AuthZEN
  - affected party
  - decision subject
  - contestability
  - audit
  - notice
  - standing
author:
  - ins: A. Aravind
    name: Anivar Aravind
    org: Independent Researcher
    email: ping@anivar.net
    uri: https://anivar.net
normative:
  RFC2119:
  RFC8174:
  RFC7009:
  RFC7515:
  RFC7519:
  RFC8615:
  RFC9457:
  RFC9943:
  AuthZEN:
    title: "Authorization API 1.0"
    target: https://openid.net/specs/authorization-api-1_0.html
    author:
      - name: Omri Gazitt
        org: Aserto
      - name: David Brossard
        org: Axiomatics
      - name: Atul Tulshibagwale
        org: CrowdStrike
    date: 2026-01
  ARAP:
    title: "AuthZEN Access Request and Approval Profile - Draft 1"
    target: https://openid.net/specs/authzen-access-request-approval-profile-1_0.html
    author:
      - name: Karl McGuinness
        org: Independent
    date: 2026
  decision-subject:
    title: "Decision-Subject Representation for Agent Authorization"
    author:
      - name: Anivar Aravind
        org: Independent Researcher
    date: 2026
    seriesinfo:
      Internet-Draft: draft-aravind-oauth-decision-subject-00
informative:
  RFC9162:
  COAZ:
    title: "AuthZEN COAZ Framework 1.0"
    target: https://openid.net/specs/authzen-coaz-framework-1_0.html
    author:
      - name: Atul Tulshibagwale
        org: CrowdStrike
      - name: Alex Olivier
        org: Cerbos
    date: 2026
  COAZ-MCP:
    title: "AuthZEN COAZ MCP Binding 1.0"
    target: https://openid.net/specs/authzen-coaz-mcp-binding-1_0.html
    author:
      - name: Atul Tulshibagwale
        org: CrowdStrike
      - name: Alex Olivier
        org: Cerbos
    date: 2026
  w3c-did:
    title: "Decentralized Identifiers (DIDs) v1.0"
    target: https://www.w3.org/TR/did-core/
    author:
      - org: World Wide Web Consortium
    date: 2022
  kuehlewind-audit-architecture:
    title: "An Architecture for Auditing AI Agent Delegation and Interactions"
    author:
      - name: Mirja Kuehlewind
        org: Ericsson
      - name: Henk Birkholz
        org: Fraunhofer SIT
    date: 2026-05
    seriesinfo:
      Internet-Draft: draft-kuehlewind-audit-architecture-00
  mcguinness-oauth-actor-profile:
    title: "OAuth Actor Profile for Delegation"
    author:
      - name: Karl McGuinness
        org: Independent
    date: 2026
    seriesinfo:
      Internet-Draft: draft-mcguinness-oauth-actor-profile-00
  hardt-oauth-aauth-protocol:
    title: "AAuth Protocol"
    author:
      - name: Dick Hardt
    date: 2026
    seriesinfo:
      Internet-Draft: draft-hardt-oauth-aauth-protocol-09
  ssrn-6669318:
    title: "Epistemic Capture and the Action Boundary"
    author:
      - name: Anivar Aravind
    date: 2026
    seriesinfo:
      SSRN: "6669318"
  ssrn-6059075:
    title: "Corrigibility as a Structural Precondition for Digital Public Infrastructure"
    author:
      - name: Anivar Aravind
    date: 2026
    seriesinfo:
      SSRN: "6059075"
--- abstract

This profile defines an **AuthZEN Context input** by which a party an authorisation decision was made *about*, distinct from the requesting subject and the resource owner, can register a signed challenge that a Policy Decision Point (PDP) MUST evaluate with a defined effect. It is the **subject-side complement** to the OpenID AuthZEN Access Request and Approval Profile (ARAP), and rides on the same AuthZEN decision API surface. The profile requires three asymmetries relative to ARAP: **notice** (the affected party MUST learn a decision was made), **standing** (an Affected-Party Entity role distinct from the operator's `sub`/`act`/`client` roles), and **mandatory evaluation** (the PDP MUST evaluate a well-formed challenge, not MAY).

--- middle

# Introduction

## Motivation

The OpenID AuthZEN Authorization API ({{AuthZEN}}) defines a stable decision interface between Policy Enforcement Points (PEPs) and Policy Decision Points (PDPs). The Access Request and Approval Profile ({{ARAP}}) extends this interface to support **requestable denials**. In ARAP, a denial remains a denial (`decision: false`); the PDP signals requestability by including an `access_request` object in the Decision Context; the PEP submits an Access Request to an Access Request Endpoint and receives an opaque **Task Handle**; the approval workflow resolves asynchronously, the Task Handle being portable so it survives PEP restart or handoff; and on approval the PEP performs a fresh AuthZEN evaluation, re-evaluation being the only base completion mode, so the PDP remains authoritative at enforcement time. ARAP scopes itself deliberately to *missing authority* created by an asynchronous governance process, distinct from *missing information* a caller already holds, which partial evaluation addresses.

This profile defines the inverse. Where ARAP enables the *operator's* approver to grant continued authorisation when the PDP cannot decide unilaterally, this profile enables the **party an action was decided about** to register a signed challenge that the PDP MUST evaluate against the decision, with a defined effect on the decision's persistence and on the authority by which the decision continues to govern.

The asymmetry is structural. The ARAP approver is reachable by construction; they sit inside the PDP's trust boundary, are nominated by the operator, and consume operator-defined Context schemas. The Affected Party is not, and three additional protocol obligations are required to bring the subject-side surface to parity. This profile specifies those three obligations.

## Relationship to AuthZEN Authorization API and ARAP

This profile composes with both the base AuthZEN Authorization API and the ARAP profile, reusing ARAP's machinery wherever the shape is symmetric rather than inventing parallel structures. Apart from a single OPTIONAL response member ({{notice}}), it does not alter the AuthZEN evaluation request or response schemas. It defines:

- A new Decision Context member (`subject_side_challenge`, registered without a vendor prefix in the manner of ARAP's `access_request`) carrying a signed challenge from an Affected Party.
- An OPTIONAL AuthZEN Decision Context member, `subject_side_notice_required` ({{notice}}), by which a PDP flags a decision as Notice-eligible. Both members this profile introduces are Decision Context members, at the extension point {{ARAP}} names for that purpose.
- Reuse of ARAP's `evaluation_id` and `binding_token` binding patterns to bind a challenge to the decision it concerns, in place of a profile-specific decision reference.
- An opaque Task Handle for the challenge's asynchronous resolution, identical in lifecycle role to ARAP's Task Handle, so a challenge can be polled, resumed, or handed off, and so re-evaluation remains the authoritative completion mode.
- A capability URN (`urn:openid:authzen:capability:subject-side-challenge`) and a `subject_side_challenge_endpoint` PDP metadata parameter, mirroring ARAP's metadata discovery; Standing Token verification reuses the PDP `jwks_uri`.
- A new Decision Outcome (`reevaluate-with-subject-context`) by which a prior decision is suspended pending subject-side re-evaluation.
- A new Notice channel ({{notice}}) by which decisions communicating real-world effects to an Affected Party MUST also communicate the standing to challenge.
- A new Standing Token ({{standing}}) by which an Affected Party demonstrates the right to register a subject-side challenge.

This profile, ARAP, and partial evaluation are three orthogonal mechanisms on the same decision API. ARAP resolves **missing authority** (requester-initiated, resolved by an operator-side approver). Partial evaluation resolves **missing information** (a caller supplies inputs it already holds). This profile resolves neither: it provides a route for the **party a rendered decision is about** to contest that decision after the fact. A deployment MAY implement all three.

## Three Architectural Asymmetries

Three obligations distinguish this profile from a permissive interpretation in which a subject-side challenge would be an optional Context input the operator could ignore:

1. **Notice** ({{notice}}) — When a decision attributable to an Affected Party is made, the Operating Entity that consumes the decision MUST emit a notice to a reachable channel binding the Affected Party Entity to the decision and the standing-to-challenge endpoint.

2. **Standing** ({{standing}}) — The Affected Party Entity MUST be a first-class principal in the decision data model, distinct from the requesting `sub`, the actor `act`, the `client`, and the resource owner. Standing is asserted via a Standing Token, conveyed in the AuthZEN Context.

3. **Mandatory Evaluation** ({{eval}}) — A PDP receiving a well-formed subject-side challenge **MUST** (not MAY) evaluate it. The PDP MUST produce one of three defined Decision Outcomes ({{outcomes}}): `affirm-prior-decision`, `reevaluate-with-subject-context`, or `escalate-to-arap-approver`.

Without these three, the signed challenge is a Context input the Operating Entity can route to nowhere, present in the schema, absent in force. The profile name *Subject-Side* presupposes the three obligations together.

The need is visible in ARAP's own scoping. ARAP standardises the handoff from enforcement to the workflow that resolves a denial, and deliberately leaves the *approver-facing* surface, how an approver discovers and acts on a pending request, out of scope and non-interoperable by design. ARAP's model therefore names two actors it does not specify: the approver, whose inbox is left to deployments, and the Affected Party, who has no seat in the model at all. The operator has a standing incentive to build the first surface for itself. It has none to build the second. This profile specifies the second.

To the authors' knowledge, no current IETF or OpenID work models the affected party — the party a decision is *about* — as a first-class protocol role. The nearest adjacent art names a different party or a non-protocol concept: AuthZEN is deliberately subject-agnostic, but its `subject` is the *requesting* principal (human, agent, service, or device), not the affected party; ARAP's requestable denial is *requester-side* remediation; the "data subject" of data-protection law is a legal-rights concept, not an authorization or audit protocol role; and the audit-record architecture of {{kuehlewind-audit-architecture}} is oriented to the delegation and execution chain — the acting side. This profile, with its companion {{decision-subject}}, names the inverse. This is a claim of novelty in the standards corpus, not a proof of absence; reviewers aware of prior or parallel art are asked to point it out.

## Scope of the Affected Party

The Affected Party is deliberately **not** defined as a customer, and this profile presupposes no commercial relationship. Three registers fall within scope:

- **Consumer** — a party in a transactional relationship with the operator (a cardholder, a platform user). For this register, dispute and consumer-protection mechanisms (chargebacks, consumer-rights regimes) provide a partial analogue. This makes it the most familiar case, not the defining one.
- **Governed party** — a party subject to a decision by public or essential infrastructure, with no commercial relationship and frequently no ability to opt out (a benefits applicant, a citizen subject to an eligibility decision). Existing consumer-protection mechanisms do not reach this register, because they presuppose a transaction.
- **Bystander or counterparty** — a party an agent's action lands on without that party having initiated, contracted, or consented (a person captured by a decision they were not party to, a supplier a procurement agent transacts with).

The defining property is that the party's interests are materially altered by a decision while its identity is absent from the authorization chain that produced the decision. The transactional register is the on-ramp; the governed and bystander registers are why a new primitive is required at all.

## Conventions and Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 ({{RFC2119}}, {{RFC8174}}) when, and only when, they appear in all capitals, as shown here.

**Affected Party Entity** (also "Affected Party", "Affected Entity"): The natural person or organisation whose interests are materially altered by a decision rendered by a PDP, distinct from the requesting subject (`sub`), the acting agent (`act`), the relying-party client (`client`), and the resource owner. Examples: the loan applicant in a credit decision; the candidate in a hiring-filter decision; the citizen in a benefits-eligibility decision; the supplier in a procurement-agent-initiated purchase. This is the same party the companion profile {{decision-subject}} names on the decision record as the **decision subject** (`dsub`), an OPTIONAL, **non-authorizing**, audit-legibility claim. The two profiles are the **passive** and **active** faces of one role: `dsub` writes the affected party onto the audit record and grants no authority; this profile gives that recorded party notice, standing, and a mandatory-evaluation challenge. Wherever this document says "Affected Party Entity", the party is identified on the record by `dsub`.

**Subject-Side Challenge**: A signed, time-bounded protest record by which an Affected Party registers, at the PDP's challenge endpoint, that a prior or pending decision warrants re-evaluation.

**Notice**: A delivery of decision metadata from the Operating Entity to the Affected Party including the standing-to-challenge endpoint and the standing-token claim format.

**Standing Token**: A signed credential demonstrating the bearer's status as Affected Party for a specific decision or decision class.

**Mandatory Evaluation**: The PDP's obligation to evaluate a well-formed subject-side challenge against the decision it concerns, producing one of the defined Decision Outcomes.

# Architectural Overview

## PDP as Black Box

This profile preserves the PDP-as-black-box architecture that {{AuthZEN}} establishes and that {{ARAP}} extends. The Policy Decision Point evaluates well-formed authorisation requests and returns decisions; the policy language and engine remain implementation choices. The subject-side challenge enters the decision flow as a Context input, not as a token-format change. Identity tokens (OAuth, OIDC, SPIFFE, AAuth ({{hardt-oauth-aauth-protocol}}), and the like) are not modified by this profile.

Consistent with the principle that authority lives in the decision, not in the token, as articulated by McGuinness in public discussion (June 2026): the Standing Token in this profile is a Standing assertion, not an authority grant; the authority to compel re-evaluation lives in the PDP's defined Decision Outcome.

Because the Standing Token and its `decision_ref` name the Affected Party but grant no authority — per {{decision-subject}}, `dsub` is non-authorizing and a PDP MUST NOT treat it as an authorization input — the affected-party binding is carried in the `subject_side_challenge` Context member **alongside** the authorization inputs and MUST NOT be admitted as an authorization attribute. A PDP MUST strip the affected-party binding from the authorization-evaluation input before rendering allow/deny, exactly as {{decision-subject}} requires for `dsub`. A PDP whose evaluation input is a closed schema will thereby fail closed on any attempt to smuggle the affected-party binding into the authorization decision; that is the intended behaviour, not an error.

## Decision Lifecycle

~~~
+----------------+         +-------+        +--------------------+
| Operating      |  AuthZEN| PDP   |        | Affected Party     |
| Entity (PEP)   |--------->       |        | (off-stack)        |
|                |  request|       |        |                    |
+----------------+         +-------+        +--------------------+
        |                      |                       |
        | response (permit)    |                       |
        |<---------------------+                       |
        |                      |                       |
        | decision-takes-effect|                       |
        | NOTICE EMITTED (this profile, MUST)          |
        |--------------------------------------------->|
        |                      |                       |
        |                      |  subject-side         |
        |                      |  challenge (this      |
        |                      |  profile, Context     |
        |                      |  input + standing-tok)|
        |                      |<----------------------+
        |                      |                       |
        |                      | MANDATORY EVALUATION  |
        |                      | per this profile      |
        |                      |                       |
        |                      | decision-outcome      |
        |                      | (one of three)        |
        |<---------------------+---------------------->|
        |                                              |
~~~

## Composition with ARAP

The ARAP profile and this profile are duals at the same decision-protocol altitude. ARAP routes a *deny-with-escalation* to an operator-designated approver and ingests the approver's grant as Context. This profile routes a *decision-with-affected-party-standing-disclosed* (a `permit` or a `deny` that materially affects an Affected Party) to the Affected Party and ingests the Affected Party's challenge as Context. Both reduce to PDP Context inputs evaluated under the AuthZEN decision API; both issue an opaque Task Handle for asynchronous resolution; and both treat a fresh AuthZEN evaluation as the authoritative completion mode, leaving the PDP authoritative at enforcement time.

A single PDP MAY implement both profiles, and the Decision Outcomes of one MAY be the input to the other. In particular, the `escalate-to-arap-approver` outcome ({{outcomes}}) routes a subject-side challenge into ARAP's Access Request Endpoint as a triggering input, so the operator's existing approver workflow resolves the challenge and the resulting approval drives the re-evaluation.

## Delegated Challenge

An Affected Party MAY delegate the filing of a subject-side challenge to an agent acting on its behalf. Such an agent carries its own identity and delegation chain, for example per an OAuth actor profile ({{mcguinness-oauth-actor-profile}}), and presents the Affected Party's Standing Token. Delegated challenge is the mechanism by which the subject-side surface scales to populations who will not hand-assemble challenges individually. It composes with this profile without modification and is otherwise out of scope. It is the subject-side analogue of the operator-side agent stack: the same delegation machinery, pointed the other way.

# Notice {#notice}

## The PDP-Triggered Notice Obligation

When a PDP returns a decision (`permit` or `deny`) that, when enforced, materially affects an identifiable Affected Party, the Operating Entity that consumes the decision MUST emit a Notice to the Affected Party. The trigger is the Operating Entity's act of *enforcement*; the obligation is on the Operating Entity that consumes the AuthZEN decision, not on the PDP itself.

A PDP that issues decisions in scope of this profile MUST flag, in the decision response, whether the decision is enforcement-Notice-eligible. The decision response carries an OPTIONAL boolean member `subject_side_notice_required`, carried in the AuthZEN Decision Context, whose value SHALL be `true` if the policy under evaluation classifies the decision as one with material effect on an identifiable Affected Party.

## Notice Content

A Notice MUST carry, at minimum:

- The identifier of the decision (a stable opaque reference)
- The PDP identifier (URL or DID)
- The decision timestamp
- The Affected Party Entity identifier (binding to a notice channel)
- The standing-to-challenge endpoint URL
- The Standing Token format(s) the PDP accepts
- The decision validity period

A Notice MAY carry: a human-readable summary of the decision; a reference to the operator-side policy excerpt under which the decision was rendered; a deadline beyond which subject-side challenges will not be considered timely.

A Notice MUST NOT carry: the raw policy text of trade-secret or confidential operator policy; the requester's identity or token; any data not necessary for the Affected Party to evaluate whether to challenge.

## Notice Channel Binding

A Notice channel is one of: a registered email address; a registered SMS endpoint; a registered wallet push; a registered postal address; a registered DID delegate channel; or an alternative channel agreed under regulatory or contractual obligation.

The binding from the Affected Party Entity identifier to the Notice channel is *out of scope* for this profile and MUST be established by the regulatory regime, the contractual regime, or the platform's standing data model governing the Affected Party relationship. The profile presupposes the binding exists; it specifies the obligation to use it.

## Notice SLA

The Operating Entity MUST deliver a Notice within a time bound governed by the regulatory regime under which the decision is rendered or, in the absence of a regulatory time bound, within the time bound declared by the PDP in its conformance disclosure (per {{conformance}}). The default time bound, when neither regulatory nor disclosed, is **30 days** from decision enforcement.

# Standing {#standing}

## The Affected Party Entity Role

The decision data model is extended with a new principal role: `affected_party`. This role is distinct from:

- `sub` — the requesting subject (the user on whose behalf the request is made)
- `act` — the actor (the agent acting on behalf of `sub`, per OAuth Token Exchange semantics)
- `client` — the relying-party client (the application making the request)
- `resource_owner` — the entity whose resource is the subject of the decision

The `affected_party` role denotes an Entity whose **interests** are materially altered by the decision but whose **identity** is not part of the requesting authorisation chain. Today's identity model does not carry this role; sub/act/client name the Operating Entity's perspective. This profile names the inverse.

## Standing Token

A Standing Token is a signed credential demonstrating that the bearer is an Affected Party with respect to a specific decision or decision class. The Standing Token format is a JSON Web Token ({{RFC7519}}) with the following minimum claims:

- `iss` — the Notice-emitting Operating Entity or a delegate authority
- `sub` — the Affected Party Entity identifier
- `aud` — the PDP challenge endpoint
- `decision_ref` — the decision binding from the Notice; SHOULD be carried as ARAP's `evaluation_id` where the PDP exposes one, or as an integrity-protected `binding_token`, so subject-side binding reuses ARAP's binding patterns rather than a profile-specific reference. An open ARAP PR (#532) would require `binding_token` for an independent Access Request Service and scope `evaluation_id`-only binding to same-service deployments; if that lands, this document's binding guidance should be revised to track it rather than treating the two as interchangeable.
- `iat` — issuance timestamp
- `exp` — expiry (MUST be bounded by the regulatory or disclosed dispute window)
- `jti` — a unique token identifier
- `affected_party_role` — a structured indication of the role under which the Affected Party holds standing (for example: `data-subject`, `applicant`, `bystander`, `consumer`, `citizen`)

The Standing Token MUST be signed by the issuer's key per JWS ({{RFC7515}}). The signing key MUST be discoverable via the issuer's well-known metadata. Alternative formats, such as SD-JWT, Verifiable Credentials, or opaque PASETO, are PERMITTED if the PDP discloses support in its conformance metadata.

## Standing Acquisition

The Affected Party acquires a Standing Token through one of three flows:

1. **Notice-bound issuance** — Following Notice receipt, the Affected Party presents a verification factor (factor depends on the Notice channel binding) to the issuer and receives the Standing Token directly. Default flow.

2. **Identity-broker mediation** — An identity broker holding a binding to the Affected Party (for example, a Decentralised Identifier method controller; a state-issued verifier; an institutional registrar) issues the Standing Token on the Affected Party's behalf.

3. **Self-asserted with attestation** — The Affected Party self-asserts standing accompanied by an out-of-band attestation acceptable to the PDP under its conformance disclosure (for example, a court order; a regulatory order; a class-action standing).

The choice among the three flows is a deployment matter governed by the regulatory regime and the operator-side disclosure; it is not constrained by this profile.

## Standing Token Conveyance

The Standing Token is conveyed to the PDP in the AuthZEN Context as a member of the new Decision Context object `subject_side_challenge` ({{eval}}). Earlier drafts named this `x-authzen-subject-side-challenge`; the vendor prefix is dropped to match ARAP's convention of registering plain Context member names such as `access_request`.

# Mandatory Evaluation {#eval}

## The MUST-Evaluate Obligation

A PDP receiving a well-formed Subject-Side Challenge in the AuthZEN Context MUST evaluate it against the decision it references. A PDP MUST NOT silently drop, defer indefinitely, or route to nowhere a well-formed challenge.

This requirement applies to a PDP that advertises the `urn:openid:authzen:capability:subject-side-challenge` capability ({{openid-foundation-registry-considerations}}). {{ARAP}} requires an implementation receiving an unrecognised member at an extension point to ignore it and not fail processing on that basis. A PDP that does not implement this profile therefore disregards a `subject_side_challenge` member, and this profile does not override that rule.

An Affected Party, or an agent filing on its behalf, MUST resolve the PDP's capabilities and `subject_side_challenge_endpoint` before submitting a challenge. Where the capability is not advertised, a submitted challenge has the status of an unrecognised Context member, and recourse is regulatory or contractual ({{operator-suppression}}).

A challenge is **well-formed** when:

- The Standing Token verifies against the issuer's signing key
- The Standing Token has not expired
- The `decision_ref` in the Standing Token matches a decision the PDP has recently rendered (within the regulatory or disclosed retention window)
- The Affected Party identity asserted by the Standing Token matches the Affected Party recorded on that decision's audit entry ({{audit}}). Standing is anchored to the record: a challenger has standing because the decision's own audit entry names them as the party the decision was about, not merely because the `decision_ref` resolves. A Standing Token whose `sub` does not equal the recorded Affected Party identifier for `decision_ref` is not well-formed, regardless of issuer signature.

  This profile does not require a particular record format for that identifier. Where a deployment records the Affected Party using the `dsub` claim of {{decision-subject}}, `dsub` SHOULD be the value compared. A deployment that records the Affected Party by other means compares against the identifier its audit entry binds, and MUST state that binding in its conformance disclosure ({{conformance}}).
- The `jti` has not been previously consumed
- The challenge payload is well-formed per {{challenge-payload}}

A PDP MAY reject malformed challenges with a defined error response ({{errors}}).

## Subject-Side Challenge Payload {#challenge-payload}

The `subject_side_challenge` Decision Context object is a JSON object with the following members:

- `standing_token` — REQUIRED. The Standing Token described in {{standing}}.
- `decision_ref` — REQUIRED. The decision binding from the Notice, carried as ARAP's `evaluation_id` or an integrity-protected `binding_token` (see the applicability note at {{standing}}, pending ARAP PR #532). MUST match the `decision_ref` claim in the Standing Token.
- `challenge_basis` — REQUIRED. A structured enumeration indicating the basis on which the Affected Party challenges the decision. Values include: `factual-error`, `procedure-error`, `category-mismatch`, `consent-withdrawn`, `change-in-circumstances`, `bias-asserted`, `regulatory-objection`, `other`. The Affected Party MAY specify multiple bases.
- `challenge_evidence` — OPTIONAL. A structured object carrying additional evidence the PDP may use in re-evaluation (for example: a corrected attribute value; a counter-document hash; a regulatory reference). Format is determined by the policy under evaluation.
- `requested_effect` — REQUIRED. One of: `reverse`, `suspend-pending-review`, `mark-for-human-review`. The Affected Party indicates the desired effect; the PDP determines the actual effect per {{outcomes}}. In this version, `reverse` is satisfied by `reevaluate-with-subject-context` returning a corrected decision; true rollback of an already-executed effect is out of scope pending a dedicated completion mode.

## Decision Outcomes {#outcomes}

On evaluation of a well-formed Subject-Side Challenge, the PDP MUST return one of the following Decision Outcomes:

1. **`affirm-prior-decision`** — The PDP, having considered the challenge, affirms the prior decision. The PDP MUST include a structured rationale (`affirm_basis`) referencing the policy clause or evidence that prevails over the challenge. The Affected Party retains recourse to the regulatory or contractual escalation path; the PDP-layer protocol obligation terminates here.

2. **`reevaluate-with-subject-context`** — The PDP re-evaluates the original decision request augmented with the challenge as Context input. As in ARAP, re-evaluation is a fresh AuthZEN evaluation and the PDP is authoritative at enforcement time; the PDP MUST return the re-evaluated decision and MUST include a structured `reevaluation_basis` indicating which challenge basis was material to the change in outcome. The re-evaluated decision SHALL replace the prior decision in any downstream enforcement. Where resolution is asynchronous, the PDP returns a Task Handle (with the lifecycle semantics ARAP defines) and the re-evaluated decision is retrieved on completion.

3. **`escalate-to-arap-approver`** — The PDP, or its Access Request Service, submits the challenge to ARAP's Access Request Endpoint as a triggering input, returning the resulting ARAP Task Handle to the Affected Party for status. This outcome is selected when the PDP's policy classifies the decision as one requiring a human approver rather than algorithmic re-evaluation. The eventual ARAP approval drives the authoritative re-evaluation, and that decision governs.

A PDP MAY return additional implementation-defined outcomes, but MUST also map them to one of the three above for interoperability.

## Conformance Disclosure {#conformance}

A PDP claiming conformance to this profile MUST publish a conformance disclosure at a well-known endpoint listing:

- The decision classes for which it asserts the Notice obligation
- The Standing Token formats it accepts
- The notice SLA it commits to
- The challenge dispute window it observes
- The Decision Outcome types it supports
- The audit log substrate to which evaluated challenges are written

The conformance disclosure is the integration point with conformance-registry mechanisms ({{audit}}).

## Errors {#errors}

Where the PDP rejects a malformed or inadmissible challenge, it MUST return an HTTP error using `application/problem+json` as defined by {{RFC9457}}, with the problem type URI in the `type` member. This profile defines the following problem types:

`urn:openid:authzen:subject-side-challenge:error:invalid_standing_token`:
: The Standing Token failed verification.

`urn:openid:authzen:subject-side-challenge:error:expired_standing_token`:
: The Standing Token is outside its validity period.

`urn:openid:authzen:subject-side-challenge:error:unknown_decision_ref`:
: The referenced decision is not in scope or not retained.

`urn:openid:authzen:subject-side-challenge:error:replay_detected`:
: The `jti` has been previously consumed.

`urn:openid:authzen:subject-side-challenge:error:malformed_payload`:
: The challenge payload does not conform to {{challenge-payload}}.

`urn:openid:authzen:subject-side-challenge:error:out_of_challenge_window`:
: The challenge was submitted beyond the disclosed dispute window.

`urn:openid:authzen:subject-side-challenge:error:rate_limit_exceeded`:
: The rate limit of {{rate-limiting}} was exceeded.
{: newline="true" spacing="compact"}

Each problem response MUST carry a stable human-readable `title` and SHOULD carry a `detail` and a reference URL pointing to the conformance disclosure.

# Audit and Logging {#audit}

A PDP claiming conformance to this profile MUST log, per evaluated subject-side challenge, the following to an audit substrate:

- The Standing Token hash
- The decision reference
- The challenge basis and (where supplied) evidence hash
- The Decision Outcome
- The rationale (per {{outcomes}})
- The Affected Party Entity identifier hash (privacy: minimised)

The audit substrate MUST be append-only and tamper-evident. Compatible substrates include:

- IETF SCITT ({{RFC9943}})
- A Certificate-Transparency-modeled log ({{RFC9162}}) under the operator's chosen log operator
- The auditor-published log of the Affected Party's elected representative (where regulatory regime permits)

The audit substrate MUST be readable by:

- The Operating Entity (always)
- The Affected Party Entity associated with the decision (always)
- The PDP's accredited auditor (always)
- Other parties as governed by the regulatory regime

To support the anti-suppression property of {{operator-suppression}}, the substrate SHOULD additionally:

- Periodically publish a signed commitment to its current state (a signed tree head or equivalent) to an anchor independent of the Operating Entity, such that an omitted or truncated entry is detectable by a **consistency proof** against a previously anchored commitment.
- Expose a subject-scoped, read-only projection by which an Affected Party Entity can retrieve, and independently verify against the anchor, the decisions recorded about them, keyed on the recorded `dsub` ({{decision-subject}}). This is the pull complement to Notice. Verification MUST NOT require trusting keys the Operating Entity supplies in the same response; the verifying party uses keys obtained out-of-band.

# Security Considerations

## Replay

Per {{eval}}, the `jti` of a Standing Token MUST be tracked and not re-accepted within the challenge dispute window. The PDP MUST implement standard replay protections per {{RFC7519}}.

## Operator Suppression {#operator-suppression}

The MUST-emit obligation on Notice is the primary mechanism by which the Affected Party *learns* a decision was made. A conforming Operating Entity that fails to emit a Notice for an enforcement-Notice-eligible decision is in non-conformance, and the Affected Party retains regulatory and contractual recourse.

Push-Notice alone, however, is exactly the obligation an operator can silently omit, and its omission is not self-evidencing. This profile therefore binds notice-eligibility to the tamper-evident audit substrate of {{audit}}: a PDP that flags a decision `subject_side_notice_required: true` ({{notice}}) MUST record that flag, and the Operating Entity SHOULD record the fact of notice emission, into the append-only, **externally-anchored** log. Where the substrate is anchored out-of-band — a signed tree head periodically published to an independent anchor, verifiable by a consistency proof — a *suppressed* or *back-dated* notice becomes **cryptographically detectable**: the operator cannot omit or truncate the corresponding log entry without failing the consistency check against the anchor. Suppression is thus not merely "non-conformance the Affected Party must somehow discover" — it is a detectable break in an externally-anchored chain.

To complete the discovery path, a conforming deployment SHOULD expose a subject-scoped, read-only view of the substrate by which an Affected Party can *pull* the decisions recorded about them and verify each against the anchor without trusting the operator ({{audit}}). This gives a party who suspects a suppressed notice a route to discover and prove it. Push-Notice remains the primary *learn* mechanism; the anchored, subject-readable pull view is the *non-repudiation and anti-suppression* mechanism. The conformance disclosure ({{conformance}}) remains the artifact that pins which decision classes carry the Notice obligation.

The anchored substrate bounds, but does not dissolve, a deeper limit. A constraint only the constrained party can verify is, in the limit, indistinguishable from no constraint. The audit substrate makes suppression and zero-weighting discoverable after the fact, and, as a direction this profile does not mandate, the evaluation of a subject-side challenge MAY be delegated to a PDP or challenge registry operated independently of the Operating Entity, so that mandatory evaluation does not rest on the assessed party's own attestation. The trade-off between an in-PDP channel (composable, but operator-attested) and an independently operated evaluator (not operator-attested, but not a drop-in Context input) is left open for Working Group discussion. This profile specifies the in-PDP channel and the anchored substrate that makes its limits observable.

## Rate Limiting {#rate-limiting}

A PDP MUST rate-limit subject-side challenges to prevent denial of service. The rate limit MUST be disclosed in the conformance disclosure ({{conformance}}). Where multiple Standing Tokens are issued to the same Affected Party Entity, the rate limit applies in aggregate across the Affected Party.

## Standing Token Compromise

A compromised Standing Token can be revoked via the issuer's revocation endpoint per {{RFC7009}}. The PDP MUST check revocation status at evaluation time (or via cached freshness within a disclosed window).

## Cross-Boundary Decisions {#cross-boundary-decisions}

Where a decision is rendered by PDP A and enforced by Operating Entity B in a different trust domain, the Notice obligation MAY be carried via the Forensic Bridge primitive (a cross-domain audit-and-notice relay, out of scope for this profile) or via a Standing Token re-issuance by the cross-boundary trust authority. Cross-boundary specification is left for a companion profile.

# Privacy Considerations

## Affected Party Identification

The Notice channel binding ({{notice}}) and the Standing Token ({{standing}}) require the PDP, the Operating Entity, and the issuer to know the Affected Party Entity identifier. This profile constrains the identifier to be minimised:

- Pseudonymous identifiers are RECOMMENDED where the regulatory regime permits
- Decentralised Identifiers ({{w3c-did}}) are RECOMMENDED as the default Standing Token subject
- The Affected Party Entity identifier MUST NOT be conveyed in the AuthZEN response to any party not previously possessing it

Where the same value serves as the recorded `dsub`, the minimisation regime of {{decision-subject}} applies to it.

## Notice Channel Privacy

The Notice channel MAY be observable by parties other than the Affected Party (for example, an email administrator). The Notice content MUST be limited to the minimum specified in {{notice}}; additional content (for example, decision attributes) MUST be carried only over channels with end-to-end confidentiality.

## Right to Be Forgotten {#right-to-be-forgotten}

Where the regulatory regime grants the Affected Party a right to erase the binding from their Entity identifier to a decision, the audit substrate ({{audit}}) SHOULD support erasure of that binding while preserving the integrity of the audit chain, for example through cryptographic erasure ("crypto-shredding") of a keyed commitment to the identifier, leaving the chain verifiable but the binding unrecoverable. Reconciling erasure rights with append-only tamper-evidence is a known-hard problem; this profile records the requirement as SHOULD and names a technique rather than mandating a construction.

# IANA Considerations

This document requests one registration in the "Well-Known URIs" registry established by {{RFC8615}}.

URI Suffix:
: authzen-subject-side-conformance

Change Controller:
: OpenID Foundation AuthZEN Working Group

Reference:
: This document.

Related Information:
: The conformance disclosure a PDP publishes under this suffix is described in {{conformance}}.

The AuthZEN member names, PDP metadata parameter, and PDP capability this profile defines are recorded in the OpenID Foundation registries and are listed in {{openid-foundation-registry-considerations}}.

# OpenID Foundation Registry Considerations {#openid-foundation-registry-considerations}

The registrations below are requests. Several target registries are still being established: the base specification's registrations remain outstanding, and the AuthZEN Access Request Member Names registry is created by {{ARAP}}, a Working Group Draft. Where a target registry does not exist, these entries reserve the names, and the Working Group may redirect them.

## AuthZEN Access Request Member Names Registry

This specification requests registration of the following member names in the AuthZEN Access Request Member Names registry established by {{ARAP}}. Registration policy is Specification Required.

| Name | Extension Point | Description |
|---|---|---|
| `subject_side_challenge` | AuthZEN Decision Context | Signed subject-side challenge object an Affected Party registers against a rendered decision. |
| `subject_side_notice_required` | AuthZEN Decision Context | Boolean by which a PDP flags a decision as enforcement-Notice-eligible under this profile. |

Change Controller for both entries: OpenID Foundation AuthZEN Working Group. Specification Document for both entries: This document.

## AuthZEN Policy Decision Point Metadata Registry

This specification requests registration of the following parameter in the AuthZEN Policy Decision Point Metadata Registry.

Name:
: `subject_side_challenge_endpoint`

Description:
: HTTPS endpoint at which an Affected Party submits a subject-side challenge for a rendered decision.

Change Controller:
: OpenID Foundation AuthZEN Working Group

Specification Document:
: This document.

## AuthZEN Policy Decision Point Capabilities Registry

This specification requests registration of the following capability in the AuthZEN Policy Decision Point Capabilities Registry.

Capability Name:
: `subject-side-challenge`

Capability URN:
: `urn:openid:authzen:capability:subject-side-challenge`

Capability Description:
: Indicates that the PDP supports subject-side challenges and the challenge endpoint defined by this specification.

Change Controller:
: OpenID Foundation AuthZEN Working Group

Specification Document:
: This document.

The capability URN registered above and the problem-type URNs used for error responses ({{errors}}) both use the `urn:openid:authzen:` namespace administered by the OpenID Foundation, rather than the `urn:ietf:params:authzen:` sub-namespace that the AuthZEN Authorization API registers for capabilities ({{AuthZEN}}). This is an intentional OpenID Foundation profile convention; the `capabilities` array remains a list of URNs as defined by {{AuthZEN}}.

The three Decision Outcomes this profile defines ({{outcomes}}), the `challenge_basis` values, and the `requested_effect` values ({{challenge-payload}}) are profile-defined enumerated values. Following the base profile, this specification does not create registries for them; a future specification that defines additional values SHOULD use stable names or absolute URIs under its own change controller.

# Worked Examples {#worked-examples}

## Welfare-Eligibility Decision

A welfare agency PDP renders `deny` on a benefits-renewal application based on income classification. The Notice obligation fires; the Notice carries the standing endpoint and a reference to the applicable Standing Token issuer (the state's regulatory authority). The applicant acquires a Standing Token via state-administered Notice-bound issuance, submits a `factual-error` challenge with `challenge_evidence` carrying the corrected attribute value. The PDP returns `reevaluate-with-subject-context`; the corrected attribute changes the income classification; the decision is `permit`. Notice of the new decision fires per the same obligation. There is no commercial relationship here, and consumer-dispute mechanisms do not reach this case.

## Hiring-Filter Decision

A staffing agency PDP renders `deny` on a candidate-shortlist decision. The decision is enforcement-Notice-eligible because employment-discrimination law in the operator's regulatory regime so classifies it. The candidate acquires a Standing Token through the agency's HR portal (Notice-bound issuance), submits a `bias-asserted` challenge with `challenge_evidence` referencing the candidate's protected-class status. The PDP returns `escalate-to-arap-approver`; an ARAP-conformant human reviewer at the agency consumes the challenge and renders the final decision under audit.

## Cross-Domain Procurement Decision

A procurement agent in Organisation A places an order with Supplier B by invoking an MCP tool whose call is authorised, per the COAZ Framework ({{COAZ}}) and its MCP Binding ({{COAZ-MCP}}), by mapping the tool parameters into the AuthZEN SARC model and evaluating them at Organisation A's PDP. The rendered `permit` is the decision the Supplier (the Affected Party) is given standing to challenge: the Supplier acquires a Standing Token through a cross-boundary trust authority (a federated registry of suppliers) and submits a `change-in-circumstances` challenge naming a supply disruption. The PDP at Organisation A returns `reevaluate-with-subject-context`; the policy under evaluation classifies the disruption as material and the decision is suspended pending the operator's procurement-team review.

This demonstrates two compositions at once: a subject-side challenge over a COAZ-authorised MCP tool call, and the cross-boundary Forensic Bridge interaction ({{cross-boundary-decisions}}).

--- back

# Acknowledgements

This profile's integration shape was first proposed in a June 2026 comment on Martin Besozzi's (TwoGenIdentity) post on composing Keycloak, AuthZEN, and Cedar for agent authorisation: the author proposed the inverse of ARAP there, a channel by which the party an agent acts upon can register a signed challenge the PDP must evaluate, composed as an AuthZEN Context extension. Karl McGuinness, author of the ARAP profile, replied in the same thread, contributing the principle that authority lives in the decision, not the token, and responding directly to the inverse-channel proposal: "agreed, that composes cleanly ... the subject-side complement to the operator-side approver flow ARAP covers." McGuinness also noted the same signed-challenge-as-decision-input shape appearing at the OAuth layer via transaction challenges, which this document has not yet investigated or cited. The author's prior contribution (*The Layer 8*; {{ssrn-6059075}}, {{ssrn-6669318}}) supplies the institutional accountability theory from which the three asymmetries — notice, standing, mandatory evaluation — derive. **This document itself, as a full write-up, has not been reviewed or endorsed by McGuinness or by the OpenID Foundation.**

The author thanks reviewers in advance and welcomes feedback through the AuthZEN Working Group list.

# Verified References

Every specification this profile relies on was re-verified against its authoritative source on the date shown, rather than cited from memory. An honest "cannot verify" is recorded where absence cannot be proven.

| Reference | Version / date (verified) | What this profile relies on | Verified |
|---|---|---|---|
| OpenID AuthZEN Authorization API 1.0 | **Final Specification, 11 Jan 2026** (OIDF membership vote; a later-rendered editors' copy carries a 17 Jul 2026 site-build timestamp but is byte-identical in content, confirmed by hash comparison 22 Jul) | PDP-to-PEP decision API; batch `/access/v1/evaluations` and `/access/v1/search/*` are normative in the Final | CONFIRMED (2026-07-19; re-confirmed 2026-07-22) |
| OpenID AuthZEN Access Request and Approval Profile (ARAP) | Working Group Draft 1; K. McGuinness (Independent) | `access_request` Context object, `evaluation_id`, opaque JWS `binding_token`, Access Request Endpoint, opaque Task Handle, `result.mode: "reevaluate"` completion, the PDP metadata / capabilities / member-names registries this profile registers into | CONFIRMED (2026-07-19); published Draft 1 front matter uses the abbreviation ARAP (the OIDF Working-Group-approval announcement used AARP) |
| OpenID AuthZEN COAZ Framework 1.0 and COAZ MCP Binding 1.0 | Working Group Drafts (the single COAZ profile was split into a Framework and an MCP Binding on 17 Jul 2026); A. Tulshibagwale (CrowdStrike), A. Olivier (Cerbos) | mapping from MCP tool parameters into the AuthZEN SARC (Subject-Action-Resource-Context) model, used in the {{worked-examples}} procurement example only | CONFIRMED (2026-07-19) |
| Problem Details for HTTP APIs | RFC 9457, Proposed Standard | `application/problem+json` error responses and the problem-type URI convention ({{errors}}) | CONFIRMED (2026-07-19) |
| SCITT Architecture | RFC 9943, Proposed Standard, June 2026 (formerly `draft-ietf-scitt-architecture`) | append-only, tamper-evident signed-statement transparency plus receipts (an {{audit}} compatible substrate) | CONFIRMED (2026-07-19) |
| Certificate Transparency Version 2.0 | RFC 9162 (Experimental) | Merkle-tree log; signed tree head plus inclusion/consistency proofs, the {{audit}}/{{operator-suppression}} anti-suppression substrate (informative example) | CONFIRMED (2026-07-19) |
| Well-Known URIs | RFC 8615 | registration of the `authzen-subject-side-conformance` well-known suffix | CONFIRMED (2026-07-19) |
| RFC 7009 / RFC 7515 / RFC 7519 | Proposed Standard | OAuth 2.0 Token Revocation / JSON Web Signature / JSON Web Token | CONFIRMED (2026-07-19) |
| An Architecture for Auditing AI Agent Delegation and Interactions | draft-kuehlewind-audit-architecture-00, Informational, 18 May 2026; M. Kuehlewind (Ericsson), H. Birkholz (Fraunhofer SIT) | audit-record architecture for AI-agent delegation; the Auditor role | CONFIRMED (2026-07-19) |
| Decision-Subject Representation for Agent Authorization | draft-aravind-oauth-decision-subject-00 (this author) | `dsub`, the non-authorizing affected-party claim on the decision record; the passive face of this profile's role | companion draft |
| Prior/parallel art modeling the affected party as a first-class protocol role | — | none found in the IETF/OpenID standards corpus as of 2026-07-19 | UNVERIFIED (absence of prior art is not provable) |

Field names taken verbatim into normative text (for example, `access_request` members) should be re-read directly from the ARAP source immediately before list submission, as spec field names can change between editors' drafts.

# Notes for Reviewers

This is a first cut (Draft 00), prepared for review within the OpenID AuthZEN Working Group. It is an unadopted Working Group Draft. It composes with the OpenID AuthZEN Authorization API 1.0 and is positioned as the subject-side complement to ARAP. It has not been reviewed, adopted, or endorsed by the OpenID Foundation, the AuthZEN Working Group, or the author of ARAP, and was circulated in full to Karl McGuinness, author of ARAP, on 22 July 2026 before this submission. IETF cross-referencing is anticipated at a future AUDIT BoF (targeted for IETF 127); the BoF originally anticipated for IETF 126 was deferred.

`decision_ref` ({{standing}}, {{challenge-payload}}) follows ARAP as published, in which `evaluation_id` and `binding_token` are interchangeable. ARAP PR #532 would require `binding_token` for an independent Access Request Service. Issue #606 asks which of the two dependent work should pin to. This document will be revised to match #532 as settled.

Specific attention is requested on:

1. **In-PDP channel versus independent evaluator ({{operator-suppression}}).** This remains the central open question. The externally-anchored audit substrate partially answers it by making suppression and zero-weighting detectable after the fact, but the substrate does not remove the operator-attested character of the in-PDP channel. Working Group views on whether to specify the independently-operated evaluator option here or in a companion profile are sought.

2. **Notice placement ({{notice}}).** The obligation sits on the enforcing Operating Entity, with the PDP flagging eligibility via `subject_side_notice_required`. A MUST on out-of-band delivery is not expressible in this API and not checkable by a conformance suite. A registered Obligation Type, with a destination the operator does not select, is a better fit; this is the gap raised on the Working Group list in July under "notification obligations: is pointing one outward in scope?". Obligation negotiation is advisory and non-execution is handled rather than forbidden, so an Obligation as currently specified would carry less force than the present text. The fulfillment tiers in issue #521 would close that gap. Direction is requested on whether to move Notice to that mechanism now or to wait for tiers.

3. **Standing Token claim set ({{standing}}) and Decision Outcome enumeration ({{outcomes}}).** The required claim set is minimal for composability; the three outcomes are intended to be reductively exhaustive. Reviewers may identify gaps for specific regulatory regimes, or a fourth outcome that does not map cleanly.

4. **Challenge endpoint wire mechanics.** This cut names the `subject_side_challenge_endpoint`, Task Handle issuance and polling, and the well-known conformance disclosure, but does not yet specify their HTTP mechanics or schema. The intent is to mirror ARAP's Access Request Endpoint. Reviewers are asked whether these should be specified here or inherited from ARAP by reference.

5. **Erasure versus tamper-evidence ({{right-to-be-forgotten}}).** Recorded as SHOULD with a named technique rather than a mandated construction. Reviewers with cryptographic-erasure expertise are invited to strengthen it.
