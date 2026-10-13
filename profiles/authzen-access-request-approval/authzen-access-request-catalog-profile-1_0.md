---
title: "AuthZEN Access Request Catalog Profile - Draft 1"
abbrev: "ARAP Catalog"
category: std
ipr: none

docname: authzen-access-request-catalog-profile-1_0
workgroup: OpenID AuthZEN
consensus: true
v: 3
stand_alone: true
pi: [toc, sortrefs, symrefs, private]
keyword:
  - authorization
  - access request
  - approval workflow
  - catalog
  - entitlement
  - AI agent
  - just-in-time access
  - governance

author:
  -
    name: Karl McGuinness
    org: Independent
    email: public@karlmcguinness.com

normative:
  RFC9110:
  RFC6749:
  RFC6750:
  RFC6901:
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
    title: "AuthZEN Access Request and Approval Profile 1.0"
    target: "https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html"
    author:
      -
        ins: K. McGuinness
        name: Karl McGuinness
    date: 2026

informative:
  RFC8693:
  I-D.bhutton-json-schema:

--- abstract

This specification defines a companion profile to the AuthZEN Access Request and Approval Profile that adds a Catalogs Document, a Catalog Endpoint protocol, and a Catalog Response format, so that a Policy Enforcement Point, whether it renders a form for a human user or acts as an autonomous agent, can resolve Access Request form fields whose values are selected from a backing catalog such as applications, entitlements, roles, or cost centers.  The profile adds one member, `request_catalogs_url`, to the requestable denial, and changes nothing about Access Request submission, task handling, or re-evaluation.

--- middle

# Introduction

An Access Request submitted after a requestable denial often carries more than the Subject, Resource, and Action of the denied evaluation.  Deployments ask the requester which application, which entitlement, which role, or which cost center the request concerns.  Those values are not free text: they are drawn from catalogs that are large, that change continuously, and that are scoped to what a particular requester is permitted to see.

The AuthZEN Access Request and Approval Profile {{ARAP}} lets a Policy Decision Point (PDP) publish a machine-readable description of those additional submission fields through the `request_schema_url` member of a requestable denial.  JSON Schema {{I-D.bhutton-json-schema}} describes the shape and constraints of the data a submission must carry, but it has no vocabulary for remote, requester-scoped enumeration.  A static `enum` embedded in the schema does not work when a catalog holds tens of thousands of entries, when the entitlements that are valid depend on the application the requester selected first, or when two requesters must see different subsets of the same catalog.

A catalog is also an authorization boundary in its own right.  The set of applications, entitlements, roles, or cost centers a requester is permitted to see is itself sensitive: it discloses organizational structure, policy shape, and finance master data.  A catalog surface therefore needs authentication, authorization, and scoping rules, not only a data format.

This profile defines that surface.  It adds:

* A Catalogs Document ({{catalogs-document}}), a sibling artifact to the form schema that maps form fields to the catalogs backing them.
* A Catalog Endpoint protocol ({{catalog-endpoint}}) for searching, scoping, and paginating a catalog.
* A Catalog Response format ({{catalog-response}}) carrying Catalog Items with well-known presentation and triage metadata.
* One member, `request_catalogs_url`, of the requestable denial's `access_request` object ({{requestable-denial-extension}}).

This document is a profile of {{ARAP}} in the sense defined by the Extensibility and Profiles section of that specification, and through it a profile of the AuthZEN Authorization API {{AuthZEN}}.  It populates the `context.access_request` extension point defined by {{ARAP}} with a single member, and defines extension points of its own ({{extensibility}}).  It modifies no other part of {{ARAP}}: Access Request submission, Task Handles, completion semantics, and re-evaluation are unchanged.

This profile does not define an entitlement or catalog data model beyond the members a PEP needs to select and submit a value.  It does not define provisioning or fulfillment.  It does not define an agent-protocol transport or discovery mechanism.  It does not define a user-interface rendering vocabulary.

