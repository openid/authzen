---
title: "AuthZEN Access Request and Approval Profile - Draft 1"
abbrev: "ARAP"
category: std
ipr: none

docname: authzen-access-request-approval-profile-1_0
workgroup: OpenID AuthZEN
consensus: true
v: 3
stand_alone: true
pi: [toc, sortrefs, symrefs, private]
keyword:
  - authorization
  - authorization escalation
  - AI agent
  - access request
  - approval workflow
  - human-in-the-loop
  - just-in-time access
  - delegation
  - authority
  - step-up authorization
  - governance

author:
  -
    name: Karl McGuinness
    org: Independent
    email: public@karlmcguinness.com

normative:
  BULK:
    title: "AuthZEN Bulk Access Requests Profile 1.0"
    target: "https://openid.github.io/authzen/authzen-access-request-bulk-profile-1_0.html"
    author:
      -
        ins: K. McGuinness
        name: Karl McGuinness
    date: 2026
  ACTOR:
    title: "AuthZEN Actor Delegation Profile 1.0"
    target: "https://openid.github.io/authzen/authzen-access-request-actor-profile-1_0.html"
    author:
      -
        ins: K. McGuinness
        name: Karl McGuinness
    date: 2026
  CALLBACK:
    title: "AuthZEN Callback Notifications Profile 1.0"
    target: "https://openid.github.io/authzen/authzen-access-request-callback-profile-1_0.html"
    author:
      -
        ins: K. McGuinness
        name: Karl McGuinness
    date: 2026
  RFC9110:
  RFC9457:
  RFC3339:
  RFC6749:
  RFC6750:
  RFC7515:
  RFC7516:
  RFC7517:
  RFC7519:
  RFC8785:
  I-D.bhutton-json-schema:
  I-D.bhutton-json-schema-validation:
  I-D.ietf-httpapi-idempotency-key-header:
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

informative:
  OBLIGATIONS:
    title: "AuthZEN Profile for Obligations 1.0"
    target: "https://openid.github.io/authzen/authzen-obligations-profile-1_0.html"
    author:
      -
        org: OpenID AuthZEN Working Group
    date: 2026
  CATALOG:
    title: "AuthZEN Access Request Catalog Profile 1.0"
    target: "https://openid.github.io/authzen/authzen-access-request-catalog-profile-1_0.html"
    author:
      -
        ins: K. McGuinness
        name: Karl McGuinness
    date: 2026

--- abstract

This profile extends the OpenID AuthZEN Authorization API so a Policy Enforcement Point (PEP) can submit an access request after a requestable denial.  The profile preserves the AuthZEN Authorization API decision model: a denied decision remains a denial and MUST NOT be treated as access.  It defines denial context, an access request endpoint, a task handle for the asynchronous workflow, and re-evaluation after approval to keep the Policy Decision Point authoritative at enforcement time.

--- middle

# Introduction

The AuthZEN Authorization API lets a Policy Enforcement Point (PEP) ask a Policy Decision Point (PDP) whether a Subject may perform an Action on a Resource within a Context.  The PDP returns an allow or deny Decision.

Beyond a bare allow or deny, the AuthZEN family gives a PEP several ways to continue.  The ones this profile relates to are:

* An obligation ({{OBLIGATIONS}}) is an action the PEP itself performs to honor a permit the PDP has already made.  No second evaluation follows.
* A partial-evaluation residual is policy the caller completes locally.  No second evaluation follows.
* An Access Request resolves a denial with an input the PEP cannot produce on its own: an approval or a grant recorded out of band.  The PDP evaluates again and remains authoritative.
* A transient denial is retried after a delay with nothing changed ({{reevaluation-denials}}).

Each fails closed: an obligation the PEP cannot perform turns a permit into a deny ({{OBLIGATIONS}}), and a residual or an Access Request the PEP cannot use leaves the denial standing.  How these mechanisms compose is defined by the profiles that carry them.

This profile defines the Access Request.  When authority is fixed at provisioning time through roles, scopes, or service-account grants, a runtime denial ends the interaction.  When approval is possible during execution, a requestable denial lets the PEP submit an Access Request to an approval workflow, hold a Task Handle while the workflow runs, and re-evaluate access against current policy after approval ({{protocol-overview}}).  The profile serves autonomous callers and user-facing applications alike.  Companion profiles define bulk Access Requests ({{BULK}}), callback notifications ({{CALLBACK}}), actor delegation ({{ACTOR}}), and catalog-backed request input ({{CATALOG}}).

An approval workflow modeled as an obligation under {{OBLIGATIONS}} is outside this profile: it carries no Task Handle, no denial binding, and no re-evaluation.  Where an approver's decision must be recorded and evaluated again, it is an Access Request.  Workflow engines, approval policy languages, ticketing systems, entitlement catalogs, user interfaces, and approver-facing inbox or enumeration APIs are also out of scope; the PDP or Access Request Service supplies them, including how human or automated evaluators discover and act on pending requests.

The presence of `context.access_request` does not weaken the AuthZEN Authorization API decision.  A PEP MUST NOT grant access based on a requestable denial.  Access is permitted only after an approved completion result is enforced according to this profile.

## Protocol Overview {#protocol-overview}

~~~ ascii-art
+---------+                         +---------+                    +----------------+
|   PEP   |                         |   PDP   |                    | Access Request |
|         |                         |         |                    |    Service     |
+----+----+                         +----+----+                    +-------+--------+
     |                                   |                                 |
     | 1. Access Evaluation              |                                 |
     |---------------------------------->|                                 |
     |                                   |                                 |
     | 2. decision=false                 |                                 |
     |    context.access_request         |                                 |
     |<----------------------------------|                                 |
     |                                   |                                 |
     | 3. Submit Access Request          |                                 |
     |------------------------------------------------------------------->|
     |                                   |                                 |
     | 4. task handle                    |                                 |
     |<-------------------------------------------------------------------|
     |                                   |                                 |
     | 5. Poll task or receive callback  |                                 |
     |------------------------------------------------------------------->|
     |<-------------------------------------------------------------------|
     |                                   |                                 |
     | 6. Re-evaluate                    |                                 |
     |---------------------------------->|                                 |
     |<----------------------------------|                                 |
~~~

Steps 1 and 6 use the AuthZEN Access Evaluation API.  Step 6 is a new evaluation, not a resumption of the denied operation.  The PEP MUST NOT permit the requested operation based only on the presence of `context.access_request`.

In step 5 the PEP can poll the task, receive a callback ({{CALLBACK}}), or otherwise use the Task Handle to determine completion.

The flow is the same for a caller with no human present.  An autonomous agent that receives a requestable denial for a newly discovered tool submits the Access Request, persists the Task Handle, continues independent work, and re-evaluates the tool invocation when approval completes.

## Protocol Invariants {#protocol-invariants}

The rules of this profile rest on seven invariants, each stated normatively in the section that defines it:

1. A requestable denial is still a denial.
2. An Access Request does not itself grant access.
3. An approval does not itself grant access.
4. The PDP makes a new authorization decision at enforcement time.
5. An Access Request is bound to the denied evaluation it remediates.
6. An approval is bound to the Access Request it completed.
7. The PEP carries binding material between the roles but does not establish or vouch for the authority it represents.

# Requirements Notation and Conventions

{::boilerplate bcp14-tagged}

The terms Policy Decision Point (PDP), Policy Enforcement Point (PEP), Subject, Resource, Action, Context, and Decision are used as defined by {{AuthZEN}}.

# Terminology

Access Request:
: A request submitted after a denied AuthZEN Authorization API decision asking that access be approved, granted, or otherwise remediated.

Access Request Service:
: A role that receives Access Request submissions and manages the resulting approval task.  This role MAY be played by the PDP itself (logically part of the PDP), by a service trusted by the PDP (such as a governance platform), or by an independent service operating with delegated authority from the PDP.

Independent Access Request Service:
: For denial binding, an Access Request Service without trusted access to denied-evaluation state shared with or delegated by the PDP.  Independence describes state access, not organizational ownership or absence of trust between the roles.

Requestable Denial:
: An AuthZEN Authorization API Decision with `decision` set to `false` and a Decision Context indicating that the denied access can be requested through an Access Request Endpoint.

Task Handle:
: An opaque identifier and associated status endpoint representing the lifecycle of an Access Request.

Autonomous PEP:
: A PEP that acts without a human present to confirm what it fetches or submits.

Approval Result:
: The completed result of an Access Request task.  An Approval Result does not itself permit access; the PEP uses it to obtain an AuthZEN Authorization API allow decision through a new Access Evaluation, or enforces it according to a profile-defined completion mode where one applies.

Authorization-Relevant Context:
: The subset of AuthZEN Authorization API `context` members that the PDP treats as authorization input and includes in denial binding and approval scope.

    The rules that fix this set for a given evaluation are in {{structural-comparison}}.

# Roles and Binding {#roles-trust-and-keys}

Three roles take part in this profile:

* The PEP enforces decisions and carries the flow from denial to re-evaluation.
* The PDP decides and remains authoritative at enforcement time.
* The Access Request Service runs the approval workflow.

The protocol, authorization, and binding requirements apply regardless of which entity plays the Access Request Service role.

## Binding Model {#binding-model}

Denial and approval binding material passes through the PEP for verification by the receiving role:

| Exchange | Signed proof | Trusted-state lookup |
|---|---|---|
| Denial: PDP to Access Request Service | Self-contained `binding_token`, signed by the PDP | `evaluation_id`, resolved by the Access Request Service |
| Approval: Access Request Service to PDP | `approval.state`, signed by the service or the PDP acting through it | `approval.id`, resolved by the PDP |

These are verification patterns, not mutually exclusive members.  With a `binding_token`, an accompanying `evaluation_id` serves only correlation and audit.  `approval.id` remains present alongside signed `approval.state`.  The `state` member also permits other verifier state, not only signed proof ({{approval-result}}).

The PEP carries these values through the exchange without interpreting their protected contents ({{requestable-denial-context}}, {{approval-result}}).

## PDP Metadata {#discovery}

PDP metadata carries the Access Request Endpoint as `access_request_endpoint` and the capability URN `urn:openid:authzen:capability:access-request`; the publication rules are in {{pdp-metadata-rules}}.

Non-normative metadata example:

~~~ json
{
  "policy_decision_point": "https://pdp.example.com",
  "access_evaluation_endpoint": "https://pdp.example.com/access/v1/evaluation",
  "access_evaluations_endpoint": "https://pdp.example.com/access/v1/evaluations",
  "access_request_endpoint": "https://pdp.example.com/access/v1/requests",
  "capabilities": [
    "urn:openid:authzen:capability:access-request"
  ]
}
~~~

# Requestable Denial

## Requestable Denial Context {#requestable-denial-context}

When an AuthZEN Access Evaluation response denies access and the denial is eligible for an access request, the PDP MAY include an `access_request` object in the Decision Context.

The presence of `context.access_request` is the signal that the denial is requestable.

The `access_request` object has the following members:

`expires_at`:
: REQUIRED.  String containing an {{RFC3339}} timestamp.  Indicates when the requestable denial hint expires.  The PEP echoes this value as `denial.expires_at` when submitting the Access Request ({{pep-construct}}).

`endpoint`:
: OPTIONAL.  HTTPS URI.  The endpoint to which the PEP submits the access request.

`template`:
: OPTIONAL.  String.  An opaque template identifier that can guide the Access Request Service.

`display`:
: OPTIONAL.  Object.  Localizable user-interface hints such as title, description, or recommended call-to-action text.

`binding_token`:
: OPTIONAL in same-service or shared-state deployments ({{shared-state-deployments}}), and REQUIRED when the Access Request Service is independent of the PDP.  String.  Opaque context to be returned to the Access Request Service when submitting the access request.

  Integrity protection and encryption are defined in {{denial-binding}}; the PEP's handling is in {{pep-construct}}.

Two further members of this object, `form_url` and `request_schema_url`, are defined in {{machine-readable-forms}}.

AuthZEN leaves Decision Context implementation-defined.  This profile uses `context.reason` for the machine-readable denial reason, which the PEP echoes as `denial.reason` in the Access Request.

Non-normative example:

~~~ json
{
  "decision": false,
  "context": {
    "evaluation_id": "eval_01HX4Y2P8BQ4Y3F0V0K9D6Z7M1",
    "evaluated_at": "2026-04-30T20:15:00Z",
    "reason": "approval_required",
    "access_request": {
      "endpoint": "https://pdp.example.com/access/v1/requests",
      "template": "manager_approval",
      "expires_at": "2026-04-30T20:25:00Z",
      "display": {
        "title": "Request access",
        "description": "Manager approval is required before this document can be opened."
      }
    }
  }
}
~~~

## Evaluation Identifier {#evaluation-identifier}

`evaluation_id` identifies an AuthZEN Authorization API evaluation for denial binding and audit correlation.

Re-evaluation uses the `approval` object, not `evaluation_id` ({{completion-semantics}}).

A PDP returns `evaluation_id` as a member of the AuthZEN Decision Context: `context.evaluation_id`, a string.  The PEP echoes the captured identifier as `denial.evaluation_id` when submitting an Access Request.

Profiles that bridge to specifications using a transaction-binding identifier (for example, a token-issuance profile whose underlying specification carries a separate transaction identifier claim) MAY use `evaluation_id` directly as that identifier when its uniqueness, stability, and binding-window properties match the consuming specification's requirements.

A PDP MAY return `evaluated_at` as a member of the AuthZEN Decision Context: `context.evaluated_at`, an {{RFC3339}} timestamp indicating when the Decision was produced.  The PEP echoes the captured timestamp as `denial.evaluated_at` when submitting an Access Request.

# Submitting the Access Request

The Access Request Endpoint accepts a submission and returns a Task Handle.  Its deployment-specific URL comes from `access_request_endpoint` in PDP metadata or `context.access_request.endpoint` in the denial.

## Access Request Submission {#access-request-submission}

The PEP submits an Access Request using the HTTP `POST` method as defined in {{RFC9110}}.

### Request Body {#submission-request-body}

