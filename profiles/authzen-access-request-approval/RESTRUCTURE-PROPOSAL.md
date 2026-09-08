# Restructure Plan: AuthZEN Access Request and Approval Profile

Version 15. Status: PR A1 commit 2 (verbatim relocation) was executed in the working tree, corrected after two independent reviews of the rendered result, re-verified, and approved by the editor on 2026-09-08; it is not yet committed. PR A2 (wording) is the next pass. Pass 0 was signed off by the editor on 2026-09-07 after four review rounds; see `PASS0-REPORT.md`, `PASS0-INVENTORY.tsv`, `PASS0-ANCHORS.tsv`, `PASS0-EXPECTED-MOVES.tsv`, and `PASS0-SKELETON.md` in this directory. Nothing in the specification has been changed.

Target file: `profiles/authzen-access-request-approval/authzen-access-request-approval-profile-1_0.md` on branch `arap-catalog-profile` (1,960 lines). Line references are to that file and were checked against it for this version. Protocol questions live in `PROTOCOL-GAPS.md`; nothing here resolves one.

## 0. What changed and why

**Version 15**, from an independent review of the rendered A1 result: insertions inside a definition list are indented paragraphs preceded by a blank line and placed after the entry's nested items; an insertion after a conformance bullet goes after the whole list; a conformance bullet relocated alone keeps its lead-in, so 1080 stays in the PDP list for A1; new sections are cited by anchor, never by plan section number, since the rendered numbering differs while Sections 11 and 15 are absent; Section 14 has subsections that restore the request and response context of the two `items` definitions. Three anchors were added for headings the pointer list cites.

**Version 14**, from executing PR A1 commit 2: a table is one unit for A1 placement, like a lead-in-dependent list, because a table row moved alone renders as a headerless table and fails the build; the `partial` transition row (689) and mapping row (709) therefore stay with their tables in A1 and move to Section 14 in A2, raising the A1-differs-from-final count to 9. All A1 insertions are keyword-free sentences so the comparison script does not see them. The comparison is run with the seven retargeted anchor names normalized back to their originals, since a retargeted citation changes a unit's text. Verification results are in `PASS0-REPORT.md`.

**Version 13**, from a fresh review of the target skeleton: the structural-comparison definition (1184) becomes a Section 5 subsection ahead of the claim list, with anchor `structural-comparison` and the 1096 citation retargeted there, because 1180, 860, and 1096 use it before Section 6; the PEP-facing surfaces subsection (1236 to 1252) goes whole to Section 7, since its member lists are the antecedent of 1244; the `display` and `links` definitions stay in Section 6, because the Part I pending example renders them; Section 11 is not created in A1 and its units stay in Section 5 until A2; Section 22 holds a pointer list rather than a bare note; Section 4 carries an A1 title matching its content; four pointer lines, one cross-reference, and two citations are the only A1 insertions besides editor's notes, and the skeleton lists them; sub-headings of sections that move whole are enumerated in the skeleton.

**Version 12**, from an independent audit and a dry run of the Pass 0 files: A1 performs no consolidation at all, since the one approved merge would have removed a sentence three citations depend on; 1133 and 1262 (reject an unverifiable actor chain) go to Section 6 by the Part I test; the `evaluation_id` stability rules stay in Section 5 because 261 and 1082 cite them; `overbroad-approval` goes to Section 10 with its only rule; a target skeleton (`PASS0-SKELETON.md`) now names every heading, level, anchor, and the order of units under it, which the earlier files lacked; Section 6 becomes a level-1 heading and absorbs the Access Request Endpoint parent; Section 22 is empty after A1 and carries an editor's note until A2; Section 15 is not created in A1; tags are unit-level; the inventory schema replaces the split-row disposition with a `multi_actor` column and measures disposition against the plan's map of each current top-level heading.

**Version 11**, from independent review of the Pass 0 inventory: 1214 goes to Section 10 and 1270 to Section 7, both by the Part I test over the Security row; the abstract's rule at 74 is inventoried under a new destination code F (front matter, unchanged); the 1104/1218 consolidation is rejected because the two rules name different checkpoints; the 1258 consolidation is deferred to A2 because a partial paragraph would register as an added unit; the scenario list at 84 to 89 shares one A1 placement; the A1 expectations file is computed over extractor units before actor expansion, with outcomes UNCHANGED, STAY-RENAMED, MOVED, REMOVED, and keyword totals separately; coverage is verified by matching every extractor unit to a row by line range.

