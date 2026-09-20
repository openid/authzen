# PR A3 Plan: Consolidation and Part I Placements

Current record: version 2, 2026-09-17. The editor authorized consolidation of the A1/A2/A3 stack into `arap-restructure`, tracking `origin/arap-restructure`. The old local and remote restructure branch names were removed; their commits remain in the consolidated history. A1/A2/A3 now identify review stages, not separate active branches or a stacked pull-request plan. The catalog split remains a separate branch. No change to other topic branches is part of this work.

A3.1 and A3.2 are committed as `00db206`; A3.3 is committed as `97a575f`. The A3.3 record below describes only that commit and is unchanged by A3.4. A3.4 is the separate editorial pass against `97a575f`, independently audited and committed as specification-only commit `431b56f`. Audit records remain local at the editor's instruction to commit only the specification. A3.5 below records the subsequent uncommitted binding-model clarification. This current-status note supersedes the historical branch and pending-review statements below.

### Historical A3.1–A3.2 record

Version 1. Status: applied 2026-09-17 on branch `arap-restructure-a3`, stacked on `arap-restructure-a2` (A2.6, d73676b), on the editor's instruction to apply the recommendations of the end-to-end critique. Awaiting the editor's review. Unlike PR A2, this pass removes keywords: six restatements are folded into their surviving rules, so the total falls from 404 to 398. Each fold is listed with its surviving rule so a reviewer can confirm the survivor carries the same actor, condition, obligation, and exceptions. An independent equivalence audit of the diff, run before the editor's review, judged all ten items equivalent, found every hunk covered by the list below, every citation resolving, and no stale reference to removed wording or headings; it confirmed items 1, 3, and 7 as unions of their originals, neither narrower nor wider. Its one wording note: item 1 keeps the bullet's word "applicable to" rather than the subsection's "bound to", which is defensible because the next bullet already defines the failure case as a non-applicable reference.

## A3.1 Consolidations

