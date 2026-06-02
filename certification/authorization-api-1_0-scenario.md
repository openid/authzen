# AuthZEN Authorization API 1.0 - Certification Scenario

## Introduction

This document defines the conformance certification scenario for Policy Decision Points (PDPs) implementing the AuthZEN Authorization API 1.0 specification.

The certification verifies **protocol conformance**: that the PDP correctly accepts well-formed requests and returns correctly structured responses per the specification. The certification does **not** verify the correctness of authorization decisions -- whether a PDP permits or denies a given request is a function of the implementer's policy.

To exercise the protocol, the PDP under test must be loaded with a minimal policy and dataset so that the harness can receive real responses. This scenario defines the required fixture in Section 1. The fixture is deliberately small -- it exists to give the PDP something to evaluate, not to test policy logic.

## Notational Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

## Certification Levels

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

### Test ID Matrix

| Certification Sub-level | Test IDs |
|--------------------------|----------|
| **Basic Core** | 2.2.1, 2.2.2, 2.2.3, 2.2.8, 2.2.9, 2.3.x, 2.4.x, 2.5.x, 2.6 |
| **Basic Properties** | 2.2.4, 2.2.5, 2.2.6, 2.2.7 |
| **Batch Core** | 3.2.1, 3.2.2, 3.2.5, 3.2.6, 3.3.x, 3.4.x |
| **Batch Properties** | 3.2.3, 3.2.4, 3.2.7 |
| **Search Core** | 4.2.1, 4.2.2, 4.2.3, 4.3.1, 4.3.2, 4.4.1, 4.4.2, 4.5.x, 4.6.x, 4.7.x |
| **Search Properties** | 4.2.4, 4.3.3, 4.4.3 |
| **Discovery** | 6.1–6.6 |

Sections 2.3–2.6 (response format, errors, headers, idempotency) and Section 5 (transport) apply to all certification sub-levels.

---

## 1. Required Fixture

The PDP under test MUST be configured with the following minimal fixture so that the harness can exercise all API endpoints against known entity identifiers and receive valid responses.

### 1.1 Subjects

The PDP MUST recognise the following subjects:

| Subject ID | Subject Type | Properties |
|------------|-------------|------------|
| `alice` | `user` | |
| `bob` | `user` | `role`: `"admin"` |

### 1.2 Resources

The PDP MUST recognise the following resources:

| Resource ID | Resource Type | Properties |
|-------------|--------------|------------|
| `record-1` | `record` | `status`: `"active"` |
| `record-2` | `record` | `status`: `"archived"` |

### 1.3 Actions

The PDP MUST recognise the following action names:

| Action Name | Properties |
|-------------|------------|
| `read` | |
| `write` | |
| `delete` | `soft`: `true` or `false` |

### 1.4 Required Policy Behaviour

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

### 1.5 Search Fixture Requirements (Search Certification Only)

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

### 1.6 Fixture Notes

- **Rules 1-4 use identifier fields only.** The harness sends `type`, `id`, and `name` without `properties`. The PDP may resolve attributes internally or the policy may not require them.
- **Rules 5-8 require properties.** The harness sends `properties` on subject, resource, and/or action. The PDP MUST evaluate these values to produce the correct decision.
- **The `context` field is not required for fixture decisions.** The eight required decisions in Section 1.4 MUST hold regardless of whether `context` is present or absent in the request.
- **Additional entities are permitted.** The PDP MAY have additional subjects, resources, actions, and policies beyond the fixture. The harness only sends requests using the fixture identifiers defined above.

---

## 2. Basic Certification: Access Evaluation API

### 2.1 Endpoint

The PDP MUST expose the Access Evaluation API at:

```
POST /access/v1/evaluation
```

Or at a path discoverable via the PDP metadata endpoint (see Section 6).

### 2.2 Request Acceptance

The PDP MUST accept a valid Access Evaluation request containing `subject`, `action`, and `resource` and return an HTTP 200 response.

**Core (Basic Core certification):**

#### 2.2.1 Fixture request -- permit decision

**Request:**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 200. Response body:
```json
{
  "decision": true
}
```

This is a fixture request (Section 1.4, rule 1). The harness validates both the response structure and the decision value.

#### 2.2.2 Fixture request -- deny decision