**Version 10**, corrections found by Pass 0 under the rule that the text wins over the plan: the claim list runs to 1182; 1252 is one paragraph and moves whole to Section 7; 256, 258, and 263 stay in Section 5 and only 259 and 261 are shared-state alternatives; the Part II row sending part of 1107 to Section 18 had no referent and is removed; 1264 to 1266 goes to Section 6; the reading guide names Sections 1 through 10; a list-placement rule is added (Section 5) with an `a1_dest` column in the inventory, so that lists whose lead-in depends on all items stay whole in PR A1 and are split by rewording in PR A2; anchor overrides and citation retargets are recorded in Section 7 from `PASS0-ANCHORS.tsv`.


**Version 9**, from a fresh-eyes review that verified the heading map and dry-ran Pass 0 on one section: a precedence rule now decides conflicts between the plan's own tables (Section 4), with six known collisions resolved by name; the comparison script is section-aware, so a verbatim relocation is reported as a move between sections that must match an inventory row (Appendix X, Section 10); the "Either" list at 1179 to 1181 stays whole in Section 5 and the structural-comparison definition at 1184 goes to Section 6, correcting a range that had swept it into an optional section; the `act` and clock-skew consolidations are withdrawn because they merged different actors or stripped conditions on MUST-rejects; the `partial` definition stays in the status enumeration; the reading guide no longer calls Sections 12 to 20 "optional" without qualification, and obligations on implementations that do not support a feature move to Part I; the three editor's notes are reworded to take no position; the `aud` statement is corrected again to what the text says (a REQUIRED claim with a MUST-reject inside a list introduced by SHOULD at 1171); Pass 0's keyword-free list is extended and its size stated honestly.

**Version 8**: the example audit no longer claims the approval tokens lack expiry; the SHOULD at 711 stays normative.

**Version 7**: replaced a hand-written line map with a heading-level map and a Pass 0 that generates the line map; withdrew pre-decided deletions of 797, 929, 931, 143, 1873; split the work into a verbatim pull request and a wording pull request; gave every anchor an explicit home; withdrew the example fix.

## 1. Purpose and scope

Make the profile learnable from its first few sections without changing what it requires. A reader who finishes the Introduction and the four flow sections should hold the complete happy path: a signed requestable denial, a submission that echoes it, a Task Handle, and a re-evaluation carrying signed approval state. Everything else should be reachable from there rather than interleaved with it.

In scope: relocating text, removing verified restatements, adding cross-references and non-normative editor's notes, and, in a second pull request, tightening prose without changing meaning.

Out of scope: any change to what a MUST, SHOULD, or MAY requires; any change to example tokens; any resolution of a register item. The stop rule: an editor who finds that a move or merge would change meaning does not perform it, leaves the text where it is, and records the question in `PROTOCOL-GAPS.md`.

## 2. Diagnosis

| Measure | Current |
|---|---|
| Total words | 19,490 |
| Words in the four sections a reader must cross for the happy path (Requestable Denial Context, Access Request Submission, Access Request Response, Completion Semantics) | 5,703 |
| RFC 2119 keywords in those four sections (excluding OPTIONAL) | 135 |
| Completion Semantics alone | 2,476 words, 58 keywords including OPTIONAL |
| Binding Token Integrity, a normative claim list filed under Security | 1,297 words |
| RFC 2119 keywords in Security Considerations, all subsections aggregated | 53 |
| Words before the first JSON wire format (lines 78 to 224) | about 2,000 |
| Times the six-step flow is narrated before any JSON | 3 |

Four structural causes:

1. **Advanced material is interleaved into core sections.** Requestable Denial Context carries the two-topology binding discussion and JWS/JWE guidance. Access Request Submission carries bulk `items`, `client.actor` chains, `callback`, `emergency`, and idempotency mechanics. Access Request Response carries `progress`, per-item results, and aggregation. Completion Semantics carries `approval.state` verification, scope matching, structural comparison, and bulk re-evaluation.
2. **The trust model is scattered.** `binding_token` is defined at 240, its claims at 1167 to 1204 under Security, its verification steps at 1190 to 1196. `approval.state` is defined at 809, its key discovery at 824. The cross-vendor interoperability MUST for both artifacts is the last paragraph of a Security subsection at 1204. The `jwks_uri` anchoring both is at 202.
3. **Rules are restated or scattered.** Callback security is stated at 921, 929, 931 and restated at 1258. Re-evaluation reason codes are defined at 842 to 848 and again at 1394 to 1398. Bulk `partial` semantics are spread over 654, 689, 709, and 787 as different aspects of one feature. The `subject.properties.act` comparison exclusion is stated by the PDP's scope rule at 860 and by the service's binding rule at 1180, which are different rules with the same clause.
4. **Examples do not satisfy the text.** No example `binding_token` carries the `aud` claim that 1174 marks REQUIRED and that a conformant Access Request Service MUST reject the absence of. All five `approval.state` tokens omit the `iss` and `aud` that 824 makes MUST. The bulk token at 496 flattens items to strings against 1186. These are recorded as register item G15 and are not fixed by this plan.

