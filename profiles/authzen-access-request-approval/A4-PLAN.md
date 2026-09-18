# PR A4 Plan: Progressive Layout

Version 4, 2026-09-18. Status: applied in the working tree, independently audited twice, corrected after the editor's review, awaiting approval; not committed. Version 3 records execution below. Version 2 corrected version 1 after the editor's review: "signed" no longer stands in for "integrity-protected", so no rule's applicability narrows; Part II's applicability distinguishes implementation support, rules triggered by artifact use, and circumstances that need portable proof; Part III is Additional Mechanisms and holds no general obligation; the PEP's exchange stays contiguous in Section 8 with the verifier rules after it; the decision table stays beside the fallback rules; Task Handle Portability stays with task authorization; the Binding Model table stays near Roles; every changed unit is enumerated, including non-keyword sentences; the reading metric is relabelled; and each commit checks companion-document links. Target: `authzen-access-request-approval-profile-1_0.md` on branch `arap-restructure` at 0c20d5a. Line numbers below remain keyed to that baseline file.

## Purpose

Let a reader meet the trusted-state deployment first and take on binding artifacts and additional mechanisms only when their deployment uses them. A4 is editorial: relocation, example replacement, a reading guide, and a small enumerated set of rewordings. No requirement is added, removed, or changed in applicability or force. The conformance layering that would make trusted-state binding a separate claim is the normative decision in `PROFILE-FAMILY-PROPOSAL.md`; A4 does not depend on it and must not imply it.

## Framing

- **Common PEP protocol and security invariants**: wire format, the PEP's conditional presence rules and opaque forwarding, expiry enforcement, tuple and Context comparison, caller binding, PEP authentication, approval applicability, current-status check, task-handle authorization.
- **Trusted-state backend binding**: `evaluation_id` resolved against shared or delegated state; approval by lookup of `approval.id`. Part I's worked examples.
- **Binding artifacts**: `binding_token` and `approval.state` as integrity-protected artifacts in any format the parties support, with JWS as the mandatory-to-implement format. Denial side and approval side are separate boundaries.

Interim conformance statement, verbatim in the reading guide: "Shared-state deployments need not exchange binding artifacts, but conforming Access Request Services and PDPs currently must support their respective JWS verification paths. Section placement does not waive that requirement."

## Target layout

Part I. Core protocol.

