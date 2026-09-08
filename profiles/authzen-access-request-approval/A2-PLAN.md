# PR A2 Plan: Wording Pass

Status: opened 2026-09-08 on branch `arap-restructure-a2`, stacked on `arap-restructure-a1`. A2 changes the wording of normative text and therefore does not claim to be script-verifiable. Every changed unit is reviewed by a person against `PASS0-INVENTORY.tsv`, which records each unit's actor, condition, obligation, and exceptions; the scripts in the plan's Appendix X run as evidence, not as pass or fail. Nothing in A2 may settle a question recorded in `PROTOCOL-GAPS.md`.

## Inputs

- `PASS0-INVENTORY.tsv`: the ten rows whose `a1_dest` differs from `dest` are A2's relocation work; the consolidation candidates deferred to A2 are listed in `PASS0-REPORT.md`.
- `PASS0-REPORT.md`: the reading-order items recorded during A1 execution and its two reviews.
- A scan of Part I for paragraphs that break the plan's prose rules: fourteen paragraphs exceed four sentences or carry more than two RFC 2119 keywords (listed in stage A2.3).
- The seven editor's notes and the Section 22 pointer list inserted by A1.

## Stages

Each stage is one commit and a review checkpoint.

### A2.1 Structural completions

Status: applied in the working tree on 2026-09-08 and corrected after two reviews; not committed, awaiting sign-off. Corrections from the second review: the core `denial` definition states both REQUIRED cases and the OPTIONAL case itself, and Section 14 keeps only the bundle coverage rule; the Section 10 verification sub-bullet carries an obligation verb again (one added MUST, so the keyword total is 409); the relocated `evaluation_id` verification rule names the Access Request Service; the three relocated bullets in Sections 11 and 13 are re-sentenced to stand in their new context; Section 11's introduction claims only what its rules support and cites where the remaining shared-state rules live; the forms permission sits after both definitions in Section 20 so the definition list renders whole, and the two self-references inside that section are removed; the `binding_token` definition points to both forms; the Section 7 transitions table cites Section 14 for `partial`. Build clean; no missing anchors; 408 keyword occurrences; the unit comparison against the committed A1 text lists exactly the reworded lead-ins (240, 344, 742, 785), the relocated units (243, 245, 347, 349, 656 as a sentence, 744, 788, 921 with its actor, 937), the two added citations (176, 641), and the reworded `items` sub-entry. Item 5 changed: the `partial` mapping row (709) stays in Appendix C and its inventory destination is corrected.

Complete the structure A1 could not, because doing so requires rewording a lead-in or a table row.

1. Create Section 11, Shared-State Deployments, after Core Conformance, holding verbatim the `evaluation_id` by-reference form (259), the both-forms paragraph (261), the lookup pattern (817), and the `evaluation_id` verification path (1096). Reword the three lead-ins they leave (256, 815, 1094) so each still states its complete rule and points to Section 11 for the alternative form.
2. Move the two bulk `denial` coverage bullets (359, 361) to Section 14 and reword the lead-in at 356 to cover the single-item case and point to Section 14.
3. Move the broadened-scope bullet (861) to Section 13 and reword the lead-in at 858.
4. Move the PDP forms permission (1080) to Section 20 with its actor made explicit.
5. Express the `partial` transition (table row 689) as a sentence in Section 14; the Section 7 table keeps its other rows. The `partial` mapping row (709) stays in the Appendix C table; its inventory destination is corrected to C, since the table is illustrative.
6. Remove the six-step list from the Introduction (the diagram replaces it) and give the sentence "This profile defines that protocol layer" its antecedent back.
7. Replace "below" in the request `items` definition with a citation and drop the pointer sentence A1 added for it. Give the status-mapping sentence in Section 7 a citation to its explanation in Appendix C.
8. Add citations at the first Part I uses of `client.actor` and `approval.state`, which are defined later.
9. Remove the Section 5 editor's note about Section 11, now resolved.

### A2.2 Security Considerations

