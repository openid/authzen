---
title: "AuthZEN Authorization API 1.0 - Certification Scenario"
abbrev: "AuthZEN Cert Scenario"
category: info
date: 2026
ipr: none

docname: authorization-api-1_0-scenario
consensus: true
workgroup: OpenID AuthZEN
keyword:
 - authorization
 - certification
 - conformance
 - AuthZEN
 - PDP
 - access control
 - interoperability

stand_alone: true
smart_quotes: no
pi: [toc, sortrefs, symrefs, private]

author:
 -
    fullname: Alex Olivier
    organization: Cerbos
    email: alex@cerbos.dev

normative:
  RFC2119:
  RFC8174:
  RFC7515:
  RFC7519:
  AUTHZEN:
    title: "Authorization API 1.0"
    target: https://openid.github.io/authzen/
    author:
      -
        name: Omri Gazitt
        org: Aserto
      -
        name: David Brossard
        org: Axiomatics
      -
        name: Atul Tulshibagwale
        org: SGNL
    date: 2026

--- abstract

This document defines the conformance certification scenario for Policy Decision Points (PDPs) implementing the AuthZEN Authorization API 1.0. It specifies a minimal fixture and a set of certification levels -- Basic, Batch, Search, and Discovery -- that verify protocol conformance: that a PDP correctly accepts well-formed requests and returns correctly structured responses per the specification. The scenario does not verify the correctness of authorization decisions, which are a function of the implementer's policy.

--- middle

# Introduction {#introduction}

This document defines the conformance certification scenario for Policy Decision Points (PDPs) implementing the AuthZEN Authorization API 1.0 {{AUTHZEN}} specification.

The certification verifies **protocol conformance**: that the PDP correctly accepts well-formed requests and returns correctly structured responses per the specification. The certification does **not** verify the correctness of authorization decisions -- whether a PDP permits or denies a given request is a function of the implementer's policy.

