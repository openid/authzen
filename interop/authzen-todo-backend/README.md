# AuthZEN Todo Backend

## Setup

### Install dependencies

To install the application dependencies, run the following command:

```shell
yarn
```

### Set up the `.env` file

Rename the `.env.example` file to `.env` and update the `AUTHZEN_PDP_URL` variable. The authorization middleware will send AuthZEN requests to `${AUTHZEN_PDP_URL}/access/v1/evaluation` (for the `authorization-api-1_0-00` and `authorization-api-1_0-01` spec variations), and to a both `${AUTHZEN_PDP_URL}/access/v1/evaluation` and `${AUTHZEN_PDP_URL}/access/v1/evaluations` (for the `authorization-api-1_0-02` spec variation).

Optionally, set the `AUTHZEN_PDP_API_KEY` variable if your authorizer needs an API key. This variable expects a JSON object with the key being the same keys as you use for your PDP in `src/pdps.json`, and the value being your API key, prefixed with `Basic` or `Bearer` as appropriate. If set, the authorization middleware will add the `Authorization` header with your API key to every authorization request.

Example `.env` file:

```shell
JWKS_URI=https://citadel.demo.aserto.com/dex/keys
ISSUER=https://citadel.demo.aserto.com/dex
AUDIENCE=citadel-app

AUTHZEN_PDP_URL=https://authorizer.domain.com
AUTHZEN_PDP_API_KEY='{"Aserto":"Basic aserto-key","your-pdp":"Bearer your-key"}'
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

## Run tests against a PDP

First, build the project using `yarn build`.

Help for the `test` script:

```shell
yarn test

Usage: yarn test <authorizer-url> [<spec-version>] [<format>]

    <spec-version> should be one of:
      authorization-api-1_0-00
      authorization-api-1_0-01
      authorization-api-1_0-02

      and defaults to authorization-api-1_0-01

    <format> should be one of:
      console
      markdown

      and defaults to markdown
```

### Examples

Run the `authorization-api-1_0-01` test suite, output to console:

```shell
yarn test https://authorizer.domain.com authorization-api-1_0-01 console
```

Run the `authorization-api-1_0-02` test suite, output as markdown:

```shell
yarn test https://authorizer.domain.com authorization-api-1_0-02 markdown
```