**Request:**
```json
{
  "subject": { "type": "user", "id": "bob" },
  "action": { "name": "write" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 200. Response body:
```json
{
  "decision": false
}
```

This is a fixture request (Section 1.4, rule 4). The harness validates both the response structure and the decision value.

#### 2.2.3 Request with optional context

The PDP MUST accept a request that includes the optional `context` field without error. The fixture decision MUST NOT change.

**Request:**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" },
  "context": {
    "time": "2025-06-27T18:03-07:00",
    "ip": "192.168.1.1"
  }
}
```

**Expected:** HTTP 200, `"decision": true`.

**Properties (Basic Properties certification):**

#### 2.2.4 Fixture request -- deny based on properties

The PDP MUST evaluate `properties` values passed in the request. This test validates rule 5 from Section 1.4.

**Request:**
```json
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
```

**Expected:** HTTP 200. Response body:
```json
{
  "decision": false
}
```

This is a fixture request (Section 1.4, rule 5). The harness validates both the response structure and the decision value. The deny is based on `properties.status` being `"archived"`, not on the resource identifier.

#### 2.2.5 Fixture request -- permit based on subject properties

The PDP MUST evaluate `properties` on the subject. This test validates rule 6 from Section 1.4.

**Request:**
```json
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
```

**Expected:** HTTP 200. Response body:
```json
{
  "decision": true
}
```

This is a fixture request (Section 1.4, rule 6). The harness validates both the response structure and the decision value. The permit is based on `subject.properties.role` being `"admin"`, which overrides the archived resource constraint from rule 5.

#### 2.2.6 Fixture request -- permit based on action properties

The PDP MUST evaluate `properties` on the action. This test validates rule 7 from Section 1.4.

**Request:**
```json
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
```

**Expected:** HTTP 200. Response body:
```json
{
  "decision": true
}
```

This is a fixture request (Section 1.4, rule 7). Soft delete is permitted.

#### 2.2.7 Fixture request -- deny based on action properties

This test validates rule 8 from Section 1.4.

**Request:**
```json
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
```

**Expected:** HTTP 200. Response body:
```json
{
  "decision": false
}
```

This is a fixture request (Section 1.4, rule 8). Hard delete is denied.

**Core (continued — structural tests for Basic Core certification):**

#### 2.2.8 Request with additional properties

The PDP MUST accept a request where entities include additional `properties` beyond those required by the fixture.

**Request:**
```json
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
```

**Expected:** HTTP 200, `"decision": true`.

#### 2.2.9 Request with unknown fields

Per the specification's forward-compatibility requirement, the PDP MUST ignore unrecognised fields in the request body without error.

