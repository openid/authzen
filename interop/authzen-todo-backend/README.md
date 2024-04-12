# AuthZEN Todo Backend

## Setup

### Install dependencies
To install the application dependencies, run the following command:

```shell
yarn
```

### Set up the `.env` file
Rename the `.env.example` file to `.env` and update the `AUTHZEN_PDP_URL` variable. The authorization middleware will send AuthZEN requests to `${AUTHZEN_PDP_URL}/access/v1/evaluations`.

Optionally, set the `AUTHZEN_PDP_API_KEY` variable if your authorizer needs an API key. You should prefix it with `basic` or `Bearer` as appropriate. If set, the authorization middleware will add the `authorization: ${AUTHZEN_PDP_API_KEY}` header to every authorization request.

```shell
JWKS_URI=https://citadel.demo.aserto.com/dex/keys
ISSUER=https://citadel.demo.aserto.com/dex
AUDIENCE=citadel-app

AUTHZEN_PDP_URL=https://authorizer.domain.com
AUTHZEN_PDP_API_KEY=basic YOUR_API_KEY
```

## Start the server in developer mode

```shell
yarn dev
```

## Build and start the server

```shell
yarn build
yarn start
```
