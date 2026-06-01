---
title: "AuthZEN Access Request and Approval Profile - Draft 1"
abbrev: "ARAP"
category: std

docname: authzen-access-request-approval-profile-1_0
submissiontype: IETF
workgroup: OpenID AuthZEN
consensus: true
v: 3
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
  RFC9110:
  RFC9457:
  RFC3339:
  RFC6749:
  RFC6750:
  RFC7515:
  RFC7516:
  RFC7517:
  RFC7519:
  RFC6901:
  RFC8693:
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

--- abstract

This specification defines an extension profile for the OpenID AuthZEN Authorization API that allows a Policy Enforcement Point (PEP) to submit an access request when an authorization decision is denied but requestable.  The profile preserves the AuthZEN Authorization API decision model: a denied decision remains a denial and MUST NOT be treated as access.  It adds a requestable denial context, an access request endpoint, a task handle for the asynchronous workflow that resolves a denial, and a re-evaluation completion mode that lets the Policy Decision Point remain authoritative at enforcement time after approval.

--- middle

# Introduction

The AuthZEN Authorization API enables a Policy Enforcement Point (PEP) to ask a Policy Decision Point (PDP) whether a Subject may perform an Action on a Resource within a Context.  The PDP returns a Decision indicating whether the operation is allowed or denied.

In classic deployments, the authority a caller needs is largely fixed at provisioning time.  A user is granted a role; an OAuth client is registered with a set of scopes; a service account is granted access to a database.  Runtime denials are uncommon and typically indicate misconfiguration or attack, and the appropriate response is to log, alert, or refuse.

Modern systems increasingly require authorization decisions to evolve during ongoing execution due to delegation, dynamic resource discovery, scope expansion, and long-running agent activity:

* An AI agent executing a multi-step task discovers, mid-execution, that it needs to read a document, query a record, or post to a channel that was not declared when the agent was deployed.  Each previously unseen resource produces a denial, and the same agent may produce many such denials over the course of a single task.
* An OAuth Authorization Server issuing fine-grained access tokens cannot pre-enumerate the cross-resource scope combinations a fleet of long-lived clients will request over time, and so it denies token requests for scope combinations that require governance review (policy evaluation, risk scoring, or human approval) before issuance.
* A gateway acting as a PEP for an internal API encounters a user attempting an operation that requires elevated authority their standing role does not grant.  The deployment expects the gateway to route the request to an owner for approval rather than refuse the call outright.
* A Security Token Service minting tokens for downstream calls discovers that a particular downstream resource requires per-call approval beyond what the upstream token already conveys.

In each pattern, the denial is not a terminal error.  It is a signal that further authority is required before the caller can proceed, that the deployment has a workflow capable of evaluating that request, and that the caller should hand off through a defined protocol surface rather than guess at remediation.  Autonomous callers heighten this requirement: an agent, gateway, or token service has no browser to open and no human present at the moment of denial, and the volume of denials a single such caller produces makes per-deployment integrations unsustainable.

The same need has long existed in user-facing patterns.  SaaS applications surface approval prompts to end users when access is missing.  Identity governance, ITSM, and case-management platforms accept access requests routed from enforcing applications.  These flows are typically implemented through vendor-specific integrations because the protocol layer between authorization enforcement and the workflow that resolves a denial is not standardized.  PEPs without such a standardized surface fall back to non-standard user-interface messages, out-of-band tickets, or vendor-specific governance integrations.

This profile defines that protocol layer: a narrow, interoperable mechanism for requestable denials that applies uniformly to autonomous runtime callers and to user-facing approval flows.  The flow is:

1.  The PEP evaluates access using the AuthZEN Access Evaluation API.
2.  The PDP returns `decision: false` and a structured `access_request` object in the Decision Context when the denial can be resolved by a workflow capable of evaluating the request.
3.  The PEP submits an access request to the Access Request Endpoint.
4.  The Access Request Service returns an opaque task handle.
5.  The PEP can poll the task, receive a callback, or otherwise use the task handle to determine completion.
6.  When the task is approved, the PEP performs a new AuthZEN Authorization API evaluation; the PDP remains authoritative at enforcement time.

This specification intentionally does not define a workflow engine, approval policy language, ticketing system, entitlement catalog, user interface, or approver-facing inbox or enumeration API.  Those capabilities are the responsibility of the PDP or Access Request Service.  In particular, how an approver discovers and acts on pending requests is intentionally out of scope, so that approver-facing surface is not interoperable across implementations by design.  The purpose of this profile is to standardize the handoff between authorization enforcement and the workflow that resolves a denial, so that any PEP, autonomous or user-facing, can route denials through a uniform interface to whatever evaluator the deployment uses, human or automated.

This profile resolves missing authority, not missing information.  A denied evaluation that could be completed with attributes or context the caller already holds is a matter of supplying those inputs; partial evaluation, where the PDP returns the residual conditions a caller can satisfy locally, addresses that case.  A requestable denial is different: the authority does not yet exist at evaluation time, and is created by an asynchronous governance process, often a human approver.  No information the PEP can supply would satisfy such a denial; a workflow must produce new authority first.  The two mechanisms are orthogonal and can be used together.

# Requirements Notation and Conventions

{::boilerplate bcp14-tagged}

The terms Policy Decision Point (PDP), Policy Enforcement Point (PEP), Subject, Resource, Action, Context, and Decision are used as defined by {{AuthZEN}}.

# Design Goals

This profile has the following design goals:

* Preserve the AuthZEN Authorization API's allow/deny decision model.
* Preserve the AuthZEN Authorization API's stateless evaluation model: the PDP retains no decision state between the denial and the re-evaluation, and the durable request and approval state lives in the Access Request Service role.
* Provide an interoperable interface for any PEP to route denied access to a centralized governance evaluator, whether that evaluator is human (an owner, approver, or delegate), automated (a policy engine, risk engine, or rule-based evaluator), or a combination of the two.
* Support high-volume autonomous callers by combining a uniform per-denial submission shape with Access Request Service workflow patterns that absorb load (broad-scope approvals, auto-approval, pre-approval, bulk approval).
* Make requestability explicit and machine-readable so autonomous PEPs can construct a conformant submission without human intervention at submission time.
* Provide an opaque task handle suitable for the asynchronous workflow that resolves a denial.
* Avoid embedding a workflow policy language in the authorization response.
* Allow approval and evaluation systems such as automated policy engines, risk engines, AI supervisors, ITSM platforms, identity governance platforms, chat approval, case management, or custom governance systems to sit behind a common endpoint.
* Support re-evaluation after approval so the PDP remains authoritative at enforcement time.
* Provide enough audit correlation to bind the original denial, submitted request, approver action, and final authorization result.

# Terminology

Access Request:
: A request submitted after a denied AuthZEN Authorization API decision asking that access be approved, granted, or otherwise remediated.

Access Request Service:
: A role that receives Access Request submissions and manages the resulting approval task.  This role MAY be played by the PDP itself (logically part of the PDP), by a service trusted by the PDP (such as a governance platform), or by an independent service operating with delegated authority from the PDP.

: References to "the Access Request Service" in this profile refer to whichever entity plays this role for a given deployment.  The protocol surface, authorization rules, and binding requirements apply uniformly regardless of which deployment shape is chosen.

Requestable Denial:
: An AuthZEN Authorization API Decision with `decision` set to `false` and a Decision Context indicating that the denied access can be requested through an Access Request Endpoint.

Task Handle:
: An opaque identifier and associated status endpoint representing the lifecycle of an Access Request.

Approval Result:
: The completed result of an Access Request task.  An Approval Result does not itself permit access; the PEP uses it to obtain an AuthZEN Authorization API allow decision through a new Access Evaluation, or enforces it according to a profile-defined completion mode where one applies.

Authorization-Relevant Context:
: The subset of AuthZEN Authorization API `context` members that the PDP treats as authorization input and includes in denial binding and approval scope.  Profile machinery members (`access_request`, `evaluation_id`, `evaluated_at`, and `reason`) are not authorization-relevant.  Because denial-binding comparison, approval-scope matching, and idempotent-submission comparison all depend on this set, a PDP MUST make it explicit and integrity-protected whenever any `context` member is authorization-relevant: when denial binding uses a `binding_token`, the token MUST then carry the set as a `binding_context_members` claim ({{binding-token-integrity}}); when denial binding uses `evaluation_id`, the set is the one the PDP recorded for that evaluation and the Access Request Service resolves it server-side.  The Access Request Service MUST use exactly this set.  Absent an integrity-protected or server-resolved set, the authorization-relevant Context is empty and only Subject, Resource, and Action bind.  A PDP SHOULD exclude volatile members (timestamps, nonces, or request identifiers such as `context.time`) from this set, because binding and approval-scope comparison require it to compare equal across the denial and a later submission or re-evaluation.

# Protocol Overview

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

The access evaluation in step 1 uses the existing AuthZEN Access Evaluation API.  The denial in step 2 is still a denial.  The PEP MUST NOT permit the requested operation based only on the presence of `context.access_request`.  Step 6 is a new AuthZEN Authorization API evaluation against the PDP so the PDP remains authoritative at enforcement time.

The flow supports execution continuity across the denial, approval, and re-evaluation boundary.  The Task Handle returned in step 4 is portable: it survives PEP restart, replacement, or handoff to a different runtime instance, and it can be polled or completed by any caller that can authenticate as authorized for the bound Subject, Resource, Action, and operation (see {{task-status-endpoint}} and {{authorization-and-authentication}}).  A caller that pauses execution at the denial in step 2 (for example, an agent runtime or a workflow orchestrator) can therefore persist the Task Handle, allow approval to proceed asynchronously over minutes, hours, or days, and resume execution at step 5 or step 6 from a fresh process without rebuilding session state.  This profile does not define the orchestration that pauses and resumes execution; it provides the protocol primitives a caller needs to implement it.

The Access Request Service MAY additionally publish lifecycle events for governance, audit, and analytics consumers through deployment-level event subscriptions defined by companion specifications.  Such channels are independent of the per-task callback and are not used for enforcement.

# Discovery {#discovery}

A PDP supporting this profile MUST publish an `access_request_endpoint` in PDP metadata.  The endpoint value MUST be an HTTPS URI.

A PDP supporting this profile SHOULD include the following capability URN in the `capabilities` array:

`urn:openid:authzen:capability:access-request`

A PDP that issues or verifies signed values for use under this profile (for example, a JWS-signed `binding_token` or a JWS `approval.state`) MUST publish a `jwks_uri` in PDP metadata.  The value is an HTTPS URI of a JWK Set {{RFC7517}} document containing the verification keys for the signed artifacts this profile defines: PDP-issued `binding_token` values and `approval.state` values signed by the PDP's Access Request Service.  Keys are distinguished by their `kid` and by the JWS `iss`.

Each JWK in the set SHOULD include a `kid` parameter so JWS signatures issued with a `kid` header can be resolved to the corresponding verification key, and SHOULD include a `use` parameter distinguishing signing keys (`use: "sig"`) from any other keys advertised.

Verifiers cache the JWK Set per HTTP cache headers and refresh it on key-rotation events.  An unrecognized `kid` SHOULD cause the verifier to refresh the JWK Set before rejecting the input.

The following is a non-normative metadata example:

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

The `access_request_endpoint` MAY be hosted by the PDP itself, by a service trusted by the PDP, or by an independent service operating with delegated authority from the PDP.  When hosted by a different service, the PDP metadata MUST identify the endpoint actually used by the PEP to submit access requests.

# Requestable Denial Context {#requestable-denial-context}

When an AuthZEN Access Evaluation response denies access and the denial is eligible for an access request, the PDP MAY include an `access_request` object in the Decision Context.

The presence of `context.access_request` is the signal that the denial is requestable.  The PDP MUST include this object only when the denied access is eligible for submission to an Access Request Endpoint; the PEP MUST treat the absence of this object as a non-requestable denial regardless of any other context members.

The `access_request` object has the following members:

`endpoint`:
: OPTIONAL.  HTTPS URI.  The endpoint to which the PEP submits the access request.  If omitted, the PEP MUST use the `access_request_endpoint` from PDP metadata ({{discovery}}).

`template`:
: OPTIONAL.  String.  An opaque template identifier that can guide the Access Request Service.  Implementations typically map `template` to a stable identifier of the approval workflow, request schema, governance policy, or categorical source code that applies to this denial.  The value is not a policy language and MUST NOT be interpreted by the PEP except for display or request submission.

`expires_at`:
: REQUIRED.  String containing an {{RFC3339}} timestamp.  Indicates when the requestable denial hint expires.  The PEP echoes this value as `denial.expires_at` when submitting the Access Request.  The Access Request Service MUST reject submissions received after this time, after applying any clock-skew tolerance it has configured (see {{impl-considerations}}).

`binding_token`:
: OPTIONAL.  String.  Opaque context to be returned to the Access Request Service when submitting the access request.  The PEP MUST NOT decode, modify, or interpret this value.  The PEP returns it unchanged as `denial.binding_token` when submitting the Access Request ({{access-request-submission}}).  When present, the value MUST be integrity protected in a way the Access Request Service can verify, and SHOULD be a JSON Web Signature (JWS) {{RFC7515}} in compact serialization, signed by the PDP, with a payload (such as a JWT {{RFC7519}}) that the Access Request Service can verify and bind to the original denied evaluation.  JSON Web Encryption (JWE) {{RFC7516}} MAY be used in addition to integrity protection when the payload contains information that must not be visible to the PEP, for example by encrypting a signed payload.

`display`:
: OPTIONAL.  Object.  Localizable user-interface hints such as title, description, or recommended call-to-action text.  The PEP MAY ignore this member.

`form_url`:
: OPTIONAL.  HTTPS URI.  URL of a form, hosted by the Access Request Service or another service trusted by the deployment, where the requester can supply additional information required for the Access Request.  Suitable for PEPs that render the form for a human user.  See {{machine-readable-forms}}.

`request_schema_url`:
: OPTIONAL.  HTTPS URI.  URL where the Access Request Service publishes a machine-readable description of the augmentations the PEP must add to the submission's `context` and `requested_access` objects.  RECOMMENDED to be a JSON Schema {{I-D.bhutton-json-schema}} {{I-D.bhutton-json-schema-validation}} document.  Suitable for autonomous PEPs and for PEPs that render forms natively against a schema.  See {{machine-readable-forms}}.

`request_catalogs_url`:
: OPTIONAL.  HTTPS URI.  URL of a Catalogs Document describing how the PEP resolves form fields whose values are selected from a backing catalog.  See {{catalog-references}}.