**Request:**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" },
  "foo": "bar",
  "futureField": { "nested": true }
}
```

**Expected:** HTTP 200, `"decision": true`.

### 2.3 Response Format

#### 2.3.1 Decision field is required

The response MUST contain a `decision` field with a boolean value.

The harness validates:
- The response body is valid JSON.
- The `decision` field is present.
- The `decision` field is a boolean (`true` or `false`).

#### 2.3.2 Response context is permitted

The PDP MAY include a `context` field in the response. If present, it MUST be a JSON object. The harness does not validate the contents of the response context.

### 2.4 Error Handling

#### 2.4.1 Missing required fields

The PDP MUST return HTTP 400 when a required field is missing from the request.

**Request (missing `subject`):**
```json
{
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 400.

**Request (missing `action`):**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 400.

**Request (missing `resource`):**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" }
}
```

**Expected:** HTTP 400.

#### 2.4.2 Missing required sub-fields

The PDP MUST return HTTP 400 when a required sub-field is missing.

**Request (subject missing `type`):**
```json
{
  "subject": { "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 400.

**Request (subject missing `id`):**
```json
{
  "subject": { "type": "user" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 400.

**Request (action missing `name`):**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "action": {},
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 400.

**Request (resource missing `type`):**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "id": "record-1" }
}
```

**Expected:** HTTP 400.

**Request (resource missing `id`):**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record" }
}
```

**Expected:** HTTP 400.

#### 2.4.3 Invalid content type

The PDP MUST return HTTP 400 when the request `Content-Type` is not `application/json`.

#### 2.4.4 Malformed JSON

The PDP MUST return HTTP 400 when the request body is not valid JSON.

#### 2.4.5 Empty request body

The PDP MUST return HTTP 400 when the request body is empty.

#### 2.4.6 Invalid field types

The PDP MUST return HTTP 400 when a field has an invalid type.

**Request (subject is string instead of object):**
```json
{
  "subject": "alice",
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 400.

**Request (action.name is number instead of string):**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": 123 },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 400.

### 2.5 Header Handling

#### 2.5.1 X-Request-ID echo

If the request includes an `X-Request-ID` header, the PDP MUST include the same `X-Request-ID` value in the response headers.

#### 2.5.2 X-Request-ID absent

If the request does not include an `X-Request-ID` header, the PDP MUST NOT fail. The PDP MAY generate its own `X-Request-ID` in the response.

### 2.6 Idempotency

The harness sends the same fixture request multiple times consecutively. The PDP MUST return the same `decision` value each time.

---

## 3. Batch Certification: Access Evaluations API

Batch Core certification requires Basic Core as a prerequisite. Batch Properties certification requires Basic Properties as a prerequisite.

### 3.1 Endpoint

The PDP MUST expose the Access Evaluations API at:

```
POST /access/v1/evaluations
```

Or at a path discoverable via the PDP metadata endpoint.

### 3.2 Request Acceptance

**Core (Batch Core certification):**

#### 3.2.1 Batch request with evaluations array

**Request:**
```json
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
```

**Expected:** HTTP 200 with a response body containing an `evaluations` array of two decision objects. Each object MUST contain a `decision` boolean.

```json
{
  "evaluations": [
    { "decision": <boolean> },
    { "decision": <boolean> }
  ]
}
```

#### 3.2.2 Batch with fixture decisions validated

**Request:**
```json
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
```

**Expected:** HTTP 200.
```json
{
  "evaluations": [
    { "decision": true },
    { "decision": false }
  ]
}
```

The harness validates both structure and decision values because both requests correspond to fixture rules (Section 1.4, rules 3 and 4). This also validates response ordering -- `read` (permit) must be first, `write` (deny) must be second.

**Properties (Batch Properties certification):**

#### 3.2.3 Batch with properties validated

This test validates that the PDP evaluates `properties` values in batch requests (Section 1.4, rules 2 and 5).

**Request:**
```json
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
```

**Expected:** HTTP 200.
```json
{
  "evaluations": [
    { "decision": true },
    { "decision": false }
  ]
}
```

The first evaluation permits (alice can write to active records). The second evaluation denies (rule 5: archived status blocks write). This validates that properties are evaluated per-item in the batch.

#### 3.2.4 Batch with subject properties validated

This test validates that the PDP evaluates subject `properties` in batch requests (Section 1.4, rules 5 and 6).

**Request:**
```json
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
```

**Expected:** HTTP 200.
```json
{
  "evaluations": [
    { "decision": false },
    { "decision": true }
  ]
}
```

The first evaluation denies (rule 5: alice cannot write to archived). The second evaluation permits (rule 6: admin role overrides archived constraint). This validates that subject properties are evaluated per-item in the batch.

**Core (continued — Batch Core certification):**

#### 3.2.5 Batch with fully specified evaluations (no defaults)

**Request:**
```json
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
```

**Expected:** HTTP 200. Evaluations array of two elements with decisions `true` and `false` respectively.

#### 3.2.6 Batch with context inheritance

Top-level `context` applies to all evaluations unless overridden per-evaluation.

**Request:**
```json
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
```

**Expected:** HTTP 200 with two evaluations. The harness validates that the request is accepted; the decision values are not validated (not fixture rules).

**Properties (continued — Batch Properties certification):**

#### 3.2.7 Batch with default value merging

> **Advisory:** Per-evaluation fields override top-level defaults at the **entity level** (whole-object replacement), not at the sub-field level. A per-evaluation `resource` replaces the entire top-level `resource`, except that the PDP MUST fall back to the top-level value for any required sub-field (`type`, `id`) absent from the per-evaluation object. This test validates that behavior. Vendors MAY treat this test as advisory until the specification text is updated to codify entity-level replacement semantics.

**Request:**
```json
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
```

**Expected:** HTTP 200.
```json
{
  "evaluations": [
    { "decision": true },
    { "decision": false }
  ]
}
```

The first evaluation merges the per-evaluation `resource.id` and `resource.properties` with the top-level `resource.type`, yielding a fully specified resource `record-1` with `status: "active"`. Alice can write to active records (rule 2). The second evaluation fully specifies the resource, so no merging is needed. Alice cannot write to archived records (rule 5).

### 3.3 Response Format

#### 3.3.1 Response array length matches request

The `evaluations` array in the response MUST have the same number of elements as the `evaluations` array in the request.

#### 3.3.2 Response ordering

The `evaluations` array in the response MUST be in the same order as the `evaluations` array in the request.

#### 3.3.3 Each evaluation contains a decision

Each element in the response `evaluations` array MUST contain a `decision` field with a boolean value. Each element MAY contain a `context` field.

#### 3.3.4 Top-level decision field

When the response contains an `evaluations` array, the top-level `decision` field SHOULD be omitted. If present, the harness ignores it.

### 3.4 Error Handling

#### 3.4.1 Evaluation-level errors

If a single evaluation within a batch fails (e.g. due to missing required fields in that evaluation), the PDP MUST handle this as an evaluation-level error for otherwise valid batch payloads: return HTTP 200 with an `evaluations` array matching the request cardinality, set the failed item to `"decision": false`, and MAY include error details in that item's `context`.

Transport-level or whole-payload failures (for example malformed JSON) remain HTTP error responses as defined in Section 2.4.

**Request (second evaluation missing resource):**
```json
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
```

**Expected:** HTTP 200 with two evaluations. The second evaluation MUST have `"decision": false`.

#### 3.4.2 Missing evaluations array (backwards-compatible)

Per the specification, if the `evaluations` array is not present, the Access Evaluations endpoint behaves in a backwards-compatible manner with the single Access Evaluation API. The PDP MUST accept a valid request with `subject`, `action`, and `resource` at the top level and return an Access Evaluation response.

**Request (missing evaluations):**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 200. Response body:
```json
{
  "decision": true
}
```

This is a fixture request (Section 1.4, rule 1). The harness validates both the response structure and the decision value.

#### 3.4.3 Empty evaluations array (backwards-compatible)

Per the specification, if the `evaluations` array is empty, the Access Evaluations endpoint behaves in a backwards-compatible manner with the single Access Evaluation API. The PDP MUST accept a valid request with `subject`, `action`, and `resource` at the top level and return an Access Evaluation response.

**Request (empty evaluations):**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" },
  "evaluations": []
}
```

**Expected:** HTTP 200. Response body:
```json
{
  "decision": true
}
```

This is a fixture request (Section 1.4, rule 1). The harness validates both the response structure and the decision value.

---

## 4. Search Certification

### 4.1 Endpoints

The PDP MUST expose the following Search APIs:

```
POST /access/v1/search/subject
POST /access/v1/search/resource
POST /access/v1/search/action
```

Or at paths discoverable via the PDP metadata endpoint.

### 4.2 Subject Search

**Core (Search Core certification):**

#### 4.2.1 Valid subject search request with non-empty results

**Request:**
```json
{
  "subject": { "type": "user" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 200 with a `results` array. Per the fixture (Section 1.5), the results MUST include at least:
```json
{
  "results": [
    { "type": "user", "id": "alice" },
    { "type": "user", "id": "bob" }
  ]
}
```

The harness validates:
- HTTP 200 response.
- `results` is an array.
- Each element contains `type` and `id`.
- Each element's `type` matches the requested type (`user`).
- `alice` and `bob` appear in the results.
- Additional results beyond `alice` and `bob` are permitted.

#### 4.2.2 Subject search with context

The PDP MUST accept a Subject Search request that includes the optional `context` field.

#### 4.2.3 Subject search with subject id present

Per the specification, `subject.id` should be omitted from Subject Search requests. The harness does not send `subject.id` in Subject Search requests.

**Properties (Search Properties certification):**

#### 4.2.4 Subject search with resource properties — fixture validated

**Request:**
```json
{
  "subject": { "type": "user" },
  "action": { "name": "write" },
  "resource": {
    "type": "record",
    "id": "record-2",
    "properties": { "status": "archived" }
  }
}
```

**Expected:** HTTP 200 with a `results` array. Per the fixture (Section 1.5), the results MUST include at least `bob`. Validates rule 6.

### 4.3 Resource Search

**Core (Search Core certification):**

#### 4.3.1 Valid resource search request with non-empty results

**Request:**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "action": { "name": "read" },
  "resource": { "type": "record" }
}
```

**Expected:** HTTP 200 with a `results` array. Per the fixture (Section 1.5), the results MUST include at least:
```json
{
  "results": [
    { "type": "record", "id": "record-1" }
  ]
}
```

The harness validates:
- HTTP 200 response.
- `results` is an array.
- Each element contains `type` and `id`.
- Each element's `type` matches the requested type (`record`).
- `record-1` appears in the results.
- Additional results are permitted.

#### 4.3.2 Resource search with resource id present

Per the specification, `resource.id` should be omitted from Resource Search requests. The harness does not send `resource.id` in Resource Search requests.

**Properties (Search Properties certification):**

#### 4.3.3 Resource search with subject properties — fixture validated

**Request:**
```json
{
  "subject": {
    "type": "user",
    "id": "bob",
    "properties": { "role": "admin" }
  },
  "action": { "name": "write" },
  "resource": { "type": "record" }
}
```

**Expected:** HTTP 200 with a `results` array. Per the fixture (Section 1.5), the results MUST include at least `record-2`. Validates rule 6.

### 4.4 Action Search

**Core (Search Core certification):**

#### 4.4.1 Valid action search request with non-empty results

Note: the `action` field is omitted entirely from Action Search requests.

**Request:**
```json
{
  "subject": { "type": "user", "id": "alice" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 200 with a `results` array. Per the fixture (Section 1.5), the results MUST include at least:
```json
{
  "results": [
    { "name": "read" },
    { "name": "write" }
  ]
}
```

The harness validates:
- HTTP 200 response.
- `results` is an array.
- Each element contains a `name` field.
- `read` and `write` appear in the results (per rules 1 and 2).
- Additional results are permitted.

#### 4.4.2 Action search with context

The PDP MUST accept an Action Search request that includes the optional `context` field.

**Properties (Search Properties certification):**

#### 4.4.3 Action search with properties — fixture validated

**Request:**
```json
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
```

**Expected:** HTTP 200 with a `results` array. Per the fixture (Section 1.5), the results MUST include at least `write`. Validates rule 6.

### 4.5 Pagination

#### 4.5.1 Request with page limit

The PDP MUST accept a search request that includes a `page` object with a `limit` field.

**Request:**
```json
{
  "subject": { "type": "user" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" },
  "page": {
    "limit": 1
  }
}
```

**Expected:** HTTP 200 with a `results` array. If the PDP supports pagination, the response MAY include a `page` object.

The harness validates:
- HTTP 200 response.
- `results` is an array.
- If `page` is present in the response, it MUST be an object.
- If `page.next_token` is present, it MUST be a string.

#### 4.5.2 Request with page token

If the PDP returned a non-empty `next_token` in a previous response, the harness sends a follow-up request with that token.

**Request:**
```json
{
  "subject": { "type": "user" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" },
  "page": {
    "token": "<next_token from previous response>"
  }
}
```

**Expected:** HTTP 200 with a `results` array.

The harness validates:
- HTTP 200 response.
- `results` is an array.
- `page` is present and is an object.
- `page.next_token` is present and is a string.
- If more results exist, `page.next_token` is a non-empty string.
- If no more results exist, `page.next_token` is an empty string.

#### 4.5.3 Pagination response format

If the PDP returns paginated results, the response `page` object:
- MUST contain `next_token` (string). Empty string signals end of results.
- MAY contain `count` (number of results in this response).
- MAY contain `total` (total number of matching results).
- MAY contain `properties` (implementation-specific metadata).

#### 4.5.4 Pagination is optional

The PDP MAY support pagination on search endpoints. If it does not support pagination, it MUST:
- Return all results in a single response.
- Accept requests containing a `page` object without error (ignoring it).
- Omit the `page` object from the response, or return `page.next_token` as an empty string.

> **Note:** The certification harness does not require PDPs to demonstrate multi-page result sets. The fixture is deliberately small, so PDPs that support pagination are unlikely to produce multiple pages. The harness validates only that the PDP accepts pagination parameters and returns structurally valid responses.

### 4.6 Empty results

The PDP MUST return an empty `results` array (not an error) when no entities match the search criteria. This applies both when the entity identifier is unknown and when the entity type itself is unrecognised by the PDP.

#### 4.6.1 Unknown entity identifier

**Request:**
```json
{
  "subject": { "type": "user", "id": "nonexistent-user" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:**
```json
{
  "results": []
}
```

#### 4.6.2 Unknown entity type

The PDP MUST return an empty `results` array (not HTTP 400) when the search specifies an entity type the PDP does not recognise.

**Request:**
```json
{
  "subject": { "type": "spaceship" },
  "action": { "name": "read" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:**
```json
{
  "results": []
}
```

### 4.7 Search Error Handling

#### 4.7.1 Missing required fields

The PDP MUST return HTTP 400 when a required field is missing from a search request.

**Subject Search (missing `action`):**
```json
{
  "subject": { "type": "user" },
  "resource": { "type": "record", "id": "record-1" }
}
```

**Expected:** HTTP 400.

**Resource Search (missing `subject`):**
```json
{
  "action": { "name": "read" },
  "resource": { "type": "record" }
}
```

**Expected:** HTTP 400.

**Action Search (missing `resource`):**
```json
{
  "subject": { "type": "user", "id": "alice" }
}
```

**Expected:** HTTP 400.

#### 4.7.2 Missing required sub-fields

**Subject Search (resource missing `id`):**
```json
{
  "subject": { "type": "user" },
  "action": { "name": "read" },
  "resource": { "type": "record" }
}
```

**Expected:** HTTP 400.

**Resource Search (subject missing `id`):**
```json
{
  "subject": { "type": "user" },
  "action": { "name": "read" },
  "resource": { "type": "record" }
}
```

**Expected:** HTTP 400.

---

## 5. Transport Requirements

These requirements apply to all certification levels.

1. The PDP MUST accept HTTPS requests with `Content-Type: application/json`.
2. Successful evaluation and search responses MUST return HTTP 200 with `Content-Type: application/json`.
3. Missing required fields MUST return HTTP 400.
4. The PDP MUST echo the `X-Request-ID` header if present in the request.
5. The PDP MUST ignore unknown fields in the request body.

---

## 6. Discovery Certification: PDP Metadata

Discovery is an independent certification level. It is not a prerequisite for Basic, Batch, or Search certification. A PDP that does not expose the metadata endpoint can still certify at other levels by using default paths (see Section 6.6).

### 6.1 Metadata Endpoint

The PDP SHOULD expose a metadata endpoint at the well-known URI derived from the PDP base URL by inserting `/.well-known/authzen-configuration` between the host and any existing path/query components.

For a PDP base URL with no path component, this is:

```
GET /.well-known/authzen-configuration
```

For example, a PDP base URL scoped by tenant path may expose:

```
GET /.well-known/authzen-configuration/tenant1
```

### 6.2 Metadata Response Format

If exposed, the response MUST be HTTP 200 with `Content-Type: application/json`.

**Example response:**
```json
{
  "policy_decision_point": "https://pdp.example.com",
  "access_evaluation_endpoint": "https://pdp.example.com/access/v1/evaluation",
  "access_evaluations_endpoint": "https://pdp.example.com/access/v1/evaluations",
  "search_subject_endpoint": "https://pdp.example.com/access/v1/search/subject",
  "search_resource_endpoint": "https://pdp.example.com/access/v1/search/resource",
  "search_action_endpoint": "https://pdp.example.com/access/v1/search/action",
  "capabilities": ["urn:authzen:evaluation", "urn:authzen:evaluations", "urn:authzen:search"],
  "signed_metadata": "eyJhbGciOiJSUzI1NiIs..."
}
```

### 6.3 Required Metadata Fields

The response MUST include:
- `policy_decision_point` -- Base URL of the PDP (HTTPS, no query string or fragment).
- `access_evaluation_endpoint` -- URL for the Access Evaluation API.

### 6.4 Optional Metadata Fields

The response MAY include:
- `access_evaluations_endpoint` -- URL for the Access Evaluations API.
- `search_subject_endpoint` -- URL for the Subject Search API.
- `search_resource_endpoint` -- URL for the Resource Search API.
- `search_action_endpoint` -- URL for the Action Search API.
- `capabilities` -- Array of capability URNs supported by the PDP.
- `signed_metadata` -- A JSON Web Token (JWT) containing metadata claims. If present, it MUST be digitally signed or MACed using JSON Web Signature (JWS) and MUST contain an `iss` (issuer) claim. Metadata values in the signed token take precedence over plain JSON values in the response.

### 6.5 Metadata Validation

The harness validates:
- HTTP 200 response with `Content-Type: application/json`.
- Response body is valid JSON.
- `policy_decision_point` is present and matches the base URL used for discovery.
- `access_evaluation_endpoint` is present and is a valid HTTPS URL.
- If `access_evaluations_endpoint` is present, it is a valid HTTPS URL.
- If `search_*_endpoint` fields are present, they are valid HTTPS URLs.
- If `capabilities` is present, it is an array of strings.
- If `signed_metadata` is present, it is a valid JWT string with a verifiable signature and contains an `iss` claim.

### 6.6 Metadata Endpoint Unavailable

For **Discovery certification**: the metadata endpoint MUST be available. An HTTP 404 response is a certification failure.

For **other certification levels** (Basic, Batch, Search): if the metadata endpoint is not available (HTTP 404), the harness falls back to the default paths defined in the specification:
- `/access/v1/evaluation`
- `/access/v1/evaluations`
- `/access/v1/search/subject`
- `/access/v1/search/resource`
- `/access/v1/search/action`


