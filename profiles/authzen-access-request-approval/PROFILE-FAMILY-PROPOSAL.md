# Proposal: A Layered Profile Family with a Colocated Core

Version 2, 2026-09-17. Status: proposal for the working group, drafted at the editor's request. Version 1 (2026-09-17, as `COMPANION-SPLIT-PROPOSAL.md`) proposed moving bulk submissions and callback completion to companion profiles. Version 2 supersedes it after the feedback on issue #520 (Alex, Vatsal): the core becomes the simplest deployment, and every other capability, including signed denial binding and signed approval state, is a profile layered on it. This document changes nothing until the working group decides. Word and keyword counts are measured on the restructured text at PR A3 (`arap-restructure-a3`, 00db206) and are estimates where a heading must be split at unit level.

## The decision requested

Whether the core specification should define only the colocated deployment, in which the PDP and the Access Request Service correlate a denial and its Access Request by `evaluation_id` and the Task Handle, with all other capabilities defined in companion profiles that hook in through the core's extension points.

## Why the layered core is better for implementers and adoption

- **The PEP is the same in every layer.** A PEP echoes the denial, holds a Task Handle, and re-submits an approval object. Whether the members it carries are opaque signed tokens or bare identifiers changes nothing it does. PEPs are the many implementations; PDPs and Access Request Services are the few. The layering costs PEP implementers nothing and gives them one short document.
- **The first implementers are colocated.** A PDP vendor that also runs the workflow, or a governance product that plays both roles, can implement the colocated case in days. Today it must also implement JWS issuance, verification, and key publication to conform, for a topology it does not have (Interoperability Baseline, two MUSTs).
- **The open protocol questions are all in the signed layer.** Register entries G1, G2, G4, G9, and G10 are what block an independent PDP and Access Request Service from interoperating. The colocated core has no blocking entry. Layering lets the core stabilize while the signed layer is settled.
- **It is the pattern already chosen.** The catalog split, the extension points, and the member registry exist so that features hook in from outside.
- **Size.** Part I falls from about 10,100 words and 284 keywords to roughly 6,000 words and 170 keywords. The four flow sections each fit on a screen or two.

## Two guardrails

1. **Reserve the wire members in the core.** `binding_token` and `approval.state` stay in the core as opaque members with the PEP rules that already exist: the PEP does not decode, modify, or interpret them, and echoes them unchanged. The core says only that a profile defines their content and verification. A core PEP then works unchanged against a colocated or a distributed backend, and the layering is invisible on the PEP side. The same holds for `items`, `callback`, `form_url`, and `request_schema_url`: registered names, defined by their profiles.
2. **Name the layers.** Each profile declares a capability URN in PDP metadata, as the core already does with `urn:openid:authzen:capability:access-request`, and carries its own conformance section. A product then says which layers it supports, and "supports ARAP" is not ambiguous. Without this, layering fragments: two products claim support and cannot interoperate.

## The family

| Document | Answers the question | Built from |
|---|---|---|
| Core | there was a deny; how does the caller find out what to do next, with the PDP and Access Request Service correlating by `evaluation_id` and the Task Handle | Part I minus the signed layer; Deployment Alternatives' shared-state text becomes the main text |
| Distributed Deployment | the PDP and the Access Request Service share no state | the signed layer listed below |
| Forms | the PEP cannot build the request from the denial alone | Machine-Readable Forms, Trusting URLs, the PEP schema rule |
| Catalog | form fields come from a backing catalog | exists |
| Bulk | many items in one request | Bulk Submissions and the bulk conditions in Part I |
| Callbacks | push instead of poll | Callback Completion and the subscribed-PEP exception |

## Move map, by heading

Headings marked "split" contain units for more than one document; the split is made at unit level from `PASS0-INVENTORY.tsv`, which already tags every requirement by actor and feature.

**Distributed Deployment (about 2,800 words, 65 keywords).** Interoperability Baseline (50 words, 3 keywords, whole). Denial Binding Claims (597, 13, whole). Verifying the Denial Binding (259, 5, whole). Denial Binding Alternatives (309, 4, whole except the bulk construction, which goes to Bulk). The `jwks_uri` rules in PDP Metadata (split, about half of 262 and 9). The `binding_token` definition and the by-value paragraph in Requestable Denial Context (split, about 150 and 6). The hashed form and the `binding_context_members` bullet in Structural Comparison (split). In Approval and Re-evaluation, the `approval.state` definition, the JWS verification rules, the bound-reference pattern, and the carried-by-value sentence of Decision and Binding Integrity (split, about 1,100 and 26). The signature-related bullets in the three conformance lists (split, about 10 keywords). The Denial and Approval Integrity threat paragraphs on binding-token integrity and approval-reference substitution. The registry rows for `jwks_uri` and the `approval_unverifiable` reason. Register entries G1, G2, G4, G9, G10, and G3's stateless case go with it.