1. Introduction; Protocol Overview; new Reading Guide (non-normative): three rows, deployment / read / then read; the interim statement; one sentence on companions.
2. Requirements Notation and Conventions.
3. Terminology: Access Request, Access Request Service, Independent Access Request Service (154 to 155, unchanged; it is used by the presence rule at 255), Requestable Denial, Task Handle, Approval Result, Authorization-Relevant Context reduced to its first sentence plus the pointer at 169; the volatile-member SHOULD (second sentence of 167) moves verbatim to Structural Comparison.
4. Roles and Binding: Roles (173 to 179); Binding Model (181 to 194, unchanged; the table explains both mechanisms without teaching cryptography); PDP Metadata (198, 208 to 227) with the metadata example unchanged; Endpoint Protection (229 to 233). The `jwks_uri` paragraphs (200 to 206) and Interoperability Baseline (235 to 239) move to Part II.
5. Requestable Denial: Requestable Denial Context with members ordered `expires_at`, `endpoint`, `template`, `display`, `binding_token`; the `binding_token` entry keeps its presence rule (255) and its first two bullets (257 to 258), and its integrity and JWE bullets (259 to 260) move verbatim to Part II with a pointer left in place; the binding-material paragraph (275) unchanged; a new trusted-state example (no `binding_token`, `form_url`, or `request_schema_url`) replaces 279 to 300, which moves to Part II. Evaluation Identifier (302 to 318). Denial Binding by Reference (1040 to 1044) as the closing subsection. Trusting URLs (320 to 327) stays.
6. Submitting the Access Request: Access Request Submission (333 to 339); Request Body (341 to 363; the sentence at 363 gains a pointer to Part III); the `denial` object as one list, required members first, absorbing Denial Metadata (462 to 479) with all definitions verbatim; a new `evaluation_id`-only example replaces 388 to 422, which moves to Part II; Access Request Response (424 to 438); Submission Processing (495 to 507) plus the PEP authentication bullet (513) re-sentenced as a paragraph, since general authentication is not actor-specific; Idempotency and Retries (481 to 493). Additional Request Information (440 to 460) moves to Part III; the chain-verification bullets (514 to 515) and the audit-metadata sentence (517) move to Part III beside Delegation, keeping their condition "When the submission claims an actor" verbatim.
7. Checking the Task, in flow order: Task Handle (523 to 559); Task Status Values (625 to 653) and State Transitions (655 to 671) under one heading, Task Status and Transitions, both lists intact, since status meanings and transition triggers are complementary; Task Status Endpoint (561 to 583); Pending Task Response (673 to 691); Completed Task Response (693 to 724) with a new lookup example that includes `status_endpoint` and omits `state`, the current example moving to Part II with `status_endpoint` added; Completion Handling for PEPs (726 to 736) stays; Task Handle Authorization (585 to 593) absorbing Task Handle Leakage (595 to 597) and Task Handle Portability (617 to 623); PEP-Facing and End-Client-Facing Surfaces (599 to 615); Availability (738 to 740).
8. Approval and Re-evaluation, PEP exchange first and contiguous: the completion-mode paragraphs (744 to 756; 748 moves to Part II); Approval Result (758 to 768, with the `state` definition unchanged); Re-evaluation Request (770 to 774); Re-evaluation Denials and PEP Behavior (776 to 813) with its decision table in place; Approval Lifetime and Enforcement (815 to 821); Approval Reuse (823 to 831); a new lookup example without `state` replaces 843 to 886, which moves to Part II. Then the verifier rules, after the exchange: Approval Verification (1068 to 1086, minus 1082); Approval Reference by Lookup (1088 to 1090); Current Approval Status (1092 to 1094); Approval Scope (1096 to 1106, minus 1102) with Approval Scope Extensions (1108 to 1112). Deadline Reference (833 to 841) moves to the appendix guide.
9. Error Responses (888 to 927), unchanged; `approval_unverifiable` and `expired_denial` cover both binding forms.
10. Binding Integrity, common: Structural Comparison (933 to 952 verbatim, including the `binding_context_members` bullet at 949, which applies whenever `binding_token` is used, plus the volatile-member SHOULD from Terminology); Decision and Binding Integrity (954 to 962 verbatim; the by-value sentence at 960 is triggered by artifact use and stays here).
11. Core Conformance: PEP Processing Rules (1252 to 1290) unchanged. PDP and Access Request Service rules are grouped under two keyword-free lead-ins, "In every deployment" and "When binding artifacts are used", with each bullet's own condition kept verbatim: 1302 and the artifact clauses of 1313 to 1317 go under the second lead-in; 1300 stays under the first because it names both forms. JWS-specific clauses stay inside their bullets as written.

Part II. Binding Artifacts.

12. Binding Artifacts: a keyword-free applicability paragraph with three statements: (a) implementation support: the Interoperability Baseline requires every service and PDP to support the JWS verification paths, whatever their deployment; (b) rules triggered by use: whenever a `binding_token` or `approval.state` is present, in any deployment, the rules of this part apply to it; (c) portable proof: an Independent Access Request Service requires `binding_token`, and a PDP that cannot resolve `approval.id` requires `approval.state`. Then Interoperability Baseline (235 to 239); Keys and Metadata (200 to 206) with a metadata example that includes `jwks_uri`.
    - Denial Binding Artifacts: the `binding_token` bullets (259 to 260); Denial Binding (964 to 974); Denial Binding Claims (976 to 984); JWT Claim Reference (986 to 993); Binding the Denied Request (995 to 1002); Hash Construction (1004 to 1021); Verifying the Denial Binding (1023 to 1038); Denial Binding Alternatives (1046 to 1052); the current denial and submission examples.
    - Approval State Artifacts: Approval State (1056 to 1066); the bound-reference sentence (1082) and scope paragraph (1102); the topology sentence (748); the current completed-task and re-evaluation examples.
    - The conformance bullets are not duplicated here; Section 11's second lead-in points to this part.

Part III. Additional Mechanisms.

13. Cancellation (1114 to 1132).
14. Delegation and Acting Parties (1134 to 1147); Client Actor and Source (1149 to 1159); Actor Chain Verification: bullets 514 to 515 and sentence 517 under a lead-in that keeps their condition.
15. Machine-Readable Forms (1161 to 1181).
16. Additional Request Members: `requested_access` and `client` (440 to 460).