The Decision's reason (why the evaluation returned `false`) is conveyed in the Decision Context.  The AuthZEN Authorization API treats the contents of the Decision Context as implementation-defined; this profile uses `context.reason` as a machine-readable reason code, which the PEP echoes as `denial.reason` when submitting an Access Request.

The PDP MUST provide enough denial-binding material for the Access Request Service to verify that a submitted Access Request corresponds to the denied evaluation and is still fresh.  A requestable denial therefore MUST include `expires_at` and MUST either include an integrity-protected `binding_token` that protects or constrains the requestable-denial expiry, or include `context.evaluation_id` ({{evaluation-identifier}}) that the Access Request Service can resolve or validate within a server-side binding window.  When neither binding form is available, or when the Access Request Service cannot determine that the binding is unexpired, the PDP MUST NOT include `context.access_request` in the Decision Context.

The following is a non-normative example:

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
      "binding_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0.eyJldmFsdWF0aW9uX2lkIjoiZXZhbF8wMUhYNFkyUDhCUTRZM0YwVjBLOUQ2WjdNMSJ9.bXBfc2lnbmF0dXJl",
      "form_url": "https://requests.example.com/forms/manager_approval",
      "request_schema_url": "https://requests.example.com/schemas/manager_approval.json",
      "request_catalogs_url": "https://requests.example.com/catalogs/manager_approval.json",
      "display": {
        "title": "Request access",
        "description": "Manager approval is required before this document can be opened."
      }
    }
  }
}
~~~

## Evaluation Identifier {#evaluation-identifier}

This profile defines `evaluation_id` as a first-class identifier for an AuthZEN Authorization API evaluation, used by the Access Request Service to bind a submitted Access Request to the denied evaluation it remediates ({{access-request-submission}}).

`evaluation_id` is also the audit thread that links a later re-evaluation back to the initial denied attempt that prompted the Access Request.  Re-evaluation is keyed by the `approval` object rather than by `evaluation_id` ({{completion-semantics}}); nonetheless, the Access Request Service SHOULD retain the original `evaluation_id` in the approval record so the full sequence (denied evaluation, Access Request, approval, and re-evaluation) can be reconstructed for audit.

A PDP returns `evaluation_id` as a member of the AuthZEN Decision Context: `context.evaluation_id`, a string.  The PEP echoes the captured identifier as `denial.evaluation_id` when submitting an Access Request.

`evaluation_id` MUST be stable for a given evaluation: subsequent retrievals or echoes of the same evaluation MUST return the same identifier.  PDPs SHOULD generate identifiers that are unique within the PDP's namespace (for example, ULIDs or UUIDs).  An identifier MAY be reused across distinct evaluations only after the original evaluation's binding window has expired.  The binding window is the period during which the Access Request Service can resolve or validate the identifier for Access Request submission; it MUST NOT extend beyond `context.access_request.expires_at`.

A PDP that returns `context.access_request` without an integrity-protected `binding_token` MUST include `evaluation_id` so the Access Request Service has verifiable denial-binding material.

Profiles that bridge to specifications using a transaction-binding identifier (for example, a token-issuance profile whose underlying specification carries a separate transaction identifier claim) MAY use `evaluation_id` directly as that identifier when its uniqueness, stability, and binding-window properties match the consuming specification's requirements.

A PDP MAY return `evaluated_at` as a member of the AuthZEN Decision Context: `context.evaluated_at`, an {{RFC3339}} timestamp indicating when the Decision was produced.  The PEP echoes the captured timestamp as `denial.evaluated_at` when submitting an Access Request.

# Machine-Readable Forms {#machine-readable-forms}

The OPTIONAL `form_url` and `request_schema_url` members of the `access_request` object ({{requestable-denial-context}}) describe additional submission fields the Access Request Service expects beyond those produced by the original AuthZEN Authorization API evaluation.  PEPs interacting with deployments that do not include either member MAY omit form-schema processing entirely.

* `form_url` identifies a form hosted by the Access Request Service or a service it trusts, suitable for PEPs that render the form for a human user.
* `request_schema_url` identifies a machine-readable description of the same augmentations, suitable for autonomous PEPs and for PEPs that render forms natively against a schema.

When a deployment expects autonomous PEP submissions, the requestable denial SHOULD include `request_schema_url` referencing a JSON Schema {{I-D.bhutton-json-schema}} {{I-D.bhutton-json-schema-validation}} document that describes the augmentations the PEP MUST add to the submission's `context` and `requested_access` objects.  An autonomous PEP MAY consume the schema directly to construct a valid submission.  If the schema requires information the PEP cannot obtain or is not authorized to supply, the PEP MUST NOT fabricate values or submit an incomplete request; it MUST either surface the request for additional input, hand it to another authorized component, or treat the denial as not requestable by that PEP.

Many existing IGA, ITSM, and approval platforms already use proprietary form description languages.  Implementations built on top of such platforms MAY publish a JSON Schema document derived from their native form description.  Some loss of fidelity is expected when translating between form description languages; the JSON Schema referenced by `request_schema_url` SHOULD provide enough information for an autonomous PEP to construct a conformant submission, while richer rendering, widget, and interaction details remain in `form_url`.

Field values that are selected from a backing catalog (for example, applications, entitlements, roles, or cost centers) are described in a separate Catalogs Document referenced by `request_catalogs_url`.  This profile keeps catalog references outside the form schema so the schema remains a pure description of data shape.  See {{catalog-references}}.

This profile does not define a UI rendering vocabulary.  Deployments that need richer rendering hints (such as widget selection, layout, or conditional display) MAY layer a UI vocabulary, identified out of band, typically keyed by `template`.

This profile does not define an agent protocol surface.  Deployments serving agentic PEPs MAY additionally expose Access Request submission through an agent protocol where the tool input schema corresponds to the JSON Schema referenced by `request_schema_url`.  Discovery of such surfaces is out of scope for this specification.

# Catalog References {#catalog-references}

The OPTIONAL `request_catalogs_url` member of the `access_request` object ({{requestable-denial-context}}) is the URL of a Catalogs Document that tells PEPs how to resolve form fields whose values come from backing catalogs (for example, applications, entitlements, roles, or cost centers).  PEPs interacting with deployments that do not include `request_catalogs_url` MAY omit Catalog Endpoint resolution.

The Catalogs Document is a sibling artifact to the form schema; it does not modify or extend the JSON Schema referenced by `request_schema_url`.  This feature is typically paired with the form-schema feature ({{machine-readable-forms}}).

## Catalogs Document

The Catalogs Document is a JSON object retrieved from `request_catalogs_url` using HTTP `GET`.  It has the following members:

`fields`:
: REQUIRED.  Object.  Each member name is a JSON Pointer ({{RFC6901}}) into the form data instance described by the form schema, identifying a field whose value is selected from a catalog.  Each member value is a Catalog Reference object.

Implementations MAY include additional members for documentation or vendor metadata; consumers MUST ignore members they do not recognize.

A Catalog Reference object has the following members:

`endpoint`:
: REQUIRED.  HTTPS URI.  Catalog Endpoint from which catalog items are retrieved.

`search_param`:
: OPTIONAL.  String.  Query parameter used to pass a free-text search term to the Catalog Endpoint.  Defaults to `q`.

`scope_params`:
: OPTIONAL.  Object.  Each member name is the query parameter sent to the Catalog Endpoint and the value is a JSON Pointer ({{RFC6901}}) into the form data instance identifying the source field.  The PEP MUST resolve each pointer at request time and MUST NOT call the Catalog Endpoint until every referenced source field has a value.

`value_path`:
: OPTIONAL.  String.  JSON Pointer ({{RFC6901}}) into a Catalog Item, identifying the value the PEP places into the form field.  Defaults to `/value`.

`label_path`:
: OPTIONAL.  String.  JSON Pointer ({{RFC6901}}) into a Catalog Item, identifying a human-readable label.  Defaults to `/label`.

Non-normative example:

~~~ json
{
  "fields": {
    "/application_id": {
      "endpoint": "https://requests.example.com/catalog/applications",
      "search_param": "q"
    },
    "/entitlement_id": {
      "endpoint": "https://requests.example.com/catalog/entitlements",
      "search_param": "q",
      "scope_params": { "application_id": "/application_id" }
    }
  }
}
~~~

## Catalog Endpoint

A Catalog Endpoint accepts an HTTP `GET` request and returns a paginated list of Catalog Items.

The Catalog Endpoint MUST accept the following query parameters:

* The search parameter named by `search_param` (default `q`): String.  Free-text query supplied by the caller.
* The scope parameters named by `scope_params`: String values taken from other form data fields.
* `cursor`: OPTIONAL.  String.  Opaque pagination cursor returned by a previous response.
* `limit`: OPTIONAL.  Integer.  Caller-requested page size.  The Catalog Endpoint MAY clamp or ignore this value.

The Catalog Endpoint MAY accept additional deployment-specific parameters; receivers MUST ignore parameters they do not recognize.

A Catalog Endpoint SHOULD share an origin with the Access Request Endpoint and SHOULD accept the same caller credentials.  Deployments that host catalogs on a different origin MUST establish a documented mechanism for obtaining credentials accepted by the Catalog Endpoint, for example through OAuth 2.0 Token Exchange {{RFC8693}}; this profile does not define cross-origin credential acquisition.

A Catalog Endpoint MUST:

* authenticate the caller;
* authorize the caller to enumerate the catalog; and
* return only items the caller is permitted to see for the original Subject, Resource, and Action.

The catalog response is itself an authorization boundary; it MUST NOT disclose entries the requester would not be permitted to request.

## Catalog Response

A successful response returns HTTP `200 OK` and a JSON object with the following members:

`items`:
: REQUIRED.  Array of Catalog Items.  Each Catalog Item is a JSON object containing the value identified by `value_path` and SHOULD include the value identified by `label_path`.  Items SHOULD include the following well-known optional members when applicable, and MAY include additional vendor-specific metadata:

  * `description`: String.  Human-readable description of the item.
  * `risk_level`: String.  Risk classification used by the deployment (for example, `low`, `medium`, `high`).  Useful for agent and human triage.
  * `granted`: Boolean.  When `true`, indicates that the requester already has access to the item.  Allows a PEP to suppress redundant or no-op Access Request submissions.
  * `owner`: Object or String.  Identifier or reference for the item's owner, when the catalog tracks ownership.

`next_cursor`:
: OPTIONAL.  String.  Opaque cursor that the caller passes as `cursor` to retrieve the next page.  Absent when no further pages are available.

`total`:
: OPTIONAL.  Integer.  Approximate total number of items matching the search and scope filters.  Used as a hint only; the PEP MUST NOT rely on its accuracy.

Non-normative example:

~~~ http
GET /catalog/entitlements?application_id=app_123&q=customer&limit=2 HTTP/1.1
Host: requests.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Accept: application/json
~~~

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "items": [
    {
      "value": "ent_abc",
      "label": "Customer Records (Read)",
      "description": "Read access to customer master data"
    },
    {
      "value": "ent_def",
      "label": "Customer Records (Write)",
      "description": "Write access to customer master data",
      "risk_level": "high"
    }
  ],
  "next_cursor": "eyJvZmZzZXQiOjJ9"
}
~~~

## PEP Resolution Rules

A PEP submitting an Access Request based on a form schema with a companion Catalogs Document:

* MUST treat field values resolved from a catalog as opaque identifiers; the value submitted is exactly the value identified by `value_path` in the chosen Catalog Item.
* MUST resolve every `scope_params` source field before calling the Catalog Endpoint for a dependent field.
* MUST NOT submit catalog values that were not returned by the Catalog Endpoint with the same scope parameters.
* SHOULD use `search_param` rather than enumerating large catalogs.
* MUST treat unknown members of a Catalog Item as informational and MUST NOT rely on them for enforcement.
* MUST NOT treat `granted` or any other Catalog Item member as an authorization decision.  Such members MAY be used to suppress or shape Access Request submission, but MUST NOT be used as authorization input.

## Access Request Service Catalog Validation

The Access Request Service MUST validate submitted catalog identifiers at submission time.  It MUST reject, normalize, or route for additional review any submitted catalog value that is no longer valid, no longer requestable by the caller, disabled, retired, or materially different in risk or ownership from the item resolved by the PEP.

## Agent Protocol Catalogs {#catalog-agent-protocol}

Deployments serving agentic PEPs MAY additionally expose catalogs through an agent protocol.  When such a protocol is used, each catalog SHOULD be exposed as a resource whose identifier or URI template encodes the same scope parameters described by `scope_params` (for example, `entitlements://{application_id}`).  Resource read responses SHOULD use the Catalog Response shape defined in this section.

This profile does not define agent-protocol discovery or transport.  When both an HTTP Catalog Endpoint and an agent-protocol catalog are exposed, they MUST return the same Catalog Items for equivalent scope parameters.

# Access Request Endpoint

The Access Request Endpoint accepts an Access Request submission and returns a Task Handle.

The endpoint is identified by the `access_request_endpoint` PDP metadata parameter or by the `context.access_request.endpoint` value returned in a requestable denial.  The endpoint path is deployment-specific.

## Access Request Submission {#access-request-submission}

The PEP submits an Access Request using the HTTP `POST` method as defined in {{RFC9110}}.

The request body is a JSON object with the following members:

`subject`:
: REQUIRED.  The AuthZEN Subject from the denied evaluation.

`resource`:
: REQUIRED when `items` is absent; MUST be omitted when `items` is present.  The AuthZEN Resource from the denied evaluation.

`action`:
: REQUIRED when `items` is absent; MUST be omitted when `items` is present.  The AuthZEN Action from the denied evaluation.

`items`:
: OPTIONAL.  Array.  Multiple `(resource, action)` items submitted as a single bundled Access Request.  When present, `resource` and `action` MUST be omitted at the top level.  Each item is an object with the following members:

  * `resource`: REQUIRED.  The AuthZEN Resource for this item.
  * `action`: REQUIRED.  The AuthZEN Action for this item.
  * `requested_access`: OPTIONAL.  Per-item `requested_access` overrides; merged with the top-level `requested_access` with item values taking precedence.
  * `denial`: OPTIONAL.  Per-item denial binding when items came from separate AuthZEN Authorization API evaluations.  A per-item `denial` uses the same members as the top-level `denial` object.  See the top-level `denial` definition below for coverage rules.

`context`:
: OPTIONAL.  The AuthZEN Context from the denied evaluation, augmented with submission-time fields such as business justification.  Submission-time augmentations MUST NOT change or remove authorization-relevant context from the denied evaluation.  When the Access Request Service needs to distinguish original evaluation context from submission-time input, deployments SHOULD place the latter in well-defined extension members rather than overwriting original context members.