**Forms (about 600 words, 17 keywords).** Machine-Readable Forms (442, 12, whole). Trusting URLs from the Requestable Denial (123, 3, whole; the `endpoint` sentence stays in the core). The `form_url` and `request_schema_url` pointer in Requestable Denial Context and the PEP schema bullet in PEP Processing Rules (split). The Information Disclosure threat paragraph on trusting URLs. Register entry G14.

**Bulk (about 1,300 words, 34 keywords).** Bulk Submissions (617, 19, whole). The `items` conditions on `resource`, `action`, and `denial`, the bundle-denial rules, and the Idempotency-Key sentence in Access Request Submission (split). The `partial` status, its transition, and the completed-task bullet for items (split across Task Status Values, State Transitions, Completed Task Response). The per-item re-evaluation paragraph in Approval and Re-evaluation. The bulk construction in Denial Binding Alternatives. The bulk-bundle threat paragraph. The registry rows for `items` and `partial`. Register entry G12.

**Callbacks (about 800 words, 24 keywords).** Callback Completion (508, 19, whole). The subscribed-PEP exception in Task Status Endpoint, the callback mention in Protocol Overview and Forward Compatibility (split). The callback threat paragraph. The registry row for `callback`. Register entry G18.

**Core (about 14,000 words including appendices; Part I about 6,000 words, 170 keywords).** Everything else: the Introduction and overview, Terminology, Roles, Endpoint Protection, the `access_request` object with `endpoint`, `template`, `expires_at`, `display`, and the reserved opaque members, Evaluation Identifier, Structural Comparison's inline rule, Access Request Submission and Response, Actor and Source Verification, Checking the Task, Approval and Re-evaluation by lookup with `approval.id`, Error Responses, Core Conformance, Cancellation, Delegation, Extensibility, the threat paragraphs on denial remains denial, confused deputy by shared state, task-handle leakage, approver hygiene, availability, Privacy, the registries, and the appendices. Shared-State Deployments stops being an alternative and becomes the main text of Sections 5 and 8. Register entries G5, G6, G8, G11, G13, G15, G17, G19, G20, G21, G22 stay with the core.

## What the core must say for the layers to work

- A one-paragraph reading guide: which profile a deployment needs, by the question it answers.
- The reserved opaque members and the PEP courier rules for them.
- The rule that implementations MAY define additional status values and that a PEP treats an unknown status as not approved, so Bulk can define `partial` without a core change.
- The response of a core-only Access Request Service to a member it does not implement (register entry G21). With the layering, the natural answer is the extension-point rule plus one problem type.
- The capability URN pattern and the requirement that a profile declare one.

## The cost

Cross-vendor interoperability between an independent PDP and Access Request Service becomes a property of implementing the Distributed Deployment profile, not of the core. The Design Rationale entry that presents the signed form first is rewritten to say why the signed form is a layer. Four new documents to build, publish, and maintain, each through the CI checklist the catalog split already exercised. A reader who wants the whole picture reads five documents instead of one; the family reading guide and cross-references by section name mitigate this.

## Sequencing

1. Merge the PR A stack as it stands. Its inventory, isolated sections, threat statements, and register are what make the split cheap and provable; the layering does not undo any of it.
2. PR B, one pull request per companion, each a verbatim relocation performed with the Pass 0 tooling (inventory, generated line map, unit comparison, anchor check), so the working group can confirm nothing changed in force. Order: Distributed Deployment first, because it moves the most and settles the shape of the core; then Forms; then Bulk and Callbacks.
3. The core's reading guide, reserved-member paragraph, capability URNs, and G21 answer as one small normative pull request after the relocations, since they are the only new text.
4. Register Part A entries are worked in their own profiles after that.

## Not proposed

Moving Delegation and Acting Parties: the chain-verification and authorization-input rules are behavior every Access Request Service exhibits on encountering `client.actor`, and the identity questions in G6 are core questions. Moving Cancellation: small, and the Task Handle's `links.cancel` and the terminal-state rules depend on it.