Status: signed off by the editor on 2026-09-08 after two reviews and committed. Second-review corrections: the confused-deputy paragraph cites both denial-verification paths (signed token, and the `evaluation_id` path for shared state), names bundle item order, and moves its register reference into an editor's note in the document's convention; the binding-token paragraph points at the bulk and other integrity-protected forms rather than the hashed form; a bulk-bundle escalation paragraph is added for the two per-item rules in Section 14; the surfaces paragraph uses the cited section's injection framing for approval material; the task-handle paragraph names the separate cancellation authorization; the on-behalf paragraph and the availability paragraph cite the endpoint-protection rules; the denial paragraph names the two fail-closed rules; anchors added to Endpoint Protection and Denial Binding Alternatives. First-review corrections: the approval-reference paragraph preserves the by-value versus lookup distinction and cites the completion section for both, with the shared-state section cited only for the lookup pattern itself; the confused-deputy paragraph describes denial-binding verification (Subject, Resource, Action, Context), task binding (a service conformance rule, now anchored as `ars-processing-rules`), and the PDP scope check as three separate mitigations and says the requester and client identity comparison is an open register question; the approver-eligibility paragraph says an ineligible approval could violate policy unless local policy explicitly allows and records the exception. The section has four groupings matching the original (Decision and Binding Integrity; Policy and Approver Hygiene; Information Disclosure; Operational and Integration) and fourteen threat paragraphs, each drawn from the threat sentence that introduced the corresponding original subsection and each citing the section that now holds the mitigating rule. Five anchors were added to headings the paragraphs cite. The section contains no RFC 2119 keyword; the keyword total is unchanged at 409; the unit comparison against the A2.1 commit is empty; all cross-references resolve; build clean.

Replace the A1 pointer list with threat statements: one short paragraph per threat naming what an attacker could do and citing the section whose rules mitigate it. No RFC 2119 keyword in the section. Source material is the threat sentences that A1 carried with their rules and the current pointer list. Citation-only rule: every threat statement cites an existing rule and implies no check that no section mandates; a threat with no mitigating rule in the text is a register item, not a Security paragraph. The Section 22 editor's note is removed in this stage; the five register-linked editor's notes stay.

### A2.3 Part I prose and deferred consolidations

- Tighten the fourteen flagged paragraphs, identified by their opening words rather than line numbers, since A2.1 has already shifted lines: "For cross-vendor interoperability", "The `binding_token` member round-trips", "An autonomous PEP MUST verify that these URLs", "The Access Request Service SHOULD retain Idempotency-Key state", "The Access Request Service MUST authenticate the PEP", "When the `binding_token` carries its own expiry", "When a task is `pending`, a PEP MAY poll", "Profiles of this specification MAY define additional completion modes", "The `approval` object MAY additionally include a `state` member", "The `evaluation_id` of the original denied evaluation is denial-binding material", "The PDP MUST NOT authorize a re-evaluation solely", "When `approval.state` is carried by value as a JWS", "A PEP MUST drive its behavior from `next_action`", "A PEP MUST NOT treat an Approval Result as authorizing". Split into shorter paragraphs or numbered steps without changing actor, condition, obligation, or exception. The freshness procedure and the `next_action` rules are the two that most need it.
- Deferred consolidations, decided: 1131 into 1058, with the three citations at 860, 1180, 1181 reworded to point at Section 10 (this one needs the closest review, since it relocates a permission three citations depend on); the service sentences of 1258 into 921 and 931; the reason-code registry Description column pointing to Section 8; 1155 and 188 are left as they are, because 188 is conditional and 1155 is not.
- Section 4, decided: add the roles paragraph the plan intended (the three deployment shapes, currently in Terminology) and rename to the plan's title, Roles, Trust, and Keys.
- Apply the one-definition-list, one-sentence-per-member rule where a member's explanation has grown into a paragraph; move "why" sentences to Design Rationale.

### A2.4 Appendices and history

- Appendix B: a framing sentence for the moved scenario bullets and Design Goals.
- Appendix D: one new entry on why the signed form is presented first and shared state as the alternative.
- Document History entry for the restructure.
- Editor's notes: none is removed in A2.4. The register-linked notes stay until their items are resolved outside A2; the Section 22 note goes in A2.2.

## Acceptance for each stage

- A relocated bullet or table row is re-sentenced to stand in its new context, naming its actor; every subsection has a lead-in; a reader of the destination alone can tell what the unit governs. This rule was added after A2.1's first review found four relocated bullets standing as orphaned fragments.

- A reviewer reads every changed unit against its inventory row and confirms actor, condition, obligation, and exceptions are unchanged, or records the change as intended with a reason.
- The Appendix X scripts run as evidence: the unit comparison lists the changed units and nothing else; the anchor script reports no missing target; the aggregated counter's total is explained by the recorded changes; both profiles build clean.
- No text in A2 resolves a `PROTOCOL-GAPS.md` item. Where wording brushes one, the editor's note stays.

## Section numbering

Section 15 (Idempotency Extended Guidance) is dropped: Pass 0 found nothing for it and A2 adds nothing. Plan section codes remain as identifiers; the rendered document numbers sections consecutively, so plan code 16 onward renders one lower. Citations in the text use anchors and are unaffected.

## Out of scope

Protocol changes (PR B), the register's Part A items, and any new requirement. If a wording change would need one, it stops and goes to the register.
