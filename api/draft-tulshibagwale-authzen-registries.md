---
stand_alone: true
ipr: trust200902
cat: info
submissiontype: IETF

docname: draft-tulshibagwale-authzen-registries-00

title: Registries for the OpenID AuthZEN Authorization API
abbrev: AuthZEN Registries
lang: en
kw:
  - Authorization
  - AuthZEN
  - IANA
  - PDP
  - PEP
author:
- ins: A. Tulshibagwale
  name: Atul Tulshibagwale
  org: CrowdStrike
  email: atul.tulshibagwale@crowdstrike.com

normative:
  RFC3553: # IETF URN sub-namespace for registered protocol parameters
  RFC8126: # Writing for IANA
  RFC8615: # Well-known URIs
  IANA.well-known-uris: # IANA well-known registry
  AUTHZEN:
    title: Authorization API 1.0
    target: https://openid.net/specs/authorization-api-1_0.html
    date: 2026-01
    seriesinfo:
      OpenID Foundation: Final Specification
    author:
    - ins: O. Gazitt
      name: Omri Gazitt
      org: Aserto
    - ins: D. Brossard
      name: David Brossard
      org: Axiomatics
    - ins: A. Tulshibagwale
      name: Atul Tulshibagwale
      org: SGNL

informative:
  RFC8809: # Registries for Web Authentication (WebAuthn)

--- abstract

This specification establishes the IANA registries required by the OpenID AuthZEN Authorization API 1.0 specification. It creates the "AuthZEN" registry group, establishes the "AuthZEN Policy Decision Point Metadata" and "AuthZEN Policy Decision Point Capabilities" registries within that group, registers the "authzen-configuration" well-known URI, and registers the "authzen" URN sub-namespace.

--- middle

# Introduction {#introduction}

The Authorization API 1.0 {{AUTHZEN}} is a Final Specification of the OpenID Foundation, developed by the OpenID AuthZEN Working Group. It defines an interoperable API through which a Policy Enforcement Point (PEP) communicates with a Policy Decision Point (PDP) to obtain authorization decisions and to search for subjects, resources, and actions.

The IANA Considerations section of {{AUTHZEN}} defines two registries of protocol parameters, a well-known URI, and a URN sub-namespace that implementations depend upon for interoperability. Because {{AUTHZEN}} is published by the OpenID Foundation rather than as part of an IETF document stream, this companion document requests that IANA perform the corresponding actions on its behalf, following the precedent set by {{RFC8809}} for the W3C Web Authentication specification.

The initial values for the registries established by this document, and the definitions of the registered well-known URI and URN sub-namespace, are supplied by the IANA Considerations section (Section 12) of {{AUTHZEN}}.

## Requirements Notation and Conventions {#conventions}

{::boilerplate bcp14-tagged}

# IANA Considerations {#iana}

This document requests that IANA take four actions:

1. Create a new protocol registry group named "AuthZEN".
2. Establish two new registries within that group: "AuthZEN Policy Decision Point Metadata" ({{iana-pdp-metadata-registry}}) and "AuthZEN Policy Decision Point Capabilities" ({{iana-pdp-capabilities-registry}}).
3. Register the well-known URI "authzen-configuration" in the "Well-Known URIs" registry ({{iana-wk-registry}}).
4. Register the "authzen" URN sub-namespace in the "IETF URN Sub-namespace for Registered Protocol Parameter Identifiers" registry ({{iana-urn-namespace}}).

Note: the IANA Considerations section of {{AUTHZEN}} refers to the registry group both as "AuthZEN" and as "AuthZEN Parameters". The name of the registry group established by this document is "AuthZEN".

## Registration Procedure {#iana-procedure}

The following registration procedure is used for both registries established by this document.

The registration policy for both registries is Specification Required, as defined in {{RFC8126}}. Each registration request is posted to the `openid-specs-authzen@lists.openid.net` mailing list for a two-week public review period, and is approved or denied by one or more Designated Experts.

To allow values to be allocated before the final version of a specification is published, the Designated Experts may approve a registration once they are satisfied that the specification will be completed and published. If the specification is not completed and published in a timely manner, as determined by the Designated Experts, the Designated Experts may request that IANA withdraw the registration.

Registration requests sent to the mailing list for review should use an appropriate subject (e.g., "Request to register AuthZEN Policy Decision Point Metadata: example").

Within the review period, the Designated Experts will either approve or deny the registration request, communicating this decision to the review list and IANA. Denials should include an explanation and, if applicable, suggestions as to how to make the request successful. The IANA escalation process is followed when the Designated Experts are not responsive within 14 days.

Criteria that should be applied by the Designated Experts includes determining whether the proposed registration duplicates existing functionality, determining whether it is likely to be of general applicability or whether it is useful only for a single application, and whether the registration makes sense.

IANA must only accept registry updates from the Designated Experts and should direct all requests for registration to the review mailing list.

It is suggested that multiple Designated Experts be appointed who are able to represent the perspectives of different applications using this specification, in order to enable broadly-informed review of registration decisions. In cases where a registration decision could be perceived as creating a conflict of interest for a particular Expert, that Expert should defer to the judgment of the other Experts.

