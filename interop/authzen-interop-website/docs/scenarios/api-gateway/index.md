---
sidebar_position: 1
---

# Payload Spec

This document lists the request and response payloads for each of the API requests in the API Gateway / Todo interop scenario.

> Note: These payloads and corresponding interop results are for the [AuthZEN 1.0 Draft 02](https://openid.net/specs/authorization-api-1_0-02.html) version of the spec.

:::tip
This is a copy of the payload document defined by the AuthZEN WG. The definitive document can be found [here](https://hackmd.io/ecYxP6uxSCm5X0RexkAM2g?view).
:::

## Changelog
- Created: Jan 23 2025
- Updated: Feb 22 2025 (`subject.type`: `"user"` -> `"identity"`)

## Context

The API Gateway scenario layers on top of the existing Todo scenario.

In this scenario, there are two policy enforcement points - the API gateway, and the Todo app itself.

![enforcement points](/img/enforcement-points.png)

## Todo app: fine-grained authorization
Currently, the Todo authorization scenario relies on the application to supply the OwnerID for each Todo. The application retrieves this from a SQLite database, which is not exposed/accessible to the API gateway.

Therefore, only the application has all the data to be able to correctly formulate the question "can this user perform this action on this specific todo".

This scenario is documented [here](https://hackmd.io/gNZBRoTfRgWh_PNM0y2wDA) and remains unchanged for the Gartner inteorp.

## API gateway: medium-grained authorization

The API Gateway can do "medium-grained authorization" (also known as "functional authorization") in this scenario, formulating the question "can this user invoke this HTTP method on this route".

The remainder of this document describes the endpoints that the React application invokes (and the API gateway proxies).

For each endpoint, it documents the payload the AuthZEN requests that participating gateways will issue to AuthZEN-compliant PDPs, and how the PDPs should respond to each request.

Participating PDPs will, therefore, employ TWO policies: one for the existing fine-grained authorization scenario, and a new policy to handle the route authorization done by the Gateway (which will be referred to as "medium-grained authorization").

## Overview of the scenario

The Todo application manages a shared todo list between a set of users.

There are 5 actions that the Todo application supports, each with a permission associated with it:

| Action | Permission |
| -------- | -------- |
| View a user's information | `can_read_user` |
| View all Todos | `can_read_todos` |
| Create a Todo | `can_create_todo` |
| (Un)complete a Todo | `can_update_todo` |
| Delete a Todo | `can_delete_todo` |


There are four roles defined:
* `viewer` - able to view the shared todo list (`can_read_todos`), as well as information about each of the owners of a Todo (notably, their picture) (`can_read_user`)
* `editor` - `viewer` + the ability to create new Todos (`can_create_todo`), as well as edit and delete Todos *that are owned by that user*
* `admin` - `editor` + the ability to delete any Todos (`can_delete_todo`)
* `evil_genius` - `editor` + the ability to edit Todos that don't belong to the user (`can_update_todo`)

There are 5 users defined (based on the "Rick & Morty" cartoon), each with one (or more) roles, defined below in the Subjects section.

## Component description

The interop consists of the following components:
- a simple React frontend that manages Todo lists. 
- a Node.JS backend that serves 5 routes that the frontend talks to.
- API gateways provided by interop participants, which proxy these 5 routes, and perform route-level (medium-grained) authorization
- external PDPs provided by the interop participants, which the API gateway calls using the AuthZEN API to issue authorization decisions.

The URIs listed in the document below are the contracts between the React app and the Node.JS backend. 

The payloads listed below are the contract between the API Gateway (the PEP) and the PDP.

## Subjects

Note: in every request payload, the subject indicated by `<subject_from_jwt>` is one of the following strings:


| User | PID |
| -------- | -------- |
| Rick Sanchez     | CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs     |
| Morty Smith     | CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs     |
| Summer Smith     | CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs     |
| Beth Smith     | CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs     |
| Jerry Smith     | CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs     |

This will be extracted from the `sub` claim in the JWT passed in as a bearer token in the Authorization header of each request, and passed into the AuthZEN request.

## Attributes associated with users (expected to come from PIP)

These are noted below in JSON format, with the key being the PID string from the table above, and the value being a set of attributes associated with the user. 


```js
{
  "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "id": "rick@the-citadel.com",
    "name": "Rick Sanchez",
    "email": "rick@the-citadel.com",
    "roles": ["admin", "evil_genius"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Rick%20Sanchez.jpg"
  },
  "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "id": "beth@the-smiths.com",
    "name": "Beth Smith",
    "email": "beth@the-smiths.com",
    "roles": ["viewer"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Beth%20Smith.jpg"
  },
  "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "id": "morty@the-citadel.com",
    "name": "Morty Smith",
    "email": "morty@the-citadel.com",
    "roles": ["editor"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Morty%20Smith.jpg"
  },
  "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "id": "summer@the-smiths.com",
    "name": "Summer Smith",
    "email": "summer@the-smiths.com",
    "roles": ["editor"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Summer%20Smith.jpg"
  },
  "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "id": "jerry@the-smiths.com",
    "name": "Jerry Smith",
    "email": "jerry@the-smiths.com",
    "roles": ["viewer"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Jerry%20Smith.jpg"
  }
}
```

The PIP can, of course, express this in any way they desire. The policy for each implementation has its own contract with its PIP, and this contract is outside of the scope of the PEP-PDP interop scenario.

## Requests and payloads

Unless otherwise noted, these are payloads for the `evaluation` API, and are meant to be sent using the following HTTP(S) request:

```http
POST /access/v1/evaluation HTTP/1.1
Host: mypdp.com
[Authorization: Bearer <token>]
```

### `GET /users/{userId}`

Get information (e.g. email, picture) associated with a user. This is used by the backend to render the picture of the user that owns each todo.

For simplicity, the policy always returns `true`.

#### Request payload

```js
{
  "subject": {
    "type": "identity",
    "id": "<subject_from_jwt>"
  },
  "action": {
    "name": "GET"
  },
  "resource": {
    "type": "route",
    "id": "/users/{userId}"
  },
  "context": {
  }
}
```

> Note:
> Each of the `subject`, `action`, `resource` fields MAY contain additional key/value pairs in the `properties` field - for example, additional information about the subject or resource. In addition, the `context` field MAY contain additional key/value pairs - for example, HTTP headers for the request. 
> HTTP Gateways that map these into standard locations as per the [AuthZEN REST API Gateway Profile proposal](https://hackmd.io/MTJPf_vzSmubctNtHis99g) are compliant with these payloads. The PDPs, however, will ignore those extra fields for the purpose of this interop showcase.
> Feb 22 2025: changed `subject.type` from "user" to "identity"


#### Response payload

For every subject and resource combination:

```js
{
  "decision": true
}
```

### `GET /todos`

Get the list of todos. 

#### Evaluation API payload

For simplicity, the policy always returns `true` for every user.

##### Evaluation API Request payload

```js
{
  "subject": {
    "type": "identity",
    "id": "<subject_from_jwt>"
  },
  "action": {
    "name": "GET"
  },
  "resource": {
    "type": "route",
    "id": "/todos"
  },
  "context": {
  }
}
```

> Note:
> Each of the `subject`, `action`, `resource` fields MAY contain additional key/value pairs in the `properties` field - for example, additional information about the subject or resource. In addition, the `context` field MAY contain additional key/value pairs - for example, HTTP headers for the request. 
> HTTP Gateways that map these into standard locations as per the [AuthZEN REST API Gateway Profile proposal](https://hackmd.io/MTJPf_vzSmubctNtHis99g) are compliant with these payloads. The PDPs, however, will ignore those extra fields for the purpose of this interop showcase.
> Feb 22 2025: changed `subject.type` from "user" to "identity"

##### Evaluation API Response payload

For every subject and resource combination:

```js
{
  "decision": true
}
```

### `POST /todos`

Create a new todo.

The policy evaluates the subject's `roles` attribute to determine whether the user can create a new todo.

#### Request payload

```js
{
  "subject": {
    "type": "identity",
    "id": "<subject_from_jwt>"
  },
  "action": {
    "name": "POST"
  },
  "resource": {
    "type": "route",
    "id": "/todos"
  },
  "context": {
  }
}
```

> Note:
> Each of the `subject`, `action`, `resource` fields MAY contain additional key/value pairs in the `properties` field - for example, additional information about the subject or resource. In addition, the `context` field MAY contain additional key/value pairs - for example, HTTP headers for the request. 
> HTTP Gateways that map these into standard locations as per the [AuthZEN REST API Gateway Profile proposal](https://hackmd.io/MTJPf_vzSmubctNtHis99g) are compliant with these payloads. The PDPs, however, will ignore those extra fields for the purpose of this interop showcase.
> Feb 22 2025: changed `subject.type` from "user" to "identity"

#### Response payload

Only users with a `roles` attribute that contains `admin` or `editor` return a `true` decision. In the user set above, this includes Rick, Morty, and Summer.

```js
{
  "decision": true
}
```

For the other two users, Beth and Jerry, the decision is `false`.

```js
{
  "decision": false
}
```

### `PUT /todos/{todoId}`

Edit (complete) a todo. 

The policy allows the operation if the subject's `roles` attribute contains the `evil_genius` role OR `editor` role.

The Node.js back-end allows users with the `evil_genius` role to complete ANY todos, but only allows users with the `editor` role to complete their own Todos.

However, given the fact that the incoming HTTP request DOES NOT include information about the owner of the Todo, the API Gateway, which only performs **medium-grained authorization**, allows any `editor` or `evil_genius` to execute this operation (which means) passing it to the Todo back-end to perform **fine-grained authorization**.

#### Request payload

```js
{
  "subject": {
    "type": "identity",
    "id": "<subject_from_jwt>"
  },
  "action": {
    "name": "PUT"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
  },
  "context": {
  }
}
```

> Note:
> Each of the `subject`, `action`, `resource` fields MAY contain additional key/value pairs in the `properties` field - for example, additional information about the subject or resource. In addition, the `context` field MAY contain additional key/value pairs - for example, HTTP headers for the request. 
> HTTP Gateways that map these into standard locations as per the [AuthZEN REST API Gateway Profile proposal](https://hackmd.io/MTJPf_vzSmubctNtHis99g) are compliant with these payloads. The PDPs, however, will ignore those extra fields for the purpose of this interop showcase.
> Feb 22 2025: changed `subject.type` from "user" to "identity"

#### Response payload

Only users with a `roles` attribute that contains `evil_genius` (Rick), OR `editor` (Morty and Summer), return a `true` decision.

For the user Morty, the following request will return a `true` decision:

```js
{
  "subject": {
    "type": "identity",
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "PUT"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
  },
  "context": {
  }
}
```

```js
{
  "decision": true
}
```

For Jerry (who is a `viewer`), the decision will be `false`:

```js
{
  "decision": false
}
```

### `DELETE /todos/{todoId}`

Delete a todo. 

The policy allows the operation if the subject's `roles` attribute contains the `admin` role OR `editor` role.

The Node.js back-end allows users with the `admin` role to complete ANY todos, but only allows users with the `editor` role to complete their own Todos.

However, given the fact that the incoming HTTP request DOES NOT include information about the owner of the Todo, the API Gateway, which only performs **medium-grained authorization**, allows any `editor` or `admin` to execute this operation (which means) passing it to the Todo back-end to perform **fine-grained authorization**.

#### Request payload

```js
{
  "subject": {
    "type": "identity",
    "id": "<subject_from_jwt>"
  },
  "action": {
    "name": "DELETE"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{id}"
  },
  "context": {
  }
}
```

> Note:
> Each of the `subject`, `action`, `resource` fields MAY contain additional key/value pairs in the `properties` field - for example, additional information about the subject or resource. In addition, the `context` field MAY contain additional key/value pairs - for example, HTTP headers for the request. 
> HTTP Gateways that map these into standard locations as per the [AuthZEN REST API Gateway Profile proposal](https://hackmd.io/MTJPf_vzSmubctNtHis99g) are compliant with these payloads. The PDPs, however, will ignore those extra fields for the purpose of this interop showcase.
> Feb 22 2025: changed `subject.type` from "user" to "identity"

#### Response payload

Only users with a `roles` attribute that contains `admin` (Rick), OR `editor` (Morty and Summer), return a `true` decision.

For the user Morty, the following request will return a `true` decision:

```js
{
  "subject": {
    "type": "identity",
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "DELETE"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
  },
  "context": {
  }
}
```

```js
{
  "decision": true
}
```

For Jerry (who is a `viewer`), the decision will be `false`:

```js
{
  "decision": false
}
```