To exercise the protocol, the PDP under test must be loaded with a minimal policy and dataset so that the harness can receive real responses. This scenario defines the required fixture in [](#c-1). The fixture is deliberately small -- it exists to give the PDP something to evaluate, not to test policy logic.

# Notational Conventions {#notational-conventions}

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 {{RFC2119}} {{RFC8174}} when, and only when, they appear in all capitals, as shown here.

# Certification Levels {#certification-levels}

A PDP MAY certify at one or more of the following levels. Each level has sub-levels that distinguish tests using only required identifier fields (Core) from tests that require `properties` evaluation (Properties):

| Level | Sub-level | APIs Covered | Description |
|-------|-----------|-------------|-------------|
| **Basic** | Core | Access Evaluation | Single decision using required fields only |
| **Basic** | Properties | Access Evaluation | Single decision using entity properties |
| **Batch** | Core | Access Evaluations | Multiple decisions using required fields only |
| **Batch** | Properties | Access Evaluations | Multiple decisions using entity properties and default value merging |
| **Search** | Core | Subject, Resource, Action Search | Discovery using required fields only |
| **Search** | Properties | Subject, Resource, Action Search | Discovery using entity properties |
| **Discovery** | — | PDP Metadata | Well-known configuration endpoint |

Prerequisites:

- Batch Core requires Basic Core.
- Batch Properties requires Basic Properties.
- Search Properties requires Search Core.

## Test ID Matrix {#test-id-matrix}

| Certification Sub-level | Tests |
|--------------------------|-------|
| **Basic Core** | [](#c-2-2-1), [](#c-2-2-2), [](#c-2-2-3), [](#c-2-2-8), [](#c-2-2-9), [](#c-2-3), [](#c-2-4), [](#c-2-5), [](#c-2-6) |
| **Basic Properties** | [](#c-2-2-4), [](#c-2-2-5), [](#c-2-2-6), [](#c-2-2-7) |
| **Batch Core** | [](#c-3-2-1), [](#c-3-2-2), [](#c-3-2-5), [](#c-3-2-6), [](#c-3-3), [](#c-3-4) |
| **Batch Properties** | [](#c-3-2-3), [](#c-3-2-4), [](#c-3-2-7) |
| **Search Core** | [](#c-4-2-1), [](#c-4-2-2), [](#c-4-2-3), [](#c-4-3-1), [](#c-4-3-2), [](#c-4-4-1), [](#c-4-4-2), [](#c-4-5), [](#c-4-6), [](#c-4-7) |
| **Search Properties** | [](#c-4-2-4), [](#c-4-3-3), [](#c-4-4-3) |
| **Discovery** | [](#c-6) |

The response format, error handling, header handling, and idempotency requirements ([](#c-2-3), [](#c-2-4), [](#c-2-5), [](#c-2-6)) and the transport requirements ([](#c-5)) apply to all certification sub-levels.


# Required Fixture {#c-1}

The PDP under test MUST be configured with the following minimal fixture so that the harness can exercise all API endpoints against known entity identifiers and receive valid responses.

## Subjects {#c-1-1}

The PDP MUST recognise the following subjects:

| Subject ID | Subject Type | Properties |
|------------|-------------|------------|
| `alice` | `user` | |
| `bob` | `user` | `role`: `"admin"` |

## Resources {#c-1-2}

The PDP MUST recognise the following resources:

| Resource ID | Resource Type | Properties |
|-------------|--------------|------------|
| `record-1` | `record` | `status`: `"active"` |
| `record-2` | `record` | `status`: `"archived"` |

## Actions {#c-1-3}

The PDP MUST recognise the following action names:

| Action Name | Properties |
|-------------|------------|
| `read` | |
| `write` | |
| `delete` | `soft`: `true` or `false` |

## Required Policy Behaviour {#c-1-4}

The PDP MUST implement a policy such that:

**Core** (identifier fields only):

1. For subject `alice` performing action `read` on resource `record-1`: the decision MUST be `true`.
2. For subject `alice` performing action `write` on resource `record-1`: the decision MUST be `true`.
3. For subject `bob` performing action `read` on resource `record-1`: the decision MUST be `true`.
4. For subject `bob` performing action `write` on resource `record-1`: the decision MUST be `false`.

**Properties** (require `properties` evaluation):

5. For subject `alice` performing action `write` on a resource with `properties.status` = `"archived"`: the decision MUST be `false`.
6. For a subject with `properties.role` = `"admin"` performing action `write` on a resource with `properties.status` = `"archived"`: the decision MUST be `true`.
7. For subject `alice` performing action `delete` with `properties.soft` = `true` on resource `record-1`: the decision MUST be `true`.
8. For subject `alice` performing action `delete` with `properties.soft` = `false` on resource `record-1`: the decision MUST be `false`.

Rules 1–4 use only identifier fields. Rules 5–8 require the PDP to evaluate `properties` values passed in the request.

These eight decisions are the **only** decision values the harness validates. All other requests to the PDP use fixture entity identifiers but the harness only validates response structure, not the decision value.

How the PDP implements this policy is entirely at the implementer's discretion. The fixture could be a single hard-coded rule, a full RBAC model, or anything in between.

## Search Fixture Requirements (Search Certification Only) {#c-1-5}

For Search certification, the fixture MUST be configured such that:

**Core:**

1. A Subject Search for subjects of type `user` who can perform `read` on resource `record-1` MUST return a non-empty `results` array that includes at least `alice` and `bob`.
2. A Resource Search for resources of type `record` that subject `alice` can perform `read` on MUST return a non-empty `results` array that includes at least `record-1`.
3. An Action Search for subject `alice` on resource `record-1` MUST return a non-empty `results` array that includes at least `read` and `write` (per rules 1 and 2).

**Properties:**

4. A Subject Search for subjects of type `user` who can perform `write` on resource `record-2` with `properties.status` = `"archived"` MUST return a non-empty `results` array that includes at least `bob` (per rule 6).
5. A Resource Search for resources of type `record` that subject `bob` with `properties.role` = `"admin"` can perform `write` on MUST return a non-empty `results` array that includes at least `record-2` (per rule 6).
6. An Action Search for subject `bob` with `properties.role` = `"admin"` on resource `record-2` with `properties.status` = `"archived"` MUST return a non-empty `results` array that includes at least `write`.

> **Note:** `delete` is excluded from the Properties Action Search fixture. Action Search omits the `action` key from requests per the spec, so `action.properties.soft` cannot be provided. Action Search results return action names only, without constraining properties.

These conditions ensure the harness can validate that search responses contain structurally valid, non-empty result sets. The harness validates that the expected entities appear in the results but does not reject additional results.

## Fixture Notes {#c-1-6}

- **Rules 1-4 use identifier fields only.** The harness sends `type`, `id`, and `name` without `properties`. The PDP may resolve attributes internally or the policy may not require them.
- **Rules 5-8 require properties.** The harness sends `properties` on subject, resource, and/or action. The PDP MUST evaluate these values to produce the correct decision.
- **The `context` field is not required for fixture decisions.** The eight required decisions in [](#c-1-4) MUST hold regardless of whether `context` is present or absent in the request.
- **Additional entities are permitted.** The PDP MAY have additional subjects, resources, actions, and policies beyond the fixture. The harness only sends requests using the fixture identifiers defined above.


# Basic Certification: Access Evaluation API {#c-2}

## Endpoint {#c-2-1}

The PDP MUST expose the Access Evaluation API at:

~~~
POST /access/v1/evaluation
~~~

Or at a path discoverable via the PDP metadata endpoint (see [](#c-6)).

## Request Acceptance {#c-2-2}

The PDP MUST accept a valid Access Evaluation request containing `subject`, `action`, and `resource` and return an HTTP 200 response.

**Core (Basic Core certification):**

### Fixture request -- permit decision {#c-2-2-1}

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 200. Response body:

~~~ json
{
  "decision": true
}
~~~

This is a fixture request ([](#c-1-4), rule 1). The harness validates both the response structure and the decision value.

### Fixture request -- deny decision {#c-2-2-2}

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "bob" },
  "action": { "name": "write" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 200. Response body:

~~~ json
{
  "decision": false
}
~~~

This is a fixture request ([](#c-1-4), rule 4). The harness validates both the response structure and the decision value.

### Request with optional context {#c-2-2-3}

The PDP MUST accept a request that includes the optional `context` field without error. The fixture decision MUST NOT change.

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" },
  "context": {
    "time": "2025-06-27T18:03-07:00",
    "ip": "192.168.1.1"
  }
}
~~~

**Expected:** HTTP 200, `"decision": true`.

**Properties (Basic Properties certification):**

### Fixture request -- deny based on properties {#c-2-2-4}

The PDP MUST evaluate `properties` values passed in the request. This test validates rule 5 from [](#c-1-4).

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "write" },
  "resource": {
    "type": "record",
    "id": "record-2",
    "properties": {
      "status": "archived"
    }
  }
}
~~~

**Expected:** HTTP 200. Response body:

~~~ json
{
  "decision": false
}
~~~

This is a fixture request ([](#c-1-4), rule 5). The harness validates both the response structure and the decision value. The deny is based on `properties.status` being `"archived"`, not on the resource identifier.

### Fixture request -- permit based on subject properties {#c-2-2-5}

The PDP MUST evaluate `properties` on the subject. This test validates rule 6 from [](#c-1-4).

**Request:**

~~~ json
{
  "subject": {
    "type": "user",
    "id": "bob",
    "properties": {
      "role": "admin"
    }
  },
  "action": { "name": "write" },
  "resource": {
    "type": "record",
    "id": "record-2",
    "properties": {
      "status": "archived"
    }
  }
}
~~~

**Expected:** HTTP 200. Response body:

~~~ json
{
  "decision": true
}
~~~

This is a fixture request ([](#c-1-4), rule 6). The harness validates both the response structure and the decision value. The permit is based on `subject.properties.role` being `"admin"`, which overrides the archived resource constraint from rule 5.

### Fixture request -- permit based on action properties {#c-2-2-6}

The PDP MUST evaluate `properties` on the action. This test validates rule 7 from [](#c-1-4).

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": {
    "name": "delete",
    "properties": {
      "soft": true
    }
  },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 200. Response body:

~~~ json
{
  "decision": true
}
~~~

This is a fixture request ([](#c-1-4), rule 7). Soft delete is permitted.

### Fixture request -- deny based on action properties {#c-2-2-7}

This test validates rule 8 from [](#c-1-4).

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": {
    "name": "delete",
    "properties": {
      "soft": false
    }
  },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 200. Response body:

~~~ json
{
  "decision": false
}
~~~

This is a fixture request ([](#c-1-4), rule 8). Hard delete is denied.

**Core (continued — structural tests for Basic Core certification):**

### Request with additional properties {#c-2-2-8}

The PDP MUST accept a request where entities include additional `properties` beyond those required by the fixture.

**Request:**

~~~ json
{
  "subject": {
    "type": "user",
    "id": "alice",
    "properties": {
      "department": "Sales",
      "role": "manager"
    }
  },
  "action": {
    "name": "read",
    "properties": {
      "method": "GET"
    }
  },
  "resource": {
    "type": "record",
    "id": "record-1",
    "properties": {
      "status": "active",
      "owner": "bob"
    }
  }
}
~~~

**Expected:** HTTP 200, `"decision": true`.

### Request with unknown fields {#c-2-2-9}

Per the specification's forward-compatibility requirement, the PDP MUST ignore unrecognised fields in the request body without error.

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" },
  "foo": "bar",
  "futureField": { "nested": true }
}
~~~

**Expected:** HTTP 200, `"decision": true`.

## Response Format {#c-2-3}

### Decision field is required {#c-2-3-1}

The response MUST contain a `decision` field with a boolean value.

The harness validates:

- The response body is valid JSON.
- The `decision` field is present.
- The `decision` field is a boolean (`true` or `false`).

### Response context is permitted {#c-2-3-2}

The PDP MAY include a `context` field in the response. If present, it MUST be a JSON object. The harness does not validate the contents of the response context.

## Error Handling {#c-2-4}

### Missing required fields {#c-2-4-1}

The PDP MUST return HTTP 400 when a required field is missing from the request.

**Request (missing `subject`):**

~~~ json
{
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 400.

**Request (missing `action`):**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 400.

**Request (missing `resource`):**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" }
}
~~~

**Expected:** HTTP 400.

### Missing required sub-fields {#c-2-4-2}

The PDP MUST return HTTP 400 when a required sub-field is missing.

**Request (subject missing `type`):**

~~~ json
{
  "subject": { "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 400.

**Request (subject missing `id`):**

~~~ json
{
  "subject": { "type": "user" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 400.

**Request (action missing `name`):**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": {},
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 400.

**Request (resource missing `type`):**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "id": "record-1" }
}
~~~

**Expected:** HTTP 400.

**Request (resource missing `id`):**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record" }
}
~~~

**Expected:** HTTP 400.

### Invalid content type {#c-2-4-3}

The PDP MUST return HTTP 400 when the request `Content-Type` is not `application/json`.

### Malformed JSON {#c-2-4-4}

The PDP MUST return HTTP 400 when the request body is not valid JSON.

### Empty request body {#c-2-4-5}

The PDP MUST return HTTP 400 when the request body is empty.

### Invalid field types {#c-2-4-6}

The PDP MUST return HTTP 400 when a field has an invalid type.

**Request (subject is string instead of object):**

~~~ json
{
  "subject": "alice",
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 400.

**Request (action.name is number instead of string):**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": 123 },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 400.

## Header Handling {#c-2-5}

### X-Request-ID echo {#c-2-5-1}

If the request includes an `X-Request-ID` header, the PDP MUST include the same `X-Request-ID` value in the response headers.

### X-Request-ID absent {#c-2-5-2}

If the request does not include an `X-Request-ID` header, the PDP MUST NOT fail. The PDP MAY generate its own `X-Request-ID` in the response.

## Idempotency {#c-2-6}

The harness sends the same fixture request multiple times consecutively. The PDP MUST return the same `decision` value each time.


# Batch Certification: Access Evaluations API {#c-3}

Batch Core certification requires Basic Core as a prerequisite. Batch Properties certification requires Basic Properties as a prerequisite.

## Endpoint {#c-3-1}

The PDP MUST expose the Access Evaluations API at:

~~~
POST /access/v1/evaluations
~~~

Or at a path discoverable via the PDP metadata endpoint.

## Request Acceptance {#c-3-2}

**Core (Batch Core certification):**

### Batch request with evaluations array {#c-3-2-1}

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "evaluations": [
    {
      "resource": { "type": "record", "id": "record-1" }
    },
    {
      "resource": { "type": "record", "id": "record-2" }
    }
  ]
}
~~~

**Expected:** HTTP 200 with a response body containing an `evaluations` array of two decision objects. Each object MUST contain a `decision` boolean.

~~~
{
  "evaluations": [
    { "decision": <boolean> },
    { "decision": <boolean> }
  ]
}
~~~

### Batch with fixture decisions validated {#c-3-2-2}

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "bob" },
  "resource": { "type": "record", "id": "record-1" },
  "evaluations": [
    {
      "action": { "name": "read" }
    },
    {
      "action": { "name": "write" }
    }
  ]
}
~~~

**Expected:** HTTP 200.

~~~ json
{
  "evaluations": [
    { "decision": true },
    { "decision": false }
  ]
}
~~~

The harness validates both structure and decision values because both requests correspond to fixture rules ([](#c-1-4), rules 3 and 4). This also validates response ordering -- `read` (permit) must be first, `write` (deny) must be second.

**Properties (Batch Properties certification):**

### Batch with properties validated {#c-3-2-3}

This test validates that the PDP evaluates `properties` values in batch requests ([](#c-1-4), rules 2 and 5).

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "write" },
  "evaluations": [
    {
      "resource": {
        "type": "record",
        "id": "record-1",
        "properties": { "status": "active" }
      }
    },
    {
      "resource": {
        "type": "record",
        "id": "record-2",
        "properties": { "status": "archived" }
      }
    }
  ]
}
~~~

**Expected:** HTTP 200.

~~~ json
{
  "evaluations": [
    { "decision": true },
    { "decision": false }
  ]
}
~~~

The first evaluation permits (alice can write to active records). The second evaluation denies (rule 5: archived status blocks write). This validates that properties are evaluated per-item in the batch.

### Batch with subject properties validated {#c-3-2-4}

This test validates that the PDP evaluates subject `properties` in batch requests ([](#c-1-4), rules 5 and 6).

**Request:**

~~~ json
{
  "action": { "name": "write" },
  "resource": {
    "type": "record",
    "id": "record-2",
    "properties": { "status": "archived" }
  },
  "evaluations": [
    {
      "subject": { "type": "user", "id": "alice" }
    },
    {
      "subject": {
        "type": "user",
        "id": "bob",
        "properties": { "role": "admin" }
      }
    }
  ]
}
~~~

**Expected:** HTTP 200.

~~~ json
{
  "evaluations": [
    { "decision": false },
    { "decision": true }
  ]
}
~~~

The first evaluation denies (rule 5: alice cannot write to archived). The second evaluation permits (rule 6: admin role overrides archived constraint). This validates that subject properties are evaluated per-item in the batch.

**Core (continued — Batch Core certification):**

### Batch with fully specified evaluations (no defaults) {#c-3-2-5}

**Request:**

~~~ json
{
  "evaluations": [
    {
      "subject": { "type": "user", "id": "alice" },
      "action": { "name": "read" },
      "resource": { "type": "record", "id": "record-1" }
    },
    {
      "subject": { "type": "user", "id": "bob" },
      "action": { "name": "write" },
      "resource": { "type": "record", "id": "record-1" }
    }
  ]
}
~~~

**Expected:** HTTP 200. Evaluations array of two elements with decisions `true` and `false` respectively.

~~~ json
{
  "evaluations": [
    { "decision": true },
    { "decision": false }
  ]
}
~~~

### Batch with context inheritance {#c-3-2-6}

Top-level `context` applies to all evaluations unless overridden per-evaluation.

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "context": {
    "time": "2025-06-27T18:03-07:00"
  },
  "evaluations": [
    {
      "resource": { "type": "record", "id": "record-1" }
    },
    {
      "resource": { "type": "record", "id": "record-2" },
      "context": {
        "time": "2025-06-27T19:00-07:00",
        "source": "batch-override"
      }
    }
  ]
}
~~~

**Expected:** HTTP 200 with two evaluations. The harness validates that the request is accepted; the decision values are not validated (not fixture rules).

**Properties (continued — Batch Properties certification):**

### Batch with default value merging {#c-3-2-7}

> **Advisory:** Per-evaluation fields override top-level defaults at the **entity level** (whole-object replacement), not at the sub-field level. A per-evaluation `resource` replaces the entire top-level `resource`, except that the PDP MUST fall back to the top-level value for any required sub-field (`type`, `id`) absent from the per-evaluation object. This test validates that behavior. Vendors MAY treat this test as advisory until the specification text is updated to codify entity-level replacement semantics.

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "write" },
  "resource": { "type": "record" },
  "evaluations": [
    {
      "resource": {
        "id": "record-1",
        "properties": { "status": "active" }
      }
    },
    {
      "resource": {
        "type": "record",
        "id": "record-2",
        "properties": { "status": "archived" }
      }
    }
  ]
}
~~~

**Expected:** HTTP 200.

~~~ json
{
  "evaluations": [
    { "decision": true },
    { "decision": false }
  ]
}
~~~

The first evaluation merges the per-evaluation `resource.id` and `resource.properties` with the top-level `resource.type`, yielding a fully specified resource `record-1` with `status: "active"`. Alice can write to active records (rule 2). The second evaluation fully specifies the resource, so no merging is needed. Alice cannot write to archived records (rule 5).

## Response Format {#c-3-3}

### Response array length matches request {#c-3-3-1}

The `evaluations` array in the response MUST have the same number of elements as the `evaluations` array in the request.

### Response ordering {#c-3-3-2}

The `evaluations` array in the response MUST be in the same order as the `evaluations` array in the request.

### Each evaluation contains a decision {#c-3-3-3}

Each element in the response `evaluations` array MUST contain a `decision` field with a boolean value. Each element MAY contain a `context` field.

### Top-level decision field {#c-3-3-4}

When the response contains an `evaluations` array, the top-level `decision` field SHOULD be omitted. If present, the harness ignores it.

## Error Handling {#c-3-4}

### Evaluation-level errors {#c-3-4-1}

If a single evaluation within a batch fails (e.g. due to missing required fields in that evaluation), the PDP MUST handle this as an evaluation-level error for otherwise valid batch payloads: return HTTP 200 with an `evaluations` array matching the request cardinality, set the failed item to `"decision": false`, and MAY include error details in that item's `context`.

Transport-level or whole-payload failures (for example malformed JSON) remain HTTP error responses as defined in [](#c-2-4).

**Request (second evaluation missing resource):**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "evaluations": [
    {
      "resource": { "type": "record", "id": "record-1" }
    },
    {}
  ]
}
~~~

**Expected:** HTTP 200 with two evaluations. The second evaluation MUST have `"decision": false`.

~~~ json
{
  "evaluations": [
    { "decision": true },
    { "decision": false, "context": <context> }
  ]
}
~~~

### Missing evaluations array (backwards-compatible) {#c-3-4-2}

Per the specification, if the `evaluations` array is not present, the Access Evaluations endpoint behaves in a backwards-compatible manner with the single Access Evaluation API. The PDP MUST accept a valid request with `subject`, `action`, and `resource` at the top level and return an Access Evaluation response.

**Request (missing evaluations):**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 200. Response body:

~~~ json
{
  "decision": true
}
~~~

This is a fixture request ([](#c-1-4), rule 1). The harness validates both the response structure and the decision value.

### Empty evaluations array (backwards-compatible) {#c-3-4-3}

Per the specification, if the `evaluations` array is empty, the Access Evaluations endpoint behaves in a backwards-compatible manner with the single Access Evaluation API. The PDP MUST accept a valid request with `subject`, `action`, and `resource` at the top level and return an Access Evaluation response.

**Request (empty evaluations):**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" },
  "evaluations": []
}
~~~

**Expected:** HTTP 200. Response body:

~~~ json
{
  "decision": true
}
~~~

This is a fixture request ([](#c-1-4), rule 1). The harness validates both the response structure and the decision value.


# Search Certification {#c-4}

## Endpoints {#c-4-1}

The PDP MUST expose the following Search APIs:

~~~
POST /access/v1/search/subject
POST /access/v1/search/resource
POST /access/v1/search/action
~~~

Or at paths discoverable via the PDP metadata endpoint.

## Subject Search {#c-4-2}

**Core (Search Core certification):**

### Valid subject search request with non-empty results {#c-4-2-1}

**Request:**

~~~ json
{
  "subject": { "type": "user" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 200 with a `results` array. Per the fixture ([](#c-1-5)), the results MUST include at least:

~~~ json
{
  "results": [
    { "type": "user", "id": "alice" },
    { "type": "user", "id": "bob" }
  ]
}
~~~

The harness validates:

- HTTP 200 response.
- `results` is an array.
- Each element contains `type` and `id`.
- Each element's `type` matches the requested type (`user`).
- `alice` and `bob` appear in the results.
- Additional results beyond `alice` and `bob` are permitted.

### Subject search with context {#c-4-2-2}

The PDP MUST accept a Subject Search request that includes the optional `context` field.

### Subject search with subject id present {#c-4-2-3}

Per the specification, `subject.id` should be omitted from Subject Search requests. The harness does not send `subject.id` in Subject Search requests.

**Properties (Search Properties certification):**

### Subject search with resource properties — fixture validated {#c-4-2-4}

**Request:**

~~~ json
{
  "subject": { "type": "user" },
  "action": { "name": "write" },
  "resource": {
    "type": "record",
    "id": "record-2",
    "properties": { "status": "archived" }
  }
}
~~~

**Expected:** HTTP 200 with a `results` array. Per the fixture ([](#c-1-5)), the results MUST include at least `bob`. Validates rule 6.

## Resource Search {#c-4-3}

**Core (Search Core certification):**

### Valid resource search request with non-empty results {#c-4-3-1}

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record" }
}
~~~

**Expected:** HTTP 200 with a `results` array. Per the fixture ([](#c-1-5)), the results MUST include at least:

~~~ json
{
  "results": [
    { "type": "record", "id": "record-1" }
  ]
}
~~~

The harness validates:

- HTTP 200 response.
- `results` is an array.
- Each element contains `type` and `id`.
- Each element's `type` matches the requested type (`record`).
- `record-1` appears in the results.
- Additional results are permitted.

### Resource search with resource id present {#c-4-3-2}

Per the specification, `resource.id` should be omitted from Resource Search requests. The harness does not send `resource.id` in Resource Search requests.

**Properties (Search Properties certification):**

### Resource search with subject properties — fixture validated {#c-4-3-3}

**Request:**

~~~ json
{
  "subject": {
    "type": "user",
    "id": "bob",
    "properties": { "role": "admin" }
  },
  "action": { "name": "write" },
  "resource": { "type": "record" }
}
~~~

**Expected:** HTTP 200 with a `results` array. Per the fixture ([](#c-1-5)), the results MUST include at least `record-2`. Validates rule 6.

## Action Search {#c-4-4}

**Core (Search Core certification):**

### Valid action search request with non-empty results {#c-4-4-1}

Note: the `action` field is omitted entirely from Action Search requests.

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "alice" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 200 with a `results` array. Per the fixture ([](#c-1-5)), the results MUST include at least:

~~~ json
{
  "results": [
    { "name": "read" },
    { "name": "write" }
  ]
}
~~~

The harness validates:

- HTTP 200 response.
- `results` is an array.
- Each element contains a `name` field.
- `read` and `write` appear in the results (per rules 1 and 2).
- Additional results are permitted.

### Action search with context {#c-4-4-2}

The PDP MUST accept an Action Search request that includes the optional `context` field.

**Properties (Search Properties certification):**

### Action search with properties — fixture validated {#c-4-4-3}

**Request:**

~~~ json
{
  "subject": {
    "type": "user",
    "id": "bob",
    "properties": { "role": "admin" }
  },
  "resource": {
    "type": "record",
    "id": "record-2",
    "properties": { "status": "archived" }
  }
}
~~~

**Expected:** HTTP 200 with a `results` array. Per the fixture ([](#c-1-5)), the results MUST include at least `write`. Validates rule 6.

## Pagination {#c-4-5}

### Request with page limit {#c-4-5-1}

The PDP MUST accept a search request that includes a `page` object with a `limit` field.

**Request:**

~~~ json
{
  "subject": { "type": "user" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" },
  "page": {
    "limit": 1
  }
}
~~~

**Expected:** HTTP 200 with a `results` array. If the PDP supports pagination, the response MAY include a `page` object.

The harness validates:

- HTTP 200 response.
- `results` is an array.
- If `page` is present in the response, it MUST be an object.
- If `page.next_token` is present, it MUST be a string.

### Request with page token {#c-4-5-2}

If the PDP returned a non-empty `next_token` in a previous response, the harness sends a follow-up request with that token.

**Request:**

~~~ json
{
  "subject": { "type": "user" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" },
  "page": {
    "token": "<next_token from previous response>"
  }
}
~~~

**Expected:** HTTP 200 with a `results` array.

The harness validates:

- HTTP 200 response.
- `results` is an array.
- `page` is present and is an object.
- `page.next_token` is present and is a string.
- If more results exist, `page.next_token` is a non-empty string.
- If no more results exist, `page.next_token` is an empty string.

### Pagination response format {#c-4-5-3}

If the PDP returns paginated results, the response `page` object:

- MUST contain `next_token` (string). Empty string signals end of results.
- MAY contain `count` (number of results in this response).
- MAY contain `total` (total number of matching results).
- MAY contain `properties` (implementation-specific metadata).

### Pagination is optional {#c-4-5-4}

The PDP MAY support pagination on search endpoints. If it does not support pagination, it MUST:

- Return all results in a single response.
- Accept requests containing a `page` object without error (ignoring it).
- Omit the `page` object from the response, or return `page.next_token` as an empty string.

> **Note:** The certification harness does not require PDPs to demonstrate multi-page result sets. The fixture is deliberately small, so PDPs that support pagination are unlikely to produce multiple pages. The harness validates only that the PDP accepts pagination parameters and returns structurally valid responses.

## Empty results {#c-4-6}

The PDP MUST return an empty `results` array (not an error) when no entities match the search criteria. This applies both when the entity identifier is unknown and when the entity type itself is unrecognised by the PDP.

### Unknown entity identifier {#c-4-6-1}

**Request:**

~~~ json
{
  "subject": { "type": "user", "id": "nonexistent-user" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:**

~~~ json
{
  "results": []
}
~~~

### Unknown entity type {#c-4-6-2}

The PDP MUST return an empty `results` array (not HTTP 400) when the search specifies an entity type the PDP does not recognise.

**Request:**

~~~ json
{
  "subject": { "type": "spaceship" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:**

~~~ json
{
  "results": []
}
~~~

## Search Error Handling {#c-4-7}

### Missing required fields {#c-4-7-1}

The PDP MUST return HTTP 400 when a required field is missing from a search request.

**Subject Search (missing `action`):**

~~~ json
{
  "subject": { "type": "user" },
  "resource": { "type": "record", "id": "record-1" }
}
~~~

**Expected:** HTTP 400.

**Resource Search (missing `subject`):**

~~~ json
{
  "action": { "name": "read" },
  "resource": { "type": "record" }
}
~~~

**Expected:** HTTP 400.

**Action Search (missing `resource`):**

~~~ json
{
  "subject": { "type": "user", "id": "alice" }
}
~~~

**Expected:** HTTP 400.

### Missing required sub-fields {#c-4-7-2}

**Subject Search (resource missing `id`):**

~~~ json
{
  "subject": { "type": "user" },
  "action": { "name": "read" },
  "resource": { "type": "record" }
}
~~~

**Expected:** HTTP 400.

**Resource Search (subject missing `id`):**

~~~ json
{
  "subject": { "type": "user" },
  "action": { "name": "read" },
  "resource": { "type": "record" }
}
~~~

**Expected:** HTTP 400.


# Transport Requirements {#c-5}

These requirements apply to all certification levels.

1. The PDP MUST accept HTTPS requests with `Content-Type: application/json`.
2. Successful evaluation and search responses MUST return HTTP 200 with `Content-Type: application/json`.
3. Missing required fields MUST return HTTP 400.
4. The PDP MUST echo the `X-Request-ID` header if present in the request.
5. The PDP MUST ignore unknown fields in the request body.


# Discovery Certification: PDP Metadata {#c-6}

Discovery is an independent certification level. It is not a prerequisite for Basic, Batch, or Search certification. A PDP that does not expose the metadata endpoint can still certify at other levels by using default paths (see [](#c-6-6)).

## Metadata Endpoint {#c-6-1}

The PDP SHOULD expose a metadata endpoint at the well-known URI derived from the PDP base URL by inserting `/.well-known/authzen-configuration` between the host and any existing path/query components.

For a PDP base URL with no path component, this is:

~~~
GET /.well-known/authzen-configuration
~~~

For example, a PDP base URL scoped by tenant path may expose:

~~~
GET /.well-known/authzen-configuration/tenant1
~~~

## Metadata Response Format {#c-6-2}

If exposed, the response MUST be HTTP 200 with `Content-Type: application/json`.

**Example response:**

~~~ json
{
  "policy_decision_point": "https://pdp.example.com",
  "access_evaluation_endpoint": "https://pdp.example.com/access/v1/evaluation",
  "access_evaluations_endpoint": "https://pdp.example.com/access/v1/evaluations",
  "search_subject_endpoint": "https://pdp.example.com/access/v1/search/subject",
  "search_resource_endpoint": "https://pdp.example.com/access/v1/search/resource",
  "search_action_endpoint": "https://pdp.example.com/access/v1/search/action",
  "signed_metadata": "eyJhbGciOiJSUzI1NiIs..."
}
~~~

## Required Metadata Fields {#c-6-3}

The response MUST include:

- `policy_decision_point` -- Base URL of the PDP (HTTPS, no query string or fragment).
- `access_evaluation_endpoint` -- URL for the Access Evaluation API.

## Optional Metadata Fields {#c-6-4}

The response MAY include:

- `access_evaluations_endpoint` -- URL for the Access Evaluations API.
- `search_subject_endpoint` -- URL for the Subject Search API.
- `search_resource_endpoint` -- URL for the Resource Search API.
- `search_action_endpoint` -- URL for the Action Search API.
- `capabilities` -- Array of capability URNs supported by the PDP.
- `signed_metadata` -- A JSON Web Token (JWT) {{RFC7519}} containing metadata claims. If present, it MUST be digitally signed or MACed using JSON Web Signature (JWS) {{RFC7515}} and MUST contain an `iss` (issuer) claim. Metadata values in the signed token take precedence over plain JSON values in the response.

## Metadata Validation {#c-6-5}

The harness validates:

- HTTP 200 response with `Content-Type: application/json`.
- Response body is valid JSON.
- `policy_decision_point` is present and matches the base URL used for discovery.
- `access_evaluation_endpoint` is present and is a valid HTTPS URL.
- If `access_evaluations_endpoint` is present, it is a valid HTTPS URL.
- If `search_*_endpoint` fields are present, they are valid HTTPS URLs.
- If `capabilities` is present, it is an array of strings.
- If `signed_metadata` is present, it is a valid JWT string with a verifiable signature and contains an `iss` claim.

## Metadata Endpoint Unavailable {#c-6-6}

For **Discovery certification**: the metadata endpoint MUST be available. An HTTP 404 response is a certification failure.

For **other certification levels** (Basic, Batch, Search): if the metadata endpoint is not available (HTTP 404), the harness falls back to the default paths defined in the specification:

- `/access/v1/evaluation`
- `/access/v1/evaluations`
- `/access/v1/search/subject`
- `/access/v1/search/resource`
- `/access/v1/search/action`

--- back