{: #submission-additional-information}

For a single-item submission (`items` absent), the request body is a JSON object with the following members.  {{BULK}} defines the changes for bulk submissions.

`subject`:
: REQUIRED.  The AuthZEN Subject from the denied evaluation.

`resource`:
: REQUIRED.  The AuthZEN Resource from the denied evaluation.

`action`:
: REQUIRED.  The AuthZEN Action from the denied evaluation.

`denial`:
: REQUIRED.  Object binding the Access Request to the denied AuthZEN Decision.  It binds the submitted Subject, Resource, Action, and authorization-relevant Context.  Its members are defined in {{submission-denial-object}}.

`context`:
: OPTIONAL.  The AuthZEN Context from the denied evaluation, augmented with submission-time fields such as business justification.

  This is Context from the original Access Evaluation request, not the PDP's Decision Context.  Optional presence does not waive the preservation rule in {{pep-construct}}.

`requested_access`:
: OPTIONAL.  Object containing request-specific information such as requested duration, requested role, requested entitlement, or requested scope.  This object does not define policy semantics and is interpreted by the Access Request Service.  The following well-known optional members are defined; additional members MAY be included subject to {{extension-naming}}:

  * `requested_until`: String.  {{RFC3339}} timestamp requesting access through a specific absolute time.
  * `emergency`: Boolean.  When `true`, requests an expedited or emergency-access path subject to additional auditing.

`client`:
: OPTIONAL.  Object identifying the PEP or calling application submitting the Access Request, supplementing the authenticated caller identity.  The following members are defined; implementations MAY include additional members.

  * `id`: OPTIONAL.  String.  Stable identifier for the calling application or PEP deployment.
  * `name`: OPTIONAL.  String.  Human-readable name of the calling application.

  The `actor` and `source` members of this object are defined by {{ACTOR}}.

The body can also carry `callback` ({{CALLBACK}}).

### The `denial` Object {#submission-denial-object}

The `denial` object echoes selected members of the PDP's denied evaluation response; the PEP's echo rule is in {{pep-construct}}.

`expires_at`:
: REQUIRED.  {{RFC3339}} timestamp indicating when the requestable denial hint expires, echoed unchanged.

`evaluation_id`:
: REQUIRED when `denial.binding_token` is absent; otherwise RECOMMENDED.  A stable identifier for the denied evaluation, captured by the PEP and echoed unchanged ({{evaluation-identifier}}).

`binding_token`:
: REQUIRED when `denial.evaluation_id` is absent; otherwise OPTIONAL.  String.  Integrity-protected binding material echoed unchanged ({{requestable-denial-context}}).

`evaluated_at`:
: OPTIONAL.  {{RFC3339}} timestamp indicating when the denial was produced.

`reason`:
: OPTIONAL.  String.  Machine-readable reason code for the denial, echoed unchanged.

`template`:
: OPTIONAL.  String.  Echoed unchanged when the PDP provided one.  The Access Request Service uses this value to route the request to the appropriate workflow.

### Request and Response Example {#submission-example}

This standalone, non-normative exchange assumes the original Access Evaluation request contained `context: {"project": "customer-renewal"}` and the PDP recorded `project` as authorization-relevant.  The PEP preserves that input in the submission below.  The denial specifies neither a template nor schema-required input; the Access Request Service resolves `evaluation_id` against trusted state.

~~~ http
POST /access/v1/requests HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Content-Type: application/json
Idempotency-Key: 7b8d0f0d-65a1-4af1-9fd3-a684f08a5d13

{
  "subject": {"type": "user", "id": "alice@example.com"},
  "resource": {"type": "document", "id": "q4-plan"},
  "action": {"name": "can_read"},
  "context": {"project": "customer-renewal"},
  "denial": {
    "expires_at": "2026-04-30T20:25:00Z",
    "evaluation_id": "eval_01HX4Y2P8BQ4Y3F0V0K9D6Z7M1"
  }
}
~~~

~~~ http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "task": {
    "id": "arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "status": "pending",
    "status_endpoint": "https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4"
  }
}
~~~

## Access Request Response {#access-request-response}

A successful Access Request submission returns HTTP status code `201 Created` or `202 Accepted` and a JSON object containing a `task` member.  The `task.status_endpoint` member is authoritative for subsequent status retrieval.  A response MAY also include an HTTP `Location` header equal to `task.status_endpoint`.  The HTTP status code does not determine the task's state; the PEP reads `task.status`, which may already be terminal when the service completes the request synchronously ({{ars-task}}).

The response object has the following top-level members:

`task`:
: REQUIRED.  Task Handle returned for the submitted Access Request ({{task-handle-object}}).

`result`:
: OPTIONAL except where required by {{ars-task}}.  Completion result for the task.

A synchronous-completion example is provided in {{synchronous-submission-example}}.

# Checking the Task

## Task Handle {#task-handle-object}

The `task` object has the following members:

`id`:
: REQUIRED.  Stable, opaque, and unguessable task identifier.

`status`:
: REQUIRED.  Current task status.  Values are defined in {{task-status}}.

`status_endpoint`:
: REQUIRED.  HTTPS URI used to retrieve task status.

`expires_at`:
: OPTIONAL.  {{RFC3339}} timestamp after which the task handle is no longer valid.

`display`:
: OPTIONAL.  Object containing user-interface hints for the pending request.

`progress`:
: OPTIONAL.  Object describing approval workflow progress for tasks with multi-step approvals.  The following members are defined:

  * `current_step`: OPTIONAL.  Integer.  One-based index of the step currently in progress.
  * `total_steps`: OPTIONAL.  Integer.  Total number of approval steps configured for the task.
  * `step_name`: OPTIONAL.  String.  Short identifier of the current step (for example, `manager_approval` or `resource_owner_review`).
  * `awaiting`: OPTIONAL.  Array.  Identifiers of approvers whose action is currently expected.

`links`:
: OPTIONAL.  Object containing related URLs.  Each member name is a link relation type and the value is an HTTPS URI.  The following relation types are defined; implementations MAY define additional relation types.

  * `ticket`: URL where the requester (Subject) can view the request and its status.
  * `review`: URL where an approver or administrator can review or act on the request.
  * `cancel`: URL where the PEP can cancel the request, when PEP-initiated cancellation is supported.

The `items` member of this object, present for bulk submissions, is defined in {{BULK}}.

## Task Status and Transitions {#task-status}

The following task status values are defined:

`pending`:
: The request has been accepted and is awaiting processing or approval.

`approved`:
: The request was approved.  Approval does not by itself grant access; the PEP obtains access only through the completion mode in {{completion-semantics}}.

`denied`:
: The request was denied by the approval workflow.

`expired`:
: The request expired before completion.

`cancelled`:
: The request was cancelled by the requester, approver, administrator, or system.

`failed`:
: The request could not be completed due to an error.

The `partial` status for bulk tasks is defined by {{BULK}}.

Implementations MAY define additional status values.

### State Transitions {#state-transitions}

In the base state machine, a task is either returned in a terminal state when the Access Request Service completes it synchronously, or returned in the `pending` state and subsequently transitions exactly once to one of the terminal states defined in {{task-status}}.  Terminal states do not transition further.

The following transitions are defined from `pending`:

| To | Trigger |
|---|---|
| `approved` | Approval workflow completes successfully. |
| `denied` | Approval workflow rejects the request. |
| `expired` | `task.expires_at` is reached before the request reaches a terminal state. |
| `cancelled` | The request is cancelled by the requester, approver, administrator, or PEP using the cancellation endpoint ({{cancellation}}). |
| `failed` | A system error prevents the request from completing. |

The `partial` status, which applies only to bulk tasks, is described in {{BULK}}.

## Task Status Endpoint {#task-status-endpoint}

The PEP retrieves task status with an HTTP `GET` ({{RFC9110}}) to `status_endpoint`.

Non-normative example:

~~~ http
GET /access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4 HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Accept: application/json
~~~

A successful response returns a JSON object containing a `task` member.  Completed task responses include a `result` member according to the rules in {{ars-task}}.

The PEP's polling rules are in {{pep-poll}}.

Completion notification is defined by {{CALLBACK}}.

## Pending Task Response

A response with `task.status: pending` echoes the submission's Task Handle ({{task-handle-object}}).  Polls use the same shape, updating status, progress, and links as the task advances.  {{completed-task-response}} defines the response at terminal status.

Non-normative example:

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "task": {
    "id": "arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "status": "pending",
    "status_endpoint": "https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "expires_at": "2026-04-30T23:00:00Z"
  }
}
~~~

## Completed Task Response {#completed-task-response}

The Access Request Service's rules for the result member are in {{ars-task}}.

Non-normative example:

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "task": {
    "id": "arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "status": "approved",
    "status_endpoint": "https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4"
  },
  "result": {
    "mode": "reevaluate",
    "approval": {
      "id": "apr_01HX4Y8E2NE3Y2X7P0K4JE6WVH",
      "approved_at": "2026-04-30T20:42:00Z",
      "approved_until": "2026-05-01T00:42:00Z"
    }
  }
}
~~~

# Approval and Re-evaluation {#completion-semantics}

The only base completion mode, `result.mode: "reevaluate"`, directs the PEP to perform a new AuthZEN Access Evaluation after approval.  The PDP evaluates current policy and state, rather than resuming the original denial, and remains authoritative at enforcement time.

The PEP supplies the approval at `context.approval`; the PDP need not retain the original decision.

Profiles of this specification MAY define additional completion modes through the `result.mode` extension point ({{extensibility}}).

Implementations that bind approval to a specific issuance flow, such as OAuth token issuance where the issued token is itself the decision representation, MUST do so through a profile that defines a completion mode appropriate to that flow; the base profile does not define such a mode.

Approval platforms can use this mode by changing backing state that the next evaluation reads ({{impl-considerations}}).

## Approval Result {#approval-result}

`approval`:
: REQUIRED when `result.mode` is `reevaluate`.  Object.  Identifies the approval that completed the Access Request task and has the following members:

* `id`: REQUIRED.  String.  Stable, opaque, and unguessable identifier of the approval.
* `approved_until`: REQUIRED.  {{RFC3339}} timestamp indicating the latest time through which the approval remains valid.
* `approved_at`: OPTIONAL.  {{RFC3339}} timestamp indicating when the approval completed.

The `approval` object MAY additionally include a `state` member.  `state` is an opaque JSON value populated by the Access Request Service or PDP, carrying proof or verifier state the PDP needs at re-evaluation time (for example, a signed reference, an extended lookup token, or deployment-specific state).

The PEP's rules for carrying the approval are in {{approval-reevaluation-request}}.

## Re-evaluation Denials {#reevaluation-denials}

When the PDP denies a re-evaluation that presented an `approval` reference, it conveys what the PEP should do next through the following Decision Context members ({{pdp-reevaluation-denial}}); the PEP's handling is in {{pep-reevaluation-handling}}:

* `next_action`: RECOMMENDED.  String.  The action the PEP should take.  One of:
    * `request`: submit a new Access Request.
    * `retry`: re-evaluate the same request after a delay; the denial is expected to be transient.  This is the transient-denial outcome of the Introduction: nothing is remediated and nothing changes in the request.
    * `none`: do not retry or re-request; the denial is terminal for this approval.
* `retry_after`: RECOMMENDED when `next_action` is `retry`.  Integer.  Number of seconds the PEP waits before re-evaluating the same request.  Its value has the delta-seconds semantics of HTTP `Retry-After` (Section 10.2.3 of {{RFC9110}}); it appears in Decision Context because an Access Evaluation denial is a successful protocol response.
* `reason`: OPTIONAL.  String.  A machine-readable reason code for UX and audit.  This profile defines the following well-known re-evaluation denial reason codes with their default `next_action`:
    * `approval_expired` (`request`): the approval is no longer valid because `approved_until` has passed or it was revoked, cancelled, or superseded.
    * `out_of_scope` (`request`): the approval is valid but the current evaluation falls outside its approval scope.
    * `grant_pending` (`retry`): the approval is valid and in scope, but the backing entitlement, role, or grant is not yet present (for example, provisioning has not completed).
    * `policy_denied` (`none`): the approval is valid and in scope, but current policy, subject status, or risk state denies the request; re-requesting will not help.
    * `approval_unverifiable` (`none`): the presented `approval.id` or `approval.state` could not be resolved or verified, or its binding did not match.

  Implementations MAY register additional reason codes (for example, a more specific `approval_revoked`).  These codes are registered in the AuthZEN Access Request Re-evaluation Denial Reason registry ({{iana-reeval-reasons}}).

## Re-evaluation Example {#lookup-reevaluation-example}

This non-normative exchange uses `approval.id` to resolve the approval from trusted server-side state ({{approval-reference-lookup}}).

Non-normative re-evaluation request:

~~~ json
{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "resource": {
    "type": "document",
    "id": "q4-plan"
  },
  "action": {
    "name": "can_read"
  },
  "context": {
    "approval": {
      "id": "apr_01HX4Y8E2NE3Y2X7P0K4JE6WVH",
      "approved_at": "2026-04-30T20:42:00Z",
      "approved_until": "2026-05-01T00:42:00Z"
    },
    "time": "2026-04-30T20:43:00Z"
  }
}
~~~

Non-normative re-evaluation response:

~~~ json
{
  "decision": true,
  "context": {
    "approval": {
      "id": "apr_01HX4Y8E2NE3Y2X7P0K4JE6WVH",
      "approved_until": "2026-05-01T00:42:00Z"
    }
  }
}
~~~

# Error Responses {#error-responses}

HTTP error responses from the Access Request Endpoint and Task Status Endpoint MUST use `application/problem+json` as defined by {{RFC9457}} when returning one of the problem types defined by this specification.  The problem type URI MUST appear in the `type` member.

The following problem types are defined:

`urn:openid:authzen:access-request:error:not_requestable`:
: HTTP `400 Bad Request`.  The submitted denial is not requestable.

`urn:openid:authzen:access-request:error:expired_denial`:
: HTTP `410 Gone`.  The requestable denial has expired: the freshness deadline (the earlier of `denial.expires_at` and any `binding_token` `exp`) has passed.

`urn:openid:authzen:access-request:error:invalid_denial_binding`:
: HTTP `400 Bad Request`.  The submitted Access Request cannot be bound to the denied AuthZEN Decision.

`urn:openid:authzen:access-request:error:duplicate_request`:
: HTTP `409 Conflict`.  The `Idempotency-Key` was reused by the same requester with a submission body that is not equivalent to the original request (see {{submission-idempotency}}).

`urn:openid:authzen:access-request:error:unknown_task`:
: HTTP `404 Not Found`.  The task handle is unknown or unavailable to the caller.

`urn:openid:authzen:access-request:error:task_expired`:
: HTTP `410 Gone`.  The task handle has expired.

`urn:openid:authzen:access-request:error:invalid_task_state`:
: HTTP `409 Conflict`.  The requested operation cannot be performed in the current task state (for example, cancellation of a task that has already reached a terminal status).

Non-normative example:

~~~ http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "urn:openid:authzen:access-request:error:not_requestable",
  "title": "Access is not requestable",
  "status": 400,
  "detail": "The denied decision did not contain a context.access_request object."
}
~~~

