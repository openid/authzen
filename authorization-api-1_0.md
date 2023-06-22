---
stand_alone: true
ipr: none
cat: std # Check
submissiontype: IETF
area: General [REPLACE]
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
contributor: # Same structure as author list, but goes into contributors
- name: Marc Jordan
  org: SGNL
  email: marc@sgnl.ai
- name: Erik Gustavson
  org: SGNL
  email: erik@sgnl.ai

normative:
  RFC4001: # text representation of IP addresses
  RFC5234: # REPLACE
  RFC6749: #OAuth
  RFC8259: #JSON
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
informative:
  exampleRefMin:
    title: Title [REPLACE]
    author:
    - name: Givenname Surname[REPLACE]
      org: (ignored here anyway)
    - name: Givenname Surname1 Surname2
      surname: Surname1 Surname2 # needed for Spanish names etc.
      org: (ignored here anyway)
    date: 2006
  exampleRefOrg:
    target: http://www.example.com/
    title: Title [REPLACE]
    author:
    - org: Organization [REPLACE]
    date: 1984-04

--- abstract

Abstract [REPLACE]

--- middle

# Introduction

Computational services often implement access control within their components by separating Policy Decision Points (PDPs) from Policy Enforcement Points (PEPs). PDPs and PEPs are defined in {{XACML}}. Communication between PDPs and PEPs follows similar patterns across different software and services that require or provide authorization information. The Authorization API described in this document enables different providers to offer PDP and PEP capabilities without having to bind themselves to one particular implementation of a PDP or PEP.

## Model
The Authorization API is a REST API published by the PDP, to which the PEP acts as a client. The Authorization API is itself authorized using OAuth 2.0 {{RFC6749}}

## Features
The Authorization API has two main features:

* An Access Evaluations API, which enables a PEP to find out if a specific request can be permitted to access specific resources
* A Search API, which enables a PEP to discover all assets that a principal has access to, by specifying conditions for the access

# Terminology

Principal:
: The user or robotic principal about whom the Authorization API call is being made

Asset:
: The target of the request; the resource that the principal about which the Authorization API is being made

Action:
: The method by which the Principal relates to the Asset in an Authorization API call.

# API Specification
The Authorization API has two parts, Access Evaluation and Search. Each of these is defined below:

## API Version
This document describes the API version 1. Any updates to this API through subsequent revisions of this document or through other documents MAY augment this API, but MUST NOT modify the API described here. Augmentation MAY include additional API methods or additional parameters to existing API methods, additional authorization mechanisms or additional optional headers in API requests. All API methods for version 1 MUST be immediately preceded by the relative URL path `/v1/`.

## API Authorization
This API SHALL be authenticated using the OAuth 2.0 Bearer access token {{RFC6750}} to authorize API calls

## Request Identification
All requests to the API MUST have request identifiers to uniquely identify them. The API client (PEP) is responsible for generating the request identifier. The request identifier SHALL be provided using the HTTP Header `X-Request-Id`. The value of this header is an arbitrary string. The following non-normative example describes this header:

~~~ http
POST /access/v1/evaluations HTTP 1.1
Authorization: Bearer mF_9.B5f-4.1JqM
X-Request-Id: bfe9eb29-ab87-4ca3-be83-a1d5d8305716
~~~
{: #requestidexample title="Request Id Example"}

## Principals {#principals}
A Principal is the user or robotic principal about whom the Authorization API is being invoked. The Principal may be requesting access at the time the Authorization API is invoked, or the Principal may be of interest in a Search API call.

A Principal is a JSON {{RFC8259}} object that has the following fields:

id:
: REQUIRED, A field, whose value is of type `string`, which uniquely identifies the user. This identifier could be an email address, or it might be an internal identifier such as a UUID or employee ID.

ipAddress:
: OPTIONAL, A field, whose value is of type `string`, which is a {{RFC4001}} text representation of the IP Address

deviceId:
: OPTIONAL, A field, whose value is of type `string`, which uniquely identifies the device of the Principal

The following non-normative example describes a Principal:

~~~ json
{
    "id": "atul@sgnl.ai",
    "ipAddress": "172.217.22.14",
    "deviceId": "8:65:ee:17:7e:0b"
}
~~~
{: #principalexample title="Example Principal Object"}

## Assets {#assets}
An Asset is the target of an access request. It is a JSON {{RFC8259}} object that has the following fields:

id:
: REQUIRED, the asset Id of the asset. It's value is a `string` specifying the identifier of the asset

type:
: OPTIONAL, the type of the asset. It's value is a `string` that specifies the type of the asset

attributeNames:
: OPTIONAL, an array of strings, each string representing the name of an attribute of the asset.

The following is a non-normative example of an Asset:

~~~json
{
    "id": "somevalue",
    "type": "user",
    "attributeNames": [
        "homeAddress",
        "birthDate",
        "employeeId"
    ]
}
~~~
{: #assetexample title="Example Asset"}

## Actions {#actions}
An action is the type of access that the requester intends to perform. There are common actions defined herein, or the action may be custom, which could be specific to the application being accessed or shared across a applications but not listed in the common actions below

### Common Actions
The following common actions are defined herein:

"access":
: A generic action that could mean any type of access. This is useful if the policy or application is not interested in different decisions for different types of actions

"create":
: The action to create a new entity, which MAY be defined by the `asset` field in the request

"read":
: The action to read the content. Based on the asset being accessed, this could mean a list functionality or reading an individual asset contents

"update":
: The action to update the content of an existing entity. This MAY represent a partial update or an entire replacement of the entity. The entity MAY be identified by the asset in the request

"delete":
: The action to delete an entity. The entity MAY be identified by the asset in the request

Policies MAY incorporate common action names to provide different decisions based on the action

### Custom Actions
Any action that is not one of the above is a custom action. Policies MAY incorporate custom action names if decisions need to be taken differently for different custom actions

## Access Query {#access-query}
An Access Query is a question about whether a principal can access a specific asset. It is a JSON object with the following fields:

action:
: REQUIRED. The type of access that is to be performed. Its value is a `string` that describes the action. This value of this field is as described in the {{#actions}} section.

asset:
: REQUIRED. The asset about which this query is. It's format is as described in the {{#assets}} section

The following is a non-normative example of an Access Query:

~~~ json
{
    "action": "stream",
    "asset": {
        "id": "1234",
        "type": "webcam",
        "attributeNames": [
            "lowRes",
            "motionOnly"]
    }
}
~~~
{#example-access-query title="Example Access Query"}

## Access Decision {#access-decision}
An access decision is a JSON `string` which can have one of the following values:

"allow":
: The access request is permitted to go forward

"deny":
: The access request is denied and MUST NOT be permitted to go forward

## Access Query Decision {#access-query-decision}
An Access Query Decision is a tuple of an asset, action and a decision, represented as a JSON object. It has the following fields:

action:
: The action for which the decision is provided. The format is as described in the {{#actions}} section

asset:
: The asset for which the decision is provided. The format is as described in the {{#assets}} section. This asset MAY be greater in scope than described in the Access Query ({{#access-query}}), i.e. It MAY describe an asset more generally than specified in the Access Query. However, it MUST NOT be more specific than the asset described in the Access Query.

decision:
: The decision for the above `asset` and `action`. The format is as described in the {{#access-decision}} section

The following is a non-normative example of an Access Query Decision:

~~~ json
{
    "action": "stream",
    "asset": {
        "id": "1234"
    },
    "decision": "deny"
}
~~~
{#example-access-query-decision title="Example Access Query Decision"}

## Access Evaluations API
The access evaluations is a means for a PEP to request decisions for a number of assets for a single request context.

The Access Evaluations API is available at the relative URL `evaluations` via the `POST` HTTP method.

### Access Evaluation Request
The content of the request body is a JSON Object with the following fields:

principal:
: A principal as described in the {{#principals}} section

queries:
: An array of queries defined in section {{#access-query}} about access to specific assets

~~~ http
POST /evaluations HTTP/1.1
Host: pdp.mycompany.com
Authorization: <myoauthtoken>

{
  "principal": {
    "id": "atul@sgnl.ai",
  },
  "queries": [
    {
      "action": "read",
      "asset": {
        "type": "customer"
      }
    },
    {
      "action": "read",
      "asset": {
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

### Access Evaluation Response
The success response to an Access Evaluation Request is an Access Evaluation Response. It is a HTTP response of type `application/json`. It's body is a JSON object that contains the following fields:

iat:
: REQUIRED. The issued at time in `integer` format, expressed as epoch milliseconds

exp:
: REQUIRED. The time in `integer` format, expressed at epoch milliseconds, after which the response SHOULD NOT be used

principal:
: REQUIRED. The principal for which the response is being issued. The format of this field is as described in the {{#principals}} section

decisions:
: REQUIRED. An array of Access Query Decisions as described in the {{#access-query-decisions}} section

evaluationDuration:
: REQUIRED. The time in milliseconds, in `integer` format, that it took to respond to the Access Evaluation Request.

~~~ http
HTTP/1.1 OK
Content-type: application/json

{
  "iat": 1234567890,
  "exp": 1234568890,
  "principal": {
    "id": "atul@sgnl.ai"
  }
  "decisions": [
    {
      "action": "read",
      "asset": {
        "type": "customer"
      },
      "decision": "deny"
    },
    {
      "action": "read",
      "asset": {
        "id": "efgh",
        "type": "customer",
      },
      "decision": "allow"
    }
  ],
  "evaluationDuration": 30
}
~~~

# IANA Considerations {#IANA}

This memo includes no request to IANA. [CHECK]


# Security Considerations {#Security}

This document should not affect the security of the Internet. [CHECK]


--- back

# Acknowledgements {#Acknowledgements}
{: numbered="false"}

This template uses extracts from templates written by
{{{Pekka Savola}}}, {{{Elwyn Davies}}} and
{{{Henrik Levkowetz}}}.