1. **Re-evaluation applicability check.** The bullet in Approval and Re-evaluation (PDP MUST verify the reference is applicable to caller or requester, Subject, Resource, Action, relevant Context, scope, expiry) and the paragraph in Decision and Binding Integrity (PDPs MUST resolve or verify and confirm it is bound to the same list before using it as an input to an allow decision) are one check. Survivor: the bullet, now carrying "resolve or verify" and the trailing condition. The subsection keeps "Possession of a valid-looking approval identifier is insufficient to authorize access" and points at the bullet. Register G20 records this as the one duplicate among the six binding statements; the force question (811 MUST versus 1208 SHOULD) and the Context naming stay open and are untouched. Net: one MUST.
2. **Actor-chain rejection.** "Submissions whose claimed chain cannot be verified MUST be rejected" at the end of the PEP-acting-on-behalf paragraph restated the conformance bullet above it, which names the verification sources (caller's credential, trusted issuers). Survivor: the bullet, which is the stricter form; the sentence's threat clause was already in Security Considerations. Net: one MUST.
3. **`client.actor` as authorization input.** "MUST NOT treat `client.actor` content that has not been independently verified as authorization input" restated the `client` member rule, which covers `client.actor` and `client.source`. Survivor: the member rule; the MAY-retain-as-audit clause stays where it was, with a pointer. Net: one MUST NOT.
4. **`subject.properties.act` exclusion.** The exact-match baseline restated the Subject, Resource, and Action comparison and the `act` exclusion from Denial Binding Claims. Survivor: that section; the baseline now cites Structural Comparison and Denial Binding Claims for the comparison, member set, and exclusion. Net: one MAY.
5. **Default approval scope.** The paragraph after the scope bullets restated the exact-match baseline's definition. Survivor: the bullet; the paragraph now says the baseline is the default unless a broader or narrower scope is recorded, citing Approval Scope Extensions. Keyword-free.
6. **Form members.** Machine-Readable Forms defined `form_url` and `request_schema_url`, then re-described both in a paragraph and again in two bullets. Survivors: the definitions, under a lead-in naming them as `access_request` members; the PDP MAY sentence and the PEP MAY-omit sentence stay. Net: one OPTIONAL.

## A3.2 Part I placements

7. **PEP handling of an unsatisfiable schema.** The rule (MUST NOT fabricate or submit incomplete; MUST surface, hand off, or treat as not requestable) is behavior every PEP exhibits on encountering `request_schema_url`, so by the Part I test it belongs in Core Conformance. It replaces the PEP bullet's shorter "or MUST NOT submit if the required augmentations cannot be supplied", which it subsumes. Machine-Readable Forms keeps a pointer. Net: one keyword.
8. **Unsupported Cancellation.** The sentence moves from Checking the Task to the Cancellation section, beside the MAY-support rule. Keyword-free.
9. **Authorization-Relevant Context rules.** The MUST paragraph, its two bullets, and the empty-set sentence move from the Terminology entry to Structural Comparison, which is where the set is compared. The entry keeps its definition and a pointer. Keyword-neutral.
10. **Emergency Access.** The `emergency` member returns to the `requested_access` list beside `requested_until`, as on main. Its handling paragraph (two SHOULDs) moves to Policy and Approver Hygiene in Core Conformance, which already holds approver hygiene; the Delegation section no longer carries an unrelated subsection. The Security Considerations citation is retargeted. Keyword-neutral.

## Verification

Build clean; all cross-references resolve; `git diff --check` clean; plan counter 398; the unit comparison against A2.6 lists exactly the units named above.

## A3.3 Local organization and motivation

Status: completed on 2026-09-17 at the editor's request to implement recommendations 2, 4, and 5 of the branch-versus-main critique; the editor requested commit and push after verification. Baseline: `9ec47ac`.

- Approval and Re-evaluation gains six subsections without reordering its text: Approval Result, Approval Verification, Re-evaluation Denials and PEP Behavior, Approval Lifetime and Current Status, Approval Scope and Reuse, and Re-evaluation Example. The existing Decision and Binding Integrity subsection remains, with its applicability pointer targeting Approval Verification.
- Structural Comparison becomes the common home for the full-object comparison and `subject.properties.act` exclusion used by inline denial binding and exact-match approval-scope matching. The relocated text explicitly names those two uses; it does not alter generic JSON equality or create a universal binding obligation. Inline claims, hashed claims, and the exact-match baseline cite that common home. The bulk construction moves verbatim from Denial Binding Alternatives to a new Denial Binding for Bulk Submissions subsection beside the bulk coverage rules. Security citations follow the moved construction, and the Deployment Alternatives lead-in no longer lists it.
- The Introduction gains three non-normative sentences explaining the runtime approval handoff and the base completion mode's re-evaluation step. No reading guide, member index, or profile-family split is applied.

Verification against `9ec47ac`: 398 keywords, unchanged, with zero in Security Considerations; the Appendix X comparison reports four removed and five added units (the inline comparison split, two comparison citations, and the per-item denial citation), plus one verbatim move of the bulk construction. Example blocks and register-linked editor's notes are unchanged. Both profiles rebuilt as HTML and text after refreshing bibliography references, with stream-metadata and text-width warnings. Rendered checks confirm the six new approval subsections are siblings, the common comparison and bulk rules are at their intended destinations, internal links resolve, IDs are unique, and no list markers appear as paragraph text. `git diff --check` passes.

## A3.4 Editorial consolidation and tightening

Status: applied at the editor's request for a full editorial pass, corrected following review on 2026-09-17, independently audited, and approved for commit and push. Baseline: `97a575f`. This pass is not part of A3.3 and its comparison figures do not describe A3.3.

Scope: shorten repeated explanation and rationale while preserving requirements, exceptions, and scanability. The Introduction, role descriptions, task portability, approval explanation, Security Considerations, Motivation, Implementation Considerations, and Design Rationale are tightened. Structural-comparison rules and bulk binding forms become lists; dense paragraphs are split; the single-item Task Handle proxy list becomes prose inside its definition. Conformance checklists, example blocks, tables, headings, explicit anchors, and register-linked editor's notes remain intact. No protocol gap is resolved.

### Changed keyword-bearing units

The Appendix X comparison against `97a575f` reports **23 removed units, 26 added units, and no moves**. These are textual units, not deleted or added requirements. The exact-match scope unit becomes two paragraphs; the callback endpoint unit becomes a definition and two nested obligations, accounting for the three extra units. The complete old-to-new accounting is below; section and member names identify the units without relying on shifting source line numbers.

| # | Section and unit | Editorial change and equivalence check |
|---|---|---|
| 1 | Requestable Denial: `binding_token` definition lead | Removes a self-citation; presence conditions, type, and description are unchanged. |
| 2 | Evaluation Identifier: audit-retention paragraph | Shortens the explanation; the service's SHOULD retain the original identifier and audit purpose remain. No new identifier-reuse rule. |
| 3 | Denial Binding Claims: `aud` | Shortens audience rationale; REQUIRED presence and the service's MUST reject missing or mismatched audiences remain. |
| 4 | Denial Binding Claims: `jti` | Removes the repeated explanation of the short tracking window; SHOULD track until `exp` remains. |
| 5 | Access Request Submission: equivalent retries | Moves the keyword-free body-equivalence definition into its own paragraph; requester/key/body conditions, same-task SHOULD, changed-body MUST reject, retention qualifier, and service-defined comparison remain. No processing precedence is introduced. |
| 6 | Task Handle: `status_endpoint` proxy paragraph | Removes the one-item bullet marker; both MAY permissions and the authorization proviso are verbatim. |
| 7 | PEP-Facing and End-Client-Facing Surfaces: forwarding paragraph | Shortens the explanation and retargets citations; SHOULD NOT forward and the distinction between possession and authorization remain. |
| 8 | Task Handle Portability: caller permission | Consolidates repeated continuity explanations; the MAY for a different caller and all Subject/Resource/Action/task/operation authorization conditions remain. |
| 9 | Approval Verification: unchanged `approval` rule | Shortens the following explanation but explicitly retains `id`, timestamps, and any `state`; the PEP's MUST carry the object unchanged is verbatim. |
| 10 | Re-evaluation Denials: guidance lead-in | Shortens the prose; the PDP's SHOULD provide next-action guidance still applies to a denied re-evaluation presenting an approval reference. |
| 11 | Re-evaluation Denials: `next_action` lead-in | Removes "durable interoperability surface"; RECOMMENDED, type, enumeration, and fallback behavior remain. |
| 12 | Approval Scope and Reuse: exact-match baseline | Replaces a single-item list with two paragraphs; both MUSTs, equality rules, actor exclusion, and the bound-reference Context-member-set condition remain. One old unit maps to two new units. |
| 13 | Re-evaluation Example: introductory paragraph | Shortens the signed-form explanation; MAY omit `approval.state` only with trusted shared state and server-side lookup remains. |
| 14 | Denial Binding Alternatives: multi-profile JWT | Shortens examples; MAY combine profiles only with a present and consistent union of required claims, and tolerance of additional claims, remain. |
| 15 | Bulk Denial Binding: bundle construction | Splits inline and hashed forms into bullets. The hashed construction and MUST use it remain verbatim; whole-array coverage, order, actor exclusion, and the per-item-denial exception remain in adjacent prose. |
| 16 | Bulk Status, Cancellation, and Re-evaluation: cancellation | Splits the paragraph and shortens repeated qualifiers. Pending-item cancellation, terminal-item preservation, implementation-defined handling, SHOULD document it, aggregate recomputation, and the all-terminal error remain. |
| 17 | Callback Completion: `endpoint` definition | Separates the REQUIRED URI definition and two MUST checks into nested bullets; authenticated-PEP validation and the explicitly allowed internal-destination exception remain verbatim. One old unit maps to three new units. |
| 18 | Delegation: approval routing | Shortens surrounding prose; MAY consider any chain identity and the requirement for representable, verifiable identities before routing remain. Uses "requires", not lowercase "must". |
| 19 | Machine-Readable Forms: autonomous submissions | Shortens the conformance pointer; schema SHOULD, augmentation MUST, and direct-consumption MAY remain. |
| 20 | Machine-Readable Forms: proprietary form translation | Shortens the platform introduction and loss-of-fidelity explanation; MAY derive JSON Schema and SHOULD provide enough input information remain, with richer rendering at `form_url`. |
| 21 | Design Rationale: single endpoint | Shortens discovery/routing rationale; the intermediate enforcer's MAY proxy and protocol-preservation condition remain verbatim. |
| 22 | Design Rationale: distinct artifact names | Shortens the explanation; `binding_token` integrity MUST and the artifacts' issuer/verifier directions and format distinction remain. |
| 23 | Design Rationale: always-present approval identifier | Shortens correlation rationale; REQUIRED `approval.id` and the cross-check when signed state carries an identifier remain. |

### Keyword-free changes and review corrections

The unit counter does not see keyword-free normative prose. Review also covers the structural-comparison definition (same JSON type, number canonicalization, string/array/object equality, and absent-versus-null distinction); the service-defined idempotency comparison; signed-key publication/selection; bulk coverage, ordering, aggregation, cancellation, and per-item exceptions; and declaration of the catalogs document. These rules are preserved, not replaced by summaries. Other deletions remove repeated rationale, role descriptions, or navigation whose destinations still exist; they do not remove conditions or exceptions.

The follow-up review's six corrections are applied:

1. Machine-Readable Forms explicitly says that the denial references a **catalogs document defined by** the Catalog Profile, not the profile itself.
2. Mapping Backend States names **implementations**, not the endpoint, as the mapping actor.
3. The bulk-escalation threat cites **Bulk Submissions**, covering aggregation and independently enforceable per-item results.
4. The unchanged-approval rule explicitly includes **`id`, timestamps, and any `state`**.
5. Delegation routing uses **"requires"** rather than introducing lowercase "must".
6. Bulk status uses **"two or more distinct terminal statuses"** rather than "mixed outcomes".

### Verification and independent audit

Completed against `97a575f` on 2026-09-17:

- An independent, read-only reviewer read every specification hunk, including keyword-free rules, and found no change to actor, condition, obligation, exception, or force and no inadvertent resolution of a register question. The reviewer verified all six corrections and the complete 23-to-26 unit accounting above, with no remaining findings. Build/render checks below were performed separately by the implementing agent; script counts alone are not proof of equivalence.
- Appendix X: 23 removed units, 26 added, no moves; aggregated keyword total 398, unchanged, with zero in Security Considerations. Keyword counts are also unchanged at every heading, not merely in aggregate. All specification cross-reference targets resolve.
- All fenced examples/artwork, table lines, heading lines, explicit anchors, and editor's notes remain identical to the baseline. The A3.3 block remains unchanged from the previously reviewed local record. The gaps register and pre-relocation source copy were not edited.
- HTML and text rebuild successfully. The build reports 69 stream-metadata and width warnings, with no errors or failed reference fetches. Rendered HTML has no duplicate IDs or literal list markers in paragraphs. Structural comparison and bulk binding render as lists; the callback's two checks remain nested inside its definition; the full-object approval clarification renders correctly. The renderer's pre-existing unresolved `#copyright` boilerplate link remains; specification links resolve.
- `git diff --check` passes. Whole-file whitespace-delimited word count falls from 21,893 to 18,582 (15.1%); counting only text after `--- middle` and excluding fenced examples/artwork, it falls from 20,463 to 17,152 (16.2%). These counts describe A3.4 only, against `97a575f`.

At the review handoff, no files had been staged, committed, or pushed. The editor subsequently requested commit and push, then restricted the commit to the specification. The temporary, unpushed A3.3-record commit was undone with all working files preserved; specification-only commit `431b56f` was pushed. The A3.3 and A3.4 records remain local and uncommitted.

## A3.5 Binding-model overview and deployment terminology

Status: applied at the editor's request following review of ten recommendations. Baseline: `431b56f`. Not committed. This stage applies recommendations 2, 6, and 7 as editorial clarification; it does not define a signed approval payload or choose revocation semantics.

- Terminology defines an Independent Access Request Service by the absence of trusted access to denied-evaluation state shared with or delegated by the PDP, not by organizational ownership or absence of trust.
- A Binding Model subsection under Roles, Trust, and Keys replaces the signed-artifact pointer paragraph with a two-row comparison of signed proof and trusted-state lookup. It preserves the signer/verifier directions, notes that identifiers and signed artifacts are not mutually exclusive, distinguishes denial-token precedence from the always-present approval identifier, and retains the broader meaning of the opaque `approval.state` member. Links connect the overview to claims, submission verification, approval verification, shared-state alternatives, and other formats; detailed rules remain beside the operations they govern.
- The stateless-PDP goal now permits evaluation without retaining prior decisions and supports signed bindings where denial/approval records are not shared. The overview explicitly preserves the current-approval-status check; it does not equate stateless evaluation with offline revocation knowledge.
- The JWS interoperability requirements and Actor Profile recommendation already existed on main (`4450201`) and in the profile's introduction commit (`f4003c6`). Neither is labelled a new restructure requirement. Document History and Catalog placement are unchanged.

Verification against `431b56f`: the Appendix X keyword-bearing unit comparison is empty; the aggregated total remains 398, with zero in Security Considerations. All source cross-reference targets resolve; examples and editor's notes are unchanged. The keyword-free definition, summary, and goal were checked against the existing denial-binding, shared-state, approval-verification, and lifetime rules. HTML and text rebuild successfully with 69 metadata/width warnings and no build or reference-fetch errors. The new table renders with three columns and two data rows, and the new term renders as a definition. HTML IDs are unique; specification links resolve, with only the pre-existing renderer `#copyright` boilerplate link unresolved. `git diff --check` passes. No commit or push performed for this stage.

## Not done here

The G20 force question and Context naming, G21, G22, and everything in register Part A. The profile-family proposal is a separate document, `PROFILE-FAMILY-PROPOSAL.md` (version 2, superseding the companion-split proposal after the feedback on issue #520), for the working group.