## 3. Organizing principle and the Part I test

The PEP is a courier of two signed envelopes. On the way out, the PDP signs the denial as `binding_token` and the Access Request Service verifies it. On the way back, the Access Request Service (or the PDP acting through it, 824) signs the approval as `approval.state` and the PDP verifies it. Everything in the core follows from that. This is an editorial framing. The current text permits either envelope to be replaced by a reference in shared-state deployments (240, 256 to 264, 815 to 822), and the plan preserves that unchanged, presenting the signed form first and the shared-state form as the alternative in Section 11.

**Part I test.** Part I contains every rule an implementation of the single-item, signed-artifact, poll-for-completion flow needs. Two kinds of rule are distinguished. Support for a feature is optional and its mechanics live in Part II. An obligation that binds an implementation whether or not it supports the feature is mandatory and lives in Part I. Current examples: a PEP that receives `request_schema_url` and cannot supply the augmentations MUST NOT submit (1059); a PEP treats unknown task status values as not approved (1065) and unknown `result.mode` values as not approved (1067, also 797); a PEP MUST NOT expose `task.links.review` to an unauthorized caller (1252, second sentence); a PEP MUST preserve the Subject's principal identity and the Resource, Action, and relevant Context, and MUST NOT drop an actor identity (1058); a service MUST NOT rely on `client.actor` or `client.source` as authorization input unless independently verified (389); a service that does not support cancellation returns `405 Method Not Allowed` (in 769 to 790); implementations SHOULD document their status mapping (711). A rule goes to Part II only if a Part I implementation that never uses the feature, and obeys the Part I obligations when it meets the feature, is still correct and safe. Section 11 is the one exception: it is an alternative to two Part I mechanisms rather than an addition.

kramdown-rfc has no part construct. Parts are expressed by section order and a reading-guide paragraph. Flow-step section titles are verbs.

## 4. Target structure and heading-level map

**Precedence.** The tables below overlap, and Pass 0 will find more collisions than the six listed here. Resolve every collision in this order: (1) the text of the spec over anything in this plan; (2) the Part I test in Section 3 over any destination row; (3) a row that names a specific line, member, or rule over a row that names a whole section; (4) a unit never splits, and if two rows would split one unit it goes where rule 2 or rule 3 puts the unit as a whole; (5) a container heading whose children all move is removed only if it carries no anchor and no body text, otherwise it stays in place until PR A2.

**Collisions resolved by name.** 389 stays in Section 6 with the `client` member as a service obligation, and Section 19 cross-references it. The PEP-facing surfaces subsection (1236 to 1252) goes whole to Section 7 as a child of Task Handle Authorization, because its member lists are the antecedent of "these members" at 1244. Binding Token Integrity (1167) splits as its row below says, and the split row wins over the "moves whole" rule for Security subsections. The whole list item at 860 stays in Section 8; Section 13 receives 861 and 863; Section 6 cross-references 860 for the `act` clause rather than moving it. Cancellation (769 to 790) goes to Section 17 except 787, which goes to Section 14, and the `405` rule for services that do not support cancellation, which goes to Section 7. The Security subsection at 1153 to 1155 is a consolidation candidate (Section 6 of this plan); if not consolidated it moves to Section 1 with its heading dropped under rule 5.

The left column is every current heading with its line, taken from the heading map of the current file. The right column is the destination. Where a section's content splits, the split is described by member or rule name; Pass 0 assigns lines.

### Part I: Core Protocol

