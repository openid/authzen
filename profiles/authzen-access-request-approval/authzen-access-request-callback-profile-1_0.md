---
title: "AuthZEN Callback Notifications Profile - Draft 1"
abbrev: "ARAP Callback"
category: std
ipr: none

docname: authzen-access-request-callback-profile-1_0
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
  RFC6750:
  ARAP:
    title: "AuthZEN Access Request and Approval Profile 1.0"
    target: "https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html"
    author:
      -
        ins: K. McGuinness
        name: Karl McGuinness
    date: 2026
  BULK:
    title: "AuthZEN Bulk Access Requests Profile 1.0"
    target: "https://openid.github.io/authzen/authzen-access-request-bulk-profile-1_0.html"
    author:
      -
        ins: K. McGuinness
        name: Karl McGuinness
    date: 2026

--- abstract

This profile defines callback notifications for the AuthZEN Access Request and Approval Profile, including the callback submission member, notification payload, endpoint validation, authentication, and interaction with polling and deployment-level subscriptions.

--- middle

# Introduction

This companion to the AuthZEN Access Request and Approval Profile {{ARAP}} defines the `callback` submission member and authenticated notifications of task completion.  It also describes completion through deployment-level event subscriptions.  Task status retrieval, approval verification, and re-evaluation remain defined by the base profile.

A notification can carry an enforceable result or prompt the PEP to retrieve task status.  The delivery, authentication, and correlation rules below distinguish those cases.  This profile defines no new capability-negotiation or callback-acceptance handshake.

The `partial` event name corresponds to the bulk task status defined by {{BULK}}; other task statuses are defined by {{ARAP}}.

# Requirements Notation and Conventions

{::boilerplate bcp14-tagged}

The terms PEP, PDP, Subject, Resource, Action, Context, Access Request, Access Request Service, Task Handle, and Approval Result are used as defined by {{ARAP}}.

# Callback Completion {#callback-completion}

`callback`:
: OPTIONAL.  Object describing a callback endpoint where the Access Request Service can send completion notifications.

A PEP MAY request callback notification by including a `callback` object in the Access Request submission.

The `callback` object has the following members:

`endpoint`:
: REQUIRED.  HTTPS URI to which the Access Request Service sends completion notifications.

  * The Access Request Service MUST validate that the endpoint is authorized for the authenticated PEP, either by matching a pre-registered callback URI or by applying an explicit deployment allowlist.
  * The Access Request Service MUST reject callback endpoints that resolve to loopback, link-local, private-use, or otherwise internal network addresses unless the deployment has explicitly allowed that destination.

  In-cluster or same-trust-domain deployments allowlist specific internal destinations rather than disabling this protection against server-side request forgery.

`state`:
: OPTIONAL.  Opaque value supplied by the PEP and returned unmodified in the callback.

`events`:
: OPTIONAL.  Array of event names requested by the PEP.  Defined event names are `approved`, `denied`, `expired`, `cancelled`, `failed`, and `partial`.

## Notification Delivery {#notification-delivery}

Callback notifications MUST contain a `task` member and MAY contain a `result` member.  When present, the `result` object MUST use one of the completion forms defined in [Approval and Re-evaluation](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#completion-semantics).  A callback whose `task.status` is `approved` but that does not contain an enforceable `result` is only a notification; the PEP MUST retrieve the Task Status Endpoint response before enforcing access.

The Access Request Service MUST authenticate to the callback endpoint using a mechanism agreed between the PEP and Access Request Service.  This specification does not mandate a single callback authentication mechanism, but implementations SHOULD use one of the following: an OAuth 2.0 bearer token {{RFC6750}} issued to the Access Request Service, mutual TLS, or an HMAC signature over the request body using a pre-shared key.  Unauthenticated callbacks MUST NOT be accepted.

Callback delivery is a notification optimization.  The Task Status Endpoint remains authoritative unless the callback contains an enforceable completion result under [Approval and Re-evaluation](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html#completion-semantics).

Non-normative notification-only callback: no `result` is included, so the PEP retrieves task status before enforcing access.

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

PEPs SHOULD verify callback origin, bind callbacks to expected task identifiers and state values, and treat callbacks as notifications unless they contain an enforceable result under {{ARAP}}.

## Polling and Event Subscriptions {#polling-and-event-subscriptions}

PEPs subscribed to per-task callbacks ({{callback-completion}}) or to deployment-level event subscriptions MAY skip polling entirely and rely on push notification, falling back to a single status retrieval after each notification to obtain any enforceable `result`.

Implementations MAY satisfy completion notification through deployment-level event subscriptions (for example, organization-scoped webhooks or event-streaming bindings defined by companion specifications) rather than per-task callbacks.  When a deployment relies on such a subscription, the PEP MAY omit the `callback` member from the Access Request submission.  Deployment-level event subscriptions deliver the same Task Handle and lifecycle information to subscribed receivers; they are a notification channel and MUST NOT be treated as enforcement unless paired with a separate enforceable result.

The Access Request Service MAY additionally publish lifecycle events for governance, audit, and analytics consumers through deployment-level event subscriptions defined by companion specifications.  Such channels are independent of the per-task callback and are not used for enforcement.

# Security Considerations

**Callback security.** Callbacks expose spoofing, replay, and request-forgery risks, including server-side request forgery.  {{callback-completion}} defines destination validation, notification authentication, and PEP-side checks.

The base profile's Task Handle authorization and completion rules apply to notification content.  Notification delivery does not replace approval verification or re-evaluation.

# Privacy Considerations

The privacy considerations of {{ARAP}} apply to callback payloads.  Callback destinations and deployment-level subscriptions can disclose task state and approval information to additional recipients.

# IANA Considerations

This specification makes no requests of IANA.

# OpenID Foundation Registry Considerations

## AuthZEN Access Request Member Names Registry {#member-names}

This specification registers the following entries in the AuthZEN Access Request Member Names registry established by {{ARAP}}.

| Name | Extension Point | Description |
|---|---|---|
| `callback` | Access Request submission | Callback destination, correlation state, and selected events. |

Change Controller for all entries: OpenID Foundation AuthZEN Working Group.  Specification Document for all entries: This document.

--- back

# Examples

## End-to-End Agent Tool Discovery

This non-normative example shows an agent requesting access to a tool discovered mid-task.  A broad-scope approval covers related invocations without a new Access Request for each call.

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

The runtime supplies actor and source members to route approval to the agent's owner and record the originating session.  It persists the Task Handle and continues other work while approval proceeds, resuming this operation when the callback arrives.

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

The completed task provides a seven-day approval for the CRM tool class.  The PDP verifies `approval.state` during re-evaluation rather than relying only on an `approval.id` lookup.

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

# Implementation Considerations

## Notification Channels

Existing webhook subscriptions or event-streaming bindings can provide completion notification instead of per-task callbacks ({{callback-completion}}).

# Document History

-00

* Extracted callback notification requirements and related material from the AuthZEN Access Request and Approval Profile without changing their force or conditions.
