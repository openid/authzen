# Use Cases for AuthZEN Integration with Identity Providers

**Note:** the Demo App is hosted at https://sts.authzen-interop.net/.

# Initial Concept 
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

```json
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

```json
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

As a result, the JWT token minted for Alice contains a claim called `record` where the value is an array of record identifiers. The name for the claim comes from the `type` field.

---

# Demonstration Plan

## Target Identity Providers (IdPs)

Possible IdP participants are listed here: https://hackmd.io/@oidf-wg-authzen/idp-demo-participants. We welcome participation from as many IdPs as possible.

## Demonstration Application Flow

1.  A user navigates to the demo application, which acts as a central gateway.
2.  The user selects a Policy Decision Point (PDP) to be used for the session.
3.  The user selects an Identity Provider (IdP) to log in with.
4.  The IdP's authentication flow is initiated. During this flow, the IdP calls the demo application's API.
5.  The demo application proxies the authorization request to the active PDP.
6.  The PDP evaluates the request against its policies and returns a decision.
7.  The decision is passed back to the IdP.
8.  The IdP issues a token enriched with claims according to the PDP's decision based on the call to its Search API.
9.  The user is redirected back to the demo application, which displays the final claims from the token.

## Demonstration Policies

We are using the same policies as in the Search Demo App. These policies are defined [here](https://hackmd.io/@oidf-wg-authzen/identiverse-2025-interop#Authorization-Use-Cases). The only relevant policy here is the one that relates to deleting records:

 - a user can delete any record they own

## Demo Users

We are reusing the users from the Search Demo App as defined [here](https://hackmd.io/@oidf-wg-authzen/identiverse-2025-interop). Because the policy is based on ownership, we do not need `role` or `department`. However, we do need a password for the user accounts to be created in the IdPs.

There are 6 users in the demo:

| ID   | Password        |
|--------|-------------|
| alice  | VerySecret123!     |
| bob    | VerySecret123!    |
| carol  | VerySecret123!  |
| dan    | VerySecret123!     |
| erin   | VerySecret123!    |
| felix  | VerySecret123!  |


The full dataset is stored in `interop/authzen-idp/data/users.json`.


#### Resources

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

Sample data for the demo records is stored in Github as well in the same location as user data: `interop/authzen-idp/data/records.json`

## Sample Payloads

The entire payloads for the interop can be found in `interop/authzen-idp/test`.