# Requirements Notation and Conventions

{::boilerplate bcp14-tagged}

The terms Policy Decision Point (PDP), Policy Enforcement Point (PEP), Subject, Resource, Action, Context, and Decision are used as defined by {{AuthZEN}}.

# Terminology

This specification uses the terms Policy Enforcement Point (PEP), Policy Decision Point (PDP), Access Request, Access Request Service, Access Request Endpoint, requestable denial, and Task Handle as defined in {{ARAP}}, and the terms Subject, Resource, Action, Context, and Decision Context as defined in {{AuthZEN}}.

This specification defines the following additional terms.

Form Schema:
: The machine-readable description of the augmentations a PEP adds to an Access Request submission's `context` and `requested_access` objects, referenced by the `request_schema_url` member of a requestable denial and RECOMMENDED by {{ARAP}} to be a JSON Schema {{I-D.bhutton-json-schema}} document.

Form Data Instance:
: The JSON instance a PEP constructs to satisfy the Form Schema, and into which catalog-resolved values are placed.  JSON Pointers appearing in a Catalogs Document are evaluated against this instance.

Catalog:
: A set of selectable values backing one or more Form Schema fields, for example applications, entitlements, roles, or cost centers.

Catalogs Document:
: A JSON document, referenced by `request_catalogs_url`, that maps Form Schema fields to the Catalog Endpoints from which their values are resolved ({{catalogs-document}}).

Catalog Reference:
: The object within a Catalogs Document that describes how the value of a single Form Schema field is resolved.

Catalog Endpoint:
: An HTTP endpoint that returns a paginated, authorized, requester-scoped list of Catalog Items for a Catalog ({{catalog-endpoint}}).

Catalog Item:
: A single selectable entry returned by a Catalog Endpoint, carrying the value the PEP places into a Form Schema field along with OPTIONAL presentation and triage metadata.

Catalog Response:
: The JSON object a Catalog Endpoint returns for a successful request ({{catalog-response}}).

# Protocol Overview {#overview}

1.  The PEP evaluates access using the AuthZEN Access Evaluation API and receives a requestable denial as defined by {{ARAP}}.
2.  The requestable denial carries both `request_schema_url` and `request_catalogs_url` in its `context.access_request` object.
3.  The PEP verifies that both URLs resolve to hosts trusted under the deployment ({{trusting-catalog-urls}}), then fetches the Form Schema and the Catalogs Document.
4.  For each Form Schema field named in the Catalogs Document, the PEP calls the Catalog Endpoint named by that field's Catalog Reference, supplying a search term and any scope parameters resolved from fields already populated in the Form Data Instance.
5.  The PEP places the value identified by `value_path` in the chosen Catalog Item into the Form Data Instance, then repeats step 4 for any dependent field whose scope parameters have now become resolvable.
6.  The PEP submits the Access Request to the Access Request Endpoint, carrying the completed Form Data Instance as the augmentations to the submission's `context` and `requested_access` objects.
7.  The Access Request Service re-validates every submitted catalog identifier before accepting the submission.

Everything after submission proceeds exactly as defined in {{ARAP}}: the Access Request Service returns a Task Handle, the PEP polls the task or receives a callback, and an approved task is enforced through a new AuthZEN Authorization API evaluation.  This profile changes none of that.

# Requestable Denial Extension {#requestable-denial-extension}

This profile defines one additional member of the `access_request` object in the Decision Context of a requestable denial, added at the extension point defined by the Extensibility and Profiles section of {{ARAP}}.

`request_catalogs_url`:
: OPTIONAL.  HTTPS URI.  URL of a Catalogs Document describing how the PEP resolves form fields whose values are selected from a backing catalog.  See {{catalogs-document}}.

PEPs interacting with deployments that do not include `request_catalogs_url` MAY omit Catalog Endpoint resolution entirely.

