---
sidebar_position: 1
---

# Payload Spec

This document lists the request and response payloads for each of the API requests in the Search scenario.

> Note: These payloads and corresponding interop results are for the [AuthZEN 1.0 Draft 03](https://openid.net/specs/authorization-api-1_0-03.html) version of the spec.

:::tip
This is a copy of the payload document defined by the AuthZEN WG. The definitive document can be found [here](https://hackmd.io/qOL6rdylRlCn2pDPdj-1cQ).
:::

## Changelog
- Created: May 13 2025

## Context

For this interop, we have decided to use a different scenario that is more relevant to fine-grained access control.

![Interop Architecture - Subject Search Example](https://hackmd.io/_uploads/rk2S_tBkxg.png)


## Search App

For the Search Interop, we have decided to build a React Router-based application which acts as a super PEP to an AuthZEN PDP. The React App will be able to create a valid Search API request. It lets users simulate what would happen if a given user logged in and tried to browse data.

Users will be able to choose between:
- a Subject Search: `who can view/edit/delete record 123?`
- a Resource Search: `which records can Alice view/edit/delete?`
- an Action Search: `which actions can Alice perform on record 123?`

The Search Interop Demo App will let users create the request by choosing values from a dropdown (choose the user/record identifier/action). It will also display the AuthZEN payload in JSON format as well as a the Search API response in JSON format and eventually inside a data table.

## Scenario

This scenario was originally documented [here](https://hackmd.io/@oidf-wg-authzen/IdentiverseInterop).

There are 3 actions that the Search API Demo (SAD) application supports:

 - `view`,
 - `edit`, and
 - `delete`

There are two roles defined:
* `employee` - this role doesn't give any permission per se.
* `manager` - several rules give managers more ability than the base user (or employee).

As previously mentioned, there are six users defined.

### Authorization Use Cases

The following are the policies used in the scenario.

 - a user can view any record they own
 - a user can view any record in their department
 - a manager can view any record
 - a user can edit any record they own
 - a manager can edit any record in their department
 - a user can delete any record they own

Note: department and ownership are two separate concepts. A user may own a record that is not in their department. How that occured is beyond this demo.

### Information Model

- `user`
    - `id`
    - `role`
    - `department`
- `record`
    - `id`
    - `title`
    - `department`
    - `owner`

### Sample Data

#### User Data

There are 6 users in the demo:

| ID   | Role        | Department  |
|--------|-------------|-------------|
| alice  | manager     | Sales       |
| bob    | employee    | Legal       |
| carol  | contractor  | Legal       |
| dan    | manager     | Finance     |
| erin   | employee    | Finance     |
| felix  | contractor  | Accounting  |

[Sample data](https://raw.githubusercontent.com/openid/authzen/refs/heads/search-demo/interop/authzen-search-demo/data/users.json) for the demo users is stored in Github (under `authzen/interop/authzen-search-demo/data`).

See below for the JSON representation.

#### Record Data

There are 20 records in the demo:

| ID   | Title                        | Department   | Owner  |
|------|------------------------------|--------------|--------|
| 101  | Hamlet                       | Legal        | alice  |
| 102  | Othello                      | Legal        | bob    |
| 103  | Macbeth                      | Legal        | carol  |
| 104  | King Lear                    | Accounting   | dan    |
| 105  | Romeo and Juliet             | Legal        | erin   |
| 106  | A Midsummer Night's Dream    | Accounting   | felix  |
| 107  | The Tempest                  | Sales        | alice  |
| 108  | Twelfth Night                | Legal        | bob    |
| 109  | Julius Caesar                | Accounting   | carol  |
| 110  | As You Like It               | Sales        | dan    |
| 111  | Much Ado About Nothing       | Accounting   | erin   |
| 112  | The Merchant of Venice       | Legal        | felix  |
| 113  | Henry V                      | Sales        | alice  |
| 114  | Richard III                  | Accounting   | bob    |
| 115  | Coriolanus                   | Finance      | carol  |
| 116  | Taming of the Shrew          | Legal        | dan    |
| 117  | Antony and Cleopatra         | Legal        | erin   |
| 118  | Measure for Measure          | Accounting   | felix  |
| 119  | The Winter's Tale            | Legal        | alice  |
| 120  | All's Well That Ends Well    | Accounting   | bob    |

[Sample data](https://raw.githubusercontent.com/openid/authzen/refs/heads/search-demo/interop/authzen-search-demo/data/records.json) for the demo records is stored in Github as well in the same location as user data.

See below for the JSON representation.

## Technical Overview

The interop consists of the following components:
- a simple React Router app frontend that acts as a super PEP. It lets users create AuthZEN Search API requests and send them to a compliant PDP. 
- The React Router app comes with its own backend used to route calls to the PDP.
- external PDPs provided by the interop participants, which the API gateway calls using the AuthZEN Search API to issue authorization decisions.

The payloads listed below are the contract between the SAD App (the PEP) and the PDP.

## Attributes associated with users (expected to come from PIP)

The use case utilizes two user attributes, *role* and *department*, that are derived from the user identity. The values are expected to be fetched from a PIP. 


```js
[
  {
    "id": "alice",
    "role": "manager",
    "department": "Sales"
  },
  {
    "id": "bob",
    "role": "employee",
    "department": "Legal"
  },
  {
    "id": "carol",
    "role": "contractor",
    "department": "Legal"
  },
  {
    "id": "dan",
    "role": "manager",
    "department": "Finance"
  },
  {
    "id": "erin",
    "role": "employee",
    "department": "Finance"
  },
  {
    "id": "felix",
    "role": "contractor",
    "department": "Accounting"
  }
]

```

The PIP can, of course, express this in any way they desire. The policy for each implementation has its own contract with its PIP, and this contract is outside of the scope of the PEP-PDP interop scenario.

## Attributes associated with resources (expected to come from PIP)

The resource metadata contains 4 attributes of which 2 have bearing on the authorization: the `department` and the `owner` attributes. The `title` attribute is just there for cosmetics.

The PDP may choose to use a PIP to retrieve `title` and `department`. The values will not be passed from the demo application.

```js
[
  {
    "id": 101,
    "title": "Hamlet",
    "department": "Legal",
    "owner": "alice"
  },
  {
    "id": 102,
    "title": "Othello",
    "department": "Legal",
    "owner": "bob"
  },
  {
    "id": 103,
    "title": "Macbeth",
    "department": "Legal",
    "owner": "carol"
  },
  {
    "id": 104,
    "title": "King Lear",
    "department": "Accounting",
    "owner": "dan"
  },
  {
    "id": 105,
    "title": "Romeo and Juliet",
    "department": "Legal",
    "owner": "erin"
  },
  {
    "id": 106,
    "title": "A Midsummer Night's Dream",
    "department": "Accounting",
    "owner": "felix"
  },
  {
    "id": 107,
    "title": "The Tempest",
    "department": "Sales",
    "owner": "alice"
  },
  {
    "id": 108,
    "title": "Twelfth Night",
    "department": "Legal",
    "owner": "bob"
  },
  {
    "id": 109,
    "title": "Julius Caesar",
    "department": "Accounting",
    "owner": "carol"
  },
  {
    "id": 110,
    "title": "As You Like It",
    "department": "Sales",
    "owner": "dan"
  },
  {
    "id": 111,
    "title": "Much Ado About Nothing",
    "department": "Accounting",
    "owner": "erin"
  },
  {
    "id": 112,
    "title": "The Merchant of Venice",
    "department": "Legal",
    "owner": "felix"
  },
  {
    "id": 113,
    "title": "Henry V",
    "department": "Sales",
    "owner": "alice"
  },
  {
    "id": 114,
    "title": "Richard III",
    "department": "Accounting",
    "owner": "bob"
  },
  {
    "id": 115,
    "title": "Coriolanus",
    "department": "Finance",
    "owner": "carol"
  },
  {
    "id": 116,
    "title": "Taming of the Shrew",
    "department": "Legal",
    "owner": "dan"
  },
  {
    "id": 117,
    "title": "Antony and Cleopatra",
    "department": "Legal",
    "owner": "erin"
  },
  {
    "id": 118,
    "title": "Measure for Measure",
    "department": "Accounting",
    "owner": "felix"
  },
  {
    "id": 119,
    "title": "The Winter's Tale",
    "department": "Legal",
    "owner": "alice"
  },
  {
    "id": 120,
    "title": "All's Well That Ends Well",
    "department": "Accounting",
    "owner": "bob"
  }
]
```

## Requests and payloads

For each Search API (subject search, resource search, and action search) the following section documents the request/response payload:
- the AuthZEN requests that the SAD app will issue to AuthZEN-compliant PDPs, and 
- The AuthZEN responses: how the PDPs should respond to each request.

Participating PDPs will, therefore, employ a group of *policies* that represent the authorization use cases aforementioned. 

The following payloads are specified according to the [Authorization API 1.0 – draft 03](https://openid.net/specs/authorization-api-1_0-03.html).

They are meant to be sent using the following HTTP(S) request:

### Subject Search API
#### HTTP Request
```
POST /access/v1/search/subject HTTP/1.1
Host: pdp.mycompany.com
Authorization: Bearer <myoauthtoken>
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716
```

#### JSON Request Payload

```js
{
  "subject": {
    "type": "user"
  },
  "action": {
    "name": "<action_name>"
  },
  "resource": {
    "type": "record",
    "id": "<record_id>"
  }
}
```

The value of `<record_id>` must be between 101 and 120 to conform with the sample dataset. Any other value should lead to a valid empty response from the PDP.

The value of `<action_name>` must be either of `view`, `edit`, or `delete` to conform with the demo policies. Any other action should lead to a valid empty response from the PDP.

The presence of the subject `type` field is required per the specification. All other attributes in the `subject` object will be ignored.

#### Response Payload

The following table summarizes the valid responses.

| Record   | Action | User Identifiers                  |
|--------|--------|--------------------------|
| 101 | view   | [alice, bob, carol, dan] |
| 101 | edit   | [alice] |
| 101 | delete   | [alice] |
| 102 | view   | [alice, bob, carol, dan] |
| 102 | edit   | [bob] |
| 102 | delete   | [bob] |
| 103 | view   | [alice, bob, carol, dan] |
| 103 | edit   | [carol] |
| 103 | delete   | [carol] |
| 104 | view   | [alice, dan, felix] |
| 104 | edit   | [dan] |
| 104 | delete   | [dan] |
| 105 | view   | [alice, bob, carol, dan, erin] |
| 105 | edit   | [erin] |
| 105 | delete   | [erin] |
| 106 | view   | [alice, dan, felix] |
| 106 | edit   | [felix] |
| 106 | delete   | [felix] |
| 107 | view   | [alice, dan] |
| 107 | edit   | [alice] |
| 107 | delete   | [alice] |
| 108 | view   | [alice, bob, carol, dan] |
| 108 | edit   | [bob] |
| 108 | delete   | [bob] |
| 109 | view   | [alice, carol, dan, felix] |
| 109 | edit   | [carol] |
| 109 | delete   | [carol] |
| 110 | view   | [alice, dan] |
| 110 | edit   | [alice, dan] |
| 110 | delete   | [dan] |
| 111 | view   | [alice, dan, erin, felix] |
| 111 | edit   | [erin] |
| 111 | delete   | [erin] |
| 112 | view   | [alice, bob, carol, dan, felix] |
| 112 | edit   | [felix] |
| 112 | delete   | [felix] |
| 113 | view   | [alice, dan] |
| 113 | edit   | [alice] |
| 113 | delete   | [alice] |
| 114 | view   | [alice, bob, dan, felix] |
| 114 | edit   | [bob] |
| 114 | delete   | [bob] |
| 115 | view   | [alice, carol, dan, erin] |
| 115 | edit   | [carol, dan] |
| 115 | delete   | [carol] |
| 116 | view   | [alice, bob, carol, dan] |
| 116 | edit   | [dan] |
| 116 | delete   | [dan] |
| 117 | view   | [alice, bob, carol, dan, erin] |
| 117 | edit   | [erin] |
| 117 | delete   | [erin] |
| 118 | view   | [alice, dan, felix] |
| 118 | edit   | [felix] |
| 118 | delete   | [felix] |
| 119 | view   | [alice, bob, carol, dan] |
| 119 | edit   | [alice] |
| 119 | delete   | [alice] |
| 120 | view   | [alice, bob, dan, felix] |
| 120 | edit   | [bob] |
| 120 | delete   | [bob] |

The following is the JSON response payload to the question: `who can view record 105?`

```js
HTTP/1.1 OK
Content-type: application/json
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716

{
  "results": [
    {
      "type": "user",
      "id": "alice"
    },
    {
      "type": "user",
      "id": "bob"
    },
    {
      "type": "user",
      "id": "carol"
    },
    {
      "type": "user",
      "id": "dan"
    },
    {
      "type": "user",
      "id": "erin"
    }
  ]
}
```

The entire request/response payload the resource search is [stored in github](https://github.com/openid/authzen/blob/search-demo/interop/authzen-search-demo/test/subject/results.json).


### Resource Search API
#### HTTP Request
```
POST /access/v1/search/resource HTTP/1.1
Host: pdp.mycompany.com
Authorization: Bearer <myoauthtoken>
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716
```

#### JSON Request Payload
```js
{
  "subject": {
    "type": "user",
    "id": "<user_id>"
  },
  "action": {
    "name": "<action_name>"
  },
  "resource": {
    "type": "record"
  }
}
```

The value of `<user_id>` must be one of `alice`, `bob`, `carol`, `dan`, `erin`, or `felix` to conform with the sample dataset. Any other value should lead to a valid empty response from the PDP.

The value of `<action_name>` must be either of `view`, `edit`, or `delete` to conform with the demo policies. Any other action should lead to a valid empty response from the PDP.

The presence of the resource `type` field is required per the specification. All other attributes in the `resource` object will be ignored.

#### Response Payload

The following table summarizes the valid responses.

| User ID  | Action | Records                  |
|--------|--------|--------------------------|
| alice | view   | [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120] |
| alice | edit   | [101, 107, 110, 113, 119] |
| alice | delete   | [101, 107, 113, 119] |
| bob | view   | [101, 102, 103, 105, 108, 112, 114, 116, 117, 119, 120] |
| bob | edit   | [102, 108, 114, 120] |
| bob | delete   | [102, 108, 114, 120] |
| carol | view   | [101, 102, 103, 105, 108, 109, 112, 115, 116, 117, 119] |
| carol | edit   | [103, 109, 115] |
| carol | delete   | [103, 109, 115] |
| dan | view   | [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120] |
| dan | edit   | [104, 110, 115, 116] |
| dan | delete   | [104, 110, 116] |
| erin | view   | [105, 111, 115, 117] |
| erin | edit   | [105, 111, 117] |
| erin | delete   | [105, 111, 117] |
| felix | view   | [104, 106, 109, 111, 112, 114, 118, 120] |
| felix | edit   | [106, 112, 118] |
| felix | delete   | [106, 112, 118] |

The following is the JSON response payload to the question: `which records can Erin view?`

```js
HTTP/1.1 OK
Content-type: application/json
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716

{
  "results": [
    {
      "type": "record",
      "id": "105"
    },
    {
      "type": "record",
      "id": "111"
    },
    {
      "type": "record",
      "id": "115"
    },
    {
      "type": "record",
      "id": "117"
    }
  ]
}
```

The entire request/response payload the resource search is [stored in github](https://github.com/openid/authzen/blob/search-demo/interop/authzen-search-demo/test/resource/results.json).

### Action Search API
#### HTTP Request
```
POST /access/v1/search/action HTTP/1.1
Host: pdp.mycompany.com
Authorization: Bearer <myoauthtoken>
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716
```

#### JSON Request Payload
```js
{
  "subject": {
    "type": "user",
    "id": "<user_id>"
  },
  "resource": {
    "type": "record",
    "id": "<record_id>"
  }
}
```

The value of `<user_id>` must be one of `alice`, `bob`, `carol`, `dan`, `erin`, or `felix` to conform with the sample dataset.

The value of `<record_id>` must be between 101 and 120 to conform with the sample dataset.

There must not be any `action` object in the `request` object.

#### Response payload

The following table summarizes the valid responses. Note some user ID - record ID combinations are missing. This means that particular combination does not yield any action. The overall payload document caters to that use case.

| User   | Record ID | Action List                  |
|--------|--------|--------------------------|
| alice | 101   | [view, edit, delete] |
| alice | 102   | [view] |
| alice | 103   | [view] |
| alice | 104   | [view] |
| alice | 105   | [view] |
| alice | 106   | [view] |
| alice | 107   | [view, edit, delete] |
| alice | 108   | [view] |
| alice | 109   | [view] |
| alice | 110   | [view, edit] |
| alice | 111   | [view] |
| alice | 112   | [view] |
| alice | 113   | [view, edit, delete] |
| alice | 114   | [view] |
| alice | 115   | [view] |
| alice | 116   | [view] |
| alice | 117   | [view] |
| alice | 118   | [view] |
| alice | 119   | [view, edit, delete] |
| alice | 120   | [view] |
| bob | 101   | [view] |
| bob | 102   | [view, edit, delete] |
| bob | 103   | [view] |
| bob | 105   | [view] |
| bob | 108   | [view, edit, delete] |
| bob | 112   | [view] |
| bob | 114   | [view, edit, delete] |
| bob | 116   | [view] |
| bob | 117   | [view] |
| bob | 119   | [view] |
| bob | 120   | [view, edit, delete] |
| carol | 101   | [view] |
| carol | 102   | [view] |
| carol | 103   | [view, edit, delete] |
| carol | 105   | [view] |
| carol | 108   | [view] |
| carol | 109   | [view, edit, delete] |
| carol | 112   | [view] |
| carol | 115   | [view, edit, delete] |
| carol | 116   | [view] |
| carol | 117   | [view] |
| carol | 119   | [view] |
| dan | 101   | [view] |
| dan | 102   | [view] |
| dan | 103   | [view] |
| dan | 104   | [view, edit, delete] |
| dan | 105   | [view] |
| dan | 106   | [view] |
| dan | 107   | [view] |
| dan | 108   | [view] |
| dan | 109   | [view] |
| dan | 110   | [view, edit, delete] |
| dan | 111   | [view] |
| dan | 112   | [view] |
| dan | 113   | [view] |
| dan | 114   | [view] |
| dan | 115   | [view, edit] |
| dan | 116   | [view, edit, delete] |
| dan | 117   | [view] |
| dan | 118   | [view] |
| dan | 119   | [view] |
| dan | 120   | [view] |
| erin | 105   | [view, edit, delete] |
| erin | 111   | [view, edit, delete] |
| erin | 115   | [view] |
| erin | 117   | [view, edit, delete] |
| felix | 104   | [view] |
| felix | 106   | [view, edit, delete] |
| felix | 109   | [view] |
| felix | 111   | [view] |
| felix | 112   | [view, edit, delete] |
| felix | 114   | [view] |
| felix | 118   | [view, edit, delete] |
| felix | 120   | [view] |



The following is the JSON response payload to the question: `which actions can Erin do on record 117?`

```js
{
  "results": [
    {
      "name": "view"
    },
    {
      "name": "edit"
    },
    {
      "name": "delete"
    }
  ]
}
```

The following is the JSON response payload to the question: `which actions can Erin do on record 118?`

```js
{
  "results": []
}
```


The entire request/response payload the resource search is [stored in github](https://github.com/openid/authzen/tree/main/interop/authzen-search-demo/test-harness/src). Each of the `action`, `resource`, and `subject` subdirectories has a `results.json` file that captures the expected results.

The test harness runs through the test cases and reports success or failure.