`denial`:
: Object binding the Access Request to the denied AuthZEN Decision.  REQUIRED in the following cases:

    * `items` is absent: the `denial` binds the single submitted Subject, Resource, Action, and authorization-relevant Context.
    * `items` is present and any item lacks a per-item `denial`: the top-level `denial` is a bundle denial whose verifiable binding material MUST cover the Subject, authorization-relevant Context, and every Resource and Action in `items`.

  OPTIONAL when `items` is present and every item carries its own per-item `denial`.

  An Access Request whose denial binding does not cover the submitted Subject, Resource, Action, and authorization-relevant Context (for every item when `items` is present) MUST be rejected with `urn:openid:authzen:access-request:error:invalid_denial_binding`.

`requested_access`:
: OPTIONAL.  Object containing request-specific information such as requested duration, requested role, requested entitlement, or requested scope.  This object does not define policy semantics and is interpreted by the Access Request Service.  The following well-known optional members are defined; additional members MAY be included subject to {{extension-naming}}:

  * `requested_until`: String.  {{RFC3339}} timestamp requesting access through a specific absolute time.
  * `emergency`: Boolean.  When `true`, requests an expedited or emergency-access path subject to additional auditing.

`callback`:
: OPTIONAL.  Object describing a callback endpoint where the Access Request Service can send completion notifications.

`client`:
: OPTIONAL.  Object identifying the PEP or calling application submitting the Access Request, supplementing the authenticated caller identity.  The following members are defined; implementations MAY include additional members.

  * `id`: OPTIONAL.  String.  Stable identifier for the calling application or PEP deployment.
  * `name`: OPTIONAL.  String.  Human-readable name of the calling application.
  * `actor`: OPTIONAL.  Object identifying the immediate actor on whose behalf the PEP submits the Access Request, when that actor differs from the Subject or when the deployment needs to audit the actor separately.  The following members are defined; implementations MAY include additional members.
    * `id`: REQUIRED.  String.  Stable identifier for the actor.
    * `issuer`: OPTIONAL.  String.  Issuer, authority, tenant, or identity provider for the actor identifier.
    * `type`: OPTIONAL.  String.  Actor category, such as `user`, `service`, `workload`, or `ai_agent`.
    * `act`: OPTIONAL.  Object.  Nested actor representing the next link in a delegation chain, following the conventions in {{?I-D.mcguinness-oauth-actor-profile}}.  Each `act` carries `sub` and `iss` (corresponding to `id` and `issuer` in the immediate actor) and optionally `sub_profile`; nesting represents the chain from the immediate actor outward toward the Subject.  See {{delegation}}.
  * `source`: OPTIONAL.  Object.  Audit-trail context describing where the request originated.  The following members are defined; implementations MAY include additional members.
    * `session_id`: OPTIONAL.  String.  Identifier of a bounded interaction context that produced the request, such as a chat or agent conversation, a web or mobile application session, a CLI invocation, or a long-running workflow thread.  This is an audit-origin identifier and is distinct from any authentication or authorization session associated with the caller.
    * `external_url`: OPTIONAL.  HTTPS URI.  URL of an external system (ticket, document, dashboard, chat thread) that motivated the request.
    * `integration_id`: OPTIONAL.  String.  Identifier of an upstream integration or workflow that produced the request.

  The `actor` and `source` objects are supplied for authorization, routing, and audit correlation.  The Access Request Service MUST NOT rely on `client.actor` or `client.source` as authorization input unless the values are independently verified by the service.

The `denial` object has the following members.  Each field maps directly to a single member of the PDP's denied evaluation response; the `denial` object does not echo the full AuthZEN Decision because the binding material (`evaluation_id` and `binding_token`) provides stronger evidence of the denial than a verbatim JSON echo could.

`evaluation_id`:
: REQUIRED when `denial.binding_token` is absent; otherwise RECOMMENDED.  A stable identifier for the denied evaluation, captured by the PEP from `context.evaluation_id` in the AuthZEN Decision and echoed unchanged here ({{evaluation-identifier}}).  The Access Request Service MUST be able to resolve or validate `evaluation_id` before relying on it as denial-binding material.  `evaluation_id` provides the strongest audit binding between the original denial and the submitted Access Request and SHOULD be preferred over `evaluated_at` alone.

`evaluated_at`:
: OPTIONAL.  {{RFC3339}} timestamp indicating when the denial was produced, echoed from `context.evaluated_at` of the denied evaluation.

`expires_at`:
: REQUIRED.  {{RFC3339}} timestamp indicating when the requestable denial hint expires, echoed unchanged from `context.access_request.expires_at` of the denied evaluation.  The Access Request Service MUST reject submissions received after this time, after applying any clock-skew tolerance it has configured (see {{impl-considerations}}).

`reason`:
: OPTIONAL.  String.  Machine-readable reason code for the denial, echoed unchanged from `context.reason` of the denied evaluation.

`binding_token`:
: REQUIRED when `denial.evaluation_id` is absent; otherwise OPTIONAL.  String.  Integrity-protected binding material echoed unchanged from `context.access_request.binding_token` of the denied evaluation ({{requestable-denial-context}}).  The PEP MUST NOT decode, modify, or interpret this value; it returns the original PDP-issued value byte-for-byte.

`template`:
: OPTIONAL.  String.  Echoed unchanged from `context.access_request.template` of the denied evaluation, when the PDP provided one.  The Access Request Service uses this value to route the request to the appropriate workflow.

The PEP determines the additional members of the `context` and `requested_access` objects from the JSON Schema referenced by the requestable denial's `request_schema_url`, when present.  Field values that are selected from a backing catalog are resolved according to the Catalogs Document referenced by `request_catalogs_url`; see {{catalog-references}}.

A PEP MUST submit an Access Request only for an AuthZEN Decision with `decision` equal to `false` and a `context.access_request` object present in the Decision Context.

The submitted `denial` object for each requested item MUST include either `denial.binding_token` or `denial.evaluation_id`.  The Access Request Service MUST reject a submission that lacks verifiable denial-binding material with `urn:openid:authzen:access-request:error:invalid_denial_binding`.

A PEP SHOULD include an `Idempotency-Key` header, following the conventions described in {{I-D.ietf-httpapi-idempotency-key-header}}.  The Idempotency-Key covers the entire submission body, including all members of the `items` array when present.

The Access Request Service SHOULD treat a repeated submission with the same `Idempotency-Key`, the same authenticated requester, and an equivalent submission body as the same request, returning the same Task Handle while the original request remains available.  A submission with the same `Idempotency-Key` and authenticated requester but a materially different submission body MUST be rejected with `urn:openid:authzen:access-request:error:duplicate_request`.  Two submission bodies are equivalent when they are identical under a deterministic comparison chosen by the Access Request Service (for example, a stable JSON canonicalization that ignores insignificant whitespace and object-member ordering, excluding the `Idempotency-Key` header itself).  Because the same Access Request Service that recorded the `Idempotency-Key` evaluates the retry, this comparison is a single-server concern and need not be interoperable across implementations; a body that is not equivalent under it is materially different.

The Access Request Service SHOULD retain Idempotency-Key state at least until `task.expires_at` and SHOULD continue to retain it for at least 24 hours after the task reaches a terminal status.  This window lets retries from delayed PEP restarts find the original task rather than spawning a duplicate.  After the retention window elapses, the Access Request Service MAY reclaim the Idempotency-Key; a submission presenting a previously seen Idempotency-Key whose state has been reclaimed is processed as a new submission.

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
    "binding_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0.eyJldmFsdWF0aW9uX2lkIjoiZXZhbF8wMUhYNFkyUDhCUTRZM0YwVjBLOUQ2WjdNMSJ9.bXBfc2lnbmF0dXJl",
    "template": "manager_approval"
  }
}
~~~

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

## Access Request Response {#access-request-response}

A successful Access Request submission returns HTTP status code `201 Created` or `202 Accepted` and a JSON object containing a `task` member.  The `task.status_endpoint` member is authoritative for subsequent status retrieval.  A response MAY also include an HTTP `Location` header equal to `task.status_endpoint`.

The response object has the following top-level members:

`task`:
: REQUIRED.  Task Handle returned for the submitted Access Request.

`result`:
: OPTIONAL except where required by {{completed-task-response}}.  Completion result for the task.  A PEP MUST NOT treat this member as approval unless the task is approved and the result is enforceable under {{completion-semantics}}.

When the Access Request Service is able to resolve the request synchronously (for example, when policy auto-approves and provisioning completes within the request), the Access Request Service SHOULD return `201 Created` with `task.status` already set to a terminal value and a populated `result` member ({{completion-semantics}}).  PEPs MUST handle this synchronous-completion case without polling; the Task Status Endpoint remains usable for later retrieval but is not on the critical path.

The `task` object has the following members:

`id`:
: REQUIRED.  Stable, opaque, and unguessable task identifier.  The value MUST contain sufficient entropy to prevent practical guessing and MUST NOT encode semantics that a PEP is expected to parse.

`status`:
: REQUIRED.  Current task status.  Values are defined in {{task-status}}.

`status_endpoint`:
: REQUIRED.  HTTPS URI used to retrieve task status.  An intermediate enforcer (such as an OAuth Authorization Server or other gateway acting as PEP) MAY proxy or re-present this endpoint to its own callers; the value advertised to such callers MAY differ from the value the PEP itself uses, provided the proxied endpoint observes the authorization rules defined for the original endpoint.

`progress`:
: OPTIONAL.  Object describing approval workflow progress for tasks with multi-step approvals.  When `items` is present, `progress` describes aggregate workflow progress for the bundled task; per-item progress is tracked in `task.items[]`.  The following members are defined:

  * `current_step`: OPTIONAL.  Integer.  One-based index of the step currently in progress.
  * `total_steps`: OPTIONAL.  Integer.  Total number of approval steps configured for the task.
  * `step_name`: OPTIONAL.  String.  Short identifier of the current step (for example, `manager_approval` or `resource_owner_review`).
  * `awaiting`: OPTIONAL.  Array.  Identifiers of approvers whose action is currently expected.  Implementations SHOULD apply privacy controls before populating this member; see {{privacy-considerations}}.

`expires_at`:
: OPTIONAL.  {{RFC3339}} timestamp after which the task handle is no longer valid.

`display`:
: OPTIONAL.  Object containing user-interface hints for the pending request.

`links`:
: OPTIONAL.  Object containing related URLs.  Each member name is a link relation type and the value is an HTTPS URI.  The following relation types are defined; implementations MAY define additional relation types.

  * `ticket`: URL where the requester (Subject) can view the request and its status.
  * `review`: URL where an approver or administrator can review or act on the request.
  * `cancel`: URL where the PEP can cancel the request, when PEP-initiated cancellation is supported.

`items`:
: REQUIRED when the original submission carried an `items` array; otherwise OPTIONAL.  Array.  Per-item progress for bundled Access Requests.  Each element corresponds positionally to the submission's `items` member and has the following members:

  * `resource`: REQUIRED.  The AuthZEN Resource for this item, echoing the submission.
  * `action`: REQUIRED.  The AuthZEN Action for this item.
  * `status`: REQUIRED.  Per-item status using the values defined in {{task-status}}.
  * `result`: OPTIONAL before the item reaches a terminal status; REQUIRED when the item status is `approved`.  Per-item completion result with the same shape as the top-level `result` ({{completion-semantics}}).

When the `items` member is present, the aggregate `task.status` is computed from per-item statuses as follows:

* If any item is `pending` or in an implementation-defined non-terminal status ({{task-status}}), the aggregate is `pending`.
* Otherwise, if all items share the same terminal status, the aggregate is that status.
* Otherwise, with two or more distinct terminal statuses present across items, the aggregate is `partial`.

A PEP processing a bundled task MUST consult `task.items[].status` and `task.items[].result` to determine per-item outcomes; the PEP MUST NOT infer per-item outcomes from the aggregate `task.status` alone.  A top-level `result` MUST NOT be used to authorize any individual item in a bundled task unless the same result is also present in that item's `result` member.

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

# Task Status Endpoint {#task-status-endpoint}

The Task Status Endpoint allows the PEP to retrieve the state of a previously submitted Access Request.

The PEP calls the `status_endpoint` using the HTTP `GET` method as defined in {{RFC9110}}.

The Task Handle is portable across PEP instances and process lifetimes.  A caller MAY interact with the Task Handle, such as polling status or initiating cancellation, even if that caller is not the original submitting PEP, provided the caller is authorized for the original Subject, Resource, Action, task, and requested operation.  This supports PEP restart, replacement, and agent-runtime handoff, where the Task Handle flows through application context (such as a conversation thread, a session store, or a workflow orchestrator).  This profile does not define an enumeration API for tasks belonging to a Subject; Task Handles are exchanged through the channels by which the original Access Request response was delivered.

Non-normative example:

~~~ http
GET /access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4 HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Accept: application/json
~~~

A successful response returns a JSON object containing a `task` member.  Completed task responses include a `result` member according to the rules in {{completed-task-response}}.

When a task is `pending`, a PEP MAY poll the Task Status Endpoint to determine completion.  PEPs SHOULD use exponential backoff: a starting interval of several seconds, growing to no more than one minute, with jitter applied to spread load across many concurrent pollers.  If the Access Request Service returns the `Retry-After` HTTP header (Section 10.2.3 of {{RFC9110}}), the PEP MUST wait at least the indicated duration before issuing the next poll.  The PEP MUST stop polling once `task.expires_at` is reached or the task reaches a terminal status ({{state-transitions}}).  PEPs subscribed to per-task callbacks ({{callback-completion}}) or to deployment-level event subscriptions MAY skip polling entirely and rely on push notification, falling back to a single status retrieval after each notification to obtain any enforceable `result`.

## Task Status Values {#task-status}

The following task status values are defined:

`pending`:
: The request has been accepted and is awaiting processing or approval.

`approved`:
: The request was approved.  Approval does not by itself grant access unless accompanied by a result that can be enforced under {{completion-semantics}}.

`denied`:
: The request was denied by the approval workflow.

`expired`:
: The request expired before completion.

`cancelled`:
: The request was cancelled by the requester, approver, administrator, or system.

`failed`:
: The request could not be completed due to an error.

`partial`:
: All items in a bulk task ({{access-request-response}}) reached terminal status, but with mixed outcomes (for example, some items approved while others denied).  This status is only valid for tasks containing an `items` array.  A PEP receiving `partial` MUST consult `task.items[].status` to determine per-item outcomes and MUST NOT infer aggregate access permission.