The Catalogs Document is a sibling artifact to the Form Schema; it does not modify or extend the JSON Schema referenced by `request_schema_url`.  A PDP MUST include `request_schema_url` when including `request_catalogs_url`.

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
      "template": "application_access",
      "expires_at": "2026-04-30T20:25:00Z",
      "binding_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0.eyJldmFsdWF0aW9uX2lkIjoiZXZhbF8wMUhYNFkyUDhCUTRZM0YwVjBLOUQ2WjdNMSJ9.bXBfc2lnbmF0dXJl",
      "form_url": "https://requests.example.com/forms/application_access",
      "request_schema_url": "https://requests.example.com/schemas/application_access.json",
      "request_catalogs_url": "https://requests.example.com/catalogs/application_access.json",
      "display": {
        "title": "Request access",
        "description": "Manager approval is required before this document can be opened."
      }
    }
  }
}
~~~

# Catalogs Document {#catalogs-document}

The Catalogs Document is a JSON object retrieved from `request_catalogs_url` using the HTTP `GET` method as defined in {{RFC9110}}.  It has the following members:

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

# Catalog Endpoint {#catalog-endpoint}

A Catalog Endpoint accepts an HTTP `GET` request as defined in {{RFC9110}} and returns a paginated list of Catalog Items.

The Catalog Endpoint MUST accept the following query parameters:

* The search parameter named by `search_param` (default `q`): String.  Free-text query supplied by the caller.
* The scope parameters named by `scope_params`: String values taken from other form data fields.
* `cursor`: OPTIONAL.  String.  Opaque pagination cursor returned by a previous response.
* `limit`: OPTIONAL.  Integer.  Caller-requested page size.  The Catalog Endpoint MAY clamp or ignore this value.

The Catalog Endpoint MAY accept additional deployment-specific parameters; receivers MUST ignore parameters they do not recognize.

Catalog Endpoints are protected APIs.  Their authentication and credential rules are defined in {{authorization-and-authentication}}.

A Catalog Endpoint MUST:

* authenticate the caller;
* authorize the caller to enumerate the catalog; and
* return only items the caller is permitted to see for the original Subject, Resource, and Action.

The catalog response is itself an authorization boundary; it MUST NOT disclose entries the requester would not be permitted to request.

# Catalog Response {#catalog-response}

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

# Agent Protocol Catalogs {#catalog-agent-protocol}

Deployments serving agentic PEPs MAY additionally expose catalogs through an agent protocol.  When such a protocol is used, each catalog SHOULD be exposed as a resource whose identifier or URI template encodes the same scope parameters described by `scope_params` (for example, `entitlements://{application_id}`).  Resource read responses SHOULD use the Catalog Response shape defined in {{catalog-response}}.

This profile does not define agent-protocol discovery or transport.  When both an HTTP Catalog Endpoint and an agent-protocol catalog are exposed, they MUST return the same Catalog Items for equivalent scope parameters.

# Processing Rules

## PEP Processing Rules {#pep-processing-rules}

A PEP submitting an Access Request based on a form schema with a companion Catalogs Document:

* When the requestable denial includes `request_catalogs_url`, MUST resolve catalog-backed fields according to this profile, or MUST NOT submit the Access Request if those fields cannot be resolved.
* MUST verify that `request_catalogs_url` and every catalog `endpoint` value resolve to hosts trusted under the deployment before fetching or acting on them, as required by {{trusting-catalog-urls}}.
* MUST treat field values resolved from a catalog as opaque identifiers; the value submitted is exactly the value identified by `value_path` in the chosen Catalog Item.
* MUST resolve every `scope_params` source field before calling the Catalog Endpoint for a dependent field.
* MUST NOT submit catalog values that were not returned by the Catalog Endpoint with the same scope parameters.
* SHOULD use `search_param` rather than enumerating large catalogs.
* MUST treat unknown members of a Catalog Item as informational and MUST NOT rely on them for enforcement.
* MUST NOT treat `granted` or any other Catalog Item member as an authorization decision.  Such members MAY be used to suppress or shape Access Request submission, but MUST NOT be used as authorization input.

