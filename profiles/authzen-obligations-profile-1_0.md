---
title: "AuthZEN Profile for Obligations"
abbrev: "oblg"
category: std
date: 2026-05-21
ipr: none

docname: authzen-obligations-profile-1_0
consensus: true
workgroup: OpenID AuthZEN
keyword:
 - authorization
 - AuthZen
 - obligations
 - PDP
 - PEP
 - fine-grained authorization

stand_alone: true
smart_quotes: no
pi: [toc, sortrefs, symrefs, private]

author:
 -
    fullname: Alexandre Babeanu
    organization: Indykite
    email: alex.babeanu@indykite.com

normative:
  RFC2119:
  RFC8174:
  AUTHZEN:
    title: "Authorization API 1.0"
    target: https://openid.net/specs/authorization-api-1_0.html
    author:
      -
        name: Omri Gazitt
        org: Aserto
      -
        name: David Brossard
        org: Axiomatics
      -
        name: Atul Tulshibagwale
        org: SGNL
    date: 2026

informative:
  RFC8259:

--- abstract

--- middle

# Introduction
In certain cases, a Policy Decision Point (PDP) may need to force a Policy Enforcement Point (PEP) to undertake certain mandatory actions. These actions depend on the current context or business requirements of the implementation; these mandatory actions, called Obligations, must be carried-out regardless of the actual authorization decision otherwise returned by the PDP.

