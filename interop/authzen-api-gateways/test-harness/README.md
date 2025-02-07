# AuthZEN API Gateway Test Runner

## Setup

### Install dependencies

To install the application dependencies, run the following command:

```shell
yarn
```

## Run tests against a PDP

First, build the project using `yarn build`.

Help for the `test` script:

```shell
yarn test

Usage: yarn test <authorizer-url> [<format>]

    <format> should be one of:
      console
      markdown

      and defaults to markdown
```

### Examples

Run the test suite, output to console:

```shell
yarn test https://authorizer.domain.com console
```

Run the test suite, output as markdown:

```shell
yarn test https://authorizer.domain.com markdown
```