## PDP Processing Rules

A PDP implementing this profile:

* MAY include `request_catalogs_url` in a requestable denial when the Access Request requires fields whose values are selected from a backing catalog.
* MUST include `request_schema_url` when including `request_catalogs_url`.
* MUST reference only Catalog Endpoints operated by, or trusted by, the Access Request Service for the deployment.

## Access Request Service Processing Rules

An Access Request Service implementing this profile:

* MUST validate submitted catalog identifiers at submission time.
* MUST reject, normalize, or route for additional review any submitted catalog value that is no longer valid, no longer requestable by the caller, disabled, retired, or materially different in risk or ownership from the item resolved by the PEP.
* When operating Catalog Endpoints, MUST authenticate callers, MUST authorize callers to enumerate the catalog, and MUST return only Catalog Items the caller is permitted to see in the context of the original Subject, Resource, and Action.

# Authorization and Authentication {#authorization-and-authentication}

Catalog Endpoints are protected APIs.  Support for OAuth 2.0 {{RFC6749}} is RECOMMENDED.  When OAuth 2.0 bearer tokens are used, Catalog Endpoints MUST follow {{RFC6750}}.

A Catalog Endpoint SHOULD share an origin with the Access Request Endpoint and SHOULD accept the same caller credentials.  Deployments that host catalogs on a different origin MUST establish a documented mechanism for obtaining credentials accepted by the Catalog Endpoint, for example through OAuth 2.0 Token Exchange {{RFC8693}}; this profile does not define cross-origin credential acquisition.

Authorization for a Catalog Endpoint call is bound to the original Subject, Resource, and Action of the denied evaluation rather than to a specific access token, session, or PEP instance.  The Access Request Service MUST authorize each catalog call independently: authorization to submit an Access Request does not imply authorization to enumerate every catalog the deployment operates.

# Extensibility {#extensibility}

This profile populates the `context.access_request` extension point defined by {{ARAP}} with the `request_catalogs_url` member ({{requestable-denial-extension}}).

This profile defines three additional extension points.  Additional members MAY appear at these locations, and those members MUST follow the naming rules in the Naming Extensions section of {{ARAP}}:

* A Catalogs Document ({{catalogs-document}}).
* A Catalog Reference object within a Catalogs Document ({{catalogs-document}}).
* A Catalog Item within a Catalog Response ({{catalog-response}}).

An implementation receiving a member it does not recognize at an extension point defined by this profile MUST ignore it and MUST NOT fail processing on the basis of the unrecognized name.  An implementation MAY surface unrecognized members in audit records or to a human requester, subject to the rule in {{pep-processing-rules}} that unknown Catalog Item members are informational only.

Registry-eligible member names introduced by this profile are registered in {{member-names}}.

# Privacy Considerations

Search terms and scope parameters sent to a Catalog Endpoint reveal what the requester is looking for before any Access Request is submitted, and may themselves be personal data.  A partially typed search term discloses requester intent even when no Access Request follows.

Catalog Endpoints SHOULD minimize the logging and retention of query strings, and SHOULD retain them only as long as required by business, security, and compliance policy.

Catalog Item metadata can identify people.  The `owner` member in particular names or references an individual, and MUST only be returned to callers authorized to receive it.

PEPs SHOULD NOT cache Catalog Responses beyond the request interaction that produced them.  Catalog contents are scoped to the requester and to the Subject, Resource, and Action of the denied evaluation, so a cached response can outlive both the authorization that produced it and the accuracy of the items it holds.

# Security Considerations

## Trusting Catalog URLs {#trusting-catalog-urls}

The `request_catalogs_url` member of a requestable denial, and the catalog `endpoint` values inside the Catalogs Document it references, are delivered to the PEP inside a denial response or inside a document fetched on the basis of that response.  A compromised or misconfigured PDP, or an Access Request Service compelled by one, could direct the PEP at attacker-controlled hosts to substitute catalogs, harvest search terms and justifications, or perform credential phishing against the requester.