| Current heading (line) | Destination |
|---|---|
| Introduction (78) | 1. Introduction: opening paragraphs and the non-goals paragraph (104). Scenario bullets and the partial-evaluation paragraph go to Appendix B. The six-step list is removed in PR A2 once the diagram sits beside it. |
| Requirements Notation and Conventions (108) | 2. Unchanged. |
| Design Goals (114) | Appendix B. The stateless-model goal (119) is also quoted in 4. |
| Terminology (129) | 3. All six terms whole, including Authorization-Relevant Context with its full definition (148 to 156). |
| Protocol Overview (158) | 1. The diagram and the paragraph at 188. The portability paragraph (190) goes to 18; the events paragraph (192) goes to 16. |
| Discovery (194) | 4. Roles, Trust, and Keys. Whole, as currently defined. |
| Requestable Denial Context (225) | 5. Requestable Denial. The `access_request` members other than `form_url` and `request_schema_url`; the eligibility rules (227, 229); `context.reason` (254); the binding-material rules at 256, 258, and 263, which bind a signed-artifact PDP and stay; 259 and 261 are the shared-state alternatives (final destination 11; under the list rule 259 stays with its lead-in in A1). The Trusting URLs subsection (1226 to 1230) joins this section. `form_url` and `request_schema_url` definitions go to 20 with a one-line pointer here. |
| Evaluation Identifier (290) | 5 for the `evaluation_id` and `evaluated_at` definitions (294, 304); 11 for the stability, reuse, binding-window, and bridging rules. |
| Machine-Readable Forms (306) | 20. |
| Access Request Endpoint (323) and Access Request Submission (329) | 6. Submitting the Access Request. Single-item members, the `client` member with 389, the `denial` echo table, the submission rules (411 to 421), the single-item example. `items` and bulk denial coverage go to 14; `callback` to 16; the `client.actor` and `client.source` definitions to 19; `emergency` (369) to 19; the bulk example to 14. |
| Access Request Response (502) | 6 for the Task Handle core members, the `result` member (512), and the `display` and `links` definitions (538 to 546), which the Part I pending example renders; 18 for `progress`; 14 for `items` and aggregation. |
| Task Status Endpoint (611), Task Status Values (632), Pending Task Response (713), Completed Task Response (733) | 7. Checking the Task. The whole status enumeration stays, including the `partial` entry at 654; the `partial` transitions (689 to 691) go to 14. |
| State Transitions (659) | 7 for the transition table and the terminal-state sentence; 18 for the narrative and diagram. |
| Mapping Backend States (695) | Appendix C for the illustrative table and its explanation (695 to 709). The SHOULD at 711 goes to 7. |
| Cancellation (769) | 17, except 787 to 14 and the `405` rule for non-supporting services to 7. |
| Completion Semantics (791) | 8. Approval and Re-evaluation. The lookup bullet at 817 has final destination 11 and the broadened-scope bullet at 861 final destination 13, but both stay with their lead-ins in A1 under the list rule; 863 goes to 13. 822 and 1165 are single paragraphs and stay whole in 8. Bulk per-item rules (801, 854) go to 14. Everything else stays, including 797 whole and 852. |
| Callback Completion (914) | 16. |
| Error Responses (955) | 9. Unchanged content. |
| PEP Processing Rules (1051), PDP Processing Rules (1072), Access Request Service Processing Rules (1088) | 10. Core Conformance for rules whose defining section is in Part I; each other rule goes to the conformance list of the Part II section that defines its feature. The Pass 0 inventory records the destination of every bullet. |
| Authorization and Authentication (1107) | 4 for endpoint protection (1109 to 1111); 7 for Task Handle operation authorization (1113 to 1119). The anchor goes to 7 with the majority of its own rows. |
| Binding Token Integrity (1167), from Security | 5 for the claim list whole, 1169 to 1182, including the "Either" list with both its inline and hashed bullets and the `evaluation_id` claim at 1182, at its current force (introduced by SHOULD at 1171, with `aud` marked REQUIRED and a MUST-reject at 1174); 5 for the structural-comparison definition (1184), as its own subsection ahead of the claim list, with anchor `structural-comparison`; 6 for the verification steps and freshness rules (1190 to 1198); 12 for bulk binding (1186), deployment claims and JWE (1188), other formats (1200), polyglot (1202); 4 for the interoperability baseline (1204). The anchor `{#binding-token-integrity}` goes on the Section 5 subsection heading that holds the claim list; the citation at 1096, which refers to the structural comparison, is retargeted to `structural-comparison` in Section 5. |

### Part II: Alternatives and Extended Features

| Current heading (line) | Destination |
|---|---|
| (from 225, 791, 1088) | 11. Shared-State Deployments. Not created in A1: its units (259, 261, 817, 1096) stay with their lead-ins in Part I under the list rule and move in A2. |
| (from 1167) | 12. Denial Binding Alternatives. |
| (from 791: 861, 863) | 13. Approval Scope Extensions. |
| (from 329, 502, 659, 769, 791) | 14. Bulk Submissions. |
| (from 329) | 15. Idempotency Extended Guidance. Pass 0 found nothing that belongs here rather than in 6; 1266 goes to 6 and its heading at 1264 dissolves under rule 5. The section is not created in A1. |
| Callback Completion (914), Callback Security (1256) | 16. Callback Completion. |
| Cancellation (769) | 17. Cancellation. |
| (from 158, 502, 611, 659) | 18. Task Lifecycle Details: portability (190), `progress` (527 to 533), 617, and the state-transition narrative and diagram. The PEP-facing surfaces subsection (1236 to 1252) goes whole to 7. |
| Delegation and On-Behalf-Of (1121), Emergency Access (1220), PEP Acting on Behalf of the Subject (1260), and the `client.actor`, `client.source`, `emergency` definitions from 329 | 19. Delegation and Acting Parties. |
| Machine-Readable Forms (306) and the `form_url`, `request_schema_url` definitions from 225 | 20. Machine-Readable Forms. The rule at 1059 stays in Part I. |