The reason for the use of the mailing list is to enable public review of registration requests, enabling both Designated Experts and other interested parties to provide feedback on proposed registrations. The reason to allow the Designated Experts to allocate values prior to publication as a final specification is to enable giving authors of specifications proposing registrations the benefit of review by the Designated Experts before the specification is completely done, so that if problems are identified, the authors can iterate and fix them before publication of the final specification.

## AuthZEN Policy Decision Point Metadata Registry {#iana-pdp-metadata-registry}

IANA is requested to establish the "AuthZEN Policy Decision Point Metadata" registry under the "AuthZEN" registry group. The registry records the Policy Decision Point metadata parameter and a reference to the specification that defines it.

Registry Name: AuthZEN Policy Decision Point Metadata

Registration Policy: Specification Required per {{RFC8126}}, following the procedure described in {{iana-procedure}}

Reference: Section 12.1 of {{AUTHZEN}} and \[This Document\]

### Registration Template {#iana-pdp-metadata-template}

Metadata Name:
: The name requested (e.g., "resource"). This name is case-sensitive. Names may not match other registered names in a case-insensitive manner unless the Designated Experts state that there is a compelling reason to allow an exception.

Metadata Description:
: Brief description of the metadata (e.g., "Resource identifier URL").

Change Controller:
: For IETF stream RFCs, list the "IETF". For others, give the name of the responsible party. Other details (e.g., postal address, email address, home page URI) may also be included.

Specification Document(s):
: Reference to the document or documents that specify the parameter, preferably including URIs that can be used to retrieve copies of the documents. An indication of the relevant sections may also be included but is not required.

### Initial Registrations {#iana-pdp-metadata-initial}

The initial registrations in this registry are those defined in Section 12.1.3 of {{AUTHZEN}}. This document does not reproduce them; {{AUTHZEN}} is the authoritative source for their contents.

## AuthZEN Policy Decision Point Capabilities Registry {#iana-pdp-capabilities-registry}

IANA is requested to establish the "AuthZEN Policy Decision Point Capabilities" registry under the "AuthZEN" registry group. The registry contains PDP-specific capabilities or features, identified by URNs within the "authzen" URN sub-namespace registered in {{iana-urn-namespace}}. These URNs are intended to be used in Policy Decision Point metadata discovery documents (as described in Section 9 of {{AUTHZEN}}) to allow a PEP to determine the supported functionality of a given PDP instance. The content of this registry will be specified by AuthZEN-compliant PDP vendors that want to declare interoperable capabilities.

Registry Name: AuthZEN Policy Decision Point Capabilities

Registration Policy: Specification Required per {{RFC8126}}, following the procedure described in {{iana-procedure}}

Reference: Section 12.3 of {{AUTHZEN}} and \[This Document\]

### Registration Template {#iana-pdp-capabilities-template}

Capability Name:
: The name of the capability. This name MUST begin with the colon (":") character. This name is case-sensitive. Names may not match other registered names in a case-insensitive manner unless the Designated Experts state that there is a compelling reason to allow an exception.

Capability URN:
: The URN of the AuthZEN Policy Decision Point Capability.

Capability Description:
: Brief description of the capability.

Change Controller:
: For IETF stream RFCs, list the "IETF". For others, give the name of the responsible party. Other details (e.g., postal address, email address, home page URI) may also be included.

Specification Document(s):
: Reference to the document or documents that specify the parameter, preferably including URIs that can be used to retrieve copies of the documents. An indication of the relevant sections may also be included but is not required.

### Initial Registrations {#iana-pdp-capabilities-initial}

This registry is initially empty. {{AUTHZEN}} defines no initial registrations for it.

## Well-Known URI Registry {#iana-wk-registry}

IANA is requested to register the well-known URI defined in Section 9.2 of {{AUTHZEN}} in the "Well-Known URIs" registry {{IANA.well-known-uris}} established by {{RFC8615}}.

### Registry Contents {#iana-wk-contents}

URI Suffix:
: authzen-configuration

Reference:
: Section 9.2 of {{AUTHZEN}} and \[This Document\]

Status:
: permanent

Change Controller:
: OpenID Foundation AuthZEN Working Group
: mailto:openid-specs-authzen@lists.openid.net

Related Information:
: (none)

## Registration of the "authzen" URN Sub-namespace {#iana-urn-namespace}

IANA is requested to register the URN sub-namespace `urn:ietf:params:authzen` in the "IETF URN Sub-namespace for Registered Protocol Parameter Identifiers" registry defined in {{RFC3553}}.

Registry Name: authzen

Specification: {{AUTHZEN}} and \[This Document\]

Repository: "AuthZEN Policy Decision Point Capabilities" registry ({{iana-pdp-capabilities-registry}} of \[This Document\])

Index value: Sub-parameters MUST be specified in UTF-8, using standard URI encoding where necessary.

# Security Considerations {#security}

This document only establishes IANA registries and registrations; it defines no protocol behavior of its own. See the Security Considerations section (Section 11) of {{AUTHZEN}} for security considerations relevant to the Authorization API.

--- back

# Acknowledgements {#acknowledgements}

Thanks to the members of the OpenID AuthZEN Working Group, and to the editors of {{AUTHZEN}}, {{{Omri Gazitt}}} and {{{David Brossard}}}. The structure of this document follows that of {{RFC8809}}, which established the corresponding registries for the W3C Web Authentication specification.