Then Extensibility and Profiles (1183 to 1248); Security Considerations (1336 to 1374) with citations retargeted by anchor; Privacy; IANA; registries unchanged; Appendix A Examples with a new End-to-End Trusted-State Approval walkthrough before the existing one, and the existing re-evaluation request (1677 to 1683) corrected to carry `state`; Appendix B PEP Implementation Guide (new, non-normative) holding Deadline Reference; Motivation; Implementation Considerations; Design Rationale with 1946 to 1948 rewritten as "Why present trusted-state binding first?"; Acknowledgements; Document History entry.

## Enumerated changes

Everything not listed here moves verbatim.

New keyword-free text: the Reading Guide; the Part II applicability paragraph; the two conformance lead-ins; the Actor Chain Verification lead-in; three headings and lead-ins for the examples moved to Part II (Signed Denial Example, Submission with a Binding Token, Completed Task with Approval State); the Part I re-evaluation example's new anchor `lookup-reevaluation-example`, the old anchor moving with the Part II copy; the level changes of Approval Verification, Approval Reference by Lookup, Current Approval Status, Approval Scope, Approval Scope Extensions, and PEP-Facing Surfaces; the Part III pointer at 363; the pointer left at the `binding_token` entry; the Appendix B heading and one framing sentence.

New examples (non-normative): trusted-state denial (Section 5); `evaluation_id`-only submission and response (Section 6); lookup completed task with `status_endpoint` (Section 7); lookup re-evaluation request and response (Section 8); the End-to-End Trusted-State Approval walkthrough (Appendix A).

Corrected examples: the moved completed-task example gains `status_endpoint`; the appendix re-evaluation request gains `state`. Both are recorded against register entry G15.

Reworded units: the Terminology entry for Authorization-Relevant Context loses its second sentence, which moves; the PEP authentication bullet (513) becomes a sentence with the same actor, condition, and obligation; the rationale entry (1946 to 1948) is rewritten; the Document History gains an entry. No other sentence changes.

Relocated tables: Deadline Reference moved unchanged; its citations were already anchors.

Non-keyword rules preserved verbatim, checked by the sentence diff below: terminal-state immutability (657); the `405 Method Not Allowed` and `409 Conflict` sentences in Cancellation; the transition triggers table; the by-reference procedure (1044); the `approval_unverifiable` definition.

## Verification, per commit

- Build clean; anchor check zero missing; plan counter unchanged at 350.
- Unit comparison against the previous commit shows only MOVED lines plus the reworded units above.
- Sentence diff: every non-code sentence of the previous commit, normalized, is present in the new commit or listed above as removed or reworded. This catches keyword-free rules that the unit comparison cannot see.
- Companion-document link check: every core section title cited by name in the Catalog, Bulk, and Callback profiles, and every `{{ARAP}}`-style reference, resolves to a heading that still exists with that title; renamed headings are listed with their old titles.
- Independent equivalence audit of the diff before the editor's review.
- Three commits: Part I with Appendix B; Part II; Part III with Security Considerations retargeting.

## Expected effect

These are planning estimates, not measured results. See the execution record for actual size.

| | Now | After A4 |
|---|---|---|
| Reading needed to understand the trusted-state exchange | about 10,500 words | about 5,500 |
| Read and discarded on that path | about 2,300 | near zero |
| Reading needed to confirm conformance | the whole normative text | the whole normative text, until the conformance decision |
| Requirements changed | none | none |

## Execution record, 2026-09-18

All three layout phases are applied together as one uncommitted working-tree change. The proposed three-commit sequence has not been executed; verification and the independent audit compare the complete result with `0c20d5a`. No commit or push was made. Existing changes to other plans, the family proposal, and Makefiles were preserved.

The reading guide identifies Part I as Sections 1–11, Part II as Section 12, and Part III as Sections 13–16, without extra part headings that would change the planned section numbering. State Transitions remains a nested heading under Task Status and Transitions so both existing anchors survive. Task Handle Leakage and Portability likewise retain their headings under Task Handle Authorization.

### Preservation decisions