# Binding Integrity {#deployment-alternatives}

Denial binding connects an Access Request to the denied evaluation; approval binding connects a re-evaluation to the approved request.  Both use the comparison rules in this section.

## Structural Comparison {#structural-comparison}

Throughout this profile, structural comparison requires the same JSON type and applies these rules:

* Numbers are equal under their {{RFC8785}} canonical form.
* Strings are equal codepoint-for-codepoint.
* Arrays are equal element-by-element in order.
* Objects have the same set of member names with recursively equal values.
* An absent member is distinct from a member whose value is `null`.

These rules apply wherever the profile compares Subject, Resource, Action, or authorization-relevant Context, including inline denial binding and approval-scope matching ({{approval-scope}}).

For inline denial binding and exact-match approval-scope matching, Subject, Resource, and Action are compared as full AuthZEN Authorization API objects, every `properties` member present in the bound values included, except that `subject.properties.act` is excluded because the PEP MAY normalize the actor to `client.actor` (see {{pep-processing-rules}} and {{ACTOR}}); the exclusion applies whether or not the actor profile is implemented, so two core implementations compare identically.  Context comparison includes each member of the authorization-relevant Context and excludes profile machinery members.

Denial binding, approval-scope matching, and idempotent-submission comparison all compare the authorization-relevant Context, so when any member is authorization-relevant the PDP MUST make it explicit and integrity-protected, and the Access Request Service MUST use exactly that set:

- with a `binding_token`, the token carries the set as a `binding_context_members` claim ({{binding-token-integrity}});
- with `evaluation_id`, the set is recorded for that evaluation in shared state and resolved server-side.

Absent an integrity-protected or server-resolved set, the authorization-relevant Context is empty and only Subject, Resource, and Action bind.

Profile machinery members (`access_request`, `evaluation_id`, `evaluated_at`, `reason`, and `approval`) are not authorization-relevant, and a PDP SHOULD also exclude volatile members (timestamps, nonces, or request identifiers such as `context.time`) so the authorization-relevant Context set compares equal across the denial and a later submission or re-evaluation.

## Decision and Binding Integrity {#decision-and-binding-integrity}

Implementations MUST bind Access Requests and approval results to the Subject, Resource, Action, Context, task, and requester.  PDPs MUST validate this binding during re-evaluation.

Possession of a valid-looking approval identifier is insufficient to authorize access; the applicability check is stated in {{approval-verification}}.

When approval state is carried by reference, the PDP or Access Request Service MUST protect the backing approval record against unauthorized lookup and mutation.  When approval binding material is carried by value, for example in `approval.state`, the PDP MUST verify integrity, issuer, audience or intended recipient, expiry, and binding before accepting it.

Approval results MUST expire.  Re-evaluation Mode SHOULD bind approval references to the original request tuple.  Profiles of this specification that define token-based completion modes are responsible for defining the token's audience restriction, lifetime, and binding to the approved request.

## Time and Clock Skew {#time-and-clock-skew}

The {{RFC3339}} timestamps in `context.evaluated_at`, `context.access_request.expires_at`, `denial.expires_at`, `task.expires_at`, `approval.approved_at`, and `approval.approved_until` may be checked on a host other than their producer.  Clock skew can therefore cause incorrect freshness or expiry decisions.

Implementations SHOULD allow a small skew tolerance when comparing a remote-host timestamp against the local clock.  A tolerance of 30 seconds is typical; tolerances above 60 seconds are NOT RECOMMENDED.  A PEP comparing `approval.approved_until` to local time MAY treat the approval as valid until `approved_until` plus the tolerance.  An Access Request Service comparing `denial.expires_at` (the PEP-echoed requestable-denial hint expiry) to its local clock MAY accept submissions arriving up to the tolerance after that timestamp, after verifying the echoed value against the denial-binding material.

Hosts that produce timestamps SHOULD synchronize their clocks against a reliable time source (for example, NTP or PTP) to keep skew well below the tolerance window.  Deployments with stricter requirements (for example, regulatory or audit constraints) MAY define a tighter tolerance and document it as part of their deployment profile.

# PEP Processing {#pep-processing-rules}

This section holds every rule for a PEP implementing this profile, in the order of the flow in {{protocol-overview}}.  The messages it sends and receives are defined in {{requestable-denial-context}}, {{access-request-submission}}, {{task-handle-object}}, and {{completion-semantics}}.

## Recognize the Denial {#pep-recognize}

* MUST treat `decision: false` as a denial, even when the Decision Context contains an `access_request` object.
* MUST treat the absence of `context.access_request` as a non-requestable denial regardless of any other context members.
* MUST submit an Access Request only for an AuthZEN Decision with `decision` equal to `false` and a `context.access_request` object present in the Decision Context.

## Check the URLs {#trusting-urls}

The following checks apply to `endpoint`, `form_url`, `request_schema_url`, and any URL a profile adds to the requestable denial or to a document fetched from it.

An autonomous PEP MUST verify that these URLs resolve to hosts trusted under the deployment before fetching or acting on them, by requiring the same origin as the Access Request Endpoint advertised in PDP metadata or by maintaining an explicit allowlist of trusted Access Request Service hosts.
A PEP that renders them for a human user SHOULD apply the same check.

A PEP that performs the origin check obtains the Access Request Endpoint from PDP metadata even when the denial supplies `endpoint`.  When a URL fails the check, the PEP does not fetch it or submit to it; what it then reports to a requester is a deployment matter.

PEPs MUST NOT submit credentials to a host that is not trusted to receive them.

## Construct the Submission {#pep-construct}

* MUST use the `endpoint` from the denial context when present; if `endpoint` is omitted, MUST use the `access_request_endpoint` from PDP metadata ({{discovery}}).
* Echoes every `denial` member the PDP supplied, unchanged: `expires_at`, `evaluation_id`, `binding_token`, `evaluated_at`, `reason`, and `template` ({{submission-denial-object}}).
* MUST include `denial.evaluation_id` when `denial.binding_token` is absent, and SHOULD include it when the PDP returned an evaluation identifier.  `evaluation_id` provides the strongest audit binding between the original denial and the submitted Access Request and SHOULD be preferred over `evaluated_at` alone.
* MUST NOT decode, modify, or interpret `binding_token`; it returns the original PDP-issued value byte-for-byte as `denial.binding_token`.
* MUST NOT interpret the `template` value except for display or request submission; the value is not a policy language.
* MAY ignore `display`.

The PEP MUST preserve the principal identity of the Subject, and MUST preserve the Resource, Action, and relevant Context of the denied evaluation when submitting the Access Request.  When the original evaluation conveyed an actor identity in the Subject (for example, via `subject.properties.act`), the PEP MAY preserve the actor in the submission's `subject` or normalize it to `client.actor` ({{ACTOR}}); the actor identity itself MUST NOT be dropped.

Submission-time augmentations MUST NOT change or remove authorization-relevant context from the denied evaluation.  When the Access Request Service needs to distinguish original evaluation context from submission-time input, deployments SHOULD place the latter in well-defined extension members rather than overwriting original context members.

When the requestable denial includes `request_schema_url`, the PEP MUST construct the augmentations to the submission's `context` and `requested_access` objects according to {{machine-readable-forms}}.  If the schema requires information the PEP cannot obtain or is not authorized to supply, the PEP MUST NOT fabricate values or submit an incomplete request; it MUST either surface the request for additional input, hand it to another authorized component, or treat the denial as not requestable by that PEP.

A PEP SHOULD include an `Idempotency-Key` header, following the conventions described in {{I-D.ietf-httpapi-idempotency-key-header}}.

## Handle the Response {#pep-submit}

* MUST treat a Task Handle as opaque.
* MUST NOT infer approval from a task identifier, link, or display text.
* MUST NOT treat `result` as approval unless the task is approved and the result is enforceable under {{completion-semantics}}.
* MUST handle synchronous completion, a submission response whose `task.status` is already terminal, without polling; the Task Status Endpoint remains usable for later retrieval but is not on the critical path.

An intermediate enforcer (such as an OAuth Authorization Server or other gateway acting as PEP) MAY proxy or re-present `status_endpoint` to its own callers; the value advertised to such callers MAY differ from the value the PEP itself uses, provided the proxied endpoint observes the authorization rules defined for the original endpoint.

## Poll the Task {#pep-poll}

* When a task is `pending`, a PEP MAY poll the Task Status Endpoint to determine completion.
* PEPs SHOULD use exponential backoff: a starting interval of several seconds, growing to no more than one minute, with jitter applied to spread load across many concurrent pollers.
* If the Access Request Service returns the `Retry-After` HTTP header (Section 10.2.3 of {{RFC9110}}), the PEP MUST wait at least the indicated duration before issuing the next poll.
* The PEP MUST stop polling once `task.expires_at` is reached or the task reaches a terminal status ({{state-transitions}}).
* A PEP that receives an unknown status value MUST treat the task as not approved.
* SHOULD fail closed when task status cannot be determined.

## Handle Completion {#pep-complete}

* MUST enforce an approved result only according to {{completion-semantics}}.
* For any terminal status other than `approved`, MUST NOT treat a `result` object as approval.
* A PEP that receives an unknown `result.mode` value MUST treat the task as not approved and MUST NOT permit access on the basis of that result.
* MUST re-evaluate access through the AuthZEN Access Evaluation API after approval, unless a profile-defined completion mode applies (for example, a profile binding to OAuth token issuance).

## Re-evaluate {#approval-reevaluation-request}

The PEP MUST include the `approval` object unchanged at `context.approval` inside the AuthZEN Authorization API re-evaluation request.  This includes its `id`, timestamps, and any `state`.

The PEP MUST preserve the JSON value exactly and MUST NOT modify or interpret the contents of `approval.state`.

The PEP MUST NOT use the approval for re-evaluation after `approved_until`.

## Handle a Re-evaluation Denial {#pep-reevaluation-handling}

A PEP handles `next_action` as follows:

* A PEP MUST drive its behavior from `next_action` when the value is recognized.
* A PEP that receives `next_action: "request"` without `context.access_request` MUST NOT submit a new Access Request and treats the denial as `none`.
* A PEP that receives no `next_action`, or an unrecognized value, falls back first to the default next action for a recognized `reason`, then to the requestable-denial signal.
* When the fallback action is `request`, the PEP treats the denial as `request` only when `context.access_request` is present; otherwise it treats the denial as `none`.

A PEP that receives `next_action: "retry"` without `retry_after` SHOULD apply bounded exponential backoff with jitter, starting at several seconds and growing to no more than one minute between attempts, and MUST stop retrying once the approval expires.

A PEP uses a recognized `reason`'s registered default only when `next_action` is absent or unrecognized.  A PEP treats an unrecognized `reason` as informational and relies on `next_action` or the fallback rule above.

This non-normative table summarizes the fallback order defined above.  Use the first matching row.

| Decision Context | Action source |
|---|---|
| Recognized `next_action` | Use `next_action`, even if a reason code suggests a different default. |
| Absent or unrecognized `next_action`, with a recognized `reason` | Use the reason's default next action. |
| Neither a recognized `next_action` nor a recognized `reason` | Use the requestable-denial signal: `request` when `context.access_request` is present, otherwise `none`. |

## Enforce and Reuse the Approval {#approval-lifetime}

The `approved_until` timestamp in the Approval Result envelope is a PEP-side maximum reuse and enforcement bound; it does not prevent the PDP from denying earlier because of revocation, cancellation, policy change, risk change, or other current state.  The two roles read the same value differently: the PEP applies the envelope value conservatively, and it can only shorten the PEP's use of the result, while the PDP's authoritative expiry comes from trusted state or from integrity-protected approval material ({{approval-verification}}).

When the re-evaluation response indicates an approval expiry (typically as `context.approval.approved_until`), the PEP MUST NOT enforce access past that timestamp.  PEPs that issue downstream credentials on the basis of the approved evaluation (for example, an OAuth Authorization Server issuing access tokens) MUST bound the lifetime of those credentials by the earlier of the approval expiry in the Approval Result and any approval expiry returned by the PDP during re-evaluation.  Expiry inside an opaque artifact is checked by its verifier, not extracted by the PEP ({{verifying-denial-binding}}, {{approval-verification}}).

### Approval Reuse {#approval-reuse}

The PDP determines whether an approval applies to each evaluation ({{approval-scope}}).

A PEP MUST NOT treat an Approval Result as authorizing any future Access Evaluation solely on the basis that the Access Request was approved.

A PEP MAY include the Approval Result in a subsequent Access Evaluation (by placing the `approval` object at `context.approval`), but the PDP remains responsible for determining whether the Approval Result applies under current policy.

A PEP MAY cache or retain an Approval Result, but MUST NOT independently infer that a future request is covered by that approval unless directed by the PDP or by a profile-defined mechanism.

## Task Handle Portability {#task-handle-portability}

The Task Handle survives PEP restart, replacement, or handoff to another runtime instance.  A caller MAY interact with the Task Handle, such as polling status or initiating cancellation, even if that caller is not the original submitting PEP, provided the caller is authorized for the original Subject, Resource, Action, task, and requested operation.

Refresh of a calling identity's underlying token does not invalidate Task Handle access as long as the caller remains authorized for the bound task and operation.  A different PEP instance or agent process that can authenticate as authorized for the bound task and operation MAY interact with the Task Handle.

For example, an agent can persist the Task Handle at step 4 of {{protocol-overview}} and resume at step 5 or 6 from a fresh process.  A conversation thread, session store, or workflow orchestrator can carry the handle without preserving the original session.

This profile defines neither pause/resume orchestration nor an API to enumerate a Subject's tasks.  Task Handles are exchanged through the channels that delivered the original Access Request response.

## Surfaces and Forwarding {#pep-facing-surfaces}

The following members are for PEP interactions with the Access Request Service or PDP, not for direct use by end clients such as browsers, mobile applications, or agent runtime UIs:

* `task.status_endpoint`: the polling URL for the Access Request Service.
* `task.links.cancel`: the cancellation endpoint.
* `approval.id` and `approval.state`: round-trip material the PEP places at `context.approval` during re-evaluation.

PEPs SHOULD NOT forward these members to end clients or other non-PEP callers.  Exposing them enables direct service calls that bypass the PEP or attempts to inject approval references into other evaluations.  Possession is not authorization: Task Handle operations require caller authorization ({{authorization-and-authentication}}), and the PDP checks approval applicability ({{approval-verification}}).

Human-facing members are intended only for callers authorized for the corresponding workflow:

* `task.links.ticket`: URL where the requester (Subject) can view the request and its status.
* `task.links.review`: URL where an approver or administrator can review or act on the request.
* `task.display`: localizable user-interface hints.

