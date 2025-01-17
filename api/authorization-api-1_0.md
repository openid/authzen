---
stand_alone: true
ipr: none
cat: std # Check
submissiontype: IETF
wg: OpenID AuthZEN

docname: authorization-api-1_0

title: Authorization API 1.0 – draft 02
abbrev: azapi
lang: en
kw:
  - Authorization
  - Access Management
  - XACML
  - OPA
  - Topaz
  - Cedar
  - PDP
  - PEP
  - ALFA
# date: 2022-02-02 -- date is filled in automatically by xml2rfc if not given
author:
- role: editor # remove if not true
  ins: O. Gazitt
  name: Omri Gazitt
  org: Aserto
  email: omri@aserto.com  
- role: editor # remove if not true
  ins: D. Brossard
  name: David Brossard
  org: Axiomatics
  email: david.brossard@axiomatics.com  
- role: editor # remove if not true
  ins: A. Tulshibagwale
  name: Atul Tulshibagwale
  org: SGNL
  email: atul@sgnl.ai
contributor: # Same structure as author list, but goes into contributors
- name: Marc Jordan
  org: SGNL
  email: marc@sgnl.ai
- name: Erik Gustavson
  org: SGNL
  email: erik@sgnl.ai
- name: Alex Babeanu
  org: 3Edges
  email: alex@3edges.com

normative:
  RFC4001: # text representation of IP addresses
  RFC6749: # OAuth
  RFC8259: # JSON
  RFC9110: # HTTP Semantics
  RFC9493: # Subject Identifiers for Security Event Tokens
  XACML:
    title: eXtensible Access Control Markup Language (XACML) Version 1.1
    target: https://www.oasis-open.org/committees/xacml/repository/cs-xacml-specification-1.1.pdf
    author:
    - name: Simon Godik
      role: editor
      org: Overxeer
    - name: Tim Moses (Ed.)
      role: editor
      org: Entrust
    date: 2006

--- abstract

The Authorization API enables Policy Decision Points (PDPs) and Policy Enforcement Points (PEPs) to communicate authorization requests and decisions to each other without requiring knowledge of each other's inner workings. The Authorization API is served by the PDP and is called by the PEP. The Authorization API includes an Evaluation endpoint, which provides specific access decisions. Other endpoints may be added in the future for other scenarios, including searching for subjects or resources.

--- middle

# Introduction
Computational services often implement access control within their components by separating Policy Decision Points (PDPs) from Policy Enforcement Points (PEPs). PDPs and PEPs are defined in XACML ({{XACML}}) and NIST's ABAC SP 800-162. Communication between PDPs and PEPs follows similar patterns across different software and services that require or provide authorization information. The Authorization API described in this document enables different providers to offer PDP and PEP capabilities without having to bind themselves to one particular implementation of a PDP or PEP.

# Model
The Authorization API is a transport-agnostic API published by the PDP, to which the PEP acts as a client. Possible bindings of this specification, such as HTTPS or gRPC, are described in Transport ({{transport}}).

Authorization for the Authorization API itself is out of scope for this document, since authorization for APIs is well-documented elsewhere. For example, the Authorization API's HTTPS binding MAY support authorization using an `Authorization` header, using a `basic` or `bearer` token. Support for OAuth 2.0 ({{RFC6749}}) is RECOMMENDED. 

# Features
The core feature of the Authorization API is the Access Evaluation API, which enables a PEP to find out if a specific request can be permitted to access a specific resource. The following are non-normative examples:

- Can Alice view document #123?
- Can Alice view document #123 at 16:30 on Tuesday, June 11, 2024?
- Can a manager print?

# API Version
This document describes the API version 1.0. Any updates to this API through subsequent revisions of this document or other documents MAY augment this API, but MUST NOT modify the API described here. Augmentation MAY include additional API methods or additional parameters to existing API methods, additional authorization mechanisms, or additional optional headers in API requests. All API methods for version 1.0 MUST be immediately preceded by the relative URL path `/v1/`.

# Information Model
The information model for requests and responses include the following entities: Subject, Action, Resource, Context, and Decision. These are all defined below.