Implementations MAY define additional status values.  A PEP that receives an unknown status value MUST treat the task as not approved.

### State Transitions {#state-transitions}

In the base state machine, a task is created in the `pending` state and transitions exactly once to one of the terminal states defined above.  Terminal states do not transition further.

~~~ ascii-art
                          (created)
                              |
                              v
                       +-------------+
                       |   pending   |
                       +------+------+
                              |
   +----------+----------+----+----+-----------+-----------+
   |          |          |        |           |           |
   v          v          v        v           v           v
+--------+ +------+ +-------+ +----------+ +--------+ +---------+
|approved| |denied| |expired| |cancelled | | failed | | partial |
+--------+ +------+ +-------+ +----------+ +--------+ +---------+
                                                       (bulk only)
~~~

The following transitions are defined from `pending`:

| To | Trigger |
|---|---|
| `approved` | Approval workflow completes successfully. |
| `denied` | Approval workflow rejects the request. |
| `expired` | `task.expires_at` is reached before the request reaches a terminal state. |
| `cancelled` | The request is cancelled by the requester, approver, administrator, or PEP using the cancellation endpoint ({{cancellation}}). |
| `failed` | A system error prevents the request from completing. |
| `partial` | Bulk tasks only.  All items in the `items` array reach terminal status, with two or more distinct terminal statuses present.  See aggregation rules in {{access-request-response}}. |

For tasks containing an `items` array, each item independently follows the same base state machine; the aggregate `task.status` is computed from per-item statuses according to the aggregation rule in {{access-request-response}}.

Implementations that define additional status values ({{task-status}}) extend the state machine.  Such extensions SHOULD specify the transitions into and out of the new state and document them alongside the value definition.

### Mapping Backend States {#status-mapping}

Access Request Services typically maintain richer task lifecycle state than the canonical statuses defined above.  Common backend models include separate fields for open versus closed, processing versus waiting, escalation states, and auto-approval states.  Implementations are expected to collapse such richer state into the canonical statuses for the purpose of the Task Status Endpoint.

The following non-normative mapping illustrates one such collapse and may be used as a starting point:

| Backend state | Canonical status |
|---|---|
| Open, awaiting approval or processing | `pending` |
| Closed, all required approval steps satisfied | `approved` |
| Closed, an approval step rejected the request | `denied` |
| Closed, time-bounded request elapsed before completion | `expired` |
| Closed, requester or administrator stopped the request | `cancelled` |
| Closed, system error prevented completion | `failed` |
| Closed, items in a bulk task reached two or more distinct terminal statuses | `partial` |

Implementations SHOULD document the mapping they apply so that PEP behavior remains predictable across upgrades and operational changes.

## Pending Task Response

A response with `task.status: pending` echoes the Task Handle returned at submission ({{access-request-response}}).  Subsequent polls return the same response shape with status, progress, and link members updated as the task advances; when the task reaches a terminal status, the response form is governed by {{completed-task-response}}.

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

A completed task response includes result information as follows:

* When `task.status` is `approved` and the task does not contain an `items` array, the response MUST include a top-level `result` object.
* When `task.status` is `approved` and the task contains an `items` array, each approved item in `task.items[]` MUST include its own `result` object.  The response MAY also include a top-level `result` object for aggregate workflow information, but a PEP MUST NOT use that top-level `result` to authorize an individual item unless the same result is also present in that item's `result` member.
* For any other terminal status, the response MAY include a `result` object for diagnostic or workflow information, but the PEP MUST NOT treat it as approval.
* When present, the `result` object MUST use one of the completion forms defined in {{completion-semantics}}.

A task remains retrievable from the Task Status Endpoint after it has reached a terminal status, until `task.expires_at` is reached or the Access Request Service removes it according to local retention policy.  After expiry or removal, the Task Status Endpoint MUST return `urn:openid:authzen:access-request:error:task_expired` or `urn:openid:authzen:access-request:error:unknown_task` as appropriate.

Cancellation of a pending Access Request MAY be performed by the Access Request Service, the requester through a separate user interface, an approver, or the PEP using the cancellation endpoint defined in {{cancellation}}.