### Part III: Framework

| Current heading (line) | Destination |
|---|---|
| Extensibility and Profiles (996) with its four subsections | 21. Unchanged. Title preserved exactly; the Catalog Profile cites it. |
| Security Considerations (1149) and every subsection | 22. In PR A1 every subsection moves whole to the section that holds the rule it states (the Binding Token Integrity row above is the one split), and 22 holds a pointer list, one line per relocated subsection, as its only content. In PR A2, 22 is rewritten as threat statements pointing to normative sections. |
| Privacy Considerations (1141) | 23. Unchanged. |
| IANA Considerations (1272) | 24. Unchanged, own section and anchor. |
| OpenID Foundation Registry Considerations (1276) with four subsections | 25. Unchanged, own section and anchor. In PR A2 the Re-evaluation Denial Reason table lists names and points to 8. |

### Appendices

| Current heading (line) | Destination |
|---|---|
| Examples (1404) and both walkthroughs | A. Unchanged content plus the non-normative note from Section 8 of this plan. |
| Introduction scenario bullets, Design Goals (114) | B. Motivation and Use Cases. |
| Implementation Considerations (1833) and the illustrative part of Mapping Backend States (695 to 709) | C. Implementation Considerations. This appendix is declared non-normative at 1835 yet carries SHOULDs at 1855 to 1861 that normative conditions at 240, 400, and 1097 depend on; that pre-existing inconsistency is register item G19 and is not resolved by relocation. |
| Design Rationale (1886) | D. Plus one new entry in PR A2 on why the signed form is presented first. |
| Acknowledgements (1951), Document History (1955) | E. With a history entry. |

**Reading guide** (placed at the end of Section 1): "Sections 1 through 10 define the core protocol using signed denial binding and signed approval state, together with every obligation that binds an implementation whether or not it supports an optional feature. Section 11 defines the shared-state alternative to the two signing mechanisms. Sections 12 through 20 define the mechanics of features an implementation MAY omit. Sections 21 through 25 define extensibility, security and privacy considerations, and registries. The appendices are non-normative."

## 5. Pass 0: the requirements inventory produces the line map

Pass 0 is the first commit of PR A1 and the instrument of record for everything after it. It is a table beside the spec with one row per normative requirement, and it is what a reviewer reads to approve a relocation. A dry run on Completion Semantics (791 to 913) produced 48 rows from 28 keyword-bearing units; the whole document is on the order of 500 rows and several working days of directed reading, built section by section with a review checkpoint after each.

Columns: stable ID (`REQ-001` onward), slice id, source top-level section, source lines, kind, actor, condition, obligation, exceptions, `dest` (final destination), `a1_dest` (A1 placement), disposition (stay when `a1_dest` equals the section this plan maps the current top-level heading to, otherwise move), `multi_actor` (yes when several rows share one unit), tag (unit-level), note, text. A1 performs no consolidation, so no consolidation column is needed; candidates are recorded in `PASS0-REPORT.md` for A2.

Rows are created for:
- every unit the comparison script in Appendix X extracts (a paragraph, list item, or definition-list entry containing an RFC 2119 keyword), which the script can pre-populate;
- every keyword-free unit in a normative section that defines a term, value, pattern, default, or procedure. At minimum: the structural comparison definition (1184), the numbered verification steps (1190 to 1196), the status enumeration (634 to 657), the problem-type definitions (955 to 995), the reason-code list (842 to 848), the state-transition table (661 to 688), the approval-scope definition and default (858, 865), the two approval-reference patterns (815 to 818), the completion-mode and input-attribute statements (793, 795), and every JSON member definition whose body begins with a type rather than a keyword;
- every heading anchor and every cross-reference target (Section 7).

Rules Pass 0 applies:
- A definition-list entry, list item, or numbered step is one unit and moves whole. Its type, default, and exceptions travel with it.
- A definition-list entry moves independently of its siblings. A bulleted or numbered list introduced by a lead-in whose meaning depends on the complete set of items (alternatives, cases, enumerations) stays whole with its lead-in in PR A1, and so does a table; PR A2 may split either by rewording. A conformance-list bullet relocated alone loses the lead-in that names its actor and therefore stays in its list for A1 unless the destination has a matching lead-in.
- An A1 insertion is a keyword-free sentence. Inside a definition list it is an indented paragraph preceded by a blank line, placed after the entry's nested items; after a bulleted list it goes after the whole list. Insertions cite by anchor, never by section number. The inventory records both placements: `dest` is the final destination, `a1_dest` the A1 placement. Conformance-list bullets split freely because each is self-contained.
- A unit that binds two actors has one row per actor; the rows share the unit, one destination, and one tag (the strongest present). If the rows' destinations would differ, the unit stays in Part I.
- An obligation that binds an implementation whether or not it supports a feature (Section 3) is tagged as such and goes to Part I regardless of which feature it names.
- Two rows may be marked consolidate only when a reviewer, not the script, confirms they impose the same obligation on the same actor under the same condition with the same exceptions, and only when the whole unit being removed is a restatement. A consolidation that would remove some sentences of a unit and keep others is a wording change and belongs to PR A2. Otherwise both stay and the pair is cross-referenced.
- Where the plan and the text disagree, the text wins and the plan is corrected in the same commit.