An autonomous PEP MUST verify that these URLs resolve to hosts trusted under the deployment before fetching or acting on them, by requiring the same origin as the Access Request Endpoint advertised in PDP metadata or by maintaining an explicit allowlist of trusted Access Request Service hosts; a PEP that renders them for a human user SHOULD apply the same check.  PEPs MUST NOT submit credentials to a host that is not trusted to receive them.

## Catalog Disclosure

Catalog Endpoints ({{catalog-endpoint}}) can leak sensitive information about applications, entitlements, organizational structure, or finance master data if not properly authorized.  An attacker who can call a Catalog Endpoint without scoping or authorization can enumerate sensitive identifiers, infer access policy, or harvest catalog metadata.

Mitigations:

* Catalog Endpoints MUST authorize callers and MUST return only items the caller is permitted to see for the original Subject, Resource, and Action.
* Catalog Endpoints SHOULD apply rate limits and abuse detection commensurate with the sensitivity of the catalog they expose.
* PEPs SHOULD prefer searching with `search_param` over bulk enumeration.

## Catalog Substitution and Stale Items

A PEP resolves catalog values before submission, and an approval workflow may run for minutes, hours, or days afterward.  An identifier that was valid at resolution time may be retired, re-pointed, or re-classified before the submission is accepted, and a compromised or defective PEP can submit an identifier it never resolved at all.

A PEP MUST NOT submit catalog values that were not returned by the Catalog Endpoint with the same scope parameters, and MUST resolve every `scope_params` source field before calling the Catalog Endpoint for a dependent field.  The PEP-side check is not sufficient on its own: the Access Request Service MUST validate submitted catalog identifiers at submission time and MUST reject, normalize, or route for additional review any value that is no longer valid, no longer requestable by the caller, disabled, retired, or materially different in risk or ownership from the item the PEP resolved.

## Catalog Metadata Is Not Authorization {#catalog-metadata}

Catalog Items carry metadata intended for presentation and triage.  A PEP MUST treat unknown members of a Catalog Item as informational and MUST NOT rely on them for enforcement.  In particular, a PEP MUST NOT treat `granted` or any other Catalog Item member as an authorization decision.  Such members MAY be used to suppress or shape Access Request submission, for example to avoid submitting a request for access the requester already holds, but MUST NOT be used as authorization input.  Authorization remains determined by the PDP at evaluation time and by the Access Request Service at submission time.

# IANA Considerations

This specification makes no requests of IANA.

# OpenID Foundation Registry Considerations {#openid-foundation-registry-considerations}

## AuthZEN Access Request Member Names Registry {#member-names}

This specification registers the following entries in the AuthZEN Access Request Member Names registry established by {{ARAP}}.

| Name | Extension Point | Description |
|---|---|---|
| `request_catalogs_url` | `context.access_request` | HTTPS URL of a Catalogs Document describing how catalog-backed form fields are resolved. |
| `description` | Catalog Item | Human-readable description of the catalog item. |
| `risk_level` | Catalog Item | Risk classification used by the deployment. |
| `granted` | Catalog Item | Boolean indicating the requester already has access to the item. |
| `owner` | Catalog Item | Identifier or reference for the item's owner. |

Change Controller for all entries: OpenID Foundation AuthZEN Working Group.  Specification Document for all entries: This document.

--- back

# Examples

## End-to-End Catalog Resolution