Non-normative example:

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "task": {
    "id": "arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "status": "approved"
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

## Cancellation {#cancellation}

An Access Request Service MAY support PEP-initiated cancellation of a pending Access Request.  When supported, the Task Handle MUST include a `links.cancel` member.  The PEP cancels by issuing an HTTP `POST` to `links.cancel`; implementations MAY also accept HTTP `DELETE` against `links.cancel` as an equivalent cancellation request.

The cancellation request body is an OPTIONAL JSON object with the following members:

`reason`:
: OPTIONAL.  String.  Stable, machine-readable reason code.

`comment`:
: OPTIONAL.  String.  Human-readable cancellation note for audit.

A successful cancellation returns `200 OK` and the updated `task` object whose `status` is `cancelled`.  Cancellation of a task that has already reached a terminal status returns `409 Conflict` using the `urn:openid:authzen:access-request:error:invalid_task_state` problem type.

The Access Request Service MUST authenticate the PEP and MUST verify the PEP is authorized for the original Subject, Resource, Action, task, and cancellation operation.  Authorization to submit the original request or to act for the Subject does not by itself authorize cancellation; the service MUST verify authorization for the bound Resource, Action, task, and operation.

An Access Request Service that does not support PEP-initiated cancellation omits `links.cancel`; a cancellation attempted at any cancellation endpoint in such a deployment returns `405 Method Not Allowed`.

For a task containing an `items` array, cancellation cancels every item currently in `pending` status; items already in a terminal status remain unchanged.  Behavior for items in implementation-defined non-terminal statuses ({{task-status}}) is implementation-defined; an Access Request Service that defines additional non-terminal statuses SHOULD document whether cancellation transitions those items to `cancelled` or leaves them unchanged.  The aggregate `task.status` is recomputed according to the aggregation rule defined in {{access-request-response}}, which yields `cancelled` when no item completed before cancellation, or `partial` when some items reached other terminal statuses first.  Cancellation of a bulk task in which every item is already in a terminal status returns `409 Conflict` with `urn:openid:authzen:access-request:error:invalid_task_state`.

PEPs that need to abandon an outstanding request without using this endpoint MAY stop polling and rely on `task.expires_at` and Access Request Service expiry to release resources.

# Completion Semantics {#completion-semantics}

This profile defines a single completion mode, identified by `result.mode`: `reevaluate`.  The mode instructs the PEP to perform a new AuthZEN Access Evaluation after approval, so the PDP remains authoritative at enforcement time.

Re-evaluation does not require the PDP to retain decision state from the original denial.  The PDP treats the approval as an input attribute: the PEP carries the `approval` object into the new Access Evaluation at `context.approval`, and the PDP reads it the way it reads any other backing attribute, such as a role, group membership, or risk signal.  The new evaluation runs against current policy and current state; it is not a resumption of the earlier evaluation.  Whether the re-evaluation must reach the same PDP is a property of the binding topology, not of this profile: an integrity-protected `approval.state` can be verified by any PDP that holds the issuer's verification key, while an `approval.id` resolved against server-side state requires a PDP that shares that state.

Profiles of this specification MAY define additional completion modes through the `result.mode` extension point ({{extensibility}}).  Implementations that bind approval to a specific issuance flow, such as OAuth token issuance where the issued token is itself the decision representation, MUST do so through a profile that defines a completion mode appropriate to that flow; the base profile does not define such a mode.  A PEP that receives an unknown `result.mode` value MUST treat the task as not approved and MUST NOT permit access on the basis of that result.

Most existing approval, IGA, and ITSM systems map naturally onto Re-evaluation Mode: approval changes state in a backing system, and a subsequent AuthZEN Authorization API evaluation reflects that state.  See {{impl-considerations}} for deployment patterns that adopt this mapping.

For a task containing an `items` array ({{access-request-response}}), each approved item MUST include a per-item `result` that is independently enforceable according to its own `result.mode`.

When `result.mode` is `reevaluate`, the result MUST include an `approval` member.  The `approval` object identifies the approval that completed the Access Request task and has the following members:

* `id`: REQUIRED.  String.  Stable, opaque, and unguessable identifier of the approval.  The value MUST contain sufficient entropy to prevent practical guessing and MUST NOT encode semantics that a PEP is expected to parse.
* `approved_at`: OPTIONAL.  {{RFC3339}} timestamp indicating when the approval completed.
* `approved_until`: REQUIRED.  {{RFC3339}} timestamp indicating the latest time through which the approval remains valid.  The PEP MUST NOT use the approval for re-evaluation after this timestamp.

The `approval` object MAY additionally include a `state` member.  `state` is an opaque JSON value populated by the Access Request Service or PDP, carrying proof or verifier state the PDP needs at re-evaluation time (for example, a signed reference, an extended lookup token, or deployment-specific state).  The PEP MUST preserve the JSON value exactly and MUST NOT modify or interpret the contents of `approval.state`.

The `evaluation_id` of the original denied evaluation is denial-binding material for the Access Request submission; it is not the authorization handle used during re-evaluation.  During re-evaluation, the chain back to the approved Access Request and original denial is represented by the `approval` object.  The PDP MUST be able to resolve or verify `approval.id`, `approval.state`, or both, and bind the approval to the Access Request task, the original denied evaluation when recorded, the approved Subject, Resource, Action, relevant Context, approval scope, and approval expiry.  When both `approval.id` and an integrity-protected `approval.state` are present and `approval.state` carries its own approval identifier, the PDP MUST verify that the two identifiers match, and MUST reject the re-evaluation on mismatch.

The PDP MUST NOT authorize a re-evaluation solely because the request contains a known `approval.id`.  The PDP MUST verify that the approval reference presented in `context.approval` is applicable to the authenticated caller or requester, current Subject, Resource, Action, relevant Context, approval scope, and approval expiry.  A swapped, replayed, expired, or otherwise non-applicable approval reference MUST be ignored or rejected, and the PDP MUST evaluate the request as not approved by that reference.

An approval reference has two deployment patterns:

* Lookup: the PDP resolves `approval.id` in trusted server-side state.
* Bound reference: the PDP verifies `approval.state`, which carries integrity-protected proof or verifier state.

Deployments MAY use both patterns together.  In all cases, the PDP MUST verify the approval against trusted state or integrity-protected binding material; neither `approval.id` nor `approval.state` is a bearer grant by itself.

When the PDP cannot resolve `approval.id` from trusted server-side state shared with, or delegated by, the Access Request Service, the Approval Result MUST include `approval.state` or another profile-defined PDP-verifiable artifact.  An Access Request Service MUST NOT return a Re-evaluation Mode result that the PDP cannot verify without trusting PEP-supplied assertions.

When `approval.state` is carried by value as a JWS, the verifying PDP MUST be able to discover the signer's verification key.  The JWS MUST carry an `iss` claim identifying the signer (the Access Request Service, or the PDP acting through it) and SHOULD carry a `kid` header.  The verification key is published in the PDP's `jwks_uri` JWK Set ({{discovery}}), which holds the verification keys for every signed artifact this profile defines; the PDP selects the key by `iss` and `kid`.  Because the Access Request Service is logically part of, trusted by, or delegated by the PDP, the deployment ensures the Access Request Service's approval-state signing keys are present in that JWK Set.  A JWS `approval.state` MUST carry an `aud` (or equivalent intended-recipient) claim identifying the verifying PDP, which the PDP MUST verify, so the value cannot be replayed to a different PDP that shares the signer's key.  A PDP that cannot resolve the signer's key, or resolves it to a key not trusted for the claimed `iss`, MUST reject the `approval.state`.  This `jwks_uri` is symmetric across both directions: the Access Request Service verifies PDP-signed denial binding from it, and the PDP verifies Access-Request-Service-signed approval state from it.

The approval record or verifiable binding material MUST contain, or allow the PDP to determine, at least the approval identifier, Access Request task identifier, original denied evaluation identifier when available, approved Subject, approved Resource and Action or approval scope, requester and client binding, approval status, `approved_at` when available, `approved_until`, and any revocation or cancellation state.

The PEP MUST include the `approval` object unchanged at `context.approval` inside the AuthZEN Authorization API re-evaluation request.  The PDP receives the same `approval` shape it produced (id, timestamps, and any `state`) and uses it to identify and verify the approval.

The PDP MUST evaluate the new request using current policy and the approval reference.  The PDP MAY still deny access if policy, subject, resource, action, context, approval lifetime, or risk state no longer permits access.

The PDP MUST check current approval status during re-evaluation, including whether the approval has been revoked, cancelled, superseded, or otherwise invalidated before `approved_until`.  The `approved_until` timestamp is a PEP-side maximum reuse and enforcement bound; it does not prevent the PDP from denying earlier because of revocation, cancellation, policy change, risk change, or other current state.

When the re-evaluation response indicates an approval expiry (typically as `context.approval.approved_until`), the PEP MUST NOT enforce access past that timestamp.  PEPs that issue downstream credentials on the basis of the approved evaluation (for example, an OAuth Authorization Server issuing access tokens) MUST bound the lifetime of those credentials by the earlier of the approval expiry in the Approval Result and any approval expiry returned by the PDP during re-evaluation.

When the original submission carried an `items` array, the PEP re-evaluates each approved item separately, including that item's `result.approval` at `context.approval` in the item's re-evaluation request as described above.  This profile does not define an aggregate re-evaluation that covers multiple items in one AuthZEN Authorization API call.

Approval results in this mode typically cover a class of future evaluations rather than a single submission.  An approval that grants the requester an entitlement, role, scope, or other persistent state causes subsequent AuthZEN Authorization API evaluations matching that state to succeed without further Access Requests.  Deployments serving high-volume callers, such as autonomous agents that discover and request many fine-grained permissions over time, rely on this property: a single broad-scope approval (for example, one that grants access to a class of resources for a defined duration) reduces the number of denial-and-approval cycles by orders of magnitude.

An Approval Result is associated with an approval scope: a description of the class of future Access Evaluations for which the approval may be considered.  This specification does not define a general approval-scope matching language.  It defines one portable baseline and leaves broader matching to deployments and downstream profiles:

* Exact-match baseline (interoperable).  The default approval scope is the original denied Subject, Resource, Action, and authorization-relevant Context bound to the Access Request.  An evaluation is within this scope when its Subject, Resource, Action, and authorization-relevant Context are equal, member by member, to the bound values, using the same structural comparison and authorization-relevant Context set as denial binding.  Subject, Resource, and Action comparison includes the full AuthZEN Authorization API objects, including any `properties` members present in the bound values, except that `subject.properties.act` is excluded because the PEP MAY normalize the actor to `client.actor` ({{delegation}}).  This baseline is engine-neutral, and two independently implemented PDP and Access Request Service pairs MUST interoperate on it.  In the bound-reference topology, where the verifying PDP does not share recorded state with the Access Request Service, the verifiable approval material (for example, a `binding_context_members`-equivalent claim in `approval.state`) MUST convey the authorization-relevant Context member set so the PDP applies the same set.
* Broadened scope (deployment-defined).  Broader approvals (a class of resources, a role or entitlement, a time-bounded tool class) are where the broad-approval benefit lives, but their matching is not portable across policy engines.  Broadened-scope representation and matching are deployment-specific or defined by downstream profiles.  This profile deliberately does not define context-constraint matching.

Approval workflow policy at the Access Request Service determines how broad an approval grants; this profile does not constrain that policy beyond the integrity, expiry, and audit requirements stated elsewhere.

Unless the Access Request Service or PDP records a broader or narrower approval scope, the default approval scope is the original denied Subject, Resource, Action, and relevant Context bound to the Access Request.  For a bundled Access Request, the default approval scope for each approved item is that item's Subject, Resource, Action, and relevant Context.  This default scope is not serialized in the Approval Result unless a profile or deployment defines a representation for it.

The PDP MUST only consider an Approval Result applicable when the current evaluation request is within the approval scope recorded for that Approval Result.

A PEP MUST NOT treat an Approval Result as authorizing any future Access Evaluation solely on the basis that the Access Request was approved.  A PEP MAY include the Approval Result in a subsequent Access Evaluation (by placing the `approval` object at `context.approval` as described above), but the PDP remains responsible for determining whether the Approval Result applies under current policy.  A PEP MAY cache or retain an Approval Result, but MUST NOT independently infer that a future request is covered by that approval unless directed by the PDP or by a profile-defined mechanism.

The following non-normative example carries an integrity-protected `approval.state` (here a compact JWS signed by the Access Request Service), which the PDP verifies at re-evaluation.  This is the portable form: it works whether or not the PDP and Access Request Service share state, and a PDP coding to it has verifiable binding material rather than a bare identifier.  A deployment in which the PDP and Access Request Service share trusted state MAY instead omit `approval.state` and have the PDP resolve `approval.id` by server-side lookup.

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
      "approved_until": "2026-05-01T00:42:00Z",
      "state": "eyJhbGciOiJFUzI1NiIsImtpZCI6ImFycy0xIn0.eyJhcHByb3ZhbF9pZCI6ImFwcl8wMUhYNFk4RTJORTNZMlg3UDBLNEpFNldWSCJ9.c2lnbmF0dXJl"
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

# Callback Completion {#callback-completion}

A PEP MAY request callback notification by including a `callback` object in the Access Request submission.

The `callback` object has the following members:

`endpoint`:
: REQUIRED.  HTTPS URI to which the Access Request Service sends completion notifications.  The Access Request Service MUST validate that the endpoint is authorized for the authenticated PEP, either by matching a pre-registered callback URI or by applying an explicit deployment allowlist.  The Access Request Service MUST reject callback endpoints that resolve to loopback, link-local, private-use, or otherwise internal network addresses unless the deployment has explicitly allowed that destination.  In-cluster or same-trust-domain deployments, where the PEP's callback endpoint is legitimately an internal address, permit those specific destinations through this explicit allowlist rather than by disabling the check; the secure default of blocking internal destinations protects internet-facing Access Request Services from server-side request forgery.

`state`:
: OPTIONAL.  Opaque value supplied by the PEP and returned unmodified in the callback.

`events`:
: OPTIONAL.  Array of event names requested by the PEP.  Defined event names are `approved`, `denied`, `expired`, `cancelled`, `failed`, and `partial`.

Callback notifications MUST contain a `task` member and MAY contain a `result` member.  When present, the `result` object MUST use one of the completion forms defined in {{completion-semantics}}.  A callback whose `task.status` is `approved` but that does not contain an enforceable `result` is only a notification; the PEP MUST retrieve the Task Status Endpoint response before enforcing access.

The Access Request Service MUST authenticate to the callback endpoint using a mechanism agreed between the PEP and Access Request Service.  This specification does not mandate a single callback authentication mechanism, but implementations SHOULD use one of the following: an OAuth 2.0 bearer token {{RFC6750}} issued to the Access Request Service, mutual TLS, or an HMAC signature over the request body using a pre-shared key.  Unauthenticated callbacks MUST NOT be accepted.

Callback delivery is a notification optimization.  The Task Status Endpoint remains authoritative unless the callback contains an enforceable completion result under {{completion-semantics}}.

Implementations MAY satisfy completion notification through deployment-level event subscriptions (for example, organization-scoped webhooks or event-streaming bindings defined by companion specifications) rather than per-task callbacks.  When a deployment relies on such a subscription, the PEP MAY omit the `callback` member from the Access Request submission.  Deployment-level event subscriptions deliver the same Task Handle and lifecycle information to subscribed receivers; they are a notification channel and MUST NOT be treated as enforcement unless paired with a separate enforceable result.

Non-normative callback example.  This callback is notification-only because it does not include a `result`; the PEP polls the Task Status Endpoint before enforcing access.

~~~ http
POST /callbacks/access-requests HTTP/1.1
Host: pep.example.com
Authorization: Bearer mF_9.B5f-4.1JqM
Content-Type: application/json

{
  "state": "b3Blbi1kb2N1bWVudC1mbG93",
  "task": {
    "id": "arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "status": "approved",
    "status_endpoint": "https://pdp.example.com/access/v1/requests/arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4"
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
: HTTP `409 Conflict`.  The `Idempotency-Key` was reused by the same requester with a submission body that is not equivalent to the original request (see {{access-request-submission}}).

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

# Extensibility and Profiles {#extensibility}

This specification defines a base wire format.  Several of its objects are intentionally extensible so that profiles, deployments, and implementations can adapt the model to specific upstream protocols, governance platforms, and request user interfaces without breaking interoperability.

## Extension Points

Additional members beyond those defined in this document MAY appear only at the following locations, and those members MUST follow the naming rules in {{extension-naming}}.  No other object members may be extended without a revision of this specification or a profile that explicitly redefines them.

* `context.access_request.display`: user-interface hints in a requestable denial.
* `context` in an Access Request submission: augments the AuthZEN Context.
* `requested_access` in an Access Request submission.
* `client`, `client.actor`, and `client.source` in an Access Request submission.
* A Catalogs Document and a Catalog Reference object within a Catalogs Document.
* A Catalog Item within a Catalog Response.
* `task.display`: user-interface hints attached to a Task Handle.
* `task.links`: link relations to related URLs.
* `result` and the additions defined under each `result.mode`.
* `approval.state` in a Re-evaluation Mode result: opaque profile-specific or deployment-specific verifier state carried through the PEP to the PDP at re-evaluation time.

This specification also defines extensibility for enumerated values:

* New values for `task.status` ({{task-status}}).
* New values for `result.mode` ({{completion-semantics}}).
* New problem types for {{RFC9457}}-style error responses ({{error-responses}}).

This specification does not create registries for these enumerated values.  Specifications that define new values for `task.status`, `result.mode`, or problem types SHOULD define stable names or URIs and processing rules for those values.  Short, unqualified names for `result.mode` are reserved for values defined by this base specification or by a future registry; profile-defined `result.mode` values SHOULD use absolute URIs unless such a registry exists.

## Naming Extensions {#extension-naming}

A member name or value added at an extension point MUST be one of the following:

1. A name registered in the AuthZEN Access Request Member Names registry ({{iana-member-names}}).  Registry-eligible names are short, lowercase, snake_case identifiers carrying semantics that are useful across multiple implementations.
2. An absolute URI (HTTPS or URN) when the member is profile-specific and not appropriate for the registry.  Profiles SHOULD use a stable URI under the profile's change controller.
3. A reverse-DNS-prefixed identifier (for example, `vendor.example.com/foo`) when the member is private to a single deployment and not intended for cross-implementation use.

The contents of `approval.state` are opaque to this specification and are not subject to the member naming requirements above unless a profile or deployment explicitly defines structure within `approval.state`.

## Forward Compatibility

An implementation receiving a member or value it does not recognize at an extension point MUST ignore it and MUST NOT fail processing on the basis of the unrecognized name.  This default does not override fail-safe rules defined elsewhere in this profile, such as the PEP rule in {{pep-processing-rules}} that treats unknown `result.mode` values as not approved rather than as ignorable.  An implementation MAY surface unrecognized members in audit records or pass them through unchanged when echoing wire content (for example, in callbacks).

## Profiles

A profile of this specification is a separate document that defines a coherent set of extensions for a particular use case.  Examples include a profile binding this specification to OAuth 2.0 token requests, a profile carrying Rich Authorization Requests {{?RFC9396}}, or a profile describing integration with a specific governance platform.

A profile SHOULD:

* Identify itself with a stable URI.
* Specify the extension points it populates and the member names or enumerated values it introduces.
* Register registry-eligible member names in the AuthZEN Access Request Member Names registry ({{iana-member-names}}).
* Define semantics, validation rules, and any normative requirements for its members.
* Enumerate any constraints it places on members or behaviors defined by this base specification.

This base specification does not enumerate profiles.  Conformance to a profile is determined by the presence and processing of the profile's registered or namespaced members; this specification does not require declarative profile negotiation.

# PEP Processing Rules {#pep-processing-rules}

A PEP implementing this profile:

* MUST treat `decision: false` as a denial, even when the Decision Context contains an `access_request` object.
* MUST NOT submit an Access Request unless the denied Decision contains a `context.access_request` object.
* MUST use the `endpoint` from the denial context when present; otherwise it MUST use the `access_request_endpoint` from PDP metadata.
* MUST preserve the principal identity of the Subject, and MUST preserve the Resource, Action, and relevant Context of the denied evaluation when submitting the Access Request.  When the original evaluation conveyed an actor identity in the Subject (for example, via `subject.properties.act`), the PEP MAY preserve the actor in the submission's `subject` or normalize it to `client.actor`; the actor identity itself MUST NOT be dropped.
* When the requestable denial includes `request_schema_url` or `request_catalogs_url`, MUST construct the augmentations to the submission's `context` and `requested_access` objects according to {{machine-readable-forms}} and {{catalog-references}}, or MUST NOT submit the Access Request if the required augmentations cannot be supplied.
* MUST include `denial.expires_at` from `context.access_request.expires_at`.
* MUST include `denial.evaluation_id` when `denial.binding_token` is absent, and SHOULD include it when the PDP returned an evaluation identifier.
* SHOULD include an idempotency key for Access Request submissions.
* MUST treat a Task Handle as opaque.
* MUST NOT infer approval from a task identifier, link, or display text.
* MUST treat unknown task status values as not approved.
* MUST enforce an approved result only according to {{completion-semantics}}.
* MUST treat unknown `result.mode` values as not approved.
* When using Re-evaluation Mode, MUST include the returned `approval` object unchanged at `context.approval` inside the AuthZEN Authorization API re-evaluation request.
* MUST re-evaluate access through the AuthZEN Access Evaluation API after approval, unless a profile-defined completion mode applies (for example, a profile binding to OAuth token issuance).
* MUST NOT treat an Approval Result as authorizing any future Access Evaluation solely on the basis that the Access Request task reached `approved`; applicability is determined by the PDP at each subsequent evaluation.

# PDP Processing Rules

A PDP implementing this profile:

* MAY include `context.access_request` in a denied AuthZEN Decision when the denied access is eligible for approval.
* MUST NOT include `context.access_request` unless an Access Request Endpoint is available to process the request.
* SHOULD include a stable machine-readable reason code when returning a requestable denial.
* MUST include an expiration time for the requestable denial hint as `context.access_request.expires_at`.
* MAY include `form_url`, `request_schema_url`, and `request_catalogs_url` in the requestable denial when the Access Request requires additional submission fields beyond those produced by the original AuthZEN Authorization API evaluation.
* MUST include `request_schema_url` when including `request_catalogs_url`.
* MUST provide verifiable denial-binding material when returning `context.access_request`, either by including an integrity-protected `context.access_request.binding_token` or by returning a stable evaluation identifier that the Access Request Service can resolve or validate.
* SHOULD return a stable evaluation identifier as `context.evaluation_id` ({{evaluation-identifier}}) that the PEP can supply as `denial.evaluation_id` when submitting an Access Request.
* When including `context.access_request.binding_token`, MUST integrity-protect it using a mechanism the Access Request Service can verify and SHOULD issue it as a JWS in compact serialization.
* MUST validate approval references presented during re-evaluation.
* MUST only consider an Approval Result applicable when the current evaluation request is within the approval scope recorded for that Approval Result.
* MUST ensure that approval does not override policy conditions that remain mandatory at enforcement time, such as subject status, resource sensitivity, action constraints, environmental risk, and approval expiry.

# Access Request Service Processing Rules

An Access Request Service implementing this profile:

* MUST authenticate and authorize the PEP before accepting Access Request submissions.
* MUST validate that the submission is based on a requestable denial, rejecting a submission that is not with `urn:openid:authzen:access-request:error:not_requestable`.
* MUST verify the denial-binding material for every requested item, applying the following rules:
    * When `denial.binding_token` is present, the service MUST verify its integrity.  When the value is a JWS, the service MUST verify the signature using a key resolved from the JWK Set advertised at the PDP's `jwks_uri` ({{discovery}}); JWS `kid` headers are matched against JWK `kid` parameters.
    * When `denial.binding_token` is absent, the service MUST resolve or validate `denial.evaluation_id`, retrieve the Subject, Resource, Action, authorization-relevant Context, and `expires_at` the PDP recorded for that evaluation, verify the Subject, Resource, Action, and Context match the submission using the structural comparison defined in {{binding-token-integrity}} (rejecting a mismatch with `urn:openid:authzen:access-request:error:invalid_denial_binding`), and enforce freshness against the recorded `expires_at` rather than the PEP-echoed `denial.expires_at`.
    * The service MUST reject submissions received after the verified `denial.expires_at` with `urn:openid:authzen:access-request:error:expired_denial`, after applying any clock-skew tolerance it has configured (see {{impl-considerations}}).
    * The service MUST reject submissions whose binding material cannot be verified, or whose claims do not bind to the submitted denial, with `urn:openid:authzen:access-request:error:invalid_denial_binding`.
* MUST bind the task to the submitted Subject, Resource, Action, Context, denial, requester, and client.
* MUST return an opaque Task Handle for accepted requests.
* SHOULD support idempotent request submission using the `Idempotency-Key` header.
* MUST expire Access Requests and approvals according to local policy.
* MUST NOT return `approved` unless the configured approval workflow has completed successfully.
* MUST evaluate approver eligibility, including self-approval, delegation, separation-of-duties, and conflict-of-interest policy, before treating an approval workflow as successfully completed.
* MUST retain sufficient audit records to reconstruct the request, approval, denial, and completion result.
* When operating Catalog Endpoints under {{catalog-references}}, MUST authorize callers and MUST return only Catalog Items the caller is permitted to see in the context of the original Subject, Resource, and Action.

# Authorization and Authentication {#authorization-and-authentication}

The Access Request Endpoint and Task Status Endpoint are protected APIs.  Support for OAuth 2.0 {{RFC6749}} is RECOMMENDED.  When OAuth 2.0 bearer tokens are used, the endpoints MUST follow {{RFC6750}}.  Catalog Endpoints ({{catalog-references}}) and the Cancellation endpoint ({{cancellation}}) are similarly protected; their authorization rules are defined in their respective sections.

The Access Request Service MUST authenticate the PEP or caller before accepting a submission or returning task status.  The service MUST verify that the caller is authorized to submit or view the request for the supplied Subject, Resource, and Action.

Authorization for Task Handle interactions, such as status retrieval and cancellation, is bound to the original Subject, Resource, Action, task, and requested operation rather than to a specific access token, session, or PEP instance.

The Access Request Service MUST authorize each Task Handle operation independently.  Authorization to retrieve task status does not imply authorization to cancel the task, view approver details, or retrieve an enforceable result.

Refresh of a calling identity's underlying token does not invalidate Task Handle access as long as the caller remains authorized for the bound task and operation.  A different PEP instance or agent process that can authenticate as authorized for the bound task and operation MAY interact with the Task Handle.

A task status response MUST NOT disclose approval details, approver identities, policy identifiers, or resource metadata to a caller that is not authorized to receive them.

## Delegation and On-Behalf-Of {#delegation}

A PEP submitting an Access Request frequently acts on behalf of one or more upstream principals.  Common patterns include a SaaS application acting on behalf of an end user, an OAuth Authorization Server acting on behalf of a client and an end user, an agent runtime acting on behalf of an agent which acts on behalf of an end user, and a Security Token Service acting on behalf of an upstream caller.  The protocol surface for these patterns is the AuthZEN Authorization API `subject` (carrying the principal) together with `client.actor` (carrying the immediate actor and, optionally, an `act` chain reaching back toward the Subject).

This profile does not define a new Subject shape for actor delegation.  Implementations SHOULD follow the conventions defined in {{?I-D.mcguinness-oauth-actor-profile}}, which standardizes an `act` claim representing the immediate actor with required `sub` and `iss` members and a RECOMMENDED `sub_profile` member (taking values such as `ai_agent`, `service`, or `user`).  Nested `act` objects represent multi-hop delegation chains.  The canonical actor identifier is the (`iss`, `sub`) pair regardless of which carrier expresses it.

Under this profile:

* The AuthZEN Authorization API `subject` carries the principal on whose behalf the operation is performed.
* `client.actor` (defined in {{access-request-submission}}) carries the immediate actor and MAY include a nested `act` claim that walks the delegation chain from the immediate actor outward toward the Subject.
* A PEP that captures actor information in the original AuthZEN Authorization API evaluation's `subject` (for example, via `subject.properties.act`) MAY preserve it in the submission's `subject` or normalize it to `client.actor`; the actor identity itself MUST NOT be dropped during reshaping.

The Access Request Service MUST authenticate the PEP using the deployment's chosen mechanism (typically an OAuth 2.0 bearer token, mutual TLS certificate, or signed assertion).  When the submission claims an actor or actor chain in `client.actor`, the Access Request Service MUST verify that the authenticated caller's credential authorizes the entire claimed chain, not only the immediate actor.  Mechanisms commonly used to provide such authorization include {{RFC8693}} OAuth 2.0 Token Exchange (where the access token names the Subject as the on-behalf-of party and the chain via `act` claims), signed assertions from a trusted issuer, or deployment-specific authentication policies.  The Access Request Service MUST reject submissions whose claimed chain cannot be verified against the caller's credential or against trusted issuers identified in the deployment.

The Access Request Service MUST NOT treat `client.actor` content that has not been independently verified as authorization input; unverified content MAY be retained as audit metadata only.

Approval routing at the Access Request Service MAY consider any identity in the chain (for example, routing approval to the principal's owner, the agent's deployment owner, or a delegated approver).  This profile does not constrain routing policy; it only requires that the necessary identities be representable in the submission and verifiable by the Access Request Service before routing decisions are taken.

Cross-implementation interoperability for delegated flows depends on adoption of a common actor convention.  Deployments and profiles that depend on a specific actor convention SHOULD document the Subject shape, the actor convention used, and the credential format the Access Request Service accepts as proof of the chain.

# Privacy Considerations {#privacy-considerations}

Access Requests may contain sensitive information, including user identifiers, resource identifiers, business justifications, approval chains, and policy reasons.  Implementations SHOULD minimize the amount of information returned to the PEP and displayed to the end user.

The Access Request Service SHOULD separate end-user display reasons from administrator diagnostic reasons.  A requestable denial response SHOULD avoid exposing internal policy identifiers unless the PEP is authorized for administrative diagnostics.

Approval records SHOULD be retained only as long as required by business, security, and compliance policy.

# Security Considerations

## Decision and Binding Integrity

### Denial Remains Denial

The presence of `context.access_request` does not weaken the AuthZEN Authorization API decision.  A PEP MUST NOT grant access based on a requestable denial.  Access is permitted only after an approved completion result is enforced according to this profile.

### Confused Deputy and Request Substitution

An attacker could attempt to obtain approval for one resource and apply it to another.  Implementations MUST bind Access Requests and approval results to the Subject, Resource, Action, Context, task, and requester.  PDPs MUST validate this binding during re-evaluation.

### Approval Reference Substitution

A hostile or compromised PEP could attempt to submit an `approval.id` or `approval.state` obtained from another Access Request during re-evaluation.  An approval reference is not a bearer grant by itself.  PDPs MUST resolve or verify the approval reference and confirm that it is bound to the authenticated caller or requester, current Subject, Resource, Action, relevant Context, approval scope, and approval expiry before using it as an input to an allow decision.  Possession of a valid-looking approval identifier is insufficient to authorize access.

When approval state is carried by reference, the PDP or Access Request Service MUST protect the backing approval record against unauthorized lookup and mutation.  When approval binding material is carried by value, for example in `approval.state`, the PDP MUST verify integrity, issuer, audience or intended recipient, expiry, and binding before accepting it.

### Binding Token Integrity {#binding-token-integrity}

The `binding_token` member round-trips PDP-issued state through the PEP to the Access Request Service.  Without integrity protection, a buggy or hostile PEP could drop, alter, or fabricate this value to influence approval routing or scope.  PDPs MUST integrity-protect `binding_token` using a mechanism the Access Request Service can verify and SHOULD issue it as a JWS so the Access Request Service can prove the value was produced by the PDP and bound to the original denied evaluation.  When the payload contains information that must not be visible to the PEP, the PDP MAY use JWE in addition to integrity protection, for example by encrypting a signed payload.  This is a confused-deputy mitigation: it lets the Access Request Service confirm that the requestable-denial state was issued by the PDP and not fabricated or altered by the PEP.

This profile does not mandate a specific JWS payload; the contents are deployment-specific.  Implementations that issue `binding_token` as a JWT SHOULD include the following claims to provide sound token hygiene and confused-deputy protection:

* `iss`: PDP identifier.  Lets the Access Request Service select the correct verification key from the PDP's JWK Set ({{discovery}}).
* `aud`: REQUIRED.  Access Request Service identifier, or an array of identifiers including the Access Request Service.  Array audiences support polyglot deployments that issue a single JWT consumed by multiple verifiers; the Access Request Service accepts the JWT when its identifier is among the listed audiences.  Prevents replay of a token issued for one Access Request Service against another.  The Access Request Service MUST reject a `binding_token` JWT that lacks `aud` or whose `aud` does not include the Access Request Service's identifier.
* `iat`, `exp`: issued-at and expiry.  Expiry SHOULD be short (typically minutes, aligned with the requestable-denial hint lifetime).
* `jti`: unique token identifier.  The Access Request Service SHOULD track recently-seen `jti` values until the token's `exp` to detect replay of an otherwise valid token; because `exp` is short (typically minutes), the replay-tracking window is correspondingly bounded.
* `denial_expires_at`: the `context.access_request.expires_at` value from the requestable denial, unless the token's `exp` is no later than that value.  This lets the Access Request Service verify the PEP-echoed `denial.expires_at` value or enforce the token expiry as an equal-or-stricter freshness deadline.
* `binding_context_members`: the array of `context` member names that constitute the authorization-relevant Context for this evaluation (see the Terminology definition of Authorization-Relevant Context).  Present (and MAY be an empty array) whenever any binding claim covers context; the Access Request Service uses exactly this integrity-protected set when comparing or hashing the authorization-relevant Context, and binds only Subject, Resource, and Action when it is absent.
* Binding claims that identify the original denied evaluation.  For interoperability across independently implemented PDPs and Access Request Services, the inline form is RECOMMENDED, because it is compared structurally and requires no agreed byte canonicalization.  Either:
    * Inline (RECOMMENDED): the Subject, Resource, Action, and authorization-relevant Context of the denied evaluation, which the Access Request Service compares structurally, member by member, against the submission.  Subject, Resource, and Action comparison includes the full AuthZEN Authorization API objects, including any `properties` members present in the bound values, except that `subject.properties.act` is excluded because the PEP MAY normalize the actor to `client.actor` ({{delegation}}).  Context comparison includes each member of the authorization-relevant Context and excludes profile machinery members.
    * Hashed: a `binding_hash` whose value is the base64url-encoded (without padding) SHA-256 digest of the {{RFC8785}} JSON Canonicalization Scheme (JCS) serialization of the JSON object `{"subject": <Subject>, "resource": <Resource>, "action": <Action>, "context": <authorization-relevant Context>}`, where `<Subject>` is the bound Subject with `subject.properties.act` removed (matching the inline form's exclusion) and `<authorization-relevant Context>` is the enumerated set, which the Access Request Service recomputes from the submission.  Implementations that use the hashed form MUST use exactly this construction so that a PDP and an independently implemented Access Request Service compute identical digests.
* `evaluation_id`: the PDP's identifier for the evaluation, when present in `context.evaluation_id` ({{evaluation-identifier}}).

Throughout this profile, structural comparison of two JSON values treats them as equal when they have the same JSON type and: numbers are equal under their {{RFC8785}} canonical form; strings are equal codepoint-for-codepoint; arrays are equal element-by-element in order; objects are equal when they have the same set of member names with recursively equal member values; and an absent member is distinct from a member whose value is `null`.  This is the comparison used wherever this profile compares Subject, Resource, Action, or authorization-relevant Context, including inline denial binding and approval-scope matching ({{completion-semantics}}).

When `items` is present in the submission (bulk), the binding claims cover the entire `items` array and authorization-relevant Context.  Inline bulk binding claims list each submitted item, including the full Resource and Action objects for that item, in the same order as the bound Access Request.  A bulk `binding_hash` is the base64url-encoded (without padding) SHA-256 digest of the JCS serialization of the JSON object `{"subject": <Subject>, "items": [{"resource": <Resource>, "action": <Action>}, ...], "context": <authorization-relevant Context>}`, where `<Subject>` is the bound Subject with `subject.properties.act` removed and the `items` array order is the order bound by the denial.  Implementations that use a bulk hashed form MUST use exactly this construction.  When every item carries its own per-item `denial`, each per-item binding is verified using the single-item rules instead of this bundle construction.

PDPs MAY add deployment-specific claims (policy version, factors, risk score, tenant identifier) when the Access Request Service needs them for routing or audit.  When such claims must remain opaque to the PEP, the PDP wraps the signed payload in JWE encrypted to the Access Request Service.

When `binding_token` is a JWS-signed JWT using these claims, the Access Request Service, on receipt:

1. parses the JWS header and resolves the verification key from the JWK Set at the PDP's `jwks_uri`;
2. verifies the signature, the `aud` claim, and the expiry;
3. checks `jti` against recently-seen tokens to detect replay;
4. compares the binding claims (inline or hashed) against the submission's Subject, Resource, Action, and authorization-relevant Context (or per-item for bulk submissions), rejecting a mismatch with `urn:openid:authzen:access-request:error:invalid_denial_binding`;
5. enforces freshness (the earlier of the token `exp` and `denial.expires_at`), rejecting a submission past that deadline with `urn:openid:authzen:access-request:error:expired_denial`.

When the `binding_token` carries its own expiry (`exp`) and the submitted denial also carries `denial.expires_at`, the Access Request Service MUST enforce the earlier of the two as the freshness deadline for the submission.  When `denial_expires_at` or equivalent protected binding material is present, the Access Request Service MUST verify that `denial.expires_at` matches the protected value before relying on it.  When no protected denial-expiry value is present, the Access Request Service MUST rely on `exp` only if it is no later than the echoed `denial.expires_at`; otherwise the binding material is insufficient to prove the freshness window and the submission MUST be rejected with `urn:openid:authzen:access-request:error:invalid_denial_binding`.  A submission whose freshness deadline has passed MUST be rejected with `urn:openid:authzen:access-request:error:expired_denial`.

When `binding_token` uses another integrity-protected format, the Access Request Service MUST perform equivalent verification for issuer authenticity, audience or intended recipient, expiry when present, replay resistance when provided by the format, and binding to the submitted Subject, Resource, Action, and relevant Context.

A single signed JWT MAY simultaneously satisfy this profile's claim recommendations and the requirements of another profile or specification that uses the same JWT, provided the union of required claims is present and consistent.  This enables polyglot deployments that issue one artifact and surface it on multiple wire formats (for example, as `context.access_request.binding_token` in an AuthZEN Authorization API response and as a profile-defined token elsewhere).  Verifiers process only the claims they understand and tolerate additional profile-specific claims without rejecting the JWT.

For cross-vendor interoperability, an Access Request Service MUST support verifying a `binding_token` presented as a JWS in compact serialization, and a PDP MUST support verifying an `approval.state` presented as a JWS in compact serialization ({{completion-semantics}}).  Other integrity-protected formats MAY be used when both the issuer and the verifier support them.

### Approval Replay

Approval references can be replayed if not time-bounded.  Approval results MUST expire.  Re-evaluation Mode SHOULD bind approval references to the original request tuple.  Profiles of this specification that define token-based completion modes are responsible for defining the token's audience restriction, lifetime, and binding to the approved request.

## Policy and Approver Hygiene

### Overbroad Approval {#overbroad-approval}

This profile does not define an approval policy language.  Implementations MUST NOT treat the `template`, `requested_access`, or `display` fields as sufficient authorization policy.  Actual approval scope and enforcement semantics are determined by the PDP and Access Request Service.

### Approver Eligibility and Separation of Duties {#approver-eligibility}

Approval workflows can violate enterprise access policy if an approver is not eligible to approve the requested access.  Access Request Services MUST evaluate approver eligibility before returning `approved`, including self-approval restrictions, delegated approver authority, separation-of-duties constraints, ownership rules, and conflict-of-interest policy.  A workflow step completed by an ineligible approver MUST NOT be treated as successful approval unless local policy explicitly allows that exception and records it for audit.

### Emergency Access

The `requested_access.emergency` member is a request signal, not an authorization override.  Implementations that support emergency or break-glass access SHOULD require a business justification, apply the shortest practical approval or access lifetime, notify appropriate owners or security personnel, and require post-use review.  Emergency requests and approvals SHOULD be retained and auditable according to the deployment's security and compliance policy.

## Information Disclosure

### Trusting URLs from the Requestable Denial

The `endpoint`, `form_url`, `request_schema_url`, `request_catalogs_url`, and the catalog `endpoint` values inside a Catalogs Document are all delivered to the PEP inside a denial response or document fetched on the basis of that response.  A compromised or misconfigured PDP, or an Access Request Service compelled by one, could direct the PEP at attacker-controlled hosts to harvest justifications, render hostile UI, substitute schemas and catalogs, or perform credential phishing against the requester.

An autonomous PEP MUST verify that these URLs resolve to hosts trusted under the deployment before fetching or acting on them, by requiring the same origin as the Access Request Endpoint advertised in PDP metadata or by maintaining an explicit allowlist of trusted Access Request Service hosts; a PEP that renders them for a human user SHOULD apply the same check.  PEPs MUST NOT submit credentials to a host that is not trusted to receive them.

### Catalog Disclosure

Catalog Endpoints ({{catalog-references}}) can leak sensitive information about applications, entitlements, organizational structure, or finance master data if not properly authorized.  An attacker who can call a Catalog Endpoint without scoping or authorization can enumerate sensitive identifiers, infer access policy, or harvest catalog metadata.

Mitigations:

* Catalog Endpoints MUST authorize callers and MUST return only items the caller is permitted to see for the original Subject, Resource, and Action.
* Catalog Endpoints SHOULD apply rate limits and abuse detection commensurate with the sensitivity of the catalog they expose.
* PEPs SHOULD prefer searching with `search_param` over bulk enumeration.

### Task Handle Leakage {#task-handle-leakage}

Task handles can reveal workflow state or be used to poll for sensitive information.  Task handles MUST be opaque, unguessable, and protected by authentication and authorization checks.  A leaked task handle MUST NOT be sufficient to retrieve task status without caller authorization.

### PEP-Facing vs End-Client-Facing Surfaces

Several members of the task response and approval result are intended for PEP-to-Access-Request-Service or PEP-to-PDP machine interactions, not for direct use by end clients (browsers, mobile applications, agent runtime UIs, or other non-PEP callers acting on behalf of the Subject).  The following are PEP-facing:

* `task.status_endpoint`: the polling URL for the Access Request Service.
* `task.links.cancel`: the cancellation endpoint.
* `approval.id` and `approval.state`: round-trip material the PEP places at `context.approval` during re-evaluation.

PEPs SHOULD NOT forward these members to end clients or other non-PEP callers.  Forwarding `status_endpoint` or `links.cancel` creates a direct end-client-to-Access-Request-Service channel that bypasses the PEP's enforcement and authorization context; forwarding `approval.id` or `approval.state` allows an end client to attempt to inject the approval reference into other PEPs or other evaluations.  Possession of these values is not itself authorization (see {{task-handle-leakage}} and the PDP applicability rules in {{completion-semantics}}), but exposing them broadens the attack surface unnecessarily.

Human-facing surfaces are conveyed separately and are intended to be rendered only to callers authorized for the corresponding human workflow:

* `task.links.ticket`: URL where the requester (Subject) can view the request and its status.
* `task.links.review`: URL where an approver or administrator can review or act on the request.
* `task.display`: localizable user-interface hints.

When a PEP renders requester-facing status to an end client, it SHOULD do so by rendering `task.display` and `task.links.ticket` rather than by exposing the machine surfaces.  A PEP MUST NOT expose `task.links.review` to a requester or other end client unless that caller has been authenticated and authorized as an approver or administrator for the task.

## Operational and Integration

### Callback Security

Callback endpoints can be abused for spoofing, replay, request forgery, and server-side request forgery.  Access Request Services MUST validate callback destinations as described in {{callback-completion}}.  Callback notifications MUST be authenticated.  PEPs SHOULD verify callback origin, bind callbacks to expected task identifiers and state values, and treat callbacks as notifications unless they contain an enforceable result under this profile.

### PEP Acting on Behalf of the Subject

A PEP submitting an Access Request typically acts on behalf of the Subject identified in the original AuthZEN Authorization API evaluation, and may act on behalf of a longer delegation chain.  The verification model the Access Request Service applies, the credential the PEP presents, and the wire representation of the delegation chain are defined in {{delegation}}.  An Access Request Service that accepts unverified actor claims weakens the trust model of the entire flow; submissions whose claimed chain cannot be verified MUST be rejected.

### Idempotency Key Abuse

Idempotency keys can be used to correlate requests.  Implementations SHOULD scope idempotency keys to the authenticated caller and avoid storing them longer than necessary.

### Availability

Approval workflows can introduce latency and dependency on external systems.  PEPs SHOULD fail closed when task status cannot be determined.  Access Request Services SHOULD apply rate limits and abuse detection to request submission and polling endpoints.

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

The capability URN registered above and the problem-type URNs used for error responses ({{error-responses}}) both use the `urn:openid:authzen:` namespace administered by the OpenID Foundation, rather than the `urn:ietf:params:authzen:` sub-namespace that the AuthZEN Authorization API registers for capabilities ({{AuthZEN}}).  This is an intentional OpenID Foundation profile convention; the `capabilities` array remains a list of URNs as defined by {{AuthZEN}}.

## AuthZEN Access Request Member Names Registry {#iana-member-names}

This specification requests creation of a new registry: the AuthZEN Access Request Member Names registry.

The registry tracks well-known member names that may appear at the extension points defined in {{extensibility}}.  Registration policy is Specification Required.  Each entry has the following fields:

Name:
: The member name as it appears on the wire.

Extension Point:
: One of the extension points listed in {{extensibility}}.

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
| `session_id` | `client.source` | Identifier of a bounded interaction context that produced the request (chat or agent conversation, application session, CLI invocation, workflow thread). |
| `external_url` | `client.source` | URL of an external system that motivated the request. |
| `integration_id` | `client.source` | Identifier of an upstream integration or workflow that produced the request. |
| `description` | Catalog Item | Human-readable description of the catalog item. |
| `risk_level` | Catalog Item | Risk classification used by the deployment. |
| `granted` | Catalog Item | Boolean indicating the requester already has access to the item. |
| `owner` | Catalog Item | Identifier or reference for the item's owner. |
| `ticket` | `task.links` | URL where the requester can view the request and its status. |
| `review` | `task.links` | URL where an approver or administrator can review or act on the request. |
| `cancel` | `task.links` | URL where the PEP can cancel the request. |

Change Controller for all initial entries: OpenID Foundation AuthZEN Working Group.  Specification Document for all initial entries: This document.

--- back

# Examples

## End-to-End Manager Approval

### Initial Evaluation Request

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
      "request_schema_url": "https://requests.example.com/schemas/manager_approval.json",
      "request_catalogs_url": "https://requests.example.com/catalogs/manager_approval.json"
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

### Task Handle

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

### Completed Task

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "task": {
    "id": "arq_01HX4Y3AJZ7Y56W2F9H8Q8C1V4",
    "status": "approved"
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
      "approved_until": "2026-05-01T00:42:00Z"
    }
  }
}
~~~

### Final Decision

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

## End-to-End Agent Tool Discovery

This non-normative example shows an AI agent acting on behalf of a user that, mid-task, requires authority to invoke a previously undeclared downstream tool.  A broad-scope approval grants authority for a class of subsequent same-class invocations, so the agent does not produce a new Access Request for each related call.

### Initial Evaluation Request

The agent attempts to invoke a CRM search tool while assembling a renewal report.

~~~ http
POST /access/v1/evaluation HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Content-Type: application/json

{
  "subject": {
    "type": "user",
    "id": "alice@example.com",
    "properties": {
      "act": {
        "iss": "https://agents.example.com",
        "sub": "agent_renewal_assistant_v3",
        "sub_profile": "ai_agent"
      }
    }
  },
  "resource": {
    "type": "tool",
    "id": "crm.search_accounts"
  },
  "action": {
    "name": "invoke"
  },
  "context": {
    "time": "2026-05-12T15:00:00Z"
  }
}
~~~

### Requestable Denial

The PDP returns a denial requesting broad-scope approval for the agent to call CRM tools.

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "decision": false,
  "context": {
    "evaluation_id": "eval_01HX6A9D2M7N0F4G3K2T9P1B8X",
    "evaluated_at": "2026-05-12T15:00:00Z",
    "reason": "agent_authority_missing",
    "access_request": {
      "template": "agent_tool_class_approval",
      "expires_at": "2026-05-12T15:10:00Z",
      "binding_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0.eyJldmFsdWF0aW9uX2lkIjoiZXZhbF8wMUhYNkE5RDJNN04wRjRHM0syVDlQMUI4WCIsImNsYXNzIjoiY3JtX3Rvb2xzIn0.aGFzaA",
      "request_schema_url": "https://requests.example.com/schemas/agent_tool_class_approval.json"
    }
  }
}
~~~

### Submitting the Access Request

The agent's runtime submits a request and supplies actor and source members so the Access Request Service can route approval to the agent's owner and record the session that triggered the request.  The agent persists the Task Handle, releases the calling thread, and continues other in-flight work; approval may take minutes to days, and execution resumes when the callback fires.

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
  "callback": {
    "endpoint": "https://agents.example.com/callbacks/access-requests",
    "state": "session_01HX69WJ8Q0K7P4F0V0K9D6Z7N",
    "events": ["approved", "denied", "expired"]
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

### Task Handle

~~~ http
HTTP/1.1 202 Accepted
Content-Type: application/json
Location: https://pdp.example.com/access/v1/requests/arq_01HX6AAB3J7Y56W2F9H8Q8C1V7

{
  "task": {
    "id": "arq_01HX6AAB3J7Y56W2F9H8Q8C1V7",
    "status": "pending",
    "status_endpoint": "https://pdp.example.com/access/v1/requests/arq_01HX6AAB3J7Y56W2F9H8Q8C1V7",
    "expires_at": "2026-05-20T00:00:00Z"
  }
}
~~~

### Approval Callback

Hours later, after the agent's owner approves the request, the Access Request Service notifies the agent's callback endpoint.  The callback is notification-only; the agent retrieves the Task Status Endpoint before enforcing access.

~~~ http
POST /callbacks/access-requests HTTP/1.1
Host: agents.example.com
Authorization: Bearer mF_9.B5f-4.1JqM
Content-Type: application/json

{
  "state": "session_01HX69WJ8Q0K7P4F0V0K9D6Z7N",
  "task": {
    "id": "arq_01HX6AAB3J7Y56W2F9H8Q8C1V7",
    "status": "approved",
    "status_endpoint": "https://pdp.example.com/access/v1/requests/arq_01HX6AAB3J7Y56W2F9H8Q8C1V7"
  }
}
~~~

### Completed Task

The agent retrieves the completed task and obtains an approval reference scoped to the CRM tool class for seven days.  This example includes `approval.state` to show a deployment where the PDP verifies integrity-protected binding material during re-evaluation rather than relying only on a server-side lookup by `approval.id`.

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "task": {
    "id": "arq_01HX6AAB3J7Y56W2F9H8Q8C1V7",
    "status": "approved"
  },
  "result": {
    "mode": "reevaluate",
    "approval": {
      "id": "apr_01HX6BCEF8K3Z2X7P0K4JE6WVK",
      "approved_at": "2026-05-12T17:30:00Z",
      "approved_until": "2026-05-19T17:30:00Z",
      "state": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0.eyJhcHByb3ZhbF9pZCI6ImFwcl8wMUhYNkJDRUY4SzNaMlg3UDBLNEpFNldWSyIsInNjb3BlIjoiY3JtX3Rvb2xzIiwiZXhwIjoxNzc5MjEwMDAwfQ.c2lnbmF0dXJl"
    }
  }
}
~~~

### Re-evaluation After Approval

The agent re-evaluates the original tool invocation; the PDP authorizes it against the approval reference.  Subsequent same-class CRM tool invocations within the approval lifetime are also authorized without a new Access Request.

The re-evaluation request does not repeat the original `evaluation_id`.  The PDP resolves the `approval.id` (and `approval.state`, when present) to the approved Access Request task, original denied evaluation, and approved CRM tool-class scope.

~~~ http
POST /access/v1/evaluation HTTP/1.1
Host: pdp.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Content-Type: application/json

{
  "subject": {
    "type": "user",
    "id": "alice@example.com",
    "properties": {
      "act": {
        "iss": "https://agents.example.com",
        "sub": "agent_renewal_assistant_v3",
        "sub_profile": "ai_agent"
      }
    }
  },
  "resource": {
    "type": "tool",
    "id": "crm.search_accounts"
  },
  "action": {
    "name": "invoke"
  },
  "context": {
    "time": "2026-05-12T17:31:00Z",
    "approval": {
      "id": "apr_01HX6BCEF8K3Z2X7P0K4JE6WVK",
      "approved_at": "2026-05-12T17:30:00Z",
      "approved_until": "2026-05-19T17:30:00Z",
      "state": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0.eyJhcHByb3ZhbF9pZCI6ImFwcl8wMUhYNkJDRUY4SzNaMlg3UDBLNEpFNldWSyIsInNjb3BlIjoiY3JtX3Rvb2xzIiwiZXhwIjoxNzc5MjEwMDAwfQ.c2lnbmF0dXJl"
    }
  }
}
~~~

### Final Decision

~~~ http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "decision": true,
  "context": {
    "approval": {
      "id": "apr_01HX6BCEF8K3Z2X7P0K4JE6WVK",
      "approved_until": "2026-05-19T17:30:00Z"
    }
  }
}
~~~