Destination code F denotes the abstract and front matter, which are outside the section map and unchanged.

Acceptance for Pass 0: every unit the script extracts is covered by a row, matched by line range rather than by counting populated cells; every row in the keyword-free list above exists; every anchor and cross-reference target has a row in the anchor map; every collision found is resolved by the precedence rule and recorded; a second person has read the consolidation rows and initialled each.

## 6. Consolidation candidates

These are candidates only. None is removed unless Pass 0 confirms identical meaning. Pass 0 outcome: no consolidation is performed in A1. 1155/188 and 1104/1218 are rejected as not identical; 1131/1058, 1258 with 921 and 931, and the reason-code table are deferred to A2 as wording changes (the 1131 merge would remove a sentence that 860, 1180, and 1181 cite). See `PASS0-REPORT.md`.

| Candidate set | Status after review |
|---|---|
| 1155 and 188 (denial is not access) | 188 is conditioned on "only the presence of `context.access_request`"; 1155 is unconditional and stronger. Keep 1155 as canonical only if the reviewer agrees 188 is implied; otherwise keep both. |
| 1258 against 921 and 931 (callback destination validation and authentication) | 1258 restates 921 and 931. It touches 929, the payload rule, only glancingly; 929 is not part of the set. Only 1258 is a candidate. |
| 1218 and 1104 (approver eligibility) | 1218 carries an exception clause 1104 lacks. If consolidated, 1218's wording survives. 1873 is a pointer and stays. |
| 1394 to 1398 and 842 to 848 (reason codes) | The registry table may list names and point to 8; the definitions stay in 8. Consolidation of the descriptive column only. |

Withdrawn from earlier versions, with reasons: 860 and 1180 share the `act` clause but are different rules for different actors (PDP scope matching, service binding comparison) and are cross-referenced, not merged; 240, 400, and 1097 carry "after applying any clock-skew tolerance" as a condition on a MUST-reject and are not consolidated into a sentence that would strip it; 1234 and 1063 bind different actors; 1099 and 1159 name different actors and tuples; 654, 689, 709, and 787 are aspects of one feature and only the last three move.

## 7. Anchors and cross-references

Every one of the thirty existing heading anchors is kept. An anchor is placed on the heading of the section that, after relocation, holds the rule the anchor names; where a current section's content is split, the anchor follows the majority of its normative rows, and the Pass 0 anchor map records the choice. Every one of the twenty-nine cross-reference targets currently used must resolve after PR A1 to a section containing the rows it cited before.

`PASS0-ANCHORS.tsv` records the decision for all thirty anchors, three new anchors (`structural-comparison` in Section 5, `section-14-bulk`, `section-19-client-actor`), and seven citation retargets (655, 689, 691, 787, 801 to the Section 14 anchor; 1096 to `structural-comparison`; 1130 to the Section 19 anchor). `PASS0-SKELETON.md` names the heading each anchor sits on. Anchors whose current section dissolves and therefore need an explicit home: `binding-token-integrity` (cited four times) on the Section 5 subsection holding the claim list; `approver-eligibility` on the Section 10 list or the subsection holding 1218; `task-handle-leakage` on the Section 7 subsection holding 1234; `overbroad-approval` on its Security subsection heading; `status-mapping` on the Appendix C subsection; `state-transitions` on the Section 7 subsection holding the table; `completed-task-response` and `task-status` on the Section 7 subsections holding those definitions; `evaluation-identifier` on a Section 5 subsection. Pass 0 confirms the remaining twenty-one map to sections that move whole.

## 8. Editor's notes inserted by PR A1

Each is one non-normative sentence, marked as an editor's note, pointing to a register item and asserting nothing about the text it annotates.

- Section 3, after the Authorization-Relevant Context definition: the membership of the machinery list at 149 is the subject of `PROTOCOL-GAPS.md` G8.
- Section 4, after the metadata definitions: identifier values for `iss` and `aud` and key-to-issuer association are the subject of G4.
- Section 6, after the relocated idempotency and freshness rules: the precedence among these rules and the `jti` replay check (the `jti` claim itself is in Section 5) is the subject of G5, and the relationship between the freshness sentences at 1196 and 1198 is the subject of G10.
- Section 22, as its only content in A1: a pointer list, one line per relocated subsection and its destination (listed in `PASS0-SKELETON.md`); PR A2 writes threat statements here.
- Section 5, after 261: the shared-state alternative (Section 11) is created in PR A2, when the lists at 256, 815, 858, and 1094 are split by rewording their lead-ins.