When a PEP renders requester-facing status to an end client, it SHOULD do so by rendering `task.display` and `task.links.ticket` rather than by exposing the machine surfaces.  A PEP MUST NOT expose `task.links.review` to a requester or other end client unless that caller has been authenticated and authorized as an approver or administrator for the task.

Cancellation ({{cancellation}}), actor delegation ({{ACTOR}}), and machine-readable forms ({{machine-readable-forms}}) define further PEP rules where those mechanisms are used.

# PDP Processing {#pdp-processing}

This section holds every rule for a PDP implementing this profile.

## Publish Metadata {#pdp-metadata-rules}

A PDP supporting this profile MUST publish an `access_request_endpoint` in PDP metadata.  The endpoint value MUST be an HTTPS URI.

A PDP supporting this profile SHOULD include the following capability URN in the `capabilities` array:

`urn:openid:authzen:capability:access-request`

The `access_request_endpoint` MAY be hosted by the PDP itself, by a service trusted by the PDP, or by an independent service operating with delegated authority from the PDP.  When hosted by a different service, the PDP metadata MUST identify the endpoint actually used by the PEP to submit access requests.

## Issue a Requestable Denial {#denial-issuance}

A PDP implementing this profile:

* MAY include `context.access_request` in a denied AuthZEN Decision when the denied access is eligible for approval.
* MUST NOT include `context.access_request` unless the denied access is eligible for submission and an Access Request Endpoint is available to process the request.
* SHOULD include a stable machine-readable reason code when returning a requestable denial.
* MUST include an expiration time for the requestable denial hint as `context.access_request.expires_at`.
* MUST provide verifiable denial-binding material when returning `context.access_request`: an integrity-protected `context.access_request.binding_token`, or a stable `context.evaluation_id` the Access Request Service can resolve against state shared with, or delegated by, the PDP.  When the Access Request Service is independent of the PDP, the PDP MUST provide the `binding_token` form ({{requestable-denial-context}}).
* SHOULD return a stable evaluation identifier as `context.evaluation_id` ({{evaluation-identifier}}) that the PEP can supply as `denial.evaluation_id` when submitting an Access Request.

The PDP MUST provide enough denial-binding material for the Access Request Service to verify that a submitted Access Request corresponds to the denied evaluation and is still fresh.  A requestable denial MUST include `expires_at` and at least one of two denial-binding forms: `binding_token` by value, defined in {{denial-binding}}, or `evaluation_id` by reference, defined in {{shared-state-deployments}}.

In the by-reference form, the durable denial-binding record lives in the Access Request Service role, not the PDP; a self-contained `binding_token` needs no record before submission.  This is the denial-side mirror of the re-evaluation rule that requires `approval.state` when the PDP cannot resolve `approval.id` from shared or delegated state ({{approval-state}}).  When neither binding form is available, or when the Access Request Service cannot determine that the binding is unexpired, the PDP MUST NOT include `context.access_request` in the Decision Context.

`evaluation_id` MUST be stable for a given evaluation: subsequent retrievals or echoes of the same evaluation MUST return the same identifier.  PDPs SHOULD generate identifiers that are unique within the PDP's namespace (for example, ULIDs or UUIDs).

An identifier MAY be reused across distinct evaluations only after the original evaluation's binding window has expired.  The binding window is the period during which the Access Request Service can resolve or validate the identifier for Access Request submission; it MUST NOT extend beyond `context.access_request.expires_at`.

A PDP that returns `context.access_request` without an integrity-protected `binding_token` MUST include `evaluation_id` so the Access Request Service has verifiable denial-binding material; this is the by-reference form and applies only to shared-state deployments ({{requestable-denial-context}}).

### When Binding Artifacts Are Used {#pdp-artifact-conformance}

For a PDP using the mechanisms in {{binding-artifacts}}:

* When including `context.access_request.binding_token`, MUST integrity-protect it using a mechanism the Access Request Service can verify and SHOULD issue it as a JWS in compact serialization.

## Verify the Approval at Re-evaluation {#pdp-verify}

The PDP MUST evaluate the new request using current policy and the approval reference.  The PDP MAY still deny access if policy, subject, resource, action, context, approval lifetime, or risk state no longer permits access.  The PDP MUST ensure that approval does not override policy conditions that remain mandatory at enforcement time, such as subject status, resource sensitivity, action constraints, environmental risk, and approval expiry.

### Approval Verification {#approval-verification}

The `approval` object, not the original `evaluation_id`, links re-evaluation to the approved Access Request and original denial.

The PDP MUST be able to resolve or verify `approval.id`, `approval.state`, or both, and bind the approval to the Access Request task, the original denied evaluation when recorded, the approved Subject, Resource, Action, relevant Context, approval scope, and approval expiry.

When both `approval.id` and an integrity-protected `approval.state` are present and `approval.state` carries its own approval identifier, the PDP MUST verify that the two identifiers match, and MUST reject the re-evaluation on mismatch.

At re-evaluation, the PDP:

* MUST NOT authorize a re-evaluation solely because the request contains a known `approval.id`.
* MUST resolve or verify the approval reference presented in `context.approval` and confirm that it is applicable to the authenticated caller or requester, current Subject, Resource, Action, relevant Context, approval scope, and approval expiry before using it as an input to an allow decision.
* MUST ignore or reject a swapped, replayed, expired, or otherwise non-applicable approval reference, and MUST evaluate the request as not approved by that reference.

Values carried outside `approval.state`, including `approval.id`, `approved_at`, and `approved_until`, MUST NOT be treated as authoritative by the PDP unless resolved from trusted state or proven by integrity-protected approval binding material.

Deployments MAY use lookup of `approval.id` and verification of `approval.state` together.  In all cases, the PDP MUST verify the approval against trusted state or integrity-protected binding material; neither `approval.id` nor `approval.state` is a bearer grant by itself.

The approval record or verifiable binding material MUST contain, or allow the PDP to determine, at least the approval identifier, Access Request task identifier, original denied evaluation identifier when available, approved Subject, approved Resource and Action or approval scope, requester and client binding, approval status, `approved_at` when available, `approved_until`, and any revocation or cancellation state.

### Approval Reference by Lookup {#approval-reference-lookup}

The PDP resolves `approval.id` in trusted server-side state.  {{approval-state}} defines the bound-reference alternative using `approval.state`.

### Current Approval Status {#approval-current-status}

The PDP MUST check current approval status during re-evaluation, including whether the approval has been revoked, cancelled, superseded, or otherwise invalidated before `approved_until`.  Stateless PDP evaluation means retaining no prior decisions, not dispensing with this check.

### Approval Scope {#approval-scope}

Approval scope determines which Access Evaluations may use an approval, subject to current PDP policy.  Reusing an approval avoids a new Access Request for each operation.  This profile defines exact-match scope; broader matching, such as a resource-class or role grant, is deployment-specific or defined by downstream profiles ({{approval-scope-extensions}}).

The default approval scope is the original denied Subject, Resource, Action, and authorization-relevant Context bound to the Access Request.  An evaluation is within this scope when its Subject, Resource, Action, and authorization-relevant Context are equal, member by member, to the bound values, using the structural comparison, authorization-relevant Context set, and `subject.properties.act` exclusion defined in {{structural-comparison}}.  This baseline is engine-neutral, and two independently implemented PDP and Access Request Service pairs MUST interoperate on it.

The exact-match baseline is the default unless the Access Request Service or PDP records a broader or narrower approval scope ({{approval-scope-extensions}}).  This default scope is not serialized in the Approval Result unless a profile or deployment defines a representation for it.

The PDP MUST only consider an Approval Result applicable when the current evaluation request is within the approval scope recorded for that Approval Result.

#### Approval Scope Extensions {#approval-scope-extensions}

Broader approvals can cover a resource class, role, entitlement, or time-bounded tool class.  Their representation and matching are deployment-specific or defined by downstream profiles, not portable across policy engines.  This profile does not define context-constraint matching.

The Access Request Service's workflow policy determines approval breadth, subject to this profile's integrity, expiry, and audit requirements.

## Deny a Re-evaluation {#pdp-reevaluation-denial}

When the PDP denies a re-evaluation that presented an `approval` reference, it SHOULD tell the PEP what to do next using the Decision Context members defined in {{reevaluation-denials}}.

When `next_action` is `request`, the PDP MUST also include a fresh `context.access_request` ({{requestable-denial-context}}) so the PEP has a valid requestable-denial signal for the new submission.

# Access Request Service Processing {#ars-processing-rules}

This section holds every rule for an Access Request Service implementing this profile.

## Protect the Endpoints {#endpoint-protection}

The Access Request Endpoint and Task Status Endpoint are protected APIs.  Support for OAuth 2.0 {{RFC6749}} is RECOMMENDED.  When OAuth 2.0 bearer tokens are used, the endpoints MUST follow {{RFC6750}}.  The Cancellation endpoint ({{cancellation}}) is similarly protected; its authorization rules are defined in that section.

The Access Request Service MUST authenticate the PEP or caller before accepting a submission or returning task status.  The service MUST verify that the caller is authorized to submit or view the request for the supplied Subject, Resource, and Action.

When authenticating a submission, the Access Request Service MUST authenticate the PEP using the deployment's chosen mechanism (typically an OAuth 2.0 bearer token, mutual TLS certificate, or signed assertion).

## Process a Submission {#submission-processing}

An Access Request Service implementing this profile:

* MUST validate that the submission is based on a requestable denial, rejecting a submission that is not with `urn:openid:authzen:access-request:error:not_requestable`.
* MUST verify the denial-binding material for every requested item, applying the following rules:
    * When `denial.binding_token` is absent, the service MUST apply the `evaluation_id` verification path defined in {{shared-state-deployments}}.
    * The service MUST reject submissions received after the verified `denial.expires_at` with `urn:openid:authzen:access-request:error:expired_denial`, after applying any clock-skew tolerance it has configured (see {{time-and-clock-skew}}).
    * The service MUST reject submissions whose binding material cannot be verified, or whose claims do not bind to the submitted denial, with `urn:openid:authzen:access-request:error:invalid_denial_binding`.
* MUST bind the task to the submitted Subject, Resource, Action, Context, denial, requester, and client.
* MUST return an opaque Task Handle for accepted requests.
* SHOULD support idempotent request submission using the `Idempotency-Key` header ({{submission-idempotency}}).

The submitted `denial` object for each requested item MUST include either `denial.binding_token` or `denial.evaluation_id`.  The Access Request Service MUST reject a submission that lacks verifiable denial-binding material with `urn:openid:authzen:access-request:error:invalid_denial_binding`.

An Access Request whose denial binding does not cover the submitted Subject, Resource, Action, and authorization-relevant Context (for every item when `items` is present) MUST be rejected with `urn:openid:authzen:access-request:error:invalid_denial_binding`.

The Access Request Service MUST be able to resolve or validate `denial.evaluation_id` before relying on it as denial-binding material.

The Access Request Service MUST NOT rely on `client.actor` or `client.source` ({{ACTOR}}) as authorization input unless the values are independently verified by the service.

{{ACTOR}} defines actor-chain verification; {{verifying-denial-binding}} defines the denial-binding verification procedure.

The `task.id` value MUST contain sufficient entropy to prevent practical guessing and MUST NOT encode semantics that a PEP is expected to parse.

When the Access Request Service is able to resolve the request synchronously (for example, when policy auto-approves and provisioning completes within the request), the Access Request Service SHOULD return `201 Created` with `task.status` already set to a terminal value and a populated `result` member ({{completion-semantics}}).

### Denial Binding by Reference {#shared-state-deployments}

The Access Request Service resolves `evaluation_id` against state shared with, or delegated by, the PDP, within the binding window defined in {{denial-issuance}}.  This form applies only to same-service or shared-state deployments: a stateless PDP retains no decision state to fetch.

When `denial.binding_token` is absent, the Access Request Service MUST resolve or validate `denial.evaluation_id`, retrieve the Subject, Resource, Action, authorization-relevant Context, and `expires_at` recorded for that evaluation in shared state, verify the Subject, Resource, Action, and Context match the submission using the structural comparison defined in {{structural-comparison}} (rejecting a mismatch with `urn:openid:authzen:access-request:error:invalid_denial_binding`), and enforce freshness against the recorded `expires_at` rather than the PEP-echoed `denial.expires_at`.

### When Binding Artifacts Are Used {#ars-artifact-conformance}

The Access Request Service applies the artifact-specific verification rules in {{binding-artifacts}} to every requested item:

* When `denial.binding_token` is present, the service MUST verify its integrity.  When the value is a JWS, the service MUST verify the signature using a key resolved from the JWK Set advertised at the PDP's `jwks_uri` ({{binding-keys}}); JWS `kid` headers are matched against JWK `kid` parameters.

### Idempotency and Retries {#submission-idempotency}

The Access Request Service SHOULD treat a repeated submission with the same `Idempotency-Key`, the same authenticated requester, and an equivalent submission body as the same request, returning the same Task Handle while the original request remains available.  A submission with the same `Idempotency-Key` and authenticated requester but a materially different submission body MUST be rejected with `urn:openid:authzen:access-request:error:duplicate_request`.

Bodies are equivalent when identical under the Access Request Service's deterministic comparison; otherwise they are materially different.  For example, stable JSON canonicalization can ignore insignificant whitespace and object-member ordering; the `Idempotency-Key` header is outside the body.  The same service records keys and evaluates retries, so the comparison need not be interoperable across implementations.

The Access Request Service SHOULD retain Idempotency-Key state at least until `task.expires_at` and SHOULD continue to retain it for at least 24 hours after the task reaches a terminal status.  This window lets retries from delayed PEP restarts find the original task rather than spawning a duplicate.

After the retention window elapses, the Access Request Service MAY reclaim the Idempotency-Key; a submission presenting a previously seen Idempotency-Key whose state has been reclaimed is processed as a new submission.

#### Idempotency Key Abuse {#idempotency-key-abuse}

Implementations SHOULD scope idempotency keys to the authenticated caller and avoid storing them longer than necessary.

## Run the Task {#ars-task}

An Access Request Service implementing this profile:

* MUST expire Access Requests and approvals according to local policy.
* MUST NOT return `approved` unless the configured approval workflow has completed successfully.
* MUST evaluate approver eligibility, including self-approval, delegation, separation-of-duties, and conflict-of-interest policy, before treating an approval workflow as successfully completed.
* MUST retain sufficient audit records to reconstruct the request, approval, denial, and completion result.

For a completed task, the response:

* When `task.status` is `approved` and the task does not contain an `items` array, the response MUST include a top-level `result` object.
* For any other terminal status, the response MAY include a `result` object for diagnostic or workflow information.
* When present, the `result` object MUST use one of the completion forms defined in {{completion-semantics}}.

A task remains retrievable from the Task Status Endpoint after it has reached a terminal status, until `task.expires_at` is reached or the Access Request Service removes it according to local retention policy.  After expiry or removal, the Task Status Endpoint MUST return `urn:openid:authzen:access-request:error:task_expired` or `urn:openid:authzen:access-request:error:unknown_task` as appropriate.

The `approval.id` value ({{approval-result}}) MUST contain sufficient entropy to prevent practical guessing and MUST NOT encode semantics that a PEP is expected to parse.

The Access Request Service SHOULD retain the original `evaluation_id` in the approval record so the sequence from denied evaluation through Access Request, approval, and re-evaluation can be reconstructed for audit.

Implementations SHOULD apply privacy controls before populating `progress.awaiting`; see {{privacy-considerations}}.

### Status Mapping Obligation {#status-mapping-obligation}

Implementations SHOULD document the mapping they apply from their backend states to the canonical statuses so that PEP behavior remains predictable across upgrades and operational changes.  Typical mappings are illustrated in {{status-mapping}}.

Implementations that define additional status values ({{task-status}}) extend the state machine.  Such extensions SHOULD specify the transitions into and out of the new state and document them alongside the value definition.

### Availability {#availability}

Access Request Services SHOULD apply rate limits and abuse detection to request submission and polling endpoints.

### Task Handle Authorization {#authorization-and-authentication}

Authorization for Task Handle interactions, such as status retrieval and cancellation, is bound to the original Subject, Resource, Action, task, and requested operation rather than to a specific access token, session, or PEP instance.

The Access Request Service MUST authorize each Task Handle operation independently.  Authorization to retrieve task status does not imply authorization to cancel the task, view approver details, or retrieve an enforceable result.

A task status response MUST NOT disclose approval details, approver identities, policy identifiers, or resource metadata to a caller that is not authorized to receive them.

#### Task Handle Leakage {#task-handle-leakage}

Task handles MUST be opaque, unguessable, and protected by authentication and authorization checks.  A leaked task handle MUST NOT be sufficient to retrieve task status without caller authorization.

## Policy and Approver Hygiene {#overbroad-approval}

This profile does not define an approval policy language.  Implementations MUST NOT treat the `template`, `requested_access`, or `display` fields as sufficient authorization policy.  Actual approval scope and enforcement semantics are determined by the PDP and Access Request Service.

The `requested_access.emergency` member ({{submission-request-body}}) is a request signal, not an authorization override.  Implementations that support emergency or break-glass access SHOULD require a business justification, apply the shortest practical approval or access lifetime, notify appropriate owners or security personnel, and require post-use review.  Emergency requests and approvals SHOULD be retained and auditable according to the deployment's security and compliance policy.

### Approver Eligibility and Separation of Duties {#approver-eligibility}

Access Request Services MUST evaluate approver eligibility before returning `approved`, including self-approval restrictions, delegated approver authority, separation-of-duties constraints, ownership rules, and conflict-of-interest policy.  A workflow step completed by an ineligible approver MUST NOT be treated as successful approval unless local policy explicitly allows that exception and records it for audit.

# Binding Artifacts {#binding-artifacts}

This section defines how the PDP and the Access Request Service issue and verify binding artifacts at the denial and approval boundaries; a PEP carries the artifacts unchanged ({{pep-construct}}, {{approval-reevaluation-request}}) and needs nothing further from this section.  The Interoperability Baseline requires support for the respective JWS verification paths in every deployment; shared-state deployments need not exchange binding artifacts, but their Access Request Services and PDPs still support those paths.  Whenever `binding_token` or `approval.state` is used, its applicable processing rules apply, including any conditions on its format.  Rules in this section that are stated for either binding form, or for the Approval Result the Access Request Service returns, apply in every deployment.

An independent Access Request Service needs `binding_token` to verify the denial.  A PDP without trusted access to the approval record needs `approval.state` or another profile-defined PDP-verifiable artifact ({{approval-state}}).  The `state` member can carry proof or verifier state; its JWS rules apply when it is carried by value as a JWS.

## Interoperability Baseline {#interoperability-baseline}

For cross-vendor interoperability, an Access Request Service MUST support verifying a `binding_token` presented as a JWS in compact serialization, and a PDP MUST support verifying an `approval.state` presented as a JWS in compact serialization ({{approval-state}}).

Other integrity-protected formats MAY be used when both the issuer and the verifier support them.

## Keys and Metadata {#binding-keys}

A PDP that issues or verifies signed values for use under this profile (for example, a JWS-signed `binding_token` or a JWS `approval.state`, defined in {{approval-state}}) MUST publish a `jwks_uri` in PDP metadata.

The value is an HTTPS URI of a JWK Set {{RFC7517}} document containing the verification keys for the signed artifacts this profile defines: PDP-issued `binding_token` values and `approval.state` values signed by the PDP's Access Request Service.  Keys are distinguished by their `kid` and by the JWS `iss`.

Each JWK in the set SHOULD include a `kid` parameter so JWS signatures issued with a `kid` header can be resolved to the corresponding verification key, and SHOULD include a `use` parameter distinguishing signing keys (`use: "sig"`) from any other keys advertised.

Verifiers cache the JWK Set per HTTP cache headers and refresh it on key-rotation events.  An unrecognized `kid` SHOULD cause the verifier to refresh the JWK Set before rejecting the input.

Non-normative metadata example:

~~~ json
{
  "policy_decision_point": "https://pdp.example.com",
  "access_evaluation_endpoint": "https://pdp.example.com/access/v1/evaluation",
  "access_evaluations_endpoint": "https://pdp.example.com/access/v1/evaluations",
  "access_request_endpoint": "https://pdp.example.com/access/v1/requests",
  "jwks_uri": "https://pdp.example.com/access/v1/jwks",
  "capabilities": [
    "urn:openid:authzen:capability:access-request"
  ]
}
~~~

## Denial Binding Artifacts {#denial-binding}

Denial binding uses `binding_token` by value or `evaluation_id` by reference.

**`binding_token` (by value).**  An integrity-protected token that protects or constrains the requestable-denial expiry.  The PDP signs it and retains no state.  This form works in any topology, and is REQUIRED when the Access Request Service does not share state with the PDP (an independent Access Request Service).

For that independent topology the `binding_token` MUST be self-contained: it carries the denied Subject, Resource, Action, and authorization-relevant Context by value (inline or as a `binding_hash`) and the Access Request Service verifies it offline against the PDP's published key, per {{binding-token-integrity}}.  A `binding_token` that only references shared state, for example one carrying `evaluation_id` alone, does not satisfy the independent-Access-Request-Service requirement.

A PDP MAY emit both forms.  When a `binding_token` is present it is the authoritative denial binding, and any accompanying `evaluation_id` serves only as a correlation and audit identifier rather than a second binding form; the Access Request Service resolves `evaluation_id` as a binding form only when no `binding_token` is present.  This is why a PDP MAY follow the conformance recommendation to return a stable `context.evaluation_id` ({{evaluation-identifier}}) even when it also emits a `binding_token`.

The following protection rules apply to `binding_token`:

* When present, the value MUST be integrity protected in a way the Access Request Service can verify, and SHOULD be a JSON Web Signature (JWS) {{RFC7515}} in compact serialization, signed by the PDP, with a payload (such as a JWT {{RFC7519}}) that the Access Request Service can verify and bind to the original denied evaluation.
* JSON Web Encryption (JWE) {{RFC7516}} MAY be used in addition to integrity protection when the payload contains information that must not be visible to the PEP, for example by encrypting a signed payload.

### Denial Binding Claims {#binding-token-integrity}

The PDP issues `binding_token` as proof of the denied evaluation.  The PEP carries it unchanged to the Access Request Service, which verifies the binding and freshness ({{verifying-denial-binding}}).

PDPs MUST integrity-protect `binding_token` using a mechanism the Access Request Service can verify and SHOULD issue it as a JWS so the Access Request Service can prove the value was produced by the PDP and bound to the original denied evaluation.

When the payload contains information that must not be visible to the PEP, the PDP MAY use JWE in addition to integrity protection, for example by encrypting a signed payload.

This profile does not mandate a specific JWS payload; the contents are deployment-specific.  Implementations that issue `binding_token` as a JWT SHOULD include the claims described in {{denial-jwt-claims}} and {{denial-request-binding}} to provide sound token hygiene and confused-deputy protection.

#### JWT Claim Reference {#denial-jwt-claims}

* `aud`: REQUIRED.  Access Request Service identifier, or an array of identifiers including the Access Request Service.  An array supports multiple verifiers of the same JWT; audience validation prevents replay to an unintended service.  The Access Request Service MUST reject a `binding_token` JWT that lacks `aud` or whose `aud` does not include the Access Request Service's identifier.
* `iss`: PDP identifier.  Lets the Access Request Service select the correct verification key from the PDP's JWK Set ({{binding-keys}}).
* `iat`, `exp`: issued-at and expiry.  Expiry SHOULD be short (typically minutes, aligned with the requestable-denial hint lifetime).
* `jti`: unique token identifier.  The Access Request Service SHOULD track recently-seen `jti` values until the token's `exp` to detect replay of an otherwise valid token.
* `denial_expires_at`: the `context.access_request.expires_at` value from the requestable denial, unless the token's `exp` is no later than that value.  This lets the Access Request Service verify the PEP-echoed `denial.expires_at` value or enforce the token expiry as an equal-or-stricter freshness deadline.
* `evaluation_id`: the PDP's identifier for the evaluation, when present in `context.evaluation_id` ({{evaluation-identifier}}).

#### Binding the Denied Request {#denial-request-binding}

The `binding_context_members` claim is the array of `context` member names that constitute the authorization-relevant Context for this evaluation (see the Terminology definition of Authorization-Relevant Context).  It is present (and MAY be an empty array) whenever any binding claim covers context; the Access Request Service uses exactly this integrity-protected set when comparing or hashing the authorization-relevant Context, and binds only Subject, Resource, and Action when it is absent.

Binding claims identify the original denied evaluation using either of the following representations.  For interoperability across independently implemented PDPs and Access Request Services, the inline form is RECOMMENDED, because it is compared structurally and requires no agreed byte canonicalization.

* Inline (RECOMMENDED): the Subject, Resource, Action, and authorization-relevant Context of the denied evaluation, which the Access Request Service compares structurally, member by member, against the submission, using the comparison rules in {{structural-comparison}}.
* Hashed: a `binding_hash` constructed as defined in {{denial-binding-hash}}.

#### Hash Construction {#denial-binding-hash}

`binding_hash` is the base64url-encoded (without padding) SHA-256 digest of the {{RFC8785}} JSON Canonicalization Scheme (JCS) serialization of this JSON object.  Angle-bracketed values are placeholders, not literal strings:

~~~
{
  "subject": <Subject>,
  "resource": <Resource>,
  "action": <Action>,
  "context": <authorization-relevant Context>
}
~~~

`<Subject>` is the bound Subject with `subject.properties.act` removed (matching the exclusion in {{structural-comparison}}).  `<authorization-relevant Context>` is the set enumerated by `binding_context_members`, which the Access Request Service recomputes from the submission.

Implementations that use the hashed form MUST use exactly this construction so that a PDP and an independently implemented Access Request Service compute identical digests.

The bulk construction is defined in {{BULK}}.

### Verifying the Denial Binding {#verifying-denial-binding}

When `binding_token` is a JWS-signed JWT using the claims defined in {{binding-token-integrity}}, the Access Request Service, on receipt:

1. parses the JWS header and resolves the verification key from the JWK Set at the PDP's `jwks_uri`;
2. verifies the signature, the `aud` claim, and the expiry;
3. checks `jti` against recently-seen tokens to detect replay;
4. compares the binding claims (inline or hashed) against the submission's Subject, Resource, Action, and authorization-relevant Context (or per-item for bulk submissions), rejecting a mismatch with `urn:openid:authzen:access-request:error:invalid_denial_binding`;
5. enforces freshness (the earlier of the token `exp` and `denial.expires_at`), rejecting a submission past that deadline with `urn:openid:authzen:access-request:error:expired_denial`.

The following rules govern the freshness deadline of a submission:

* When the `binding_token` carries its own expiry (`exp`) and the submitted denial also carries `denial.expires_at`, the Access Request Service MUST enforce the earlier of the two as the freshness deadline for the submission.
* When `denial_expires_at` or equivalent protected binding material is present, the Access Request Service MUST verify that `denial.expires_at` matches the protected value before relying on it.
* When no protected denial-expiry value is present, the Access Request Service MUST rely on `exp` only if it is no later than the echoed `denial.expires_at`; otherwise the binding material is insufficient to prove the freshness window and the submission MUST be rejected with `urn:openid:authzen:access-request:error:invalid_denial_binding`.
* A submission whose freshness deadline has passed MUST be rejected with `urn:openid:authzen:access-request:error:expired_denial`.

### Denial Binding Alternatives {#denial-binding-alternatives}

PDPs MAY add deployment-specific claims (policy version, factors, risk score, tenant identifier) when the Access Request Service needs them for routing or audit.  When such claims must remain opaque to the PEP, the PDP wraps the signed payload in JWE encrypted to the Access Request Service.

When `binding_token` uses another integrity-protected format, the Access Request Service MUST perform equivalent verification for issuer authenticity, audience or intended recipient, expiry when present, replay resistance when provided by the format, and binding to the submitted Subject, Resource, Action, and relevant Context.

A single signed JWT MAY simultaneously satisfy this profile's claim recommendations and the requirements of another profile or specification that uses the same JWT, provided the union of required claims is present and consistent.  For example, the same JWT can appear as `context.access_request.binding_token` and as a profile-defined token elsewhere.  Verifiers process the claims they understand without rejecting additional profile-specific claims.

## Approval State {#approval-state}

When the PDP cannot resolve `approval.id` from trusted server-side state shared with, or delegated by, the Access Request Service, the Approval Result MUST include `approval.state` or another profile-defined PDP-verifiable artifact.  An Access Request Service MUST NOT return a Re-evaluation Mode result that the PDP cannot verify without trusting PEP-supplied assertions.

When `approval.state` is carried by value as a JWS:

* The verifying PDP MUST be able to discover the signer's verification key.
* The JWS MUST carry an `iss` claim identifying the signer (the Access Request Service, or the PDP acting through it) and SHOULD carry a `kid` header.
* The deployment publishes the Access Request Service's approval-state verification keys in the PDP's `jwks_uri` JWK Set ({{binding-keys}}); the PDP selects the key by `iss` and `kid`.  Publishing a signer's key there is the PDP's statement that it trusts that signer for approval-state verification; the JWK Set is a discovery surface and a trust declaration at once.
* A JWS `approval.state` MUST carry an `aud` (or equivalent intended-recipient) claim identifying the verifying PDP, which the PDP MUST verify, so the value cannot be replayed to a different PDP that shares the signer's key.
* A PDP that cannot resolve the signer's key, or resolves it to a key not trusted for the claimed `iss`, MUST reject the `approval.state`.

In the bound-reference pattern, the PDP verifies `approval.state`, carrying integrity-protected proof or verifier state.  {{approval-reference-lookup}} defines the lookup alternative.

In the bound-reference topology, where the verifying PDP does not share recorded state with the Access Request Service, the verifiable approval material (for example, a `binding_context_members`-equivalent claim in `approval.state`) MUST convey the authorization-relevant Context member set so the PDP applies the same set.

The binding topology determines which PDP can verify the approval: an integrity-protected `approval.state` can be verified using the issuer's verification key, while lookup of `approval.id` requires access to the backing state.

# Cancellation {#cancellation}

Cancellation of a pending Access Request MAY be performed by the Access Request Service, the requester through a separate user interface, an approver, or the PEP using the cancellation endpoint defined in this section.

An Access Request Service MAY support PEP-initiated cancellation of a pending Access Request.  When supported, the Task Handle MUST include a `links.cancel` member.  When cancellation is not supported, `links.cancel` is omitted and a cancellation attempted against such a service returns `405 Method Not Allowed`.  The PEP cancels by issuing an HTTP `POST` to `links.cancel`; implementations MAY also accept HTTP `DELETE` against `links.cancel` as an equivalent cancellation request.

The cancellation request body is an OPTIONAL JSON object with the following members:

`reason`:
: OPTIONAL.  String.  Stable, machine-readable reason code.

`comment`:
: OPTIONAL.  String.  Human-readable cancellation note for audit.

A successful cancellation returns `200 OK` and the updated `task` object whose `status` is `cancelled`.  Cancellation of a task that has already reached a terminal status returns `409 Conflict` using the `urn:openid:authzen:access-request:error:invalid_task_state` problem type.

The Access Request Service MUST authenticate the PEP and MUST verify the PEP is authorized for the original Subject, Resource, Action, task, and cancellation operation.  Authorization to submit the original request or to act for the Subject does not by itself authorize cancellation; the service MUST verify authorization for the bound Resource, Action, task, and operation.

PEPs that need to abandon an outstanding request without using this endpoint MAY stop polling and rely on `task.expires_at` and Access Request Service expiry to release resources.

# Machine-Readable Forms {#machine-readable-forms}

The requestable denial's `access_request` object has two members describing additional input the Access Request Service expects at submission:

`form_url`:
: OPTIONAL.  HTTPS URI.  URL of a form, hosted by the Access Request Service or another service trusted by the deployment, where the requester can supply additional information required for the Access Request.  Suitable for PEPs that render the form for a human user.

`request_schema_url`:
: OPTIONAL.  HTTPS URI.  URL where the Access Request Service publishes a machine-readable description of the augmentations the PEP must add to the submission's `context` and `requested_access` objects.  RECOMMENDED to be a JSON Schema {{I-D.bhutton-json-schema}} {{I-D.bhutton-json-schema-validation}} document.  Suitable for autonomous PEPs and for PEPs that render forms natively against a schema.

A PDP implementing this profile MAY include either member in the requestable denial when the Access Request requires such fields.  PEPs interacting with deployments that do not include either member MAY omit form-schema processing entirely.

When a deployment expects autonomous PEP submissions, the requestable denial SHOULD include `request_schema_url` referencing a JSON Schema {{I-D.bhutton-json-schema}} {{I-D.bhutton-json-schema-validation}} document that describes the augmentations the PEP MUST add to the submission's `context` and `requested_access` objects.  An autonomous PEP MAY consume the schema directly to construct a valid submission; {{pep-processing-rules}} governs handling of inputs it cannot supply.

Implementations using proprietary form languages MAY publish a JSON Schema derived from their native form description.  Translation can lose rendering details; the JSON Schema referenced by `request_schema_url` SHOULD provide enough information for an autonomous PEP to construct a conformant submission, while richer rendering, widget, and interaction details remain in `form_url`.

The companion Catalog Profile {{CATALOG}} defines how a PEP resolves fields backed by application, entitlement, role, or cost-center catalogs.  The denial references a Catalogs Document; the form schema defines the data shape.

This profile does not define a UI rendering vocabulary.  Deployments that need richer rendering hints (such as widget selection, layout, or conditional display) MAY layer a UI vocabulary, identified out of band, typically keyed by `template`.

This profile does not define an agent protocol surface.  Deployments serving agentic PEPs MAY additionally expose Access Request submission through an agent protocol where the tool input schema corresponds to the JSON Schema referenced by `request_schema_url`.  Discovery of such surfaces is out of scope for this specification.

# Extensibility and Profiles {#extensibility}

Extension points allow profiles and deployments to adapt the wire format to upstream protocols, governance platforms, and request interfaces.

This document defines both a reusable AuthZEN extension and a profile of its use.  The extension is the AuthZEN surface: `context.access_request`, `context.evaluation_id`, `context.evaluated_at`, and `context.reason` on a denied Decision; `context.approval` on an Access Evaluation request; and `next_action`, `retry_after`, `reason`, and the approval members on a re-evaluation Decision.  The profile is the Access Request Endpoint, the submission, the Task Handle, and the completion mode.  Unrecognized members of the extension do not change the underlying AuthZEN Decision: a PEP that does not implement this profile sees a plain denial or a plain permit.  Recognized members have the semantics this profile defines, including `context.approval` as authorization input to a PDP and `approved_until` as an enforcement bound on a PEP.  The handling of each member when unrecognized is stated with the member and summarized in {{decision-context-members}}.

## Companion-Defined Members {#companion-profiles}

The following protocol members and status value are defined by normative reference to companion profiles.  Their presence, processing, and validation rules are specified in those profiles.

| Location | Member or value | Specification |
|---|---|---|
| Access Request submission | `items` | Bulk Access Requests {{BULK}} |
| Task Handle | `items`; `partial` value of `status` | Bulk Access Requests {{BULK}} |
| Access Request submission | `callback` | Callback Notifications {{CALLBACK}} |

A normative reference to a companion profile makes its definitions authoritative when the feature is used; conformance to this profile does not require implementing a companion unless a rule here says so.  These are defined protocol names, not unrecognized extension names under the forward-compatibility rule.  The companion definitions do not open the submission or Task Handle to arbitrary additional members.

## Extension Points

Additional members beyond those defined in this document or by {{companion-profiles}} MAY appear only at the following locations, and those members MUST follow the naming rules in {{extension-naming}}.  No other object members may be extended without a revision of this specification or a profile that explicitly redefines them.  The AuthZEN extensibility model proposes a recursive rule under which any named object carries registered, namespaced members; aligning this list with that rule is a decision for a revision of this specification.

* `context.access_request`: additional members of the requestable denial, such as URLs of profile-defined companion documents the PEP consults when constructing a submission.
* `context.access_request.display`: user-interface hints in a requestable denial.
* AuthZEN Decision Context members defined by this profile.
* `context` in an Access Request submission: augments the AuthZEN Context.
* `requested_access` in an Access Request submission.
* `client` in an Access Request submission.
* `task.display`: user-interface hints attached to a Task Handle.
* `task.links`: link relations to related URLs.
* `result` and the additions defined under each `result.mode`.
* `approval.state` in a Re-evaluation Mode result: opaque profile-specific or deployment-specific verifier state carried through the PEP to the PDP at re-evaluation time.

This specification also defines extensibility for enumerated values:

* New values for `task.status` ({{task-status}}).
* New values for `result.mode` ({{completion-semantics}}).
* New problem types for {{RFC9457}}-style error responses ({{error-responses}}).

This specification does not create registries for these enumerated values.  Specifications that define new values for `task.status`, `result.mode`, or problem types SHOULD define stable names or URIs and processing rules for those values.  Short, unqualified names for `result.mode` are reserved for values defined by this base specification or by a future registry; profile-defined `result.mode` values SHOULD use absolute URIs unless such a registry exists.

## Decision Context Members {#decision-context-members}

The AuthZEN Decision Context and request Context members this document defines, with their processing strength and the handling of an unrecognized member or value, each stated normatively in the section cited:

| Member | Position | Effect when recognized | Unrecognized member or value |
|---|---|---|---|
| `context.access_request` | denied Decision | the denial is requestable | absent or unrecognized: the denial is not requestable ({{pep-recognize}}) |
| `context.evaluation_id`, `context.evaluated_at`, `context.reason` | denied Decision | echoed in the submission | echoed when present, otherwise absent from the submission ({{pep-construct}}) |
| `context.approval` | Access Evaluation request | authorization input the PDP verifies | a PDP that cannot resolve or verify it evaluates as not approved by that reference ({{approval-verification}}) |
| `next_action`, `retry_after`, `reason` | re-evaluation Decision; `reason` also on a requestable denial | directs the PEP's next step | unrecognized `next_action` or `reason` falls back as defined in {{pep-reevaluation-handling}}; the Decision itself is unchanged |
| response-side `approval` members | re-evaluation Decision | `approved_until` bounds reuse and enforcement | unrecognized: the permit stands as an ordinary AuthZEN permit ({{approval-lifetime}}) |

No member in this table widens a denial or narrows a permit for a PEP that does not implement this profile; in particular, `approved_until` is an enforcement and reuse bound for an implementer of this profile and does not narrow an ordinary AuthZEN permit for any other PEP.  Composition with other extensions that add Decision Context members, such as obligations, is not defined by this document.

## Naming Extensions {#extension-naming}

A member name or value added at an extension point MUST be one of the following:

1. A name registered in the AuthZEN Access Request Member Names registry ({{iana-member-names}}).  Registry-eligible names are short, lowercase, snake_case identifiers carrying semantics that are useful across multiple implementations.
2. An absolute URI (HTTPS or URN) when the member is profile-specific and not appropriate for the registry.  Profiles SHOULD use a stable URI under the profile's change controller.
3. A reverse-DNS-prefixed identifier (for example, `vendor.example.com/foo`) when the member is private to a single deployment and not intended for cross-implementation use.

The contents of `approval.state` are opaque to this specification and are not subject to the member naming requirements above unless a profile or deployment explicitly defines structure within `approval.state`.

## Forward Compatibility

An implementation receiving a member or value it does not recognize at an extension point MUST ignore it and MUST NOT fail processing on the basis of the unrecognized name.  This default does not override fail-safe rules defined elsewhere in this profile, such as the PEP rule in {{pep-processing-rules}} that treats unknown `result.mode` values as not approved rather than as ignorable.  An implementation MAY surface unrecognized members in audit records or pass them through unchanged when echoing wire content (for example, in callbacks).

## Profiles

A profile is a separate specification defining extensions for a use case, such as OAuth 2.0 token requests, Rich Authorization Requests {{?RFC9396}}, or integration with a governance platform.

A profile SHOULD:

* Identify itself with a stable URI.
* Specify the extension points it populates and the member names or enumerated values it introduces.
* Register registry-eligible member names in the AuthZEN Access Request Member Names registry ({{iana-member-names}}).
* Define semantics, validation rules, and any normative requirements for its members.
* Enumerate any constraints it places on members or behaviors defined by this base specification.

This specification neither enumerates profiles nor requires declarative profile negotiation.  Conformance to a profile depends on the presence and processing of its registered or namespaced members.

# Security Considerations

This section describes threats and cites their mitigations.  It introduces no requirements.

## Denial and Approval Integrity

**Denial remains denial.** Treating `context.access_request` as permission would grant access without an allow decision.  The PEP rules in {{pep-processing-rules}} preserve denial and treat unknown task statuses and completion modes as not approved.

**Confused deputy and request substitution.** An attacker could substitute a Subject or Resource.  Submission checks compare signed denial claims ({{verifying-denial-binding}}) or, when no token is present, recorded state ({{shared-state-deployments}}).  Task binding covers the denial, requester, and client ({{ars-processing-rules}}), and re-evaluation checks approval applicability and scope ({{approval-verification}} and {{approval-scope}}).

**Binding-token integrity.** A buggy or hostile PEP could alter or fabricate PDP-issued state to influence approval routing or scope.  {{binding-token-integrity}} and {{verifying-denial-binding}} define integrity, binding, and freshness checks; {{denial-binding-alternatives}} covers other formats.

**Approval reference substitution and replay.** A compromised PEP could present another request's approval or replay an expired or inapplicable reference.  {{approval-verification}} defines applicability checks; {{decision-and-binding-integrity}} defines verification of by-value material and protection of backing records.  An approval reference is not a bearer grant.

## Policy and Approver Hygiene

**Overbroad approval.** Treating `template`, `requested_access`, or `display` as sufficient policy would let a requester set their own approval scope.  These members are request signals, not authorization policy ({{overbroad-approval}}).

**Approver eligibility and separation of duties.** Self-approval, missing delegated authority, and conflicts of interest or duties can make a completed workflow invalid.  {{approver-eligibility}} requires eligibility checks and permits exceptions only when local policy explicitly allows and audits them.

**Emergency access.** Treating `requested_access.emergency` as an override would bypass policy.  {{overbroad-approval}} describes justification, limited lifetime, notification, review, and audit for emergency access.

## Information Disclosure

**Trusting URLs from the requestable denial.** A compromised or misconfigured PDP or Access Request Service could direct the PEP to hostile endpoints, forms, or schemas to harvest information or credentials.  {{trusting-urls}} defines host-trust checks for denial-supplied URLs and URLs in documents fetched from them.

**Task handle leakage.** A leaked handle could expose workflow state or sensitive information.  Opacity and unguessability do not replace authorization for each operation ({{task-handle-leakage}} and {{authorization-and-authentication}}).  Cancellation requires separate authorization ({{cancellation}}).

**PEP-facing and end-client-facing surfaces.** Exposed machine endpoints let end clients bypass the PEP; exposed approval references enable injection attempts in other evaluations.  {{pep-facing-surfaces}} separates machine and human-facing members and restricts disclosure of approver links.

## Operational and Integration

**PEP acting on behalf of the Subject.** Accepting unverified actor claims would let a PEP assert authority it cannot demonstrate.  {{endpoint-protection}} requires caller authorization to submit or view the request for the supplied Subject, Resource, and Action; actor-chain verification is defined by {{ACTOR}}.