# Implementation Considerations {#impl-considerations}

This appendix describes common deployment patterns and is non-normative.

## Identity Governance and Approval Platforms

Many implementations sit on top of an existing identity-governance, ITSM, or approval platform that already has catalogs, policy engines, approval workflows, and provisioning pipelines.  A useful mapping pattern is:

* The platform itself acts as the Access Request Service.  Its task or request entity becomes the Task Handle and its approval workflow runs unchanged.
* A thin AuthZEN Policy Decision Point is deployed alongside the platform.  It produces AuthZEN Authorization API evaluations from current platform state and emits requestable denials when access is missing and an approval workflow exists for it.
* The Policy Enforcement Point is either an enforcing application (reactive: a gateway calls the AuthZEN Authorization API when a user attempts an operation) or a request user interface or agent (proactive: the user opens a request portal).  Both are valid PEPs under this profile.

Re-evaluation Mode aligns directly with this pattern: provisioning changes platform state, and a subsequent AuthZEN Authorization API evaluation reflects that state.  Implementations mapping their richer task lifecycle states onto the canonical statuses defined in this profile SHOULD follow the guidance in {{status-mapping}}.

## Form and Catalog Translation

Most existing platforms have proprietary form description languages with field types beyond JSON Schema's native vocabulary, and proprietary catalog APIs with vendor-specific request and response shapes.  Implementations translate to the JSON Schema referenced by `request_schema_url` and to the Catalogs Document and Catalog Endpoint protocol defined in {{catalog-references}}.  Translation may be lossy for vendor-specific widgets and metadata; richer rendering details belong behind `form_url`, while the JSON Schema and Catalogs Document provide enough information for an autonomous PEP.  Deployments that expose tools or catalogs to autonomous agents through an agent protocol can additionally surface catalogs through that protocol; see {{catalog-agent-protocol}}.