Common Use Cases for Obligations include, but are not limited to: 
- _Logging and Accountability_: Recording access attempts, especially for sensitive data (e.g., logging that a doctor accessed a patient's medical record under emergency conditions).

- _Notifications_: Triggering alerts or sending emails (e.g., notifying a manager if an unauthorized access attempt occurs).

- _Multi-Factor Authentication/Trust Elevation_: Redirecting a user to an additional authentication step after an initial decision (e.g., requiring a higher assurance authentication method).

- _Data Transformation_ : Watermarking documents before they are returned to the user, or masking PII or other attributes in fetched data.

This profile defines a protocol for a PEP and PDP to determine whether either supports Obligations, provides a format for defining Obligations, and proposes a set of normative Obligations that can be readily used by implementers.

## Requirements Notation and Conventions
The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.

The terms Policy Decision Point (PDP), Policy Enforcement Point (PEP), Subject, Resource, Action, Context, and Decision are used as defined by [AuthZEN].

## Terminology
Obligation:
: An action that the PEP MUST carry-out regardless of the decision or search results otherwise provided in the response of an AuthZEN access request sent to a PDP.

# Obligations in PDP Responses

## Overview
In addition to a `decision`, a PDP response MAY contain a `context` JSON object field that can convey additional information pertaining to the decision. This context can thenbe used at runtime by the PEP as part of the decision enforcement process. Examples of such contextual information include, among others:

- Reason(s) a decision was made,
- Hints for rendering UI state,
- Environmental information,
- Special filters or directives for the PEP,
- etc.

Obligations are an OPTIONAL JSON field that can be added by a PDP to the `context` element of a PDP decision response . When provided, the PEP MUST comply to the specified actions. If the PEP cannot comply, or the obligation action or actions fail, then the PEP MUST change the decision to `false` ("Denied") and therefore block the requested access, or in the case of AuthZEN searches, prevent any retrieved data from being presented to the requestor. This ensures that the stipulated actions are indeed carried out by the PEP in all cases.

## Obligation Format {#obligation-format} 
When used, the `obligations` context field MUST be an array of JSON objects. Each obligation MUST be uniquely identified within the object array by an identifier, which can then be used by the PEP to refer to the obligation for tracking or logging for example. The obligation `id` field can be any string or identifier that can uniquely identity the `obligation` within the array.

The main payload of an `obligation` depends on its nature, and must therefore be identified by a normative `type` (see also section IANA Considerations below ).

Each element of the `obligations` context field carries the following properties:

`id`:
: REQUIRED. A String identifier of the current obligation, unique within the response context.

`type`:
: REQUIRED. A IANA-registered String indentifier representing the normative type of the obligation. This type refers to the obligation types provided below, which also includes a "custom" type for implementation-specific obligation actions.

`parameters`:
: OPTIONAL. A JSON object containing a set of property/value pairs. Obligation actions MAY require additional parameters for execution, this object carries these details.


## PDP Response Format

# PEP Behavior{#pep-behaviour}
Obligations must be carried-out by the PEP regardless of the decision redered by the PDP. The proper execution of these obligations actions by the PEP MUST NOT change the value of the decisions or search responses returned by the PDP, EXCEPT if those obligation actions fail, as described below.

The following cases can occur:

### Obligations with Granted Access{#obligations-with-access-granted}
In the case, the PDP returned a `"decision": true` response, along with a set of obligations. The PDP granted the requested access, but determined that the PEP must first carry out a set of actions before releasing the protected resource.

In this case, the PEP MUST first perform the Obligation actions BEFORE granting access to the selected resource. If the PEP fails to perform the obligations, or if the actions fail or error out for any reason, then the PEP MUST change the decision to `false` and deny access.

### Obligations with Denied Access{#obligations-with-access-granted}
TODO

### Obligations with box-carred `evaluations`{#obligations-with-boxcarring}
TODO

### Obligations with Search Results{#obligations-with-search-results}
In this case, the PDP returned data in a response to a Search request (Subject, Resource or Action search, as defined in [AUTHZEN]), and also added a set of obligations.

Similarly to the previous cases, the PEP must first perform the Obligation actions BEFORE returning the requested data to the calling client. If the PEP fails to perform the obligations, or if the actions fail or error-out for any reason, then the PEP MUST not return any data to the requestor, and act as if no data was returned.

### Obligation Errors{#obligations-errors}
The runtime execution of the Obligation actions by the PEP MAY error out. For example, if a Notification service is not accessible or currently out of service, then the PEP will not be able to successfully fulfil a Notification obligation. In any case, any error MUST cause the corresponding request to be denied, as detailed on the section above. Nevertheless the methods or functions that the PEP uses to deal, manage or react to these runtime obligation execution errors are implementation specific and are outside of the scope of this profile. 

For example, PEPs MAY need to communicate such Obligations execution errors to their clients or users, or MAY need to properly log or audit such errors; any such requirements are specific to the implementation domain of the PEP, the correspdonding requirements are therefore left at the discretion of implementers.



## Constructing the AuthZen Request

## Handling Obligations in the AuthZen Response

## Obligation Enforcement

# Security Considerations

# IANA Considerations

# Relationship to Other Specifications

## OpenID AuthZen Authorization API

# Design Considerations

# Acknowledgements

# Notices

Copyright (c) 2026 The OpenID Foundation.

The OpenID Foundation (OIDF) grants to any Contributor, developer, implementer,
or other interested party a non-exclusive, royalty free, worldwide copyright license to
reproduce, prepare derivative works from, distribute, perform and display, this
Implementers Draft, Final Specification, or Final Specification Incorporating Errata
Corrections solely for the purposes of (i) developing specifications, and (ii)
implementing Implementers Drafts, Final Specifications, and Final Specification
Incorporating Errata Corrections based on such documents, provided that attribution
be made to the OIDF as the source of the material, but that such attribution does not
indicate an endorsement by the OIDF.

The technology described in this specification was made available from contributions
from various sources, including members of the OpenID Foundation and others.
Although the OpenID Foundation has taken steps to help ensure that the technology
is available for distribution, it takes no position regarding the validity or scope of any
intellectual property or other rights that might be claimed to pertain to the
implementation or use of the technology described in this specification or the extent
to which any license under such rights might or might not be available; neither does it
represent that it has made any independent effort to identify any such rights. The
OpenID Foundation and the contributors to this specification make no (and hereby
expressly disclaim any) warranties (express, implied, or otherwise), including implied
warranties of merchantability, non-infringement, fitness for a particular purpose, or
title, related to this specification, and the entire risk as to implementing this
specification is assumed by the implementer. The OpenID Intellectual Property
Rights policy (found at openid.net) requires contributors to offer a patent promise not
to assert certain patent claims against other contributors and against implementers.
OpenID invites any interested party to bring to its attention any copyrights, patents,
patent applications, or other proprietary rights that may cover technology that may be
required to practice this specification.
