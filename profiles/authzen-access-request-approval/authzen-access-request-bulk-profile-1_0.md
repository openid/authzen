---
title: "AuthZEN Bulk Access Requests Profile - Draft 1"
abbrev: "ARAP Bulk"
category: std
ipr: none

docname: authzen-access-request-bulk-profile-1_0
workgroup: OpenID AuthZEN
consensus: true
v: 3
stand_alone: true
pi: [toc, sortrefs, symrefs, private]
keyword:
  - authorization
  - access request
  - approval workflow

author:
  -
    name: Karl McGuinness
    org: Independent
    email: public@karlmcguinness.com

normative:
  RFC8785:
  ARAP:
    title: "AuthZEN Access Request and Approval Profile 1.0"
    target: "https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html"
    author:
      -
        ins: K. McGuinness
        name: Karl McGuinness
    date: 2026

--- abstract

This profile defines bulk Access Requests for the AuthZEN Access Request and Approval Profile: multiple requested items, bundle and per-item denial binding, aggregate task status, and per-item approval handling.

--- middle

# Introduction

This companion to the AuthZEN Access Request and Approval Profile {{ARAP}} defines submission of multiple Resource/Action items in one Access Request.  It defines bundle and per-item denial binding, per-item outcomes, aggregate task status, and bulk cancellation and re-evaluation.

The profile defines the `items` member of the Access Request submission, the `items` member of the Task Handle, and the `partial` task status.  The base profile's authentication, authorization, freshness, task handling, and approval verification rules continue to apply; this document specifies the bulk variations.  An aggregate result is not a grant of access to every item.

# Requirements Notation and Conventions

{::boilerplate bcp14-tagged}

The terms PEP, PDP, Subject, Resource, Action, Context, Access Request, Access Request Service, Task Handle, and Approval Result are used as defined by {{ARAP}}.

# Bulk Submissions {#bulk-submissions}

## Bulk Request Body {#bulk-request-body}