**Idempotency-key abuse.** Caller-supplied keys consume server-side state and are matched against retries.  {{idempotency-key-abuse}} gives scoping and retention guidance.

**Availability.** Approval workflows introduce latency and dependencies on external systems.  {{pep-poll}} and {{availability}} cover fail-closed behavior and rate limiting; {{endpoint-protection}} covers endpoint authentication and authorization.

# Privacy Considerations {#privacy-considerations}

Access Requests may contain sensitive information, including user identifiers, resource identifiers, business justifications, approval chains, and policy reasons.  Implementations SHOULD minimize the amount of information returned to the PEP and displayed to the end user.

The Access Request Service SHOULD separate end-user display reasons from administrator diagnostic reasons.  A requestable denial response SHOULD avoid exposing internal policy identifiers unless the PEP is authorized for administrative diagnostics.

Approval records SHOULD be retained only as long as required by business, security, and compliance policy.

# IANA Considerations

This document has no IANA actions.  OpenID Foundation registry requests are listed in {{openid-foundation-registry-considerations}}.

# OpenID Foundation Registry Considerations {#openid-foundation-registry-considerations}

## AuthZEN Policy Decision Point Metadata Registry

This specification requests registration of the following PDP metadata parameters in the AuthZEN Policy Decision Point Metadata Registry.

Name:
: `access_request_endpoint`

Description:
: HTTPS endpoint used to submit Access Requests for requestable denials.

Change Controller:
: OpenID Foundation AuthZEN Working Group

Specification Document:
: This document.

Name:
: `jwks_uri`

Description:
: HTTPS URI of a JWK Set ({{RFC7517}}) document containing the verification keys for the signed artifacts this profile defines: PDP-issued `binding_token` values and `approval.state` values signed by the PDP's Access Request Service, distinguished by `kid` and JWS `iss`.

Change Controller:
: OpenID Foundation AuthZEN Working Group

Specification Document:
: This document.

## AuthZEN Policy Decision Point Capabilities Registry

This specification requests registration of the following PDP capabilities in the AuthZEN Policy Decision Point Capabilities Registry.

Capability Name:
: `access-request`

Capability URN:
: `urn:openid:authzen:capability:access-request`

Capability Description:
: Indicates that the PDP supports requestable denials and the Access Request Endpoint defined by this specification.

Change Controller:
: OpenID Foundation AuthZEN Working Group

Specification Document:
: This document.

The capability and problem-type URNs ({{error-responses}}) use the OpenID Foundation's `urn:openid:authzen:` namespace, not AuthZEN's `urn:ietf:params:authzen:` capability sub-namespace.  This profile convention leaves the AuthZEN `capabilities` array as a list of URNs ({{AuthZEN}}).

## AuthZEN Access Request Member Names Registry {#iana-member-names}

This specification requests creation of a new registry: the AuthZEN Access Request Member Names registry.

The registry tracks well-known member names that may appear at the extension points defined in {{extensibility}}.  In the terms of the AuthZEN extensibility model this is a member-name registry; each entry's processing strength is that of the object it extends, as stated by its specification document.  Registration policy is Specification Required.  Each entry has the following fields:

Name:
: The member name as it appears on the wire.

Extension Point:
: One of the extension points listed in {{extensibility}}, or an extension point defined by a profile of this specification.

Description:
: A short description of the member's semantics.

Change Controller:
: The registering specification's change controller.

Specification Document:
: The document defining the member.

Initial entries registered by this specification:

| Name | Extension Point | Description |
|---|---|---|
| `requested_until` | `requested_access` | RFC 3339 timestamp requesting access through a specific absolute time. |
| `emergency` | `requested_access` | Boolean requesting an expedited or emergency-access path. |
| `ticket` | `task.links` | URL where the requester can view the request and its status. |
| `review` | `task.links` | URL where an approver or administrator can review or act on the request. |
| `cancel` | `task.links` | URL where the PEP can cancel the request. |
| `next_action` | AuthZEN Decision Context | Action the PEP should take after a denied re-evaluation with an approval reference. |
| `retry_after` | AuthZEN Decision Context | Number of seconds the PEP waits before retrying a transient re-evaluation denial. |
| `access_request` | AuthZEN Decision Context | Requestable-denial object signaling that a denied decision may be requested. |
| `evaluation_id` | AuthZEN Decision Context | Stable identifier of the AuthZEN Authorization API evaluation, used for denial binding and audit. |
| `evaluated_at` | AuthZEN Decision Context | RFC 3339 timestamp at which the Decision was produced. |
| `reason` | AuthZEN Decision Context | Machine-readable reason code for a denial, including re-evaluation denials. |
| `approval` | AuthZEN Decision Context | Approval reference carried at `context.approval` during re-evaluation. |

Change Controller for all initial entries: OpenID Foundation AuthZEN Working Group.  Specification Document for all initial entries: This document.

## AuthZEN Access Request Re-evaluation Denial Reason Registry {#iana-reeval-reasons}

This specification requests creation of a new registry: the AuthZEN Access Request Re-evaluation Denial Reason registry.

The registry tracks well-known `context.reason` values a PDP returns when it denies a re-evaluation that presented an `approval` reference ({{completion-semantics}}).  In the terms of the AuthZEN extensibility model this is an enumerated-type registry whose values are advisory.  Registration policy is Specification Required.  Each entry has the following fields:

Reason:
: The `context.reason` value as it appears on the wire.

Default Next Action:
: The RECOMMENDED `next_action` for the value, which a PEP applies when the PDP's response carries no recognized `next_action`: `request`, `retry`, or `none`.

Description:
: A short description of the denial condition.

Change Controller:
: The registering specification's change controller.

Specification Document:
: The document defining the value.

Initial entries, summarizing the semantics and default next actions defined in {{reevaluation-denials}}:

| Reason | Default Next Action | Description |
|---|---|---|
| `approval_expired` | `request` | Approval no longer valid: `approved_until` passed, or revoked, cancelled, or superseded. |
| `out_of_scope` | `request` | Approval valid but the evaluation is outside its approval scope. |
| `grant_pending` | `retry` | Approval valid and in scope, but the backing grant is not yet present (for example, provisioning incomplete). |
| `policy_denied` | `none` | Approval valid and in scope, but current policy, subject status, or risk state denies the request. |
| `approval_unverifiable` | `none` | The presented `approval.id` or `approval.state` could not be resolved, verified, or bound. |

Change Controller for all initial entries: OpenID Foundation AuthZEN Working Group.  Specification Document for all initial entries: This document.

--- back

# Examples

## End-to-End Trusted-State Approval {#trusted-state-walkthrough}

This non-normative walkthrough uses trusted state at both backend boundaries: the service resolves the denied evaluation by `evaluation_id`, and the PDP resolves the approval by `approval.id`.  The authorization-relevant Context for this example is empty; submission-time business justification is workflow input.

### Initial Evaluation Request {#trusted-initial-evaluation-request}

~~~ http
POST /access/v1/evaluation HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Content-Type: application/json

{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "resource": {
    "type": "document",
    "id": "q4-plan"
  },
  "action": {
    "name": "can_read"
  },
  "context": {
    "time": "2026-04-30T20:15:00Z"
  }
}
~~~

### Requestable Denial {#trusted-requestable-denial}

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "decision": false,
  "context": {
    "evaluation_id": "eval_01HX4Y2P8BQ4Y3F0V0K9D6Z7M1",
    "evaluated_at": "2026-04-30T20:15:00Z",
    "reason": "approval_required",
    "access_request": {
      "template": "manager_approval",
      "expires_at": "2026-04-30T20:25:00Z"
    }
  }
}
~~~

### Submitting the Access Request {#trusted-submitting-the-access-request}

~~~ http
POST /access/v1/requests HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Content-Type: application/json
Idempotency-Key: 7b8d0f0d-65a1-4af1-9fd3-a684f08a5d13

{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "resource": {
    "type": "document",
    "id": "q4-plan"
  },
  "action": {
    "name": "can_read"
  },
  "context": {
    "business_justification": "Needed for customer renewal review"
  },
  "requested_access": {
    "requested_until": "2026-05-01T00:15:00Z"
  },
  "denial": {
    "evaluation_id": "eval_01HX4Y2P8BQ4Y3F0V0K9D6Z7M1",
    "evaluated_at": "2026-04-30T20:15:00Z",
    "expires_at": "2026-04-30T20:25:00Z",
    "reason": "approval_required",
    "template": "manager_approval"
  }
}
~~~

### Task Handle {#trusted-task-handle}

~~~ http
HTTP/1.1 202 Accepted
Content-Type: application/json
Location: https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4

{
  "task": {
    "id": "arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "status": "pending",
    "status_endpoint": "https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "expires_at": "2026-04-30T23:00:00Z",
    "links": {
      "cancel": "https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4/cancel"
    },
    "display": {
      "title": "Access request submitted",
      "description": "Your manager has been asked to approve access."
    }
  }
}
~~~

### Completed Task {#trusted-completed-task}

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "task": {
    "id": "arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "status": "approved",
    "status_endpoint": "https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4"
  },
  "result": {
    "mode": "reevaluate",
    "approval": {
      "id": "apr_01HX4Y8E2NE3Y2X7P0K4JE6WVH",
      "approved_at": "2026-04-30T20:42:00Z",
      "approved_until": "2026-05-01T00:42:00Z"
    }
  }
}
~~~

### Re-evaluation After Approval {#trusted-re-evaluation-after-approval}

The re-evaluation request does not repeat the original `evaluation_id`.  The PDP resolves the `approval.id` (and `approval.state`, when present) to the approved Access Request task and original denied evaluation.

~~~ http
POST /access/v1/evaluation HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Content-Type: application/json

{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "resource": {
    "type": "document",
    "id": "q4-plan"
  },
  "action": {
    "name": "can_read"
  },
  "context": {
    "time": "2026-04-30T20:43:00Z",
    "approval": {
      "id": "apr_01HX4Y8E2NE3Y2X7P0K4JE6WVH",
      "approved_at": "2026-04-30T20:42:00Z",
      "approved_until": "2026-05-01T00:42:00Z"
    }
  }
}
~~~

### Final Decision {#trusted-final-decision}

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "decision": true,
  "context": {
    "approval": {
      "id": "apr_01HX4Y8E2NE3Y2X7P0K4JE6WVH",
      "approved_until": "2026-05-01T00:42:00Z"
    }
  }
}
~~~

## End-to-End Manager Approval with Binding Artifacts

This walkthrough differs from {{trusted-state-walkthrough}} only where the deployment uses binding artifacts: the denial carries a `binding_token` (and, in this example, `form_url` and `request_schema_url`), the submission echoes the token, and the approval carries `state`.  The other exchanges are identical to the trusted-state walkthrough.

### Requestable Denial

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "decision": false,
  "context": {
    "evaluation_id": "eval_01HX4Y2P8BQ4Y3F0V0K9D6Z7M1",
    "evaluated_at": "2026-04-30T20:15:00Z",
    "reason": "approval_required",
    "access_request": {
      "template": "manager_approval",
      "expires_at": "2026-04-30T20:25:00Z",
      "binding_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0.eyJldmFsdWF0aW9uX2lkIjoiZXZhbF8wMUhYNFkyUDhCUTRZM0YwVjBLOUQ2WjdNMSJ9.bXBfc2lnbmF0dXJl",
      "form_url": "https://requests.example.com/forms/manager_approval",
      "request_schema_url": "https://requests.example.com/schemas/manager_approval.json"
    }
  }
}
~~~

### Submitting the Access Request

~~~ http
POST /access/v1/requests HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Content-Type: application/json
Idempotency-Key: 7b8d0f0d-65a1-4af1-9fd3-a684f08a5d13

{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "resource": {
    "type": "document",
    "id": "q4-plan"
  },
  "action": {
    "name": "can_read"
  },
  "context": {
    "business_justification": "Needed for customer renewal review"
  },
  "requested_access": {
    "requested_until": "2026-05-01T00:15:00Z"
  },
  "denial": {
    "evaluation_id": "eval_01HX4Y2P8BQ4Y3F0V0K9D6Z7M1",
    "evaluated_at": "2026-04-30T20:15:00Z",
    "expires_at": "2026-04-30T20:25:00Z",
    "reason": "approval_required",
    "binding_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0.eyJldmFsdWF0aW9uX2lkIjoiZXZhbF8wMUhYNFkyUDhCUTRZM0YwVjBLOUQ2WjdNMSJ9.bXBfc2lnbmF0dXJl",
    "template": "manager_approval"
  }
}
~~~

### Completed Task

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "task": {
    "id": "arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "status": "approved",
    "status_endpoint": "https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4"
  },
  "result": {
    "mode": "reevaluate",
    "approval": {
      "id": "apr_01HX4Y8E2NE3Y2X7P0K4JE6WVH",
      "approved_at": "2026-04-30T20:42:00Z",
      "approved_until": "2026-05-01T00:42:00Z",
      "state": "eyJhbGciOiJFUzI1NiIsImtpZCI6ImFycy0xIn0.eyJhcHByb3ZhbF9pZCI6ImFwcl8wMUhYNFk4RTJORTNZMlg3UDBLNEpFNldWSCJ9.c2lnbmF0dXJl"
    }
  }
}
~~~

### Re-evaluation After Approval

The re-evaluation request does not repeat the original `evaluation_id`.  The PDP resolves the `approval.id` (and `approval.state`, when present) to the approved Access Request task and original denied evaluation.

~~~ http
POST /access/v1/evaluation HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Content-Type: application/json

{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "resource": {
    "type": "document",
    "id": "q4-plan"
  },
  "action": {
    "name": "can_read"
  },
  "context": {
    "time": "2026-04-30T20:43:00Z",
    "approval": {
      "id": "apr_01HX4Y8E2NE3Y2X7P0K4JE6WVH",
      "approved_at": "2026-04-30T20:42:00Z",
      "approved_until": "2026-05-01T00:42:00Z",
      "state": "eyJhbGciOiJFUzI1NiIsImtpZCI6ImFycy0xIn0.eyJhcHByb3ZhbF9pZCI6ImFwcl8wMUhYNFk4RTJORTNZMlg3UDBLNEpFNldWSCJ9.c2lnbmF0dXJl"
    }
  }
}
~~~

## Submission Variants {#submission-variants}

### Submission with Requested Access

Non-normative example:

~~~ http
POST /access/v1/requests HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Content-Type: application/json
Idempotency-Key: 7b8d0f0d-65a1-4af1-9fd3-a684f08a5d13

