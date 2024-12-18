# AuthZEN Repository
This repository contains the output of the [OpenID AuthZEN](https://openid.net/wg/authzen/) working group.

## API spec

The AuthZEN authorization API is versioned in markdown at `api/authzorization-api-1_0.md`. A GitHub workflow builds this into HTML. See the "Building the spec" section for more details.

## Interop harness

The `interop` directory contains the interoperability scenarios for AuthZEN. Currently, there is a single scenario based on a "Todo" application. The scenario spec and results can be viewed [here](https://authzen-interop.net).

* `interop/authzen-interop-website` contains the source code for the https://authzen-interop.net micro-site. It is based on the Docusaurus framework.
* `interop/authzen-todo-application` contains the source code for the Todo React front-end hosted at https://todo.authzen-interop.net.
* `interop/authzen-todo-backend` contains the source code for the (TypeScript) Todo backend.

Each of these directories contains a README for further instructions.

## Building the spec

To build the spec locally, you need two tools - `kramdown` (a Ruby gem), and `xml2rfc` (a python tool).

The GitHub workflow in `.github/workflows/jekyll-gh-pages.yml` runs on each PR that is merged to `main`, resulting in a new HTML version of the spec hosted at https://openid.github.io/authzen.

To build locally, ensure that you have both a Python and Ruby distribution.

### Install dependencies

```sh
gem install kramdown-rfc
pip install xml2rfc
```

### Build the spec

```sh
# Convert from markdown to XML
kramdown-rfc2629 api/authorization-api-1_0.md > api/authorization-api-1_0.xml

# Render XML into HTML
xml2rfc api/authorization-api-1_0.xml --html -o index.html
```