Alice attempts to read a document served by an application she holds no entitlement for.  The PDP returns a requestable denial that points at both a form schema and a Catalogs Document, because the deployment's request form asks which application and which entitlement the request concerns and both values are selected from catalogs.

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
      "endpoint": "https://pdp.example.com/access/v1/requests",
      "template": "application_access",
      "expires_at": "2026-04-30T20:25:00Z",
      "binding_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0.eyJldmFsdWF0aW9uX2lkIjoiZXZhbF8wMUhYNFkyUDhCUTRZM0YwVjBLOUQ2WjdNMSJ9.bXBfc2lnbmF0dXJl",
      "form_url": "https://requests.example.com/forms/application_access",
      "request_schema_url": "https://requests.example.com/schemas/application_access.json",
      "request_catalogs_url": "https://requests.example.com/catalogs/application_access.json"
    }
  }
}
~~~

### Form Schema

The following is a non-normative example of the document retrieved from `request_schema_url`:

~~~ json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://requests.example.com/schemas/application_access.json",
  "type": "object",
  "properties": {
    "application_id": { "type": "string" },
    "entitlement_id": { "type": "string" },
    "business_justification": { "type": "string" },
    "requested_until": { "type": "string", "format": "date-time" }
  },
  "required": [
    "application_id",
    "entitlement_id",
    "business_justification"
  ]
}
~~~

The schema says nothing about catalogs.  `application_id` and `entitlement_id` are plain strings; where their values come from is described separately by the Catalogs Document, and a PEP that understands only the schema still produces a structurally valid submission.

### Catalogs Document {#example-catalogs-document}

The following is a non-normative example of the document retrieved from `request_catalogs_url`:

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

### Resolving the Application

~~~ http
GET /catalog/applications?q=crm&limit=2 HTTP/1.1
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
      "value": "app_123",
      "label": "CRM",
      "description": "Customer relationship management platform"
    },
    {
      "value": "app_456",
      "label": "CRM Analytics",
      "description": "Reporting and analytics over CRM data",
      "granted": true
    }
  ],
  "total": 2
}
~~~

The PEP places `app_123` into the form data instance at `/application_id`.  The `granted` member on the second item tells the PEP that Alice already has access to it; the PEP MAY use that to suppress a redundant submission, but MUST NOT treat it as an authorization decision.

### Resolving the Entitlement

The Catalog Reference for `/entitlement_id` declares a scope parameter sourced from `/application_id`, so the PEP can call the entitlement catalog only after the application has been resolved.

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
    "application_id": "app_123",
    "entitlement_id": "ent_abc",
    "requested_until": "2026-05-01T00:15:00Z"
  },
  "denial": {
    "evaluation_id": "eval_01HX4Y2P8BQ4Y3F0V0K9D6Z7M1",
    "evaluated_at": "2026-04-30T20:15:00Z",
    "expires_at": "2026-04-30T20:25:00Z",
    "reason": "approval_required",
    "binding_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6InBkcC0xIn0.eyJldmFsdWF0aW9uX2lkIjoiZXZhbF8wMUhYNFkyUDhCUTRZM0YwVjBLOUQ2WjdNMSJ9.bXBfc2lnbmF0dXJl",
    "template": "application_access"
  }
}
~~~

The Access Request Service re-validates `app_123` and `ent_abc` before accepting the submission.  In this example the Catalog Endpoints are hosted on `requests.example.com` while the Access Request Endpoint is hosted on `pdp.example.com`; the deployment has arranged for the Catalog Endpoints to accept the same caller credentials, as recommended in {{authorization-and-authentication}}.  From this point the Task Handle, task completion, and the re-evaluation after approval proceed exactly as defined in {{ARAP}}; this profile adds nothing to them.

# Implementation Considerations {#impl-considerations}

This appendix describes common deployment patterns and is non-normative.

## Catalog Translation

Most existing identity-governance, ITSM, and approval platforms have proprietary catalog APIs with vendor-specific request and response shapes.  Implementations translate those APIs to the Catalogs Document and Catalog Endpoint protocol defined in this profile.  Translation may be lossy for vendor-specific metadata; the Catalogs Document and Catalog Response need only carry enough information for an autonomous PEP to select and submit a value, while richer rendering details remain behind `form_url`.  Deployments that expose tools or catalogs to autonomous agents through an agent protocol can additionally surface catalogs through that protocol; see {{catalog-agent-protocol}}.