## Subject {#subject}
A Subject is the user or robotic principal about whom the Authorization API is being invoked. The Subject may be requesting access at the time the Authorization API is invoked.

A Subject is a JSON ({{RFC8259}}) object that contains two REQUIRED keys, `type` and `id`, which have a value typed `string`, and an OPTIONAL key, `properties`, with a value of a JSON object.

`type`:
: REQUIRED. A `string` value that specifies the type of the Subject.

`id`:
: REQUIRED. A `string` value containing the unique identifier of the Subject, scoped to the `type`.

`properties`:
: OPTIONAL. A JSON object containing any number of key-value pairs, which can be used to express additional properties of a Subject.

The following is a non-normative example of a Subject:

~~~ json
{
  "type": "user",
  "id": "alice@acmecorp.com"
}
~~~
{: #subject-example title="Example Subject"}

### Subject Properties {#subject-properties}
Many authorization systems are stateless, and expect the client (PEP) to pass in any properties or attributes that are expected to be used in the evaluation of the authorization policy. To satisfy this requirement, Subjects MAY include zero or more additional attributes as key-value pairs, under the `properties` object.

An attribute can be single-valued or multi-valued. It can be a primitive type (string, boolean, number) or a complex type such as a JSON object or JSON array.

The following is a non-normative example of a Subject which adds a string-valued `department` property:

~~~ json
{
  "type": "user",
  "id": "alice@acmecorp.com",
  "properties": {
    "department": "Sales"
  }
}
~~~
{: #subject-department-example title="Example Subject with Additional Property"}

To increase interoperability, a few common properties are specified below:

#### IP Address {#subject-ip-address}
The IP Address of the Subject, identified by an `ip_address` field, whose value is a textual representation of an IP Address, as defined in `Textual Conventions for Internet Network Addresses` {{RFC4001}}.

The following is a non-normative example of a subject which adds the `ip_address` property:

~~~ json
{
  "type": "user",
  "id": "alice@acmecorp.com",
  "properties": {
    "department": "Sales",
    "ip_address": "172.217.22.14"
  }
}
~~~
{: #subject-ip-address-example title="Example Subject with IP Address"}


#### Device ID {#subject-device-id}
The Device Identifier of the Subject, identified by a `device_id` field, whose value is a string representation of the device identifier.

The following is a non-normative example of a subject which adds the `device_id` property:

~~~ json
{
  "type": "user",
  "id": "alice@acmecorp.com",
  "properties": {
    "department": "Sales",
    "ip_address": "172.217.22.14",
    "device_id": "8:65:ee:17:7e:0b"
  }
}
~~~
{: #subject-device-id-example title="Example Subject with Device ID"}

## Resource {#resource}
A Resource is the target of an access request. It is a JSON ({{RFC8259}}) object that is constructed similar to a Subject entity. It has the follow keys:

`type`:
: REQUIRED. A `string` value that specifies the type of the Resource.

`id`:
: REQUIRED. A `string` value containing the unique identifier of the Resource, scoped to the `type`.

`properties`:
: OPTIONAL. A JSON object containing any number of key-value pairs, which can be used to express additional properties of a Resource.

### Examples (non-normative)

The following is a non-normative example of a Resource with a `type` and a simple `id`:

~~~ json
{
  "type": "book",
  "id": "123"
}
~~~
{: #resource-example title="Example Resource"}

The following is a non-normative example of a Resource containing a `library_record` property, that is itself a JSON object:

~~~ json
{
  "type": "book",
  "id": "123",
  "properties": {
    "library_record":{
      "title": "AuthZEN in Action",
      "isbn": "978-0593383322"
    }
  }
}
~~~
{: #resource-example-structured title="Example Resource with Additional Property"}

## Action {#action}
An Action is the type of access that the requester intends to perform.

Action is a JSON ({{RFC8259}}) object that contains a REQUIRED `name` key with a `string` value, and an OPTIONAL `properties` key with a JSON object value.

`name`:
: REQUIRED. The name of the Action.

`properties`:
: OPTIONAL. A JSON object containing any number of key-value pairs, which can be used to express additional properties of an Action.

The following is a non-normative example of an action:

~~~ json
{
  "name": "can_read"
}
~~~
{: #action-example title="Example Action"}

## Context {#context}
The Context object is a set of attributes that represent environmental or contextual data about the request such as time of day. It is a JSON ({{RFC8259}}) object.

The following is a non-normative example of a Context:

~~~ json
{
  "time": "1985-10-26T01:22-07:00"
}
~~~
{: #context-example title="Example Context"}

# Access Evaluation API {#access-evaluation-api}

The Access Evaluation API defines the message exchange pattern between a client (PEP) and an authorization service (PDP) for executing a single access evaluation.

## The Access Evaluation API Request {#access-evaluation-request}
The Access Evaluation request is a 4-tuple constructed of the four previously defined entities:

`subject`:
: REQUIRED. The subject (or principal) of type Subject

`action`:
: REQUIRED. The action (or verb) of type Action.

`resource`:
: REQUIRED. The resource of type Resource.

`context`:
: OPTIONAL. The context (or environment) of type Context.

### Example (non-normative)

~~~ json
{
  "subject": {
    "type": "user",
    "id": "alice@acmecorp.com"
  },
  "resource": {
    "type": "account",
    "id": "123"
  },
  "action": {
    "name": "can_read",
    "properties": {
      "method": "GET"
    }
  },
  "context": {
    "time": "1985-10-26T01:22-07:00"
  }
}
~~~
{: #request-example title="Example Request"}

## The Access Evaluation API Response {#access-evaluation-response}
The simplest form of a response is simply a boolean representing a Decision, indicated by a `"decision"` field. 

`decision`:
: REQUIRED. A boolean value that specifies whether the Decision is to allow or deny the operation.

In this specification, assuming the evaluation was successful, there are only 2 possible responses:

- `true`: The access request is permitted to go forward.
- `false`: The access request is denied and MUST NOT be permitted to go forward.

The response object MUST contain this boolean-valued Decision key.

### Access Evaluation Decision {#decision}
The following is a non-normative example of a simple Decision:

~~~ json
{
  "decision": true
}
~~~
{: #decision-example title="Example Decision"}

### Additional Context in a Response
In addition to a `"decision"`, a response may contain a `"context"` field which can be any JSON object.  This context can convey additional information that can be used by the PEP as part of the decision evaluation process. Examples include:

- XACML's notion of "advice" and "obligations"
- Hints for rendering UI state
- Instructions for step-up authentication

### Example Context
An implementation MAY follow a structured approach to `"context"`, in which it presents the reasons that an authorization request failed.

- A list of identifiers representing the items (policies, graph nodes, tuples) that were used in the decision-making process.
- A list of reasons as to why access is permitted or denied.

#### Reasons
Reasons MAY be provided by the PDP. 

##### Reason Field {#reason-field}
A Reason Field is a JSON object that has keys and values of type `string`. The following are non-normative examples of Reason Field objects:

~~~ json
{
  "en": "location restriction violation"
}
~~~
{: #reason-example title="Example Reason"}

##### Reason Object {#reason-object}
A Reason Object specifies a particular reason. It is a JSON object that has the following fields:

`id`:
: REQUIRED. A string value that specifies the reason within the scope of a particular response.

`reason_admin`:
: OPTIONAL. The reason, which MUST NOT be shared with the user, but useful for administrative purposes that indicates why the access was denied. The value of this field is a Reason Field object ({{reason-field}}).

`reason_user`:
: OPTIONAL. The reason, which MAY be shared with the user that indicates why the access was denied. The value of this field is a Reason Field object ({{reason-field}}).

The following is a non-normative example of a Reason Object:

~~~ json
{
  "id": "0",
  "reason_admin": {
    "en": "Request failed policy C076E82F"
  },
  "reason_user": {
    "en-403": "Insufficient privileges. Contact your administrator",
    "es-403": "Privilegios insuficientes. Póngase en contacto con su administrador"
  }
}
~~~
{: #example-reason-object title="Example of a Reason Object"}

### Sample Response with additional context (non-normative)

~~~ json
{
  "decision": true,
  "context": {
    "id": "0",
    "reason_admin": {
      "en": "Request failed policy C076E82F"
    },
    "reason_user": {
      "en-403": "Insufficient privileges. Contact your administrator",
      "es-403": "Privilegios insuficientes. Póngase en contacto con su administrador"
    }
  }
}
~~~
{: #response-with-context-example title="Example Response with Context"}

# Access Evaluations API {#access-evaluations-api}

The Access Evaluations API defines the message exchange pattern between a client (PEP) and an authorization service (PDP) for evaluating multiple access evaluations within the scope of a single message exchange (also known as "boxcarring" requests).

## The Access Evaluations API Request {#access-evaluations-request}

The Access Evaluation API Request builds on the information model presented in {{information-model}} and the 4-tuple defined in the Access Evaluation Request ({{access-evaluation-request}}).

To send multiple access evaluation requests in a single message, the caller MAY add an `evaluations` key to the request. The `evaluations` key is an array which contains a list of JSON objects, each typed as a 4-tuple, and specifying a discrete request.

If an `evaluations` array is NOT present, the Access Evaluations Request behaves in a backwards-compatible manner with the (single) Access Evaluation API Request ({{access-evaluation-request}}).

If an `evaluations` array IS present and contains one or more objects, these form distinct requests that the PDP will evaluate. These requests are independent from each other, and may be executed sequentially or in parallel, left to the discretion of each implementation.

If the `evaluations` array IS present and contains one or more objects, the top-level `subject`, `action`, `resource`, and `context` keys (4-tuple) in the request object MAY be omitted. However, if one or more of these values is present, they provide default values for their respective fields in the evaluation requests. This behavior is described in {{default-values}}.

The following is a non-normative example for specifying three requests, with no default values:

~~~json
{
  "evaluations": [
    {
      "subject": {
        "type": "user",
        "id": "alice@acmecorp.com"
      },
      "action": {
        "name": "can_read"
      },
      "resource": {
        "type": "document",
        "id": "boxcarring.md"
      },
      "context":{
        "time": "2024-05-31T15:22-07:00"
      }
    },
    {
      "subject": {
        "type": "user",
        "id": "alice@acmecorp.com"
      },
      "action": {
        "name": "can_read"
      },
      "resource": {
        "type": "document",
        "id": "subject-search.md"
      },
      "context":{
        "time": "2024-05-31T15:22-07:00"
      }
    },
    {
      "subject": {
        "type": "user",
        "id": "alice@acmecorp.com"
      },
      "action": {
        "name": "can_read"
      },
      "resource": {
        "type": "document",
        "id": "resource-search.md"
      },
      "context":{
        "time": "2024-05-31T15:22-07:00"
      }
    }
  ]
}
~~~

### Default values

While the example above provides the most flexibility in specifying distinct values in each request for every evaluation, it is common for boxcarred requests to share one or more values of the 4-tuple. For example, evaluations MAY all refer to a single subject, and/or have the same contextual (environmental) attributes.

Default values offer a more compact syntax that avoids over-duplication of request data.

If any of the top-level `subject`, `action`, `resource`, and `context` keys are provided, they are treated as default values for the 4-tuples specified in the `evaluations` object. Any values specified in the 4-tuples present in the `evaluations` object take precedence over these default values.

The following is a non-normative example for specifying three requests that refer to a single subject and context:

~~~json
{
  "subject": {
    "type": "user",
    "id": "alice@acmecorp.com"
  },
  "context":{
    "time": "2024-05-31T15:22-07:00"
  },
  "evaluations": [
    {
      "action": {
        "name": "can_read"
      },
      "resource": {
        "type": "document",
        "id": "boxcarring.md"
      }
    },
    {
      "action": {
        "name": "can_read"
      },
      "resource": {
        "type": "document",
        "id": "subject-search.md"
      }
    },
    {
      "action": {
        "name": "can_read"
      },
      "resource": {
        "type": "document",
        "id": "resource-search.md"
      }
    }
  ]
}
~~~

The following is a non-normative example for specifying three requests that refer to a single `subject` and `context`, with a default value for `action`, that is overridden by the third request:

~~~json
{
  "subject": {
    "type": "user",
    "id": "alice@acmecorp.com"
  },
  "context":{
    "time": "2024-05-31T15:22-07:00"
  },
  "action": {
    "name": "can_read"
  },
  "evaluations": [
    {
      "resource": {
        "type": "document",
        "id": "boxcarring.md"
      }
    },
    {
      "resource": {
        "type": "document",
        "id": "subject-search.md"
      }
    },
    {
      "action": {
        "name": "can_edit"
      },
      "resource": {
        "type": "document",
        "id": "resource-search.md"
      }
    }
  ]
}
~~~

### Evaluations options

The `evaluations` request payload includes an OPTIONAL `options` key, with a JSON value containing a set of key-value pairs.

This provides a general-purpose mechanism for providing caller-supplied metadata on how the request is to be executed.

One such option conrtols *evaluation semantics*, and is described in {{evaluations-semantics}}.

A non-normative example of the `options` field is shown below:

~~~json
{
  "evaluations": [...],
  "options": {
    "evaluation_semantics": "execute_all",
    "another_option": "value"
  }
}
~~~

#### Evaluations semantics

By default, every request in the `evaluations` array is executed and a response returned in the same array order. This is the most common use-case for boxcarring multiple evaluation requests in a single payload.

With that said, three evaluation semantics are supported:

1. *Execute all of the requests (potentially in parallel), return all of the results.* Any failure can be denoted by `decision: false` and MAY provide a reason code in the context.
2. *Deny on first denial (or failure).* This semantic could be desired if a PEP wants to issue a few requests in a particular order, with any denial (error, or `decision: false`) "short-circuiting" the evaluations call and returning on the first denial. This essentially works like the `&&` operator in programming languages.
3. *Permit on first permit.* This is the converse "short-circuiting" semantic, working like the `||` operator in programming languages.

To select the desired evaluations semantic, a caller can pass in `options.evaluations_semantic` with exactly one of the following values:

  * `execute_all`
  * `deny_on_first_deny`
  * `permit_on_first_permit`

`execute_all` is the default semantic, so an `evaluations` request without the `options.evaluations_semantic` flag will execute using this semantic.

##### Example: Evaluate `read` action for three documents using all three semantics

Execute all requests:

~~~json
{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "action": {
    "name": "read"
  },
  "options": {
    "evaluations_semantic": "execute_all"
  },
  "evaluations": [
    {
      "resource": {
        "type": "document",
        "id": "1"
      }
    },
    {
      "resource": {
        "type": "document",
        "id": "2"
      }
    },
    {
      "resource": {
        "type": "document",
        "id": "3"
      }
    }
  ]
}
~~~

Response:

~~~json
{
  "evaluations": [
    {
      decision: true
    },
    {
      decision: false
    },
    {
      decision: true
    }
  ]
}
~~~

Deny on first deny:

~~~json
{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "action": {
    "name": "read"
  },
  "options": {
    "evaluations_semantic": "deny_on_first_deny"
  },
  "evaluations": [
    {
      "resource": {
        "type": "document",
        "id": "1"
      }
    },
    {
      "resource": {
        "type": "document",
        "id": "2"
      }
    },
    {
      "resource": {
        "type": "document",
        "id": "3"
      }
    }
  ]
}
~~~

Response:

~~~json
{
  "evaluations": [
    {
      decision: true
    },
    {
      decision: false,
      context: {
        "id": "200",
        "reason": "deny_on_first_deny"
      }
    }
  ]
}
~~~

Permit on first permit:

~~~json
{
  "subject": {
    "type": "user",
    "id": "alice@example.com"
  },
  "action": {
    "name": "read"
  },
  "options": {
    "evaluations_semantic": "permit_on_first_permit"
  },
  "evaluations": [
    {
      "resource": {
        "type": "document",
        "id": "1"
      },
    },
    {
      "resource": {
        "type": "document",
        "id": "2"
      }
    },
    {
      "resource": {
        "type": "document",
        "id": "3"
      }
    }
  ]
}
~~~

Response:

~~~json
{
  "evaluations": [
    {
      decision: true
    }
  ]
}
~~~

## Access Evaluations API Response {#access-evaluations-response}

Like the request format, the Access Evaluations Response format for an Access Evaluations Request adds an `evaluations` array that lists the decisions in the same order they were provided in the `evaluations` array in the request. Each value of the evaluations array is typed as an Access Evaluation Response ({{access-evaluation-response}}).

In case the `evaluations` array is present, it is RECOMMENDED that the `decision` key of the response will be omitted. If present, it can be ignored by the caller.

The following is a non-normative example of a Access Evaluations Response to an Access Evaluations Request containing three evaluation objects:

~~~json
{
  "evaluations": [
    {
      "decision": true
    },
    {
      "decision": false,
      "context": {
        "reason": "resource not found"
      }
    },
    {
      "decision": false,
      "context": {
        "reason": "Subject is a viewer of the resource"
      }
    }
  ]
}
~~~

### Errors

There are two types of errors, and they are handled differently:
1. Transport-level errors, or errors that pertain to the entire payload.
2. Errors in individual evaluations.

The first type of error is handled at the transport level. For example, for the HTTP binding, the 4XX and 5XX codes indicate a general error that pertains to the entire payload, as described in Transport ({{transport}}).

The second type of error is handled at the payload level. Decisions default to *closed* (i.e. `false`), but the `context` field can include errors that are specific to that request.

The following is a non-normative example of a response to an Access Evaluations Request containing three evaluation objects, two of them demonstrating how errors can be returned for two of the evaluation requests:

~~~json
{
  "evaluations": [
    {
      "decision": true
    },
    {
      "decision": false,
      "context": {
        "error": {
          "status": 404,
          "message": "Resource not found"
        }
      }
    },
    {
      "decision": false,
      "context": {
        "reason": "Subject is a viewer of the resource"
      }
    }
  ]
}
~~~

# Transport

This specification defines an HTTPS binding which MUST be implemented by a compliant PDP.

Additional transport bindings (e.g. gRPC) MAY be defined in the future in the form of profiles, and MAY be implemented by a PDP.

## HTTPS Binding

### HTTPS Access Evaluation Request
The Access Evaluation Request is an HTTPS request with `content-type` of `application/json`. Its body is a JSON object that contains the Access Evaluation Request, as defined in {{access-evaluation-request}}.

The following is a non-normative example of the HTTPS binding of the Access Evaluation Request:

~~~ http
POST /access/v1/evaluation HTTP/1.1
Host: pdp.mycompany.com
Authorization: Bearer <myoauthtoken>
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716

{
  "subject": {
    "type": "user",
    "id": "alice@acmecorp.com"
  },
  "resource": {
    "type": "todo",
    "id": "1",
  },
  "action": {
    "name": "can_read"
  },
  "context": {
    "time": "1985-10-26T01:22-07:00"
  }
}
~~~
{: #example-access-evaluation-request title="Example of an HTTPS Access Evaluation Request"}

### Access Evaluation HTTPS Response
The success response to an Access Evaluation Request is an Access Evaluation Response. It is an HTTPS response with a `status` code of `200`, and `content-type` of `application/json`. Its body is a JSON object that contains the Access Evaluation Response, as defined in {{access-evaluation-response}}.

Following is a non-normative example of an HTTPS Access Evaluation Response:

~~~ http
HTTP/1.1 OK
Content-type: application/json
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716

{
  "decision": true
}
~~~
{: #example-access-evaluation-response title="Example of an HTTP Access Evaluation Response"}

### Access Evaluations HTTPS Request
The Access Evaluations Request is an HTTPS request with `content-type` of `application/json`. Its body is a JSON object that contains the Access Evaluations Request, as defined in {{access-evaluations-request}}.

The following is a non-normative example of a the HTTPS binding of the Access Evaluations Request:

~~~ http
POST /access/v1/evaluations HTTP/1.1
Host: pdp.mycompany.com
Authorization: Bearer <myoauthtoken>
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716

{
  "subject": {
    "type": "user",
    "id": "alice@acmecorp.com"
  },
  "context":{
    "time": "2024-05-31T15:22-07:00"
  },
  "action": {
    "name": "can_read"
  },
  "evaluations": [
    {
      "resource": {
        "type": "document",
        "id": "boxcarring.md"
      }
    },
    {
      "resource": {
        "type": "document",
        "id": "subject-search.md"
      }
    },
    {
      "action": {
        "name": "can_edit"
      },
      "resource": {
        "type": "document",
        "id": "resource-search.md"
      }
    }
  ]
}
~~~
{: #example-access-evaluations-request title="Example of an HTTPS Access Evaluations Request"}

### HTTPS Access Evaluations Response
The success response to an Access Evaluations Request is an Access Evaluations Response. It is a HTTPS response with a `status` code of `200`, and `content-type` of `application/json`. Its body is a JSON object that contains the Access Evaluations Response, as defined in {{access-evaluations-response}}.

Following is a non-normative example of an HTTPS Access Evaluations Response:

~~~ http
HTTP/1.1 OK
Content-type: application/json
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716

{
  "evaluations": [
    {
      "decision": true
    },
    {
      "decision": false,
      "context": {
        "error": {
          "status": 404,
          "message": "Resource not found"
        }
      }
    },
    {
      "decision": false,
      "context": {
        "reason": "Subject is a viewer of the resource"
      }
    }
  ]
}
~~~
{: #example-access-evaluations-response title="Example of an HTTPS Access Evaluations Response"}

### Error Responses
The following error responses are common to all methods of the Authorization API. The error response is indicated by an HTTPS status code ({{Section 15 of RFC9110}}) that indicates error.

The following errors are indicated by the status codes defined below:

| Code | Description  | HTTPS Body Content |
|------|--------------|-------------------|
| 400  | Bad Request  | An error message string |
| 401  | Unauthorized | An error message string |
| 403  | Forbidden    | An error message string |
| 500  | Internal error | An error message string |
{: #table-error-status-codes title="HTTPS Error status codes"}

Note: HTTPS errors are returned by the PDP to indicate an error condition relating to the request or its processing, and are unrelated to the outcome of an authorization decision, which is always returned with a `200` status code and a response payload.

To make this concrete:

- a `401` HTTPS status code indicates that the caller (policy enforcement point) did not properly authenticate to the PDP - for example, by omitting a required `Authorization` header, or using an invalid access token.
- the PDP indicates to the caller that the authorization request is denied by sending a response with a `200` HTTPS status code, along with a payload of `{ "decision": false }`.

### Request Identification
All requests to the API MAY have request identifiers to uniquely identify them. The API client (PEP) is responsible for generating the request identifier. If present, the request identifier SHALL be provided using the HTTPS Header `X-Request-ID`. The value of this header is an arbitrary string. The following non-normative example describes this header:

~~~ http
POST /access/v1/evaluation HTTP/1.1
Authorization: Bearer mF_9.B5f-4.1JqM
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716
~~~
{: #request-id-example title="Example HTTPS request with a Request Id Header"}

### Request Identification in a Response
A PDP responding to an Authorization API request that contains an `X-Request-ID` header MUST include a request identifier in the response. The request identifier is specified in the HTTPS Response header: `X-Request-ID`. If the PEP specified a request identifier in the request, the PDP MUST include the same identifier in the response to that request.

The following is a non-normative example of an HTTPS Response with this header:

~~~ http
HTTP/1.1 OK
Content-type: application/json
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716
~~~
{: #example-response-request-id title="Example HTTPS response with a Request Id Header"}

# IANA Considerations {#IANA}

This specification does not introduce any new identifiers that would require registration with IANA.

# Security Considerations {#Security}

## Communication Integrity and Confidentiality

In the ABAC architecture, the PEP-PDP connection is the most sensitive one and needs to be secured to guarantee:

 - Integrity
 - Confidentiality

As a result, the connection between the PEP and the PDP MUST be secured using the most adequate means given the choice of transport (e.g. TLS for HTTP REST).

## Policy Confidentiality and Sender Authentication

Additionally, the PDP SHOULD authenticate the calling PEP. There are several ways authentication can be established. These ways are out of scope of this specification. They MAY include:

 - Mutual TLS
 - OAuth-based authentication
 - API key

The choice and strength of either mechanism is not in scope.

Authenticating the PEP allows the PDP to avoid common attacks (such as DoS - see below) and/or reveal its internal policies. A malicious actor could craft a large number of requests to try and understand what policies the PDP is configured with. Requesting a client (PEP) be authenticated mitigates that risk.

## Trust

In ABAC, there is occasionally conversations around the trust between PEP and PDP: how can the PDP trust the PEP to send the right values in? This is a misplaced concern. The PDP must trust the PEP as ultimately, the PEP is the one responsible for enforcing the decision the PDP produces.

## Availability & Denial of Service

The PDP SHOULD apply reasonable protections to avoid common attacks tied to request payload size, the number of requests, invalid JSON, nested JSON attacks, or memory consumption. Rate limiting is one such way to address such issues.

--- back

# Terminology
Subject:
: The user or robotic principal about whom the Authorization API call is being made.

Resource:
: The target of the request; the resource about which the Authorization API is being made.

Action:
: The operation the Subject has attempted on the Resource in an Authorization API call.

Context:
: The environmental or contextual attributes for this request.

Decision:
: The value of the evaluation decision made by the PDP: `true` for "allow", `false` for "deny".

PDP:
: Policy Decision Point. The component or system that provides authorization decisions over the network interface defined here as the Authorization API.

PEP:
: Policy Enforcement Point. The component or system that requests decisions from the PDP and enforces access to specific requests based on the decisions obtained from the PDP.

# Acknowledgements {#Acknowledgements}

This template uses extracts from templates written by
{{{Pekka Savola}}}, {{{Elwyn Davies}}} and
{{{Henrik Levkowetz}}}.

# Document History

[[ To be removed from the final specification ]]

* 00 - Initial version.
* 01 - Refactored the optional fields of Subject, Action, and Resource into a `properties` sub-object, making it easier to design meaningful JSON-schema and protobuf contracts for the API. Also changed the `evaluations` field from an object to an array, to preserve ordering semantics.

# Notices {#Notices}
Copyright (c) 2024 The OpenID Foundation.

The OpenID Foundation (OIDF) grants to any Contributor, developer, implementer, or other interested party a non-exclusive, royalty free, worldwide copyright license to reproduce, prepare
derivative works from, distribute, perform and display, this Implementers Draft or Final Specification solely for the purposes of (i) developing specifications, and (ii) implementing
Implementers Drafts and Final Specifications based on such documents, provided that attribution be made to the OIDF as the source of the material, but that such attribution does not
indicate an endorsement by the OIDF.

The technology described in this specification was made available from contributions from various sources, including members of the OpenID Foundation and others. Although the OpenID
Foundation has taken steps to help ensure that the technology is available for distribution, it takes no position regarding the validity or scope of any intellectual property or other
rights that might be claimed to pertain to the implementation or use of the technology described in this specification or the extent to which any license under such rights might or might
not be available; neither does it represent that it has made any independent effort to identify any such rights. The OpenID Foundation and the contributors to this specification make no
(and hereby expressly disclaim any) warranties (express, implied, or otherwise), including implied warranties of merchantability, non-infringement, fitness for a particular purpose, or
title, related to this specification, and the entire risk as to implementing this specification is assumed by the implementer. The OpenID Intellectual Property Rights policy requires
contributors to offer a patent promise not to assert certain patent claims against other contributors and against implementers. The OpenID Foundation invites any interested party to bring
to its attention any copyrights, patents, patent applications, or other proprietary rights that may cover technology that may be required to practice this specification.