{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "resource": {
    "type": "document",
    "id": "q4-plan"
  },
  "action": {
    "name": "can_read"
  },
  "context": {
    "business_justification": "Needed for customer renewal review"
  },
  "requested_access": {
    "requested_until": "2026-05-01T00:15:00Z"
  },
  "denial": {
    "evaluation_id": "eval_01HX4Y2P8BQ4Y3F0V0K9D6Z7M1",
    "evaluated_at": "2026-04-30T20:15:00Z",
    "expires_at": "2026-04-30T20:25:00Z",
    "reason": "approval_required",
    "template": "manager_approval"
  }
}
~~~

### Task Handle with Display and Links

Non-normative example:

~~~ http
HTTP/1.1 202 Accepted
Content-Type: application/json
Location: https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4

{
  "task": {
    "id": "arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "status": "pending",
    "status_endpoint": "https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "expires_at": "2026-04-30T23:00:00Z",
    "links": {
      "cancel": "https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4/cancel"
    },
    "display": {
      "title": "Access request submitted",
      "description": "Your manager has been asked to approve access."
    }
  }
}
~~~

### Synchronous Completion {#synchronous-submission-example}

Non-normative synchronous-completion example, where policy auto-approved the request:

~~~ http
HTTP/1.1 201 Created
Content-Type: application/json
Location: https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V5

{
  "task": {
    "id": "arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V5",
    "status": "approved",
    "status_endpoint": "https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V5"
  },
  "result": {
    "mode": "reevaluate",
    "approval": {
      "id": "apr_01HX4Y8E2NE3Y2X7P0K4JE6WVJ",
      "approved_until": "2026-05-01T00:42:00Z"
    }
  }
}
~~~

# Motivation and Use Cases

This non-normative appendix describes the use cases behind the profile and the goals it was written against.

Authority may need to change during execution:

* An AI agent discovers documents, records, or channels it needs mid-task, potentially producing many access denials.  A broad-scope approval covers a class of later invocations; the agent runtime persists the Task Handle and resumes on completion ({{CALLBACK}}, {{ACTOR}}).
* An OAuth Authorization Server receives a combination of requested scopes that requires policy, risk, or human review before token issuance.  The approval is consumed at issuance time by a companion profile that binds it to the issued token.
* An API gateway encounters an operation beyond a user's standing role and routes it to an owner for approval.  This is the single-item flow of {{protocol-overview}} with no companion.
* A Security Token Service discovers that a downstream resource requires per-call approval beyond the upstream token's authority.  The approval is short-lived and re-evaluated on each call.

These denials can lead to workflows that grant new authority.  A machine-readable handoff serves autonomous callers without a human present, and replaces custom approval prompts, out-of-band tickets, and vendor-specific integrations in user-facing applications.

The profile is for resolution that requires an approval, a grant, or another action that produces authority the caller does not hold.  A denial that could be completed with attributes the caller already holds, or with a residual the caller can evaluate locally, is generally better represented as missing information or partial evaluation, though a deployment may still route it through an approval workflow ({{protocol-overview}} and the Introduction state the boundary).  Within missing authority, the portable approval-binding form is particularly useful where the PDP can neither see the approval in its own state nor take it as a durable fact; a single task that fans out across trust domains produces that shape ({{why-not-a-remediation-url}}).

Three goals shaped the design beyond the protocol invariants stated in the Introduction:

* A common handoff to human, automated, or hybrid evaluators that leaves existing approval infrastructure in place.
* High-volume callers absorbed by workflow patterns, such as broad-scope, auto-, pre-, and bulk approval, rather than per-denial human review.
* Requestability that is machine-readable, so an autonomous PEP can construct a conformant submission without human input.

# Implementation Considerations {#impl-considerations}

This appendix describes common deployment patterns and is non-normative.

## Identity Governance and Approval Platforms

An identity-governance, ITSM, or approval platform can implement the roles as follows:

* The platform acts as the Access Request Service, exposing its task or request as a Task Handle while retaining its approval workflow.
* The PDP evaluates platform state and emits requestable denials when access is missing and an approval workflow exists.
* The PEP enforces access in an application, request interface, or agent, either reacting to an attempted operation or evaluating proactively, as in a request portal.

Provisioning changes platform state; re-evaluation reads that state.  Implementations mapping their richer task lifecycle states onto the canonical statuses defined in this profile SHOULD follow the guidance in {{status-mapping}}.

## Form Translation

When translating proprietary forms, distinguish submission data from vendor-specific widgets and metadata.  `request_schema_url` describes the input an autonomous PEP needs; `form_url` preserves richer rendering.  The AuthZEN Access Request Catalog Profile {{CATALOG}} handles fields whose values come from catalog APIs.

## Evaluators and Workflow Design

The Access Request Service selects evaluators for each submission, such as:

* Human approvers: owners, managers, security reviewers, or delegates acting through a user interface.
* Policy engines: static or dynamic rules for ownership, separation of duties, conflicts of interest, or organizational policy.
* Risk engines: runtime signals scored against approval, denial, or escalation thresholds.
* AI supervisors: evaluators that summarize requested authority, assess stated intent, and approve, deny, or hand off.
* Hybrid pipelines: combinations such as risk checks that escalate non-trivial cases to a human.

Deployments can combine evaluators freely.  The same completion, notification, re-evaluation, and approver-eligibility rules ({{approver-eligibility}}) apply to human and automated evaluators.

To avoid overwhelming human reviewers, high-volume deployments can use:

* Auto-approval: resolve low-risk requests synchronously with `201 Created` and a populated `result`, without human review ({{access-request-response}}).
* Broad-scope approval: approve a class of operations, such as "agent X may call tool Y for 30 days."  Subsequent submissions can auto-approve or become unnecessary because re-evaluation permits access.
* Bulk approval: act on related submissions in one workflow step.
* Pre-approval or standing grants: establish authority out of band, such as at agent provisioning, to avoid denials requiring interactive review.

Bulk submission, idempotency, synchronous completion, and approval expiry support these workflows.

## Mapping Backend States {#status-mapping}

Implementations map backend lifecycle states to the canonical Task Status Endpoint values ({{task-status}}).  This non-normative table gives a starting point:

| Backend state | Canonical status |
|---|---|
| Open, awaiting approval or processing | `pending` |
| Closed, all required approval steps satisfied | `approved` |
| Closed, an approval step rejected the request | `denied` |
| Closed, time-bounded request elapsed before completion | `expired` |
| Closed, requester or administrator stopped the request | `cancelled` |
| Closed, system error prevented completion | `failed` |

# Design Rationale {#design-rationale}

This non-normative appendix explains design choices, grouped by the question a reader brings; the rules in the body of the specification govern.

## Scope

### Why a protocol rather than a remediation URL? {#why-not-a-remediation-url}

A denial that carries a remediation URL hands a human to a page.  Where the PDP already has the approval when it next evaluates, from its own store or carried in as context, that is enough, and it crosses PEP and PDP vendors cleanly, since it is one field emitted and rendered.  This profile adds what a URL does not provide: machine submission by a caller with no human present, a submission bound to the exact denied evaluation, asynchronous task state a caller can hold across restarts, a portable completion result, and an approval the PDP can verify at re-evaluation.  A deployment that shares state between the PDP and the Access Request Service uses these properties with `evaluation_id` and `approval.id`; the properties matter most where the parties share no vendor, no trust domain, and no prior wiring, which three boundaries describe and one flow crosses: an agent from one vendor, inside a customer's application from a second, attempts a refund that the customer's policy routes to its own approval service from a third.

* Interop.  The application and the approval service are different vendors.  A standing role can be provisioned across that line, but not a per-request approval bound to a specific denied action, and a URL only hands off a human.  One requestable-denial contract that any conforming Access Request Service accepts replaces a connector per customer: the agent submits to a service it was never wired for, holds the Task Handle, and moves on.
* Trust.  The application's PDP shares no approval-record state with the service that granted the approval.  When a human approves, the service returns an Approval Result whose `approval.state` is bound to that request, and the PDP verifies it against the service's key, which it already trusts as this customer's approver, without reading the service's store.  That is issuer trust, not a shared database.  Carrying a durable role as context instead would hand the agent standing privilege, which an authorize-every-action model exists to avoid.
* Semantics.  The agent has no prior wiring and no human at a URL, so the denial itself carries the remediation contract: this is requestable, here is the binding material, here is where to submit and track.

The requestable-denial signal is advisory, so a PEP that does not implement this profile sees a plain denial and adoption proceeds one participant at a time.

### Why reuse AuthZEN? {#why-a-profile-of-the-authzen-authorization-api-rather-than-a-standalone-specification}

Reusing AuthZEN's evaluation model avoids a second authorization interface.  The profile keeps its Subject, Resource, Action, Context, and Decision concepts, adds `context.access_request` to denials, and carries `context.approval` through the existing evaluation endpoint.

### Why leave workflows out of scope, and why companion profiles? {#why-does-the-spec-deliberately-not-define-a-workflow-engine-approval-policy-language-or-user-interface}

Standardizing the handoff, rather than the workflow, lets deployments retain their existing IGA, ITSM, chat-approval, or custom infrastructure; a common workflow language or interface would force incompatible platforms into one model.  The same principle places capability that only some deployments need, and that brings its own document format, endpoint, or verification model, in a companion profile that hooks in through an extension point and registers its member names: catalogs, bulk submissions, callbacks, and actor delegation.  Each evolves without revising this specification, and a core-only implementation sees defined names it does not implement rather than unknown ones.

## Completion

### Why re-evaluate after approval? {#why-is-re-evaluation-mode-the-only-base-completion-mode}

Approval can take minutes or days; policy, subject status, risk, and approval validity can change meanwhile.  A new PDP decision checks those conditions at use, rather than freezing them at approval.

### Why carry approval through the PEP? {#why-does-the-approval-round-trip-through-the-pep-rather-than-direct-pdp-to-access-request-service-communication}

Carrying `result.approval` through a normal evaluation avoids requiring a back channel or shared state.  A PDP with access to trusted state resolves `approval.id`; an independent PDP verifies integrity-protected `approval.state`.  The PEP uses the same wire shape in either topology.

### Why allow other completion modes? {#why-is-resultmode-extensible-at-all-given-the-base-defines-only-one-mode}

Token-issuance, credential-issuance, and direct-decision flows may consume approval without re-evaluation.  The `result.mode` extension point lets profiles define those flows without changing the base wire shape or its PDP-authoritative completion mode.

## Binding

### Why two boundaries and two forms? {#why-are-there-two-binding-patterns-evaluationid-and-bindingtoken}

Binding material crosses two boundaries in opposite directions, and each boundary has a form for each trust arrangement.  On the denial side, an Access Request Service with shared or accessible state looks up the denied evaluation by `evaluation_id` without cryptographic verification; without that state, a PDP-signed `binding_token` proves the denial without trusting the PEP's assertion.  On the approval side, a PDP with trusted state resolves `approval.id`; without it, the service-issued `approval.state` proves the approval.  The two artifacts keep separate names because their issuers, verifiers, and constraints differ: `binding_token` is PDP-issued and service-verified with a recommended claim set, while `approval.state` is service-issued and PDP-verified and may carry a signed token, a lookup reference, or deployment-specific state.  Neither signing infrastructure nor shared state is forced on every deployment.

### Why require `approval.id` with signed state? {#why-does-the-approval-object-always-carry-id-even-when-approvalstate-is-signed}

`approval.id` is always present as a uniform correlation handle: a lookup key in shared-state deployments and an identifier for logs, callbacks, and tasks without parsing signed state.  When signed state carries an identifier, the PDP cross-checks it against `approval.id` to detect mismatched pairs.

### Why echo selected denial fields? {#why-does-the-submissions-denial-object-carry-only-key-fields-not-the-full-authzen-decision}

Signed or server-resolvable binding material is stronger evidence than a PEP-supplied JSON echo.  Other denial members, such as `endpoint`, `display`, and `form_url`, guide the PEP rather than the Access Request Service.  The submission carries only the fields the service uses.

## Wire details

### Why discover one Access Request Endpoint? {#why-one-access-request-endpoint-per-deployment-rather-than-per-resource-or-per-tenant}

A metadata-discovered endpoint avoids resource- or tenant-specific URL construction in the PEP.  The payload's `template`, Subject, Resource, Action, and Context support routing by workflow, tenant, or resource family.  An intermediate enforcer, such as an OAuth Authorization Server or gateway acting as PEP, can proxy the endpoint and present a different URL to its own callers while preserving the protocol surface.

### Why use absolute timestamps? {#why-are-timestamps-always-absolute-never-relative-durations}

Absolute RFC 3339 timestamps give consumers a common deadline.  Offering both absolute and relative expiry would require reconciliation and precedence rules.  {{time-and-clock-skew}} addresses clock-skew tolerance.

### Why leave `template` unconstrained? {#why-is-template-an-opaque-free-form-string-rather-than-a-constrained-enumeration}

Workflow categories vary by deployment.  An opaque `template` can map to a stable workflow, ticket class, schema, policy, source-code identifier, or profile-defined value without revising this specification.  It remains routing input, not authorization policy ({{overbroad-approval}}).

# Acknowledgements

The author thanks the OpenID AuthZEN Working Group for discussion and review.

# Document History

-00

* Initial version (draft-mcguinness-authzen-access-request)

-01

* Protocol restructuring and modularization, with each requirement's force preserved.  The core protocol (requestable denial, submission, task status, approval and re-evaluation) is presented first, followed by binding and verification rules that place signed mechanisms beside their shared-state alternatives; cancellation, delegation and acting parties, and machine-readable forms follow in their own sections; security considerations name threats and point to the rules that sit beside the mechanisms they protect.  Requirements were relocated and restated without change in force, duplicated restatements were consolidated, and the conformance surface of this document changed only by what moved to companion profiles.
* Catalog references moved to the companion AuthZEN Access Request Catalog Profile.
* Bulk submission and callback notification requirements, feature-specific security considerations, and examples moved to companion profiles, with the core retaining normative references to their defined members and processing rules.
* Progressive layout: trusted-state examples lead the common protocol; artifact processing and additional mechanisms follow.  The interoperability baseline and all processing requirements retain their applicability and force.  A non-normative deadline guide and trusted-state walkthrough accompany the exchange, and two example omissions are corrected.
* One normative home per rule: message definitions stay in the flow sections, cut to name, presence, type, and one sentence; every processing rule sits in PEP Processing, PDP Processing, or Access Request Service Processing; restating tables and duplicate examples removed; fourteen duplicate statements folded into their surviving rules.
* Actor delegation (the `client.actor` and `client.source` members and actor-chain verification) moved to the companion AuthZEN Actor Delegation Profile, with the core retaining the preservation, comparison, and authorization-input rules that reference those members.