A1 also inserts, as cross-references only: pointer lines at the four definition-list lead-ins whose sub-entries leave (`access_request`, `requested_access`, `client`, `task`); a cross-reference between the eligibility rules at 1104 and 1218; `{{binding-token-integrity}}` after "these claims" at 1190 and "the binding claims" at 1186; and cross-references from the `partial` definition to Section 14 and from Actor and Source Verification to the Section 19 definitions. `PASS0-SKELETON.md` lists them.
- Section 8, after 850: how a PDP without shared state performs this check is the subject of G3; the requester and client binding at 826 is the subject of G6; the relationship between artifact expiry and `approved_until` is the subject of G9.
- Appendix A, before the first example: the example tokens do not carry the `aud` claim marked REQUIRED at 1174 or the item objects required at 1186; see G15.

## 9. Examples

PR A makes no change to any example token. Adding `iss` and `aud` requires identifier values that G4 has not defined; the bulk token at 496 needs a shape G1 has not settled; and three of the five `approval.state` tokens carry no `exp` of their own while the two that do expire before their `approved_until` (G9). Partial fixes declared correct are worse than unfixed examples with a note.

## 10. Execution

**PR A1: inventory and verbatim relocation.**
- Commit 1: Pass 0 (Section 5), section by section, with a review checkpoint before any text moves.
- Commit 2: relocation, following `PASS0-SKELETON.md` heading by heading. Every unit moves intact; nothing is removed. Section 6 becomes a level-1 heading absorbing the Access Request Endpoint parent; Sections 11 and 15 are not created; Section 22 holds its pointer list; the A1 insertions listed in the skeleton are made. Editor's notes (Section 8) are inserted. Anchors are placed per `PASS0-ANCHORS.tsv` and the seven listed citations retargeted. Both this document and the Catalog Profile are built.
- Acceptance: the section-aware comparison script in Appendix X, run old against new, run with the seven retargeted anchor names normalized to their originals, reports exactly the lines predicted in `PASS0-EXPECTED-MOVES.tsv`: a unit that stays in a renamed section and a unit that relocates both appear as MOVED and are distinguished by the expectations file; no REMOVED and no ADDED unit appears; each report is confirmed by a person because the script is sensitive to paragraph boundaries. Every keyword-free row is located by a reviewer at its destination. The anchor script reports no missing target and every target's section contains the rows it cited. The aggregated counter's per-section totals move by exactly the amounts the inventory predicts. Builds are clean.

**PR A2: wording.** Stacked on A1. Applies the Part I prose rules (one definition list per object, one sentence per member, no paragraph over four sentences outside numbered lists, one example per flow section), rewrites Section 22 to threat statements pointing at normative sections, removes container headings left empty by A1, assembles Appendices B through D, removes the six-step list from the Introduction, and adds the history entry. This pull request changes the wording of normative sentences and therefore does not claim to be script-verifiable.
- Acceptance: a reviewer walks every inventory row whose text changed and confirms actor, condition, obligation, and exceptions are preserved; the aggregated counter reports zero keywords in Section 22 including all subsections; the comparison script's output is read as a list of rows to check rather than as pass or fail; builds are clean.

## 11. Risks

- **Companion documents cite section titles.** The Catalog Profile cites "Extensibility and Profiles" and "Naming Extensions"; both are preserved. The Access Request OAuth Profile has a mapping section that names ARAP concepts; check it after A1.
- **Section numbers change.** Both companions cite by name. Any external document citing by number breaks.
- **Adjacent overlapping rules become visible.** Placing the idempotency, replay, and freshness rules side by side exposes their undefined precedence. Intended; the editor's note says so.
- **Pass 0 is the long pole.** Roughly 500 rows and several working days. It cannot be shortcut, and this plan is not executable without it.
- **Pass 0 will find collisions this plan does not list.** The precedence rule exists for that reason; each resolution is recorded in the inventory.

## 12. Open editorial decisions

- **D2.** Keep Shared-State Deployments (11) in the base. Recommendation: keep.
- **D3.** Keep Machine-Readable Forms (20) in the base or move it to a companion. Recommendation: keep for now.
- **D4.** Keep Bulk Submissions (14) in the base. Recommendation: keep.
- **D5.** Prefix section titles with part labels. Recommendation: no.

## Appendix X. Verification scripts and their limits