## Large and Dependent Catalogs

Hierarchical selection is expressed by chaining `scope_params`: a Catalog Reference names the query parameters its endpoint needs and the JSON Pointers that supply them, so a PEP resolves parent fields first and dependent fields afterward.  Deeper chains are possible, but each level adds a round trip and another point at which an autonomous PEP can stall, so deployments benefit from keeping chains shallow.

Catalogs are frequently too large to enumerate.  Implementations should prefer `search_param` over bulk retrieval, honor `next_cursor` for pagination rather than assuming offset semantics, and treat `total` as a display hint only; it may be approximate, expensive to compute, or omitted entirely.

## Human and Agent PEPs

The same Catalog Endpoints serve both PEP shapes.  A human-facing request user interface renders a typeahead or picker directly from the endpoints an autonomous agent calls, using `label_path` for display and `value_path` for the submitted value, so the two surfaces cannot drift apart or disclose different sets of items.

`granted` and `risk_level` support triage in both shapes: a user interface can dim entries the requester already holds and flag high-risk entries for extra confirmation, and an agent can decline to submit a redundant request or hand a high-risk selection to a human.  Neither member is ever an authorization signal; see {{catalog-metadata}}.

# Design Rationale {#design-rationale}

This appendix records non-obvious design choices and the reasoning behind them.  It is non-normative.

## Why are catalog references kept outside the form schema?

JSON Schema {{I-D.bhutton-json-schema}} describes the shape and constraints of a data instance.  Expressing remote enumeration inside it would require either a custom vocabulary that generic validators ignore, or a static `enum` that cannot represent a catalog which is large, changes continuously, or is scoped per requester.  Keeping the Catalogs Document as a sibling artifact lets the form schema remain a pure description of data shape, validated by any conformant validator, while resolution behavior lives in a document designed for it.

## Why a companion profile rather than part of the Access Request and Approval Profile?

Catalog resolution is optional in most deployments and absent entirely in the simplest ones, where the augmentations a submission carries are free text and timestamps.  Folding a catalog protocol, its authorization rules, and its disclosure risks into the base profile would oblige every implementer to read them.  Keeping catalogs in a companion profile keeps the base a thin wire format for the handoff between a denial and the workflow that resolves it, and lets this surface evolve without a revision of the base.

## Why JSON Pointer for field addressing and item paths?

The Catalogs Document has to name a field inside a form data instance whose shape is defined elsewhere, and a value inside a Catalog Item whose shape is partly vendor-defined.  JSON Pointer {{RFC6901}} is a small, fully specified, unambiguous syntax for exactly that, already familiar from JSON Schema tooling, with no query language and no implementation-defined evaluation behavior to make interoperable.  A richer expression language would add attack surface and divergence for no benefit at this scale.

## Why must the Access Request Service re-validate catalog identifiers at submission time?

The PEP's resolution is a convenience, not a security boundary.  A PEP may be compromised, defective, or simply slow: an identifier resolved before an approval workflow ran may be retired or re-classified by the time the submission arrives, and a hostile PEP can submit any string it likes.  The Access Request Service is the only party positioned to decide whether a value is still valid and still requestable by this caller, so the check belongs there regardless of what the PEP did.

## Why is `granted` informational rather than an authorization signal?

`granted` answers a question about the catalog, not about the current evaluation: it says the requester holds some access to the item, not that the denied Subject, Resource, and Action would now be allowed.  Treating it as authorization would move an enforcement decision into a presentation surface that is optional, cacheable, and produced by a service that is not the PDP.  Its value is in suppressing pointless requests, and that is all this profile lets it do.

# Acknowledgements

The author thanks the OpenID AuthZEN Working Group for discussion and review.

# Document History

-00

* Initial version.  Catalog references were moved here from the AuthZEN Access Request and Approval Profile so that the base profile remains a thin wire format.