## Notification Channels

Implementations frequently already have webhook subscriptions or other deployment-level event channels.  Per-task callbacks ({{callback-completion}}) are an alternative; deployments may rely on existing webhook infrastructure or event-streaming bindings defined by companion specifications for completion notification.

## Time and Clock Skew

This profile uses {{RFC3339}} timestamps in multiple places: `context.evaluated_at`, `context.access_request.expires_at`, `denial.expires_at`, `task.expires_at`, `approval.approved_at`, and `approval.approved_until`.  Each timestamp is produced on one host (PDP, Access Request Service, or PEP) and may be compared against a clock on another host, so clock skew between hosts can produce incorrect freshness or expiry decisions.

Implementations SHOULD allow a small skew tolerance when comparing a remote-host timestamp against the local clock.  A tolerance of 30 seconds is typical; tolerances above 60 seconds are NOT RECOMMENDED.  A PEP comparing `approval.approved_until` to local time MAY treat the approval as valid until `approved_until` plus the tolerance.  An Access Request Service comparing `denial.expires_at` (the PEP-echoed requestable-denial hint expiry) to its local clock MAY accept submissions arriving up to the tolerance after that timestamp, after verifying the echoed value against the denial-binding material.

Hosts that produce timestamps SHOULD synchronize their clocks against a reliable time source (for example, NTP or PTP) to keep skew well below the tolerance window.  Deployments with stricter requirements (for example, regulatory or audit constraints) MAY define a tighter tolerance and document it as part of their deployment profile.