Bulk submissions use the top-level members defined in [Request Body](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#submission-request-body) and [Additional Request Information](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#submission-additional-information), with these changes:

* When `items` is present, the top-level `resource` MUST be omitted.
* When `items` is present, the top-level `action` MUST be omitted.
* The top-level `denial` is REQUIRED when any item lacks a per-item `denial`.  It is a bundle denial; its coverage rules are in {{bulk-denial-binding}}.
* The top-level `denial` is OPTIONAL when every item carries its own per-item `denial`.

The Idempotency-Key covers the entire submission body, including all members of the `items` array when present.

## Request Items

`items`:
: OPTIONAL.  Array.  Multiple `(resource, action)` items submitted as a single bundled Access Request.  When present, `resource` and `action` MUST be omitted at the top level.  Each item is an object with the following members:

  * `resource`: REQUIRED.  The AuthZEN Resource for this item.
  * `action`: REQUIRED.  The AuthZEN Action for this item.
  * `requested_access`: OPTIONAL.  Per-item `requested_access` overrides; merged with the top-level `requested_access` with item values taking precedence.
  * `denial`: OPTIONAL.  Per-item denial binding when items came from separate AuthZEN Authorization API evaluations.  A per-item `denial` uses the same members as the top-level `denial` object.  See [The denial Object](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#submission-denial-object) and [Denial Metadata](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#submission-denial-metadata) for denial members and {{bulk-denial-binding}} for bulk coverage rules.

Non-normative bulk-submission example:

~~~ http
POST /access/v1/requests HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Content-Type: application/json
Idempotency-Key: 7b8d0f0d-65a1-4af1-9fd3-a684f08a5d14

{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "items": [
    {
      "resource": {"type": "document", "id": "q4-plan"},
      "action": {"name": "can_read"}
    },
    {
      "resource": {"type": "channel", "id": "engineering"},
      "action": {"name": "can_post"}
    }
  ],
  "context": {
    "business_justification": "Onboarding to the renewal review project"
  },
  "requested_access": {
    "requested_until": "2026-05-14T20:15:00Z"
  },
  "denial": {
    "evaluation_id": "eval_01HX4Y2P8BQ4Y3F0V0K9D6Z7M2",
    "evaluated_at": "2026-04-30T20:15:00Z",
    "expires_at": "2026-04-30T20:25:00Z",
    "reason": "approval_required",
    "binding_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0.eyJidW5kbGVfaWQiOiJidW5fMDFIWDVTVUJNMSIsIml0ZW1zIjpbeyJyZXNvdXJjZSI6ImRvY3VtZW50OnE0LXBsYW4iLCJhY3Rpb24iOiJjYW5fcmVhZCJ9LHsicmVzb3VyY2UiOiJjaGFubmVsOmVuZ2luZWVyaW5nIiwiYWN0aW9uIjoiY2FuX3Bvc3QifV19.bXBfc2lnbmF0dXJl",
    "template": "onboarding_bundle"
  }
}
~~~

## Denial Binding for Bulk Submissions {#bulk-denial-binding}

When `items` is present and any item lacks a per-item `denial`, the top-level `denial` is a bundle denial whose verifiable binding material MUST cover the Subject, authorization-relevant Context, and every Resource and Action in `items`.

The top-level `denial` presence rules are in {{bulk-request-body}}; the binding claims are defined in [Denial Binding Claims](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#binding-token-integrity).  For bulk submissions, those claims cover the entire `items` array and authorization-relevant Context:

* Inline bulk binding claims list each submitted item, including the full Resource and Action objects for that item, in the same order as the bound Access Request.
* A bulk `binding_hash` is the base64url-encoded (without padding) SHA-256 digest of the JCS {{RFC8785}} serialization of the JSON object `{"subject": <Subject>, "items": [{"resource": <Resource>, "action": <Action>}, ...], "context": <authorization-relevant Context>}`, where `<Subject>` is the bound Subject with `subject.properties.act` removed and the `items` array order is the order bound by the denial.  Implementations that use a bulk hashed form MUST use exactly this construction.

When every item carries its own per-item `denial`, each per-item binding is verified using the single-item rules instead of this bundle construction.

## Response Items and Aggregation {#bulk-aggregation}

`items`:
: REQUIRED when the original submission carried an `items` array; otherwise OPTIONAL.  Array.  Per-item progress for bundled Access Requests.  Each element corresponds positionally to the submission's `items` member and has the following members:

  * `resource`: REQUIRED.  The AuthZEN Resource for this item, echoing the submission.
  * `action`: REQUIRED.  The AuthZEN Action for this item.
  * `status`: REQUIRED.  Per-item status using the values defined in [Task Status Values](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#task-status).
  * `result`: OPTIONAL before the item reaches a terminal status; REQUIRED when the item status is `approved`.  Per-item completion result with the same shape as the top-level `result` ([Approval and Re-evaluation](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#completion-semantics)).

When `items` is present, `progress` describes aggregate workflow progress for the bundled task; per-item progress is tracked in `task.items[]`.

When `task.status` is `approved` and the task contains an `items` array, each approved item in `task.items[]` MUST include its own `result` object.  The response MAY also include a top-level `result` object for aggregate workflow information, but a PEP MUST NOT use that top-level `result` to authorize an individual item unless the same result is also present in that item's `result` member.

When the `items` member is present, the aggregate `task.status` is computed from per-item statuses as follows:

* If any item is `pending` or in an implementation-defined non-terminal status ([Task Status Values](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#task-status)), the aggregate is `pending`.
* Otherwise, if all items share the same terminal status, the aggregate is that status.
* Otherwise, with two or more distinct terminal statuses present across items, the aggregate is `partial`.

A PEP processing a bundled task MUST consult `task.items[].status` and `task.items[].result` to determine per-item outcomes; the PEP MUST NOT infer per-item outcomes from the aggregate `task.status` alone.  A top-level `result` MUST NOT be used to authorize any individual item in a bundled task unless the same result is also present in that item's `result` member.

## Bulk Task Status {#bulk-task-status}

`partial`:
: All items in a bulk task ({{bulk-submissions}}) reached terminal status, but with mixed outcomes (for example, some items approved while others denied).  This status is only valid for tasks containing an `items` array.

  * A PEP receiving `partial` MUST consult `task.items[].status` to determine per-item outcomes.
  * A PEP receiving `partial` MUST NOT infer aggregate access permission.

## Bulk Status, Cancellation, and Re-evaluation

Each item follows the base state machine independently.  The aggregate `task.status` follows {{bulk-aggregation}}, reaching `partial` when all items reach terminal status with two or more distinct terminal statuses present.

Cancellation cancels every `pending` item and leaves terminal items unchanged.  Behavior for implementation-defined non-terminal statuses is implementation-defined; an Access Request Service that defines additional non-terminal statuses SHOULD document whether cancellation transitions those items to `cancelled` or leaves them unchanged.

The aggregate status is then recomputed: `cancelled` when no item completed before cancellation, or `partial` when some items reached other terminal statuses first.  If every item was already terminal, cancellation returns `409 Conflict` with `urn:openid:authzen:access-request:error:invalid_task_state`.

For a task containing an `items` array, each approved item MUST include a per-item `result` that is independently enforceable according to its own `result.mode`.

For a bundled Access Request, the default approval scope for each approved item is that item's Subject, Resource, Action, and relevant Context.

When the original submission carried an `items` array, the PEP re-evaluates each approved item separately, including that item's `result.approval` at `context.approval` in the item's re-evaluation request as described in [Approval and Re-evaluation](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#completion-semantics).  This profile does not define an aggregate re-evaluation that covers multiple items in one AuthZEN Authorization API call.

# Security Considerations

**Bulk bundle escalation.** An aggregate status or result could be mistaken for approval of every item.  {{bulk-submissions}} requires per-item status and results and limits use of a top-level result for item authorization.

**Bundle substitution and reordering.** Denial binding covers item contents and order ({{bulk-denial-binding}}).  The base profile's binding, authentication, and authorization requirements apply to every requested item.

# Privacy Considerations

The privacy considerations of {{ARAP}} apply.  Bundles can disclose relationships among resources and approvals; per-item outcomes can reveal different policy or workflow decisions.

# IANA Considerations

This specification makes no requests of IANA.

# OpenID Foundation Registry Considerations

## AuthZEN Access Request Member Names Registry {#member-names}

This specification registers the following entries in the AuthZEN Access Request Member Names registry established by {{ARAP}}.

| Name | Extension Point | Description |
|---|---|---|
| `items` | Access Request submission | Array of requested Resource/Action items and optional per-item denial and request information. |
| `items` | Task Handle | Per-item status and completion results for a bundled request. |

Change Controller for all entries: OpenID Foundation AuthZEN Working Group.  Specification Document for all entries: This document.

The `partial` task status extends the status enumeration of {{ARAP}}; that enumeration has no separate registry.

--- back

# Implementation Considerations

The following non-normative mapping extends the base profile's backend-state mapping:

| Backend state | ARAP task status |
|---|---|
| Closed, items in a bulk task reached two or more distinct terminal statuses | `partial` |

# Design Rationale

## Why support bundle and per-item denials? {#why-does-the-denial-object-support-both-a-top-level-and-per-item-form-for-bulk-submissions}

A batch evaluation can produce one denial covering multiple Resource/Action pairs; separate evaluations produce separate denials.  Top-level binding supports the first case, and per-item binding the second.  Both allow a bundled submission without requiring the PEP to fabricate a bundle binding or submit each request separately.

# Document History

-00

* Extracted bulk Access Request requirements and related material from the AuthZEN Access Request and Approval Profile without changing their force or conditions.
