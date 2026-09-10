# AuthZEN Repository
This repository contains the output of the [OpenID AuthZEN](https://openid.net/wg/authzen/) working group.

## API spec

The AuthZEN authorization API is versioned in markdown at `api/authorization-api-1_0.md`. A GitHub workflow builds this into HTML. See the "Building the spec" section for more details.

The latest published version of the spec is available [here](https://openid.github.io/authzen).

## Draft COAZ Framework

COAZ (Compatible with OpenID AuthZEN) is a protocol-neutral framework for mapping the information model of an arbitrary protocol or interface into a request to the AuthZEN Authorization API. It is at `profiles/authzen-coaz-framework-1_0.md`. The HTML version is available [here](https://openid.github.io/authzen/authzen-coaz-framework-1_0.html).

## Draft COAZ-MCP Binding

COAZ-MCP is the COAZ binding for the Model Context Protocol (MCP), defining how MCP JSON-RPC messages map into AuthZEN Authorization API requests. It is at `profiles/authzen-coaz-mcp-binding-1_0.md`. The HTML version is available [here](https://openid.github.io/authzen/authzen-coaz-mcp-binding-1_0.html).

## Draft Access Request and Approval Profile
A profile that specifies an approval workflow for handling denials in a structured way.
The HTML version is available [here](https://openid.github.io/authzen/authzen-access-request-approval-profile-1_0.html)

## Draft OAuth 2.0 Token Issuance Profile

A profile for using the AuthZEN Authorization API to externalize an authorization server's decision to issue a token, and to let the decision response shape what is issued. It is at `profiles/authzen-oauth/authzen-oauth-token-issuance-1_0.md`. The HTML version is available [here](https://openid.github.io/authzen/authzen-oauth-token-issuance-1_0.html).

## Draft OAuth 2.0 Token Exchange Binding

The binding of the token issuance profile to OAuth 2.0 Token Exchange, covering delegation, impersonation, identity chaining, ID-JAG and Transaction Tokens. It is at `profiles/authzen-oauth/authzen-oauth-token-exchange-1_0.md`. The HTML version is available [here](https://openid.github.io/authzen/authzen-oauth-token-exchange-1_0.html).

## Draft Authorization Claims Profile

A profile that sources the `groups`, `roles` and `entitlements` claims of a JWT access token from AuthZEN Resource Search rather than from a directory or a vendor-specific hook. It is at `profiles/authzen-oauth/authzen-oauth-authorization-claims-1_0.md`. The HTML version is available [here](https://openid.github.io/authzen/authzen-oauth-authorization-claims-1_0.html).

## Interop harness

The `interop` directory contains the interoperability scenarios for AuthZEN. Currently, there is a single scenario based on a "Todo" application. The scenario spec and results can be viewed [here](https://authzen-interop.net).

* `interop/authzen-interop-website` contains the source code for the https://authzen-interop.net micro-site. It is based on the Docusaurus framework.
* `interop/authzen-todo-application` contains the source code for the Todo React front-end hosted at https://todo.authzen-interop.net.
* `interop/authzen-todo-backend` contains the source code for the (TypeScript) Todo backend.

Each of these directories contains a README for further instructions.

## Building the spec

All of the documents in this repository (the API spec, the design patterns document, the profiles and the certification scenario) are written in markdown and rendered to HTML with two tools - `kramdown-rfc` (a Ruby gem), and `xml2rfc` (a python tool).

### The publish workflow

The GitHub workflow in `.github/workflows/jekyll-gh-pages.yml` renders every document and publishes the result to https://openid.github.io/authzen.

* On every pull request against `main`, the workflow renders every document as a build check. Nothing is published.
* On every push to `main` (i.e. each merged PR), the workflow renders every document and then deploys the rendered HTML to GitHub Pages.

Each document is rendered in its own parallel job, driven by a build matrix at the top of the `build-rfc` job. A failure in one document does not stop the others from building, and the failing document is named in the job title (for example `build-rfc (coaz-framework)`).

Each matrix entry has the following fields:

| Field        | Description                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `name`       | A short identifier for the document, used in the job title and the artifact name.               |
| `source`     | The path to the markdown source, relative to the repository root.                                |
| `html`       | The file name of the rendered HTML, as it will appear under https://openid.github.io/authzen.    |
| `extra_html` | (Optional) An additional file name to publish the same HTML under. Only the API spec uses this, to serve as the site's `index.html`. |

The rendered HTML and the intermediate RFC XML for each document are uploaded as a workflow artifact named `rfc-<name>`, so they can be downloaded and inspected from the workflow run for any PR.

### Adding a new document

To publish a new profile or other document, add an entry to the `matrix.include` list in `.github/workflows/jekyll-gh-pages.yml`:

```yaml
- name: my-new-profile
  source: profiles/authzen-my-new-profile-1_0.md
  html: authzen-my-new-profile-1_0.html
```

Once merged to `main`, the document will be available at `https://openid.github.io/authzen/<html>`. Remember to add a link to it in this README as well.

### Building locally

To build locally, ensure that you have both a Python and Ruby distribution.

#### Install dependencies

```sh
gem install kramdown-rfc
pip install xml2rfc
```

#### Build a document

The commands below are the same ones the workflow runs. Substitute the `source` and `html` values from the matrix entry for the document you want to build.

```sh
# Convert from markdown to XML
kramdown-rfc2629 api/authorization-api-1_0.md > api/authorization-api-1_0.xml

# Render XML into HTML
xml2rfc api/authorization-api-1_0.xml --html -o authorization-api-1_0.html

# (Optional) Render XML into plain text
xml2rfc api/authorization-api-1_0.xml --text
```
