# Pass 0 Report: Requirements Inventory

Status: Pass 0 signed off by the editor on 2026-09-07 after four review rounds. PR A1 commit 2 (verbatim relocation following `PASS0-SKELETON.md`) was executed in the working tree on 2026-09-07, corrected on 2026-09-08 after an independent review of the rendered result found five structural defects, re-reviewed independently (verbatim-relocation gate passed; one planned insertion found missing and then added), re-verified as described under "A1 execution" below, and approved by the editor on 2026-09-08. It is not committed. Files in this directory: `PASS0-INVENTORY.tsv` (instrument of record), `PASS0-ANCHORS.tsv` (anchor and citation map), `PASS0-EXPECTED-MOVES.tsv` (unit-level expectations for the A1 comparison script), `PASS0-SKELETON.md` (the target document's headings, levels, anchors, and the ordered units under each). All are working documents for PR A1 and are deleted when the restructure merges. Nothing in the specification has been changed. Counts are computed from the files.

## How it was built

The specification was split into seven slices. A script pre-populated every keyword-bearing unit (paragraph, list item, or definition-list entry containing an RFC 2119 keyword) with its exact line range: 250 units, including the abstract's MUST NOT at line 74. Seven reviewers filled actor, condition, obligation, exceptions, destination, disposition, and tag for each row, added rows for keyword-free normative units, applied the plan's Part I test and precedence rule, and reported collisions and consolidation candidates. A second reader ruled on those. Two independent reviews then audited the result: one sampled rows against the text and recomputed the expectations and anchor map; one dry-ran the relocation of two sections from the files alone. A fourth review read the target skeleton alone. All findings are recorded under Rounds 2 to 4 below and applied.

## Results

| Measure | Count |
|---|---|
| Rows | 466 |
| Keyword-bearing rows | 280 |
| Keyword-free rows (definitions, enumerations, procedure steps, tables, examples, narrative placement rows) | 186 |
| Multi-actor units (one unit, several rows, one destination) | 29 units, 60 rows |
| Disposition stay (A1 placement equals the plan's mapping of the current top-level section) | 331 |
| Disposition move | 135 |
| Consolidations performed in A1 | 0 |
| Rows whose A1 placement differs from final destination (list, table, and conformance-bullet rules, and Section 11 deferred to A2) | 10 |
| Final destinations: Part I (Sections 1 to 10) | 302 |
| Final destinations: Part II (11 to 20) | 98 |
| Final destinations: Part III (21 to 25) | 44 |
| Final destinations: appendices | 21 |
| Front matter (abstract) | 1 |
| Rows with A1 placement 22 or 11 | 0 (Section 22 holds a pointer list after A1; Section 11 is not created in A1) |
| Extractor units | 250, every one covered by a row, matched by line range |
| Expected A1 outcomes over those units | 33 unchanged heading, 137 stay in a renamed or remapped section, 80 relocate, 0 removed |
| Keyword occurrences | 409 before and after (the aggregated counter reports 408 because it starts at the first level-1 heading) |
| Anchors | 30 existing mapped, 6 new; 7 citation retargets; every anchor on exactly one of the skeleton's 83 headings |

Largest destinations: Section 6 (Submitting) 65 rows, Section 7 (Checking) 57, Section 8 (Approval and Re-evaluation) 53, Section 10 (Core Conformance) 44, Section 5 (Requestable Denial) 40.

## Consolidations

None in A1. Every candidate is deferred to A2 or rejected:

- **1131 into 1058** (actor preservation): sound on its own terms, but 860, 1180, and 1181 cite the Delegation section for the normalization permission that 1131 states, and after the merge that sentence would exist only in Section 10. Deferred to A2, where the citations can be reworded.
- **1104 with 1218** (approver eligibility): rejected. 1104 requires evaluation before treating the workflow as successfully completed; 1218 before returning `approved`. Different checkpoints. Both go to Section 10.
- **1258 with 921 and 931** (callback security): deferred to A2. The overlap is at sentence level; removing sentences from 1258 would leave a unit the comparison script reports as added.
- **1155 with 188**: rejected. 188 is conditional, 1155 is not.
- **Reason codes 842 to 846 with the registry table 1394 to 1398**: deferred to A2 as a wording decision.
- Restatements in the Processing Rules lists stay: Section 10 is a conformance summary by design.

A1 is therefore pure relocation. The plan's consolidation rule now says that removing some sentences of a unit is a wording change and belongs to A2.

## Rules added during Pass 0

**Lists.** A definition-list entry moves independently. A bulleted or numbered list whose lead-in depends on the complete set of items is one unit for A1 placement; A2 may split it by rewording the lead-in. The inventory carries `dest` and `a1_dest`. A check over all 32 colon-introduced lists found one violation (84 to 89, resolved to Appendix B) and cleared three where the lead-in stays true with fewer items (366, 1074, 1127). Four keyword-free lists in the non-normative appendices have no rows. The eight rows with differing placements: 259 and the two rows of 261 (A1 in 5, final 11), 359 and 361 (A1 in 6, final 14), 817 (A1 in 8, final 11), 861 (A1 in 8, final 13), 1096 (A1 in 10, final 11). Consequence: Section 11 is not created in A1 and takes shape in A2.

**Tags are unit-level.** The tag drives the Part I test, so all rows of a multi-actor unit carry the strongest tag present.

**Disposition is measured against one convention.** `stay` means the A1 placement equals the section the plan maps the unit's current top-level heading to; every row's `src_section` is that top-level heading.

**Front matter.** Destination code F covers the abstract, unchanged.

## Round 4 decisions (from a fresh review of the skeleton alone)

- **Forward dependencies fixed.** The structural-comparison definition at 1184 becomes a Section 5 subsection ahead of Denial Binding Claims, since 1180, 860, and 1096 use it before Section 6; the new anchor is `structural-comparison` and 1096 retargets there. The PEP-facing surfaces subsection (1236 to 1252) goes whole to Section 7, because the member lists at 1240 to 1242 and 1248 to 1250 are the antecedent of "these members" at 1244. The `display` and `links` definitions (538 to 546) stay in Section 6, because the Part I pending Task Handle example renders them; `progress` still goes to 18. Citations to `{{binding-token-integrity}}` are inserted after "these claims" at 1190 and "the binding claims" at 1186.
- **Headings reparented.** Status Mapping Obligation under Task Status Values; Unsupported Cancellation and Availability as their own Section 7 subsections; `emergency` under Emergency Access. Section 4 carries an A1 title matching its content. The 43 sub-headings of Sections 21 and 25 and Appendices A, C, D, and E are enumerated so they move with their body text.
- **Non-row text.** Rows added for Introduction lines 80, 82 (Section 1) and 91, 93 (Appendix B), which no preceding unit covered. Definition-list whitespace stays with the lead-in. Pointer lines are inserted at the four definition-list lead-ins whose sub-entries leave (`access_request`, `requested_access`, `client`, `task`), and a cross-reference line between the eligibility rules at 1104 and 1218.
- **Near-empty sections.** Section 11 is not created in A1; 261 stays in Section 5 for A1. Section 22 holds a pointer list, one line per relocated subsection, instead of a bare note.

## Round 3 decisions (from the independent audit and dry run)

- **1133 and 1262, the rule that a service MUST reject a submission whose actor chain cannot be verified, go to Section 6.** Round 1 sent them to Section 19 on the ground that 389 makes a non-supporting service safe. It does not: 389 and 1135 only forbid relying on unverified actor data and permit keeping it as audit metadata, so a service that ignores the chain and processes the submission would satisfy them and violate 1133. Tag core.
- **The `evaluation_id` stability rules at 298 to 304 stay in Section 5.** Lines 261 and 1082 cite the anchor for that content, and 261 says the recommendation is not conditioned on shared state.
- **1184 (structural comparison) goes to Section 6.** The note that had asked a second reader to decide is superseded; the report's earlier "zero undecided" claim was false while that note stood.
- **`overbroad-approval` goes to Section 10**, on the new subsection Policy and Approver Hygiene together with `approver-eligibility`. Its only row, 1214, goes there. No row anywhere has destination 22.
- **A seventh citation retarget**: 1130 cites the submission section for `client.actor`, whose definition moves to Section 19; a new anchor there receives it.
- **The 1270 pair is a multi-actor unit** (60 rows in 29 units, not 58).
- **The Examples note row** claimed 429 lines; it is now the heading line only.
- Notes fixed: `approver-eligibility` no longer describes a rejected consolidation; one note cited a superseded plan line; the fallback procedure at 839 is now described in full in its row.

## Round 2 decisions

1214 to Section 10 and 1270 to Section 7 by the Part I test over the Security row. The abstract's rule at 74 inventoried. Coverage verified by line-range matching. Expectations computed over extractor units before actor expansion.

## Round 1 decisions

256, 258, 263 stay in 5. 363 stays in 6. 389 and 1135 stay in 6. 1165, 1159, 822 stay whole in 8; 661 whole in 7. 1230 and the Trusting URLs subsection go to 5. 1252 and 1244 go whole to 7; the classification lists 1238 to 1250 go to 18. 617, 693, 744, 789 go to 18, 18, 17, 17. 1266 goes to 6. 1186 goes to 12.

## The target skeleton

`PASS0-SKELETON.md` names every heading of the A1 document (80 headings) with its level and anchor and lists the units under it in order, plus the A1 insertions (pointer lines, cross-references, the Section 22 pointer list). Cross-section arrivals have named subsections: Section 5 gains Structural Comparison (new anchor), Denial Binding Claims (carrying `binding-token-integrity`), and Trusting URLs; Section 6 gains Verifying the Denial Binding and Actor and Source Verification, and absorbs the two paragraphs of the current level-1 Access Request Endpoint heading; Section 7 gains Task Handle Authorization (carrying `authorization-and-authentication`, with Task Handle Leakage and PEP-Facing and End-Client-Facing Surfaces as children), Unsupported Cancellation, and Availability; Section 8 gains Decision and Binding Integrity; Section 10 gains Policy and Approver Hygiene (carrying `overbroad-approval`, with Approver Eligibility and Separation of Duties as a child carrying `approver-eligibility`); Section 19 gains Client Actor and Source (new anchor). Sections 11 and 15 are not created in A1. Every row is placed; the skeleton lists none as ungrouped.

## A1 execution

The relocation was generated by script from the inventory and the skeleton, not by hand: every line of the specification after `--- middle` was assigned to a skeleton heading, by its inventory row or by inheriting the destination of the nearest preceding unit in its source range, and emitted in skeleton order under the new headings. Source headings were dropped except the example walkthrough sub-headings, which stay under their examples. The seven citation retargets and the insertions listed in the skeleton were applied; every insertion is a keyword-free sentence.

Rules added during execution and its review:

- A table is one unit for A1 placement. The `partial` transition row (689) and mapping row (709), moved alone, rendered as headerless tables and failed the build; they stay with their tables in A1 and move in A2.
- A conformance-list bullet relocated alone loses the lead-in that names its actor. The PDP permission at 1080 stays in the PDP list for A1 and moves to Section 20 in A2. Ten rows now differ between A1 placement and final destination.
- An insertion inside a definition list is an indented paragraph preceded by a blank line, placed after the entry's nested items. An unindented pointer closes the rendered list and detaches the remaining members; an indented pointer without the blank line is absorbed into the preceding bullet's text and shows up as an altered unit. Both happened in the first execution and were caught by the reviewer and by the reconciliation respectively.
- An insertion after a conformance bullet goes after the end of the list, not between bullets.
- New sections are cited by anchor, never by the plan's section number, because Sections 11 and 15 do not exist in A1 and the rendered numbering differs from the plan's.
- Relocated members that share a name (`items` in the submission and `task.items` in the response) get subsections at their destination that restore the object context their lead-ins supplied.
- An insertion that belongs at the start of a section is keyed to the section heading, not to a source line: the Appendix A note had been keyed to a blank line, and blank lines inherit the destination of the preceding unit, so the note was silently dropped. The second independent review caught it.
- Insertion text is checked for RFC 2119 words before it is emitted: the first wording of the Appendix A note contained REQUIRED in capitals and registered as a 251st normative unit until reworded.

Verification of the result against the pre-relocation file:

| Check | Result |
|---|---|
| Extractor units, before and after | 250 and 250 |
| Units found verbatim in the new document (retargeted anchor names normalized), each in its predicted section | 250 of 250, in both the first execution and the corrected one |
| Units in the section the expectations file predicts | 250 of 250 |
| New units not accounted for | 0 |
| Anchors: cross-reference targets resolving | all; 0 missing |
| Keyword occurrences (aggregated counter) | 408 before, 408 after |
| Build: kramdown-rfc2629, xml2rfc HTML, xml2rfc text | clean, no errors |
| Catalog Profile build and the two headings it cites by name | clean; "Extensibility and Profiles" and "Naming Extensions" present |
| Line count | 1,960 before, 2,014 after (new headings, pointer lines, editor's notes) |
| Rendered lists | no literal list or definition markers inside paragraphs in the XML; the `requested_access`, `client`, and `items` definitions each hold their nested members and their pointer |
| Independent review of the rendered result (first) | five structural defects found and corrected (list interruption at 1104, detached members at 365 and 374, actor lost at 1080, indistinguishable `items` definitions, wrong section number in a pointer); wording found intact |
| Independent review of the rendered result (second, same brief) | verbatim-relocation gate passed: 250 units at their destinations, 435 inventory ranges checked, all twelve tokens unchanged, rendered nesting and tables and all seven retargets and fragment links correct, no added or removed requirement; the planned Appendix A editor's note was missing and has been added |

Known A2 items observed in the A1 result (from execution and from the second review): the status-mapping recommendation that moved to Section 7 should be reconnected with the explanation that stayed in Appendix C; the word "below" in the request `items` definition now points nowhere, and the added pointer already supplies the destination; the Introduction sentence "This profile defines that protocol layer" now follows the two opening paragraphs directly, because its antecedent (the motivation paragraphs) moved to Appendix B; the six-step list remains beside the diagram until A2 removes it.

Remaining for a reviewer before merge: read the A1 document once for reading order and heading text, since the scripts cannot see keyword-free prose placement, and confirm the Section 22 pointer list and the editor's notes read as intended.

## Corrections to the plan found by Pass 0

Applied in versions 10 to 13: the claim list runs to 1182; 1252 moves whole; only 259 and 261 of the two-form paragraphs are alternatives; the lookup and scope lists stay with their lead-ins in A1; the Part II row sourcing Section 18 from 1107 had no referent; 1266 goes to Section 6 and its heading 1264 dissolves; the reading guide names Sections 1 through 10; `binding-token-integrity` is retargeted at 1096; `access-request-response` goes to 6 with five citations retargeted; `authorization-and-authentication` goes to 7; code F added; 1214 to 10 and 1270 to 7; expected moves are unit-level; A1 performs no consolidation; the editor's note in Section 6 no longer says the replay rule sits there, since the `jti` claim is in Section 5; Section 22 is empty after A1; Section 6 becomes level 1; the inventory schema replaces the split-row disposition with a `multi_actor` column; structural comparison goes to Section 5; the PEP-facing surfaces subsection goes to Section 7; `display` and `links` stay in Section 6; Section 11 is not created in A1; Section 4 carries an A1 title.

## Findings for the register

- The headline `binding_token` example at 278 decodes to `evaluation_id` alone (added to G15).
- After relocation, Section 7 defines `partial` while its trigger goes to 14 and the diagram to 18; A1 adds a cross-reference.
- The SHOULD at 711 leaves Appendix C while 1845 cites the appendix (G19).
- 1904 in Design Rationale may point at a gap about re-presenting the submission endpoint under a different URL; recorded for the editor.
- The defining line for every Processing Rules bullet is in the inventory `note` column.

## Acceptance

Every one of the 250 extractor units is covered by a row, checked by line range. Every keyword-free item in the plan's Section 5 list has a row. Every anchor and citation target is in the anchor map with a destination, and every citation whose referent moves away from its anchor is listed for retargeting. Every list whose lead-in depends on its items has a common A1 placement, checked over all 32 lists. Every multi-actor unit has one tag and one A1 placement. No consolidation is performed in A1. Final validation reports zero empty or undecided cells and zero invalid destinations. The skeleton places every row and lists none as ungrouped; every anchor sits on exactly one of its headings.
