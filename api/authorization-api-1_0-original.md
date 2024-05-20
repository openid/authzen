---
stand_alone: true
ipr: none
cat: std # Check
submissiontype: IETF
wg: OpenID TBD

docname: authorization-api-1_0

title: Authorization API
abbrev: azapi
lang: en
kw:
  - Authorization
  - Access Management
  - XACML
  - OPA
  - Cedar
  - PDP
  - PEP
# date: 2022-02-02 -- date is filled in automatically by xml2rfc if not given
author:
- role: editor # remove if not true
  ins: A. Tulshibagwale
  name: Atul Tulshibagwale
  org: SGNL
  email: atul@sgnl.ai
- role: editor # remove if not true
  ins: D. Brossard
  name: David Brossard
  org: Axiomatics
  email: david.brossard@axiomatics.com  
- role: editor # remove if not true
  ins: O. Gazitt
  name: Omri Gazitt
  org: Aserto
  email: omri@aserto.com  
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
  RFC5234: # REPLACE
  RFC6749: #OAuth
  RFC6750: #OAuth 2.0 Bearer Tokens
  RFC8259: #JSON
  RFC9110: # HTTP Semantics
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

The Authorization API enables Policy Decision Points (PDPs) and Policy Enforcement Points (PEPs) to communicate authorization requests and decisions to each other without requiring knowledge of each other's inner workings. The Authorization API is served by the PDP and is called by the PEP. The Authorization API includes an Evaluations endpoint, which provides specific access decisions and a Search endpoint, which provides generalized access capabilities.

--- middle

# Introduction

Computational services often implement access control within their components by separating Policy Decision Points (PDPs) from Policy Enforcement Points (PEPs). PDPs and PEPs are defined in XACML ({{XACML}}) and NIST's ABAC SP 800-162. Communication between PDPs and PEPs follows similar patterns across different software and services that require or provide authorization information. The Authorization API described in this document enables different providers to offer PDP and PEP capabilities without having to bind themselves to one particular implementation of a PDP or PEP.

## Model
The Authorization API is a transport-agnostic API published by the PDP, to which the PEP acts as a client. The Transport section of this specification will detail possible bindings e.g. REST. 

Authorization for the Authorization API itself is out of scope for this document, since authorization for REST APIs is well-documented elsewhere. For example, the Authorization API MAY support authorization using an `Authorization` header, using a `basic` or `bearer` token. Support for OAuth 2.0 ({{RFC6749}}) is RECOMMENDED. 

## Features
The Authorization API has two main features:

* An Access Evaluation API, which enables a PEP to find out if a specific request can be permitted to access specific resources. The following are non-normative examples:
  * Can Alice view document #123?
  * Can a manager print?
* A Search API, which enables a PEP to ask open-ended questions. This feature is sometimes referred to as partial evaluation, reverse querying, or contextual access queries by other frameworks. The following are non-normative examples:
  * What can happen?
  * What can Alice do?
  * Who can access record #123?
  * Who can edit medical records between 8 am and 3 pm?
  * Who can edit?
  * What can happen at 3 pm from Glasgow?

# API Specification
The Authorization API has two parts, Access Evaluation and Search. Each of these is defined below. The definition is transport-agnostic. Refer to the Transport section for example bindings.

## API Version
This document describes the API version 1. Any updates to this API through subsequent revisions of this document or other documents MAY augment this API, but MUST NOT modify the API described here. Augmentation MAY include additional API methods or additional parameters to existing API methods, additional authorization mechanisms, or additional optional headers in API requests. All API methods for version 1 MUST be immediately preceded by the relative URL path `/v1/`.

## Information Model

### Subjects {#subjects}
A Subject is the user or robotic principal about whom the Authorization API is being invoked. The Subject may be requesting access at the time the Authorization API is invoked, or the Subject may be of interest in a Search API call.

A Subject is a JSON ({{RFC8259}}) object that contains any number of key-value pair attributes e.g. 
~~~json
"username" : "Alice",
"department": "Sales"
~~~

An attribute can be single-valued or multi-valued. It can be a primitive type (string, boolean...) or a complex type such as a JSON object.