The scripts are evidence for a reviewer, not proof. They cannot judge whether a relocated rule kept its conditions and exceptions; the Pass 0 inventory and a person do that. What they can do is report every keyword-bearing unit that moved, disappeared, or appeared, with its source and destination top-level section; list every example token with its signer and claims; count keywords by top-level section; and check that every cross-reference has an anchor.

Known limits, found by testing: the comparison cannot see keyword-free normative text (deleting the structural-comparison definition at 1184 or gutting a problem-type definition at 965 produces no output); it is sensitive to paragraph boundaries, so a relocation that lands a paragraph directly after a non-blank line can merge two units and produce a false report; a multi-paragraph list item is split into several units. All scripts use the same keyword set, including OPTIONAL. On the current file the aggregated counter reports 53 for Security Considerations and 408 in total; the extractor counts 409 because it also sees the abstract's MUST NOT at line 74, which the counter, starting at the first level-1 heading, does not.

**Section-aware normative-unit comparison.** Tested: self-comparison is empty; moving one rule verbatim into another top-level section reports one MOVED line naming both sections; deleting one restated rule reports one REMOVED line.

```python
import re, sys, collections
KW = re.compile(r'\b(MUST NOT|MUST|SHOULD NOT|SHOULD|MAY|REQUIRED|RECOMMENDED|OPTIONAL)\b')
ITEM = re.compile(r'^\s*([*\-]|\d+\.)\s')
TERM = re.compile(r'^(`[^`]+`|[A-Z][^:`]{0,60}):\s*$')
def units(path):
    text = re.sub(r'~~~.*?~~~', '', open(path).read(), flags=re.S)
    out, cur, sec = collections.Counter(), [], '(front matter)'
    def flush():
        if cur:
            u = ' '.join(' '.join(cur).split())
            if KW.search(u): out[(sec, u)] += 1
        cur.clear()
    for line in text.split('\n'):
        m = re.match(r'^# (.*)', line)
        if m:
            flush(); sec = re.sub(r'\s*\{#.*\}', '', m.group(1)); continue
        if not line.strip() or line.startswith('#'):
            flush(); continue
        if ITEM.match(line) or TERM.match(line):
            flush(); cur.append(line)
        elif line.startswith(':') or line.startswith(('  ', '\t')):
            cur.append(line)
        elif cur and not (ITEM.match(cur[0]) or TERM.match(cur[0])):
            cur.append(line)
        else:
            flush(); cur.append(line)
    flush()
    return out
old, new = units(sys.argv[1]), units(sys.argv[2])
gone, came = old - new, new - old
by_text = collections.defaultdict(lambda: ([], []))
for (s, u), n in gone.items(): by_text[u][0].append(f'{s} x{n}')
for (s, u), n in came.items(): by_text[u][1].append(f'{s} x{n}')
for u, (g, c) in sorted(by_text.items()):
    tag = 'MOVED  ' if g and c else ('REMOVED' if g else 'ADDED  ')
    print(f'{tag} {u[:110]!r}  {g} -> {c}')
```

**JWS example listing.**

```python
import re, base64, json, sys
s = open(sys.argv[1]).read()
def dec(x):
    try: return json.loads(base64.urlsafe_b64decode(x + '=' * (-len(x) % 4)))
    except Exception: return None
for m in re.finditer(r'eyJ[\w-]+\.[\w-]+\.[\w-]+', s):
    h, p = (dec(x) for x in m.group(0).split('.')[:2])
    line = s.count('\n', 0, m.start()) + 1
    print(line, (h or {}).get('kid'), sorted(p.keys()) if p else 'undecodable payload')
```

**Aggregated keyword count by top-level section.**

```python
import re, sys
KW = re.compile(r'\b(MUST NOT|MUST|SHOULD NOT|SHOULD|MAY|REQUIRED|RECOMMENDED|OPTIONAL)\b')
top, agg = None, {}
for l in open(sys.argv[1]):
    m = re.match(r'^(#{1,3}) (.*)', l)
    if m:
        if len(m.group(1)) == 1:
            top = re.sub(r'\s*\{#.*\}', '', m.group(2)); agg.setdefault(top, 0)
        continue
    if top: agg[top] += len(KW.findall(l))
for h, n in agg.items(): print(f'{n:4d}  {h}')
print(f'{sum(agg.values()):4d}  (total)')
```

**Anchor and cross-reference check.** After A1, every target must appear in the anchor list.

```python
import re, sys, collections
s = open(sys.argv[1]).read()
anchors = set(re.findall(r'^#{1,3} .*\{#([^}]+)\}', s, flags=re.M))
refs = collections.Counter(re.findall(r'\{\{([a-z][a-z0-9-]*)\}\}', s))
for r, n in sorted(refs.items()):
    print(('ok      ' if r in anchors else 'MISSING ') + f'{n:3d}  {r}')
```