- Part II's applicability paragraph preserves `approval.state` **or another profile-defined PDP-verifiable artifact**. It also preserves verifier state that is not a JWS; conditional JWS rules are not presented as universal format requirements.
- Only the PDP token-protection bullet and the service's token-integrity/JWS sub-bullet moved to the artifact conformance groups. The service's per-item parent obligation, lookup path, expiry rejection, and invalid-binding rejection remain under In Every Deployment. The moved service bullet keeps its per-item scope in the lead-in.
- The two moved token-protection bullets have an explicit `binding_token` lead-in so "the value" retains its referent.
- General PEP authentication remains in Submission Processing. Actor-chain checks move with their existing authentication lead-in and conditions.
- The denial metadata definitions and source rows merge into the one denial-object definition. The obsolete forwarding sentence and the separate metadata-list introduction are removed; no member definition is reworded. The form-member pointer follows the complete requestable-denial member list.
- The request-body pointer already cited `submission-additional-information`; moving that target supplies the planned Part III pointer without changing the sentence. No extra Task Status lead-in was needed: its existing introduction remains.
- The new trusted-state walkthrough declares its empty authorization-relevant Context and includes complete Task Handles. The original artifact examples move without repairing their registered token defects. Only the two listed original example omissions are corrected, as recorded in G15.

### Heading and citation map

| Previous heading or anchor | A4 destination |
|---|---|
| Roles, Trust, and Keys | Roles and Binding; old generated anchor made explicit |
| Binding and Verification | Binding Integrity; `deployment-alternatives` retained |
| Denial Metadata / `submission-denial-metadata` | The `denial` Object / `submission-denial-object`; Bulk's link retargeted |
| Task Status Values | Task Status and Transitions; `task-status` retained; both Bulk link labels updated |
| Denial Binding | Denial Binding Artifacts; `denial-binding` retained |
| Approval Binding | Approval State Artifacts; `approval-binding` retained |
| Actor and Source Verification | Actor Chain Verification; `actor-source-verification` retained |
| Additional Request Information | Additional Request Members; `submission-additional-information` retained; Bulk link label updated |
| Why present signed artifacts first? | Why present trusted-state binding first?; original explicit anchor retained |

The approval-state key-publication bullet, service signature-verification bullet, and JWT `iss` claim now cite `binding-keys` instead of `discovery`. Approval Reference by Lookup now points to `approval-state` for the relocated bound-reference explanation. Security Considerations citations continue to reach their rules through retained anchors; no unnecessary citation rewrite was made. Catalog and Callback links needed no source changes.

### Verification results

- Core keyword total: **350**, unchanged. Bulk remains 29; Callback remains 20.
- Normalized non-code comparison: all baseline content remains apart from the enumerated glossary split, authentication re-sentencing, rationale rewrite, and the two obsolete denial-metadata introductions. The independent audit found no changed normative actor, condition, exception, or force, including rules without uppercase keywords.
- XML, HTML, and text build successfully. The initial sandboxed build could not refresh expired bibliography entries; the network-enabled rebuild refreshed them successfully. Existing stream-default and artwork/line-width warnings remain.
- Across the four rendered profiles: no missing local or companion anchor targets, duplicate IDs, or list markers rendered as paragraph text. All 33 core JSON-bearing examples parse. This is a syntax check, not a claim that the pre-existing G15 payload defects are fixed.
- `git diff --check` passes.
- Independent audit completed. Its one citation finding, the JWT `iss` reference to the old key-publication location, was corrected and rebuilt.

Part I is approximately **8,600 whitespace-delimited words**, or **8,200 excluding fenced examples**; the projected 5,500 was not achieved. Part I includes common backend verification and conformance rules, not just the selective PEP exchange path. No claim is made that the complete normative reading burden has decreased.

### Corrections after the editor's review, 2026-09-18

- The general PDP paragraph (the durable denial-binding record lives in the service role; when neither form is available or the service cannot determine the binding is unexpired, the PDP MUST NOT include `context.access_request`) returned from Denial Binding Artifacts to Requestable Denial Context, after the two-forms paragraph, so it is not read as artifact-conditional. The Part II applicability paragraph gained one keyword-free sentence: rules there stated for either binding form, or for the Approval Result the service returns, apply in every deployment.
- The reading guide's PEP row now names Trusting URLs, Task Handle Authorization, and the PEP processing rules.
- The Part I metadata example no longer shows `jwks_uri`; the Part II example keeps it.
- The appendix Manager Approval Completed Task response gains `task.status_endpoint`, matching its Part II copy; recorded under G15.
- Two lost antecedents restored: "both patterns" now names lookup and `approval.state`; "the set" in the moved SHOULD now says the authorization-relevant Context set.
- The rationale entry says each boundary uses whichever form its topology permits.
- This record no longer claims a Deadline Reference citation change or a status lead-in, and lists the three example headings, the anchor split, and the heading-level changes.