## Evaluators and Workflow Design

The Access Request Service determines what kind of evaluator processes a given submission.  Evaluators commonly include:

* Human approvers acting through a user interface (an owner, manager, security reviewer, or delegate).
* Automated policy engines that apply static or dynamic rules (separation-of-duties checks, ownership rules, conflict-of-interest constraints, organizational policy).
* Risk engines that score the request against runtime signals and approve, deny, or escalate based on score thresholds.
* AI supervisors or LLM-based evaluators that summarize requested authority, reason about stated intent, and approve, deny, or hand off to another evaluator.
* Hybrid pipelines that combine these (for example, an automated risk check that escalates to a human reviewer only for non-trivial cases).

This profile does not constrain which evaluator a deployment uses or how evaluators are combined.  An Access Request can be resolved entirely without human involvement, entirely by a human approver, or by any mixture.  The protocol's synchronous-completion response, callback notification, and re-evaluation semantics apply uniformly across evaluator types.  The approver-eligibility, self-approval, and separation-of-duties requirements of {{approver-eligibility}} apply to whichever entity completes a workflow step, whether human or automated.

When the calling population includes high-volume PEPs (gateways aggregating many users, OAuth Authorization Servers serving fleets of clients, or autonomous agents that discover and request many fine-grained permissions), the protocol's per-denial submission shape is sufficient on the wire but must be paired with workflow design that does not require interactive human review for every submission.  Without such design, evaluation volume overwhelms human reviewers and the deployment is unusable at scale.

Common workflow patterns that absorb volume include:

* Auto-approval rules that resolve low-risk requests synchronously, returning `201 Created` with a populated `result` and never engaging a human reviewer (see {{access-request-response}}).
* Broad-scope approvals that grant a class of future evaluations from a single decision (for example, "approve agent X to call tool Y for the next 30 days"), so subsequent same-class submissions either auto-approve or are unnecessary because re-evaluation already permits the access.
* Bulk approval, where an evaluator acts on a batch of related submissions in a single workflow step.
* Pre-approval or standing grants established out of band (for example, when an agent is provisioned), so the caller never reaches a denial that requires interactive approval.

This profile defines the substrate; it does not define approval workflow.  The Access Request Service is responsible for implementing the evaluator policy and the workflow primitives that route submissions appropriately.  The protocol's bulk submission, idempotency, synchronous-completion response, and approval-expiry semantics provide the inputs an Access Request Service needs to apply these patterns.

# Design Rationale {#design-rationale}

This appendix records non-obvious design choices and the reasoning behind them.  It is non-normative.  Where the spec elsewhere defines a normative rule, that rule governs; this appendix only explains why the rule takes the shape it does.

## Why a profile of the AuthZEN Authorization API, rather than a standalone specification?

The AuthZEN Authorization API defines the allow/deny decision surface that protected systems already integrate with.  Building a separate request-and-approval protocol would duplicate the AuthZEN Authorization API's evaluation model and split the authorization ecosystem.  As a profile of the AuthZEN Authorization API, this specification reuses the AuthZEN Authorization API's Subject, Resource, Action, Context, and Decision concepts; introduces a single new object (`context.access_request`) on the response side; and reuses the AuthZEN Authorization API's evaluation endpoint for the re-evaluation step.  A PDP that already speaks the AuthZEN Authorization API gains this profile by emitting one additional object on denials and accepting one additional context member on re-evaluation requests.

## Why is Re-evaluation Mode the only base completion mode?

The PDP is the authoritative point at enforcement time.  Returning an AuthZEN Authorization API decision (rather than a token or any other directly-enforceable artifact) ensures that current policy, subject status, risk state, revocation, and approval expiry are all evaluated again at the point of use, not frozen at approval time.  Approval workflows often take minutes to days; conditions can change.  Profiles that bind approval to a specific issuance flow (such as OAuth token issuance, where the issued token is itself the decision representation) define their own completion mode through the `result.mode` extension point ({{completion-semantics}}); the base profile deliberately keeps that surface profile-shaped.

## Why does the approval round-trip through the PEP rather than direct PDP-to-Access-Request-Service communication?

The Access Request Service and PDP may be the same component, components in the same deployment, or independent services.  Routing the approval reference through the PEP makes the protocol topology-agnostic: the PEP carries `result.approval` from the Access Request Service to the PDP through a normal AuthZEN Authorization API evaluation, with no requirement for back-channel communication or shared state.  Deployments where the PDP and Access Request Service share state benefit because the PDP can resolve `approval.id` directly; deployments where they are independent benefit because integrity-protected `approval.state` lets the PDP verify the approval without trusting the Access Request Service's API.

## Why one Access Request Endpoint per deployment, rather than per-resource or per-tenant?

A reader familiar with REST conventions might expect resource-scoped endpoints (for example, `/resources/{id}/access-requests`) or tenant-scoped endpoints in multi-tenant SaaS.  A single endpoint per deployment, identified by `access_request_endpoint` in PDP metadata, simplifies discovery: one metadata lookup, one stable call site, no URL templating in PEP code.  Routing decisions (workflow class, tenant, resource family) happen inside the request payload via `template`, the submitted Subject/Resource/Action, and other context members, rather than via URL structure.  Intermediate enforcers (an OAuth Authorization Server or other gateway acting as PEP) MAY proxy the endpoint and present a different URL to their own callers while preserving the protocol surface.

## Why are there two binding patterns (`evaluation_id` and `binding_token`)?

Different deployment topologies have different trust models:

* In a same-service or trusted deployment, the Access Request Service can look up the denied evaluation by `evaluation_id` in shared or accessible state.  No cryptographic verification is needed at the boundary.
* In a deployment where the Access Request Service is independent of the PDP, the Access Request Service cannot trust the PEP's claim that a denial happened.  A PDP-signed `binding_token` lets the Access Request Service verify the denial cryptographically without a back-channel.

Supporting both patterns lets the same wire format work across topologies without forcing every deployment to operate signing infrastructure or shared state.

## Why does the submission's `denial` object carry only key fields, not the full AuthZEN Decision?

A reader expecting an audit-style echo of the denied Decision might wonder why the submission carries `evaluation_id`, `evaluated_at`, `expires_at`, `reason`, `binding_token`, and `template` rather than the entire `{decision, context}` object.  Two reasons.  First, the binding material the Access Request Service consumes (`evaluation_id` and `binding_token`) provides stronger evidence of the denial than a verbatim JSON echo could, since binding material is signed or server-resolvable and an echo would be PEP-supplied.  Second, the other fields of `context.access_request` (`endpoint`, `display`, `form_url`, etc.) are evaluation-time PEP guidance, not data the Access Request Service consumes at submission time.  Carrying only what the Access Request Service uses keeps the wire surface small.

## Why does the `denial` object support both a top-level and per-item form for bulk submissions?

A reader looking at the bulk submission shape sees a top-level `denial` object alongside per-item `denial` members inside `items[]` and might wonder why both exist.  Real bulk submissions come in two shapes.  In the first, a single batch evaluation produces one denial that covers multiple (Resource, Action) pairs; the top-level `denial` carries one set of binding material whose JWS payload or `evaluation_id` claims encompass the whole bundle.  In the second, multiple separate evaluations produce distinct denials that the PEP bundles into one submission; each item carries its own per-item `denial` with binding material specific to that item.  Supporting both shapes lets the wire format absorb both batch-evaluation and bundled-from-separate-evaluations patterns without forcing the PEP to either issue separate Access Requests (losing the bulk benefit) or fabricate a synthetic bundle binding (compromising binding integrity).

## Why is `approval.state` distinct from `binding_token` when both are opaque round-trip slots?

The two slots play different protocol roles with different constraint regimes.  `binding_token` is PDP-issued and Access-Request-Service-verified; it MUST be integrity-protected, typically as a JWS, with the token-hygiene claim recommendations in {{binding-token-integrity}}.  `approval.state` is Access-Request-Service-issued (or PDP-issued via the Access Request Service) and PDP-verified; it is opaque and format-flexible, allowing a signed token, a lookup reference, or deployment-specific state.  The different names signal the asymmetric constraint regimes; a unified name would over-promise that the two slots play the same role.

## Why does the `approval` object always carry `id`, even when `approval.state` is signed?

In the bound-reference pattern a signed `approval.state` already carries the approval identifier, so the top-level `approval.id` can look redundant.  It is kept REQUIRED for two reasons.  First, it is the stable, uniform audit and correlation handle present in both topologies: in the server-side-lookup pattern it is the resolver key, and in the bound-reference pattern it lets logs, callbacks, and task records reference the approval without parsing `approval.state`.  Second, when both are present the PDP cross-checks that the identifier bound inside `approval.state` matches `approval.id`, a cheap defense against a PEP pairing a valid signed state with a mismatched identifier.  A single always-present identifier keeps the wire shape uniform across topologies.

## Why are timestamps always absolute, never relative durations?

Absolute RFC 3339 timestamps appear at every time-bounded value in the spec: `task.expires_at`, `approved_until`, `approved_at`, `evaluated_at`, `context.access_request.expires_at`, `denial.expires_at`, `requested_access.requested_until`.  Some specifications use relative durations (`expires_in`, OAuth-style) alongside absolute timestamps; this profile uses absolute timestamps throughout because two forms for the same concept create reconciliation logic at every consumer and a precedence rule at the wire.  Clock skew between hosts is addressed by tolerance guidance in {{impl-considerations}}.

## Why is `template` an opaque free-form string rather than a constrained enumeration?

Workflow categorization is deployment-specific.  An IGA platform's workflow names, an ITSM ticket-class identifier, an AI-supervisor source code, and a custom governance system's policy identifier all play the same role.  Constraining `template` to an enumeration would either pick winners or grow indefinitely; leaving it opaque lets profiles register their own well-known values without revising the base.  The Overbroad Approval rule ({{overbroad-approval}}) ensures `template` is treated as routing input, not as authorization policy.

## Why does the spec deliberately not define a workflow engine, approval policy language, or user interface?

These exist in many incompatible forms across IGA, ITSM, governance, chat-approval, and custom platforms.  Standardizing them in this profile would either pick a single vendor model or define a surface so broad it carries no semantic value.  The protocol layer between authorization enforcement and whatever workflow runs underneath is the interoperable seam; everything below it is implementation choice.  This positioning is what lets deployments adopt the profile alongside existing approval infrastructure without rewriting the workflow.

## Why is `result.mode` extensible at all, given the base defines only one mode?

The base profile is opinionated about PDP-authoritative-at-enforcement (Re-evaluation Mode), but real deployments include token-issuance flows (OAuth, OAuth Transaction Authorization Challenge), credential-issuance flows, and direct-decision flows where the Access Request Service's intent is consumed without a re-evaluation step.  Defining a base extension point lets profiles bind to those flows without changing the base wire shape, and lets the base spec remain stable as profile work evolves.

# Acknowledgements

The author thanks the OpenID AuthZEN Working Group for discussion and review.

# Document History

-00

* Initial version (draft-mcguinness-authzen-access-request)
 
