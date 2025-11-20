---
sidebar_position: 1
---

# Payload Spec

**Note:** the Demo App is hosted at https://sts.authzen-interop.net/.

> Note: These payloads and corresponding interop results are for the [AuthZEN 1.0 Draft 04](https://openid.net/specs/authorization-api-1_0-04.html) version of the spec.

## Context 
Identity Providers (IdPs) are a key control point in the identity infrastructure of most enterprises. IdPs, among other functions, manage the authentication ceremony and issue tokens for use in accessing various types of resources. 

The AuthZEN Working Group has defined standard APIs whereby an IdP can call to any compliant Policy Decision Point (PDP) during IDP processing. The following section defines a data flow to determine the contents of a token. 

## High-level Architecture
![image](https://hackmd.io/_uploads/r1D1UGk4le.png)

## Updated Demo App Architecture

![image](https://hackmd.io/_uploads/BJSui0Upgl.png)

## Use Case: Determine what goes inside the token as a Search API call
As an IdP, I know the user. I need to know the claims (expressed as resources) the user can get access to. The IdP asks a PDP `tell me which resources of type claim user Alice can access` using the AuthZEN Resource Search API. The PDP Resource Search API replies with a list of claims: `[claim1, claim2...]`.

This is the approach taken in the December 2025 Interop.

## Policy 
we are using the [same policy](https://hackmd.io/@oidf-wg-authzen/identiverse-2025-interop#Authorization-Use-Cases) as in the Search API Interop. In particular, this interop will focus on the `delete` use case.
*   **Mechanism:** The IdP uses a resource `search` call, asking for an array of results.

## Request Payload
The IdP sends the user's details along with an action (`delete`), and the type of resources (`record`) to be returned.

```js
{
  "subject": {
    "type": "user",
    "id": "alice"
  },
  "action": {
    "name": "delete"
  },
  "resource": {
    "type": "record"
  }
}
```

## Expected Response
The PDP returns all the records the user can delete (in this example, 101, 107, 113, and 119) that Alice can delete. 

```js
{
  "results": [
    {
      "type": "record",
      "id": "101"
    },
    {
      "type": "record",
      "id": "107"
    },
    {
      "type": "record",
      "id": "113"
    },
    {
      "type": "record",
      "id": "119"
    }
  ]
}
```

The JWT that the IdP issues contains an additional `record` key with the array value from the `results` key of the AuthZEN search response.

For this example, the decoded JWT would look something like this:

```js
{
  "name": "alice",
  "iss": "...",
  "aud": "...",
  "sub": "...",
  "iat": 1763664127,
  "exp": 1763700127,
  "sid": "...",
  "record": [
    {
      "id": "101",
      "type": "record"
    },
    {
      "id": "107",
      "type": "record"
    },
    {
      "id": "113",
      "type": "record"
    },
    {
      "id": "119",
      "type": "record"
    }
  ]
}
```

## Demo Users

We are reusing the users from the Search Demo App as defined [here](https://hackmd.io/@oidf-wg-authzen/identiverse-2025-interop). Because the policy is based on ownership, we do not need `role` or `department`. However, we do need a password for the user accounts to be created in the IdPs.

There are 6 users in the demo:

| ID     | Password       |
|--------|----------------|
| alice  | VerySecret123! |
| bob    | VerySecret123! |
| carol  | VerySecret123! |
| dan    | VerySecret123! |
| erin   | VerySecret123! |
| felix  | VerySecret123! |

The full dataset is stored in https://github.com/openid/authzen/blob/main/interop/authzen-idp/data/users.json.

## Demo Resources

In this demo, we also use the same metadata as for the Search API Interop Demo defined here. Because we only use the `delete` policy, only record ownership matters.

There are 20 records in the demo:

| ID   | Owner  |
|------|--------|
| 101  | alice  |
| 102  | bob    |
| 103  | carol  |
| 104  | dan    |
| 105  | erin   |
| 106  | felix  |
| 107  | alice  |
| 108  | bob    |
| 109  | carol  |
| 110  | dan    |
| 111  | erin   |
| 112  | felix  |
| 113  | alice  |
| 114  | bob    |
| 115  | carol  |
| 116  | dan    |
| 117  | erin   |
| 118  | felix  |
| 119  | alice  |
| 120  | bob    |

Sample data for the demo records is stored in Github as well in the same location as user data: https://github.com/openid/authzen/blob/main/interop/authzen-idp/data/records.json

## Sample Payloads

The request and response payloads for the interop can be found in https://github.com/openid/authzen/blob/main/interop/authzen-idp/test-harness/src/results.json, along with the test harness.

The test harness runs through the test cases and reports success or failure. See the README on details for how to run it against your PDP.

### Request Payload

The following is the HTTP/JSON request payload for the demo:

```js
POST /access/v1/search/resource HTTP/1.1
Host: pdp.mycompany.com
Authorization: Bearer <myoauthtoken>
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716
{
  "subject": {
    "type": "user",
    "id": "<user_id>"
  },
  "action": {
    "name": "delete"
  },
  "resource": {
    "type": "record"
  }
}
```

The value of `<user_id>` must be one of `alice`, `bob`, `carol`, `dan`, `erin`, or `felix` to conform with the sample dataset. Any other value should lead to a valid empty response from the PDP.

The presence of the resource `type` field is required per the specification. All other attributes in the `resource` object will be ignored.

#### Response Payload

The following table summarizes the valid responses.

| User ID  | Action | Records                  |
|--------|--------|--------------------------|
| alice | delete   | [101, 107, 113, 119] |
| bob | delete   | [102, 108, 114, 120] |
| carol | delete   | [103, 109, 115] |
| dan | delete   | [104, 110, 116] |
| erin | delete   | [105, 111, 117] |
| felix | delete   | [106, 112, 118] |

The following is the HTTP/JSON response payload to the question: `which records can Erin delete?`

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
      "id": "117"
    }
  ]
}
```