#### Sample Fields

Here are sample fields:

id:
: OPTIONAL. A field, whose value is of type `string`, which uniquely identifies the user within the scope of a PEP. This identifier could be an email address, or it might be an internal identifier such as a UUID or employee ID.

ipAddress:
: OPTIONAL. A field, whose value is of type `string`, which is a {{RFC4001}} text representation of the IP Address

deviceId:
: OPTIONAL. A field, whose value is of type `string`, which uniquely identifies the device of the Subject

#### Example (non-normative)

The following non-normative example describes a Subject:

~~~ json
{
  "id": "atul@sgnl.ai",
  "ipAddress": "172.217.22.14",
  "deviceId": "8:65:ee:17:7e:0b"
}
~~~
{: #subjectexample title="Example Subject Object"}

### Resources {#resources}
A Resource is the target of an access request. It is a JSON ({{RFC8259}}) object that is constructed just like a Subject object.

#### Sample Fields

id:
: OPTIONAL. The unique identifier of the resource within the scope of the PEP. Its value is a `string` specifying the identifier of the resource. This field MAY be omitted to indicate a class of resources

type:
: OPTIONAL. The type of the resource. Its value is a `string` that specifies the type of the resource


#### Example (non-normative)

The following is a non-normative example of a Resource:

~~~json
{
  "id": "123",
  "type": "book",
  "libraryRecord":{
    "title": "ABAC's new hit",
    "isbn": "978-0593383322"
  }
}
~~~
{: #resourceexample title="Example Resource"}

### Actions {#actions}
An action is the type of access that the requester intends to perform. There are common actions defined herein, or the action may be custom, which could be specific to the application being accessed or shared across applications but not listed in the common actions below. Action is a JSON ({{RFC8259}}) object that is constructed just like a Subject or Resource object.

#### Common Action Values (non-normative)
The following common actions are defined herein:
*  **access**: A generic action that could mean any type of access. This is useful if the policy or application is not interested in different decisions for different types of actions
* **create**: The action to create a new entity, which MAY be defined by the `resource` field in the request
* **read**: The action to read the content. Based on the resource being accessed, this could mean a list functionality or reading an individual resource's contents
* **update**: The action to update the content of an existing entity. This MAY represent a partial update or an entire replacement of the entity. The entity MAY be identified by the resource in the request
* **delete**: The action to delete an entity. The entity MAY be identified by the resource in the request

Policies MAY incorporate common action names to provide different decisions based on the action

#### Custom Actions
Any action that is not one of the above is custom. Policies MAY incorporate custom action names if decisions need to be taken differently for different custom actions

### Context {#context}
The Context object is a set of attributes that represent environmental or contextual data about the request such as time of day. It is a JSON ({{RFC8259}}) object that is constructed just like a Subject, Resource, or Action object.

### The Access Evaluation API Request

The request follows a format similar to that used in XACML-JSON (TBD add normative reference) or AWS Cedar i.e. a collection of _attributes_ grouped together in categories that reflect the grammatical purpose or function of said attribute. This specification defines 4 such categories as aforementioned:

* The subject (or principal) of type Subject
* The action (or verb) of type Action
* The resource of type Resource
* The context (or environment) of type Context

#### Example (non-normative)

~~~json
{
  "subject":{
    "id": {
      "username": "Art",
      "jwt": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsIm5hbWUiOiJBcnQgVmFuZGVsYXkiLCJpYXQiOjE1MTYyMzkwMjJ9.QR3kS983lnaRVM1ZVJ_TM7XxJDPppELnCSCV_upUHQIGs28mB4JE_VqC9WBlcCYIYZn_E3r1RXarnFBe5UAy9g"
    }
  },
  "resource":{
    "path": "/api/account/123"
  },
  "action":{
    "method": "GET"
  },
  "context":{
    "time": "1985-10-26T01:22-07:00"
  }
}
~~~

### The Access Evaluation API Response

The simplest form of a response is simply a boolean representing a decision, indicated by a `"decision"` field. In this specification, assuming the evaluation was successful, there are only 2 possible responses:

* `true`: The access request is permitted to go forward
* `false`: The access request is denied and MUST NOT be permitted to go forward

#### Query Decision {#query-decision}

The following is a non-normative example of a simple query decision:

~~~ json
{
  "decision": true
}
~~~

#### Additional context in a response

In addition to a `"decision"`, a response may contain a `"context"` field which can be any JSON object.  This context can convey additional information that can be used by the PEP as part of the decision evaluation process. Examples include:

* XACML's notion of "advice" and "obligations"
* Hints for rendering UI state
* Instructions for step-up authentication

#### Example context

An implementation MAY follow a structured approach to `"context"`, in which it presents the reasons that an authorization request failed.

* A list of identifiers representing the items (policies, graph nodes, tuples) that were used in the decision-making process
* A list of reasons as to why access is permitted or denied.

##### Reasons
Reasons MAY be provided by the PDP. 

###### Reason Field {#reason-field}
A Reason Field is a JSON object that has keys and values of type `string`. The following are non-normative examples of Reason Field objects:

~~~ json
{
  "en": "location restriction violation"
}
~~~

###### Reason Object {#reason-object}
A Reason Object specifies a particular reason. It is a JSON object that has the following fields:

id:
: REQUIRED. A numeric value of that specifies the reason within the scope of a particular response

reason_admin:
: OPTIONAL. The reason, which MUST NOT be shared with the user, but useful for administrative purposes that indicates why the access was denied. The value of this field is a Reason Field object ({{reason-field}}).

reason_user:
: OPTIONAL. The reason, which MAY be shared with the user that indicates why the access was denied. The value of this field is a Reason Field object ({{reason-field}})

The following is a non-normative example of a Reason Object:

~~~json
{
  "id": 0,
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

#### Sample Response with additional context (non-normative)

~~~json
{
  "decision": true,
  "context": {
    "id": 0,
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

## Resource Query {#resource-query}
An Resource Query is a question about whether a subject can access a specific resource. It is a JSON object with the following fields:

action:
: REQUIRED. The type of access that is to be performed. Its value is a `string` that describes the action. This value of this field is as described in the Actions section ({{actions}}).

resource:
: REQUIRED. The resource to which this query relates. Its format is as described in the Resources section ({{resources}})

The following is a non-normative example of an Resource Query:

~~~ json
{
  "action": "stream",
  "resource": {
    "id": "1234",
    "type": "webcam",
    "attributeNames": [
      "lowRes",
      "motionOnly"
    ]
  }
}
~~~
{: #example-resource-query title="Example Resource Query"}

### Resource Query Decision {#resource-query-decision}
An Resource Query Decision is a tuple of an resource, action and a decision, represented as a JSON object. It has the following fields:

action:
: OPTIONAL. The action for which the decision is provided. The format is as described in the Actions section ({{actions}})

resource:
: OPTIONAL. The resource for which the decision is provided. The format is as described in the Resources section ({{resources}}). This resource MAY be greater in scope than described in the Resource Query ({{resource-query}}), i.e. It MAY describe an resource more generally than specified in the Resource Query. However, it MUST NOT be more specific than the resource described in the Resource Query.

decision:
: REQUIRED. The decision for the above `resource` and `action`. The format is as described in the Query Decision section ({{query-decision}})

reason_ids:
: OPTIONAL. An array of reason identifiers that indicate specific resons why the resource query was denied

The following is a non-normative example of an Resource Query Decision:

~~~ json
{
  "action": "stream",
  "resource": {
    "id": "1234"
  },
  "decision": "deny",
  "reason_ids": [0,2,3]
}
~~~
{: #example-resource-query-decision title="Example Resource Query Decision"}

## Collections {#collections}
An API request or response MAY contain a collection of items, such as an array of strings representing various attribute names, or an array of Resource Query Decision objects ({{resource-query-decision}}). The objects in a collection MAY overlap in scope. For example:

~~~ json
[
  {
    "resource": {
      "id": "1234",
      "attributeNames": [
        "homeAddress",
        "title"
      ]
    },
    "decision": "deny",
    "reason_ids": [1]
  },
  {
    "resource": {
      "id": "1234"
    },
    "decision": "allow"
  }
]
~~~
{: #collection-example title="Example Overlapping Collection"}

The receiver of a collection MUST interpret the collection in a way that results in the least-privilege access. In the above example, this means that the subject has access to the resource identified by "1234", but not to the "homeAddress" and "title" attributes of that resource.

## Error Responses
The following error responses are common to all methods of the Authorization API. The error response is indicated by an HTTP status code ({{Section 15 of RFC9110}}) that indicates error.

The following errors are indicated by the status codes defined below:

| Code | Description  | HTTP Body Content |
|------|--------------|-------------------|
| 400  | Bad Request  | An error message string |
| 401  | Unauthorized | An error message string |
| 403  | Forbidden    | An error message string |
| 500  | Internal error | An error message string |
{: #table-error-status-codes title="Error status codes"}

## Access Evaluations API
The Access Evaluations API is a means for a PEP to request decisions for a number of resources for a single request context.

The Access Evaluations API is available at the relative URL `/evaluations/` via the `POST` HTTP method.

### Access Evaluation Request

subject:
: REQUIRED. A subject as described in the Subjects section ({{subjects}})

action:
: REQUIRED. An action as described in the Actions section ({{actions}})

resource:
: OPTIONAL. A resource as described in the Resources section ({{resources}})

context:
: OPTIONAL. The environment/context attributes, as described in the Context section ({{context}})

The following is a non-normative example of an Access Evaluation Request:

~~~ http
POST /access/v1/evaluation HTTP/1.1
Host: pdp.mycompany.com
Authorization: <myoauthtoken>
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716

{
  "subject": {
    "id": "omri@aserto.com",
  },
  "action": {
    "action": "can_read"
  },
  "resource": {
    "type": "todo",
    "id": "1"
  },
  "context": {
  }
}
~~~
{: #example-access-evaluation-request title="Example of an Access Evaluation Request"}

### Access Evaluation Response
The success response to an Access Evaluation Request is an Access Evaluation Response. It is a HTTP response of type `application/json`. Its body is a JSON object that contains the following fields:

decision:
: REQUIRED. A boolean value (`true` or `false`) as described in the Resource Query Decision section ({{resource-query-decision}}).

iat:
: OPTIONAL. The issued at time in `integer` format, expressed as epoch milliseconds

exp:
: OPTIONAL. The time in `integer` format, expressed at epoch milliseconds, after which the response SHOULD NOT be used

context:
: OPTIONAL. A JSON object that provides additional evaluation context.

evaluationDuration:
: OPTIONAL. The time in milliseconds, in `integer` format, that it took to respond to the Access Evaluation Request.

Following is a non-normative example of an Access Evaluation Response:

~~~ http
HTTP/1.1 OK
Content-type: application/json
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716

{
  "decision": true
}
~~~
{: #example-access-evaluation-response title="Example of an Access Evaluation Response"}

### Access Evaluations Request

This API is used for boxcarring more than one request to a PDP.

The content of the request body is a JSON Object with the following fields:

subject:
: REQUIRED. A subject as described in the Subjects section ({{subjects}})

queries:
: REQUIRED. An array of queries defined in Resource Query section ({{resource-query}}) about access to specific resources

The following is a non-normative example of an Access Evaluations Request:

~~~ http
POST /access/v1/evaluations HTTP/1.1
Host: pdp.mycompany.com
Authorization: <myoauthtoken>
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716

{
  "subject": {
    "id": "atul@sgnl.ai",
  },
  "queries": [
    {
      "action": "read",
      "resource": {
        "type": "customer"
      }
    },
    {
      "action": "read",
      "resource": {
        "id": "efgh",
        "type": "customer",
        "attributeNames": [
          "homeAddress"
        ]
      }
    }
  ]
}
~~~
{: #example-access-evaluations-request title="Example of an Access Evaluations Request"}

### Access Evaluations Response
The success response to an Access Evaluations Request is an Access Evaluations Response. It is a HTTP response of type `application/json`. Its body is a JSON object that contains the following fields:

iat:
: OPTIONAL. The issued at time in `integer` format, expressed as epoch milliseconds

exp:
: OPTIONAL. The time in `integer` format, expressed at epoch milliseconds, after which the response SHOULD NOT be used

subject:
: OPTIONAL. The subject for which the response is being issued. The format of this field is as described in the Subjects section ({{subjects}})

decisions:
: REQUIRED. An array of Resource Query Decisions as described in the Resource Query Decision section ({{resource-query-decision}}).

reasons:
: OPTIONAL. An array of Reason Objects ({{reason-object}}) which provide details of every reason identifier specified in the `decisions` field.  This field is REQUIRED if there is at least one decision in the `decisions` field that specifies a `reason_ids` field. The content of the `reasons` field MUST provide details of every identifier in the `reason_ids` fields in the `decisions` array.

evaluationDuration:
: OPTIONAL. The time in milliseconds, in `integer` format, that it took to respond to the Access Evaluation Request.

Following is a non-normative example of an Access Evaluations Response:

~~~ http
HTTP/1.1 OK
Content-type: application/json
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716

{
  "iat": 1234567890,
  "exp": 1234568890,
  "subject": {
    "id": "atul@sgnl.ai"
  }
  "decisions": [
    {
      "action": "read",
      "resource": {
        "type": "customer"
      },
      "decision": "deny",
      "reasons": [1]
    },
    {
      "action": "read",
      "resource": {
        "id": "efgh",
        "type": "customer",
      },
      "decision": "allow"
    }
  ],
  "reasons": [
    {
      "id": 0,
      "reason_admin": {
        "en": "Request failed policy C076E82F"
      },
      "reason_user": {
        "en-403": "Insufficient privileges. Contact your administrator",
        "es-403": "Privilegios insuficientes. Póngase en contacto con su administrador"
      }
    },
    {
      "id": 1,
      "reason_admin": {
        "en-410": "Access attempt from multiple regions"
      },
      "reason_user": {
        "en": "Insufficient privileges. Contact your administrator"
      }
    }
  ],
  "evaluationDuration": 30
}
~~~
{: #example-access-evaluations-response title="Example of an Access Evaluation Response"}

## Resource Search API
The Resource Access Search API enables a PEP to find out all resources a subject has access to.

The Resource Access Search API is available at the relative URL `/resourcesearch/` via the `POST` HTTP method

### Resource Search Request
A Resource Search Request has request parameters and a request body. The request parameters are:

pageToken:
: OPTIONAL. A string value that is returned in a previous Search Response ({{search-response}}), which indicates that the request is a continuation of a previous request

pageSize:
: OPTIONAL. The maximum number of `decision` items in a Search Response ({{search-response}}). The API MAY return a smaller number of items but SHOULD NOT return a number of items that is greater than this value

The content of a Search Request body is a JSON object with the following fields:

subject:
: REQUIRED. A subject as described in the Subjects section ({{subjects}})

queries:
: REQUIRED. An array of `string` values as described in the Actions section ({{actions}}).

The following is a non-normative example of a Search Request:

~~~ http
POST /resourcesearch HTTP/1.1
Host: pdp.mycompany.com?pageToken="NWU0OGFiZTItNjI1My00NTQ5LWEzYTctNWQ1YmE1MmVmM2Q4"&pageSize=2
Authorization: <myoauthtoken>

{
  "subject": {
    "id": "atul@sgnl.ai"
    "ipAddress": "172.217.22.14",
  }
  "queries": ["delete", "read"],
}
~~~
{: #example-search-request title="Example Access Request"}

### Resource Query result {#resource-query-result}
A Resource Query Result is a JSON object representing a single result for a Resource Search Request. The Resource Query result always convey a positive ("Allow") decision.
Its body is a JSON object with teh following fields:

action:
: REQUIRED. The action that the subject is granted on this resource.

resource:
: REQUIRED. An object representing the resource.

The following is a non-normative example of a Resource Query Result:

~~~ json
{
  "action": "stream",
  "resource": {
    "id": "1234"
  }
}
~~~
{: #example-resource-query-result title="Example Resource Query Result"}

### Resource Search Response {#search-response}
The success response to a Resource Search Request is a Resource Search Response. It is a HTTP response of type `application/json`. The Resource Search Response contains only positive results: only those Resources that the given Subject has access to. Any Resources not returned are therefore not accessible by the subject.
Its body is a JSON object that contains the following fields:

iat:
: REQUIRED. The issued at time in `integer` format, expressed as epoch milliseconds

exp:
: REQUIRED. The time in `integer` format, expressed at epoch milliseconds, after which the response SHOULD NOT be used

subject:
: REQUIRED. The subject for which the response is being issued. The format of this field is as described in the Subjects section ({{subjects}})

decisions:
: REQUIRED. An array of Resource Query Results as described in the Resource Query Result section ({{resource-query-result}}).

nextPageToken:
: OPTIONAL. A string that MAY be used in a Search Request to fetch the next set of responses.

Following is a non-normative example of a Resource Search Response:

~~~ http
HTTP/1.1 OK
Content-type: application/json
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305720

{
  "iat": 1234567890,
  "exp": 1234568890,
  "subject": {
    "id": "atul@sgnl.ai"
    "ipAddress": "172.217.22.14",
  }
  "decisions": [
    {
      "action": "read",
      "resource": {
        "id": "efgh",
        "type": "customer",
      }
    },
    {
      "action": "delete",
      "resource": {
        "id": "report.docx",
        "type": "Document",
      }
    }
  ],
  "nextPageToken": "1DlR0Em5panAPy5llasLPfNUpDztEKgTDKF2I5gPwymnc"
}
~~~
{: #example-resource-search-response title="Example of a Resource Search Response"}

## Subject Search API
The Access Subject Search API does the reverse of the Search API: it enables a PEP or client to find out all the subjects that can access a given resource.

The Access Subject Search API is available at the relative URL `/subjectsearch/` via the `POST` HTTP method

### Subject Search Request
A Subject Search Request has request parameters and a request body. The request parameters are:

pageToken:
: OPTIONAL. A string value that is returned in a previous Subject Search Response ({{subject-search-response}}), which indicates that the request is a continuation of a previous request

pageSize:
: OPTIONAL. The maximum number of `decision` items in a Subject Search Response ({{subject-search-response}}). The API MAY return a smaller number of items but SHOULD NOT return a number of items that is greater than this value

The content of a Subject Search Request body is a JSON object with the following fields:

resource:
: REQUIRED. A resource as described in the Resources section ({{resources}})

queries:
: REQUIRED. An array of `string` values as described in the Actions section ({{actions}}).

The following is a non-normative example of a Subject Search Request:

~~~ http
POST /subjectsearch HTTP/1.1
Host: pdp.mycompany.com?pageToken="NWU0OGFiZTItNjI1My00NTQ5LWEzYTctNWQ1YmE1MmVmM2Q4"&pageSize=2
Authorization: <myoauthtoken>

{
  "resource": {
    "id": "somevalue",
    "type": "document",
    "attributeNames": [
      "author",
      "createDate",
      "lastUpdated"
    ]
   },
  "queries": ["delete", "read", "write"]
}
~~~
{: #example-subject-search-request title="Example Subject Search Request"}

### Subject Search Response {#subject-search-response}
The success response to a Subject Search Request is a Subject Search Response. It is a HTTP response of type `application/json`. Its body is a JSON object that contains the following fields:

iat:
: REQUIRED. The issued at time in `integer` format, expressed as epoch milliseconds

subject:
: REQUIRED. The subject for which the response is being issued. The format of this field is as described in the Subjects section ({{subjects}})

decisions:
: REQUIRED. An array of Subject Query results as described below ({{subject-query-result}}).

nextPageToken:
: OPTIONAL. A string that MAY be used in a Search Request to fetch the next set of responses.

#### Subject Query Result {#subject-query-result}
A Subject Query Result is array of Subject Query Decisions ({{example-subject-query-decision}}). It is JSON object combining a subject, a list of resource attribute names and an action. Given that a Subject Query result is expected to be the response to a Subject Search, only positive matches should be returned; i.e., only those subjects that match the search criteria (those subjects that are allowed to access the provided Resource Attributes). Any Subjects absent from the results do not have any access to the Resource. 
A Subject Query Result has the following fields:

actions:
: OPTIONAL. An Array of the action for which the decision is provided. The format is as described in the Actions section ({{actions}}). The values in this list should match the values provided as queries in the Subject Search request.

attributeNames:
: OPTIONAL. An Array of attribute names of the resource for which the response applies. The attribute is provided only if attributes were part of the Subject search request. In that case, the attribute names must match those that are part of the request.

subject:
: REQUIRED. The subject for which the decision is provided. The format is as described in the Subjects section ({{subjects}}). 

The following is a non-normative example of a Subject Query Decision:

~~~ json
{
  "actions": ["delete", "read", "write"],
  "attributeNames": [
    "author",
    "createDate",
    "lastUpdated"
  ],
  "subject": {
    "id": "alex@3edges.com"
  }
}
~~~
{: #example-subject-query-decision title="Example Subject Query Decision"}

Following is a non-normative example of a Subject Search Response:

~~~ http
HTTP/1.1 OK
Content-type: application/json
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305720

{
  "iat": 1234567890,
  "resource": {
    "id": "somevalue",
    "type": "document",
    "attributeNames": [
      "author",
      "createDate",
      "lastUpdated"
    ]
  },
  "queries": [
    "write",
    "read"
  ],
  "decisions": [
    {
      "action": "write",
      "attributeNames": [
        "author"
      ],
      "subject": {
        "id": "alex@3edges.com"
      }
    },
    {
      "action": "read",
      "attributeNames": [
        "author",
        "createDate",
        "lastUpdated"
      ],
      "subject": {
        "id": "alex@3edges.com"
      }
    },
    {
      "action": "read",
      "attributeNames": [
        "author",
        "createDate",
        "lastUpdated"
      ],
      "subject": {
        "id": "Janet@3edges.com"
      }
    }
  ],
  "nextPageToken": "1DlR0Em5panAPy5llasLPfNUpDztEKgTDKF2I5gPwymnc"
}
~~~
{: #example-subject-search-response title="Example of a Subject Search Response"}

# Transport

## REST Binding

## Request Identification
All requests to the API MAY have request identifiers to uniquely identify them. The API client (PEP) is responsible for generating the request identifier. If present, the request identifier SHALL be provided using the HTTP Header `X-Request-ID`. The value of this header is an arbitrary string. The following non-normative example describes this header:

~~~ http
POST /access/v1/evaluations HTTP/1.1
Authorization: Bearer mF_9.B5f-4.1JqM
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716
~~~
{: #requestidexample title="Request Id Example"}

## Request Identification in a Response
A PDP responding to an Authorization API request MUST include a request identifier in the response. The request identifier is specified in the HTTP Response header: `X-Request-ID`. If the PEP specified a request identifier in the request, the PDP MUST include the same identifier in the response to that request. If the PEP has not specified a request identifier in the request, the PDP MUST generate a new request identifier in its response to the PEP. The following is an non-normative example of an HTTP Response with this header:

~~~ http
HTTP/1.1 OK
Content-type: application/json
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716
~~~
{: #example-response-request-id title="Example HTTP response with a Request Id"}

# IANA Considerations {#IANA}

TBS


# Security Considerations {#Security}

TBS


--- back

# Terminology

Subject:
: The user or robotic principal about whom the Authorization API call is being made

Resource:
: The target of the request; the resource about which the Authorization API is being made

Action:
: The operation the Subject has attempted on the Resource in an Authorization API call

PDP:
: Policy Decision Point. The component or system that provides authorization decisions over the network interface defined here as the Authorization API

PEP:
: Policy Enforcement Point. The component or system that requests decisions from the PDP and enforces access to specific requests based on the decisions obtained from the PDP


# Acknowledgements {#Acknowledgements}
{: numbered="false"}

This template uses extracts from templates written by
{{{Pekka Savola}}}, {{{Elwyn Davies}}} and
{{{Henrik Levkowetz}}}.




