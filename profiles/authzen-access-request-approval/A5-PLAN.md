# PR A5 Plan: One Normative Home per Rule

Version 3, 2026-09-18. Status: applied in the working tree on be59012 as one change (the four-commit split was not used), independently audited, corrected after the audit, awaiting the editor's review; not committed. Target: `authzen-access-request-approval-profile-1_0.md` on branch `arap-restructure` at be59012. Line numbers are to that file.

## Purpose

After A4 the document reads in order, but a PEP implementer still hunts: the PEP's own rules are about 90 keywords in 75 sentences spread over 40 headings and 9,000 words, most rules are stated two or three times at different strengths, and backend processing sits inside the PEP's exchange with nothing in the heading saying whose rule it is. An independent PEP-implementer read produced a 25-step design doc with nine guesses. A5 gives every rule one normative home and makes the heading say who it binds. It removes duplicates, not requirements: every removed sentence has a surviving sentence with the same actor, condition, obligation, and exceptions, listed in a duplicate register the execution generates and the audit checks.

## Principle

- **Flow sections define messages.** Requestable Denial, Submitting, Checking the Task, Approval and Re-evaluation keep the endpoints, the member definitions, and the examples. A member definition is name, presence, type, and one descriptive sentence. Obligations leave the definitions.
- **Role sections hold the rules.** Three sections in flow order, PEP Processing, PDP Processing, Access Request Service Processing, each a normative section, not a conformance summary. The current Core Conformance lists are the seed; the rules now scattered in the flow sections and in the member definitions move into them. A sentence that binds two roles goes to the section of the role that acts, with a pointer from the other.
- **Presence rules are written for the party that decides.** The PEP's rule for every echoed member is one sentence: echo it unchanged when the PDP supplied it. The backend's conditions (which form is required in which topology) stay in the PDP and service sections in their current words.
- **A table never restates prose.** The prose is normative; a table survives only where it is the clearest rendering and the prose it replaced is removed.

## Target layout

Part I.
1. Introduction; Protocol Overview.
2. Requirements Notation.
3. Terminology.
4. Roles and Binding: Roles; Binding Model; PDP Metadata (the `access_request_endpoint` definition only; the PDP rules at 196 and 216 move to PDP Processing); Endpoint Protection (the rules at 220 to 222 move to Access Request Service Processing; the section keeps the protected-API statement).
5. Requestable Denial: the `access_request` members (232 to 254) cut to name, presence, type, one sentence, with the `binding_token` bullets (247 to 250) moving to PEP Processing; the `context.reason` sentence (256); the example; Evaluation Identifier reduced to the definition (282 to 286) with the PDP rules (288 to 296) moving to PDP Processing; Trusting URLs (298 to 305) moves whole to PEP Processing; Denial Issuance (307 to 311) moves whole to PDP Processing; Denial Binding by Reference (313 to 317) moves whole to Access Request Service Processing.
6. Submitting the Access Request: endpoint and method (321 to 329); Request Body members cut to one sentence each, with the `context` bullets (348 to 352) and the preservation and schema rules (355 to 359) moving to PEP Processing; the `denial` object members cut to one sentence each, the source table (365 to 372) removed as a restatement of the definitions; the example; Access Request Response with the synchronous-completion rule (440 to 442) split: the service SHOULD to Access Request Service Processing, the PEP MUST to PEP Processing; Submission Processing (446 to 460) and Idempotency (462 to 474) move whole to Access Request Service Processing, except the PEP SHOULD at 329 which is already a PEP rule and moves to PEP Processing.
7. Checking the Task: Task Handle members cut to one sentence each (the `id` entropy rule to Access Request Service Processing; the intermediate-enforcer MAY to PEP Processing); Task Status and Transitions with State Transitions merged as one list, Status Mapping Obligation to Access Request Service Processing; Task Status Endpoint keeps the request and response shape, the polling rules (578 to 584) move to PEP Processing; Pending Task Response; Completed Task Response with its rules (612 to 616) split by role; Completion Handling for PEPs (641 to 651) removed as a restatement; Task Handle Authorization, Leakage, and the surfaces section (653 to 691) move whole to Access Request Service Processing and PEP Processing by actor; Portability (667 to 673) to PEP Processing; Availability split by role.
8. Approval and Re-evaluation: completion mode (699 to 709) with its PEP MUST (707) to PEP Processing and its profile rules kept; Approval Result members cut to one sentence each, the PEP rules (716, 719 to 721) to PEP Processing; Re-evaluation Request (725 to 727) split by role; Re-evaluation Denials (731 to 754) stays as the definition of `next_action`, `retry_after`, and `reason`, with the PEP handling bullets (740 to 746) moving to PEP Processing, the Decision Table (756 to 766) kept beside them there and the restatement paragraph (766) removed; Approval Lifetime (770 to 774) to PEP Processing; Deadline Reference (776 to 786) removed as a restatement; Time and Clock Skew (788 to 794) stays as a shared subsection; Approval Reuse (798 to 804) to PEP Processing; the example; Approval Verification, Lookup, Current Status, Scope (850 to 890) move whole to PDP Processing.
9. Error Responses.
10. Binding Integrity, unchanged.
11. PEP Processing, in flow order, absorbing the units above and the current PEP Processing Rules (976 to 1012), which are deduplicated against them: Recognize the denial; Check the URLs; Construct the submission; Submit and retry; Handle the Task Handle; Poll; Handle completion; Re-evaluate; Handle a re-evaluation denial; Enforce and reuse; Surfaces and forwarding.
12. PDP Processing, absorbing 288 to 296, 307 to 311, 850 to 890, and the current PDP rules (1014 to 1034), deduplicated.
13. Access Request Service Processing, absorbing 220 to 222, 313 to 317, 446 to 474, 653 to 665, and the current service rules (1036 to 1070), deduplicated; Policy and Approver Hygiene stays here.
14. Binding Artifacts, with its four examples (1196 to 1257, 1279 to 1348) moving to the appendix and its lead-in (1074 to 1076) reworded to name the roles it binds.
15. Cancellation, Delegation, Machine-Readable Forms, Additional Request Members: each keeps its member definitions; its PEP rules (for example 1354 to 1368 and the PEP sentences of Machine-Readable Forms) are cited from PEP Processing by one bullet each rather than duplicated, so a PEP reading Section 11 sees the pointer.
Then Extensibility, Security Considerations with retargeted citations, Privacy, IANA, registries, Appendices: Examples deduplicated (the Manager Approval walkthrough and the Trusted-State walkthrough differ only by `binding_token` and `state`; keep Trusted-State whole and reduce Manager Approval to the three exchanges that differ; drop the body examples that repeat appendix ones), Motivation, Implementation Considerations, Design Rationale, Acknowledgements, Document History.

## Enumerated rewordings

1. `approved` status entry (523): "Approval does not by itself grant access unless accompanied by a result that can be enforced under {{completion-semantics}}" becomes "Approval does not by itself grant access; the PEP obtains access only through the completion mode in {{completion-semantics}}". Keyword-free.
2. "Default next action" (742, 763 versus 1673): the registry column description says the value is the PEP's fallback when `next_action` is absent or unrecognized, matching Section 8. Keyword-free.
3. `expires_at` definition (235): the pointer to two service-only sections is replaced by a pointer to the PEP echo rule. Keyword-free.
4. "Autonomous PEP" (302): the rule is restated for "a PEP that fetches or submits to these URLs without a human confirming the destination", and the rendering PEP sentence keeps its SHOULD. Same actor set, same force.
5. Binding Artifacts lead-in (1074 to 1076): names the roles that verify, and says a PEP carries the artifacts unchanged and needs nothing further from the section. Keyword-free.
6. The PEP echo rule: one sentence in PEP Processing, "The PEP echoes every `denial` member the PDP supplied, unchanged", replaces the per-member echo sentences (235, 250, 256, 286, 296) and the conformance bullets 992 to 993. The presence conditions at 378 and 383 stay as the service's view in the `denial` definitions, cut to their condition and type. This does not change force for the PEP: each removed sentence was unconditional "echoes" prose or a MUST or SHOULD whose union the new sentence carries, and the duplicate register lists each. The question whether the PEP's echo of `binding_token` should be a MUST when the identifier is also present is register entry G26 and is not settled here.

## Duplicate register

Execution generates `A5-DUPLICATES.tsv`: for every keyworded sentence removed, the surviving sentence, its section, and a note on actor, condition, obligation, and exceptions. Known clusters and the survivor for each: unknown status or mode not approved (540, 651, 707, 1002, 1009; survivors: the status entry and the completion-mode sentence, both cited from PEP Processing); do not treat the hint as access (104, 136, 984; survivor: the Introduction sentence, cited from PEP Processing); do not infer future coverage (800, 804, 1012; survivor 800); fail closed (613, 695, 1001 to 1002, 1008 to 1009; survivor: one bullet list in PEP Processing); endpoint selection (238, 991; survivor 238); opaque `binding_token` (247 to 250, 383, 1126; survivor: the PEP echo rule plus the definition's type sentence); opaque `approval.state` (719 to 721, 725, 1010; survivor 721 in PEP Processing); expiry (235, 375, 782, 992; 493, 584, 616, 783, 1368; 716, 770 to 772, 784, 792; survivors: the definitions, the polling rule, and Approval Lifetime); trusted URLs (302 to 305, 359, 989; survivor 302 to 305).

## Verification, per commit

- Build clean; all anchors resolve at every heading level; companion links resolve.
- Plan counter: expected to fall by the number of removed duplicates, each listed in `A5-DUPLICATES.tsv` with its survivor; no other change.
- Unit comparison: MOVED lines, the listed rewordings, and the listed removals only.
- Sentence diff: every removed non-code sentence is in the duplicate register or the rewording list.
- Independent equivalence audit before the editor's review, briefed with the duplicate register.
- Four commits: message definitions and PEP Processing; PDP Processing; Access Request Service Processing; examples and Binding Artifacts lead-in.

## Expected effect

| | Now | After A5 |
|---|---|---|
| Contiguous reading for a PEP implementer | about 9,000 words over 40 headings | about 2,000 words in one section plus the message definitions |
| Statements of each PEP rule | two or three | one |
| Tables that restate prose | five | one, the decision table, with its prose restatement removed |
| Requirements changed | none | none; keyword count falls by removed duplicates only |

## Not done here

Register entries G23 to G26, which the PEP read exposed; G11; the conformance-layering decision.

## Execution record, 2026-09-18

Applied by assembling the document from verbatim line ranges of be59012 plus the enumerated rewordings; the assembly script asserted the presence of every sentence it split. Results: build clean; every anchor resolves at every level; no duplicate anchors; companion links resolve; `git diff --check` clean; keyword total 350 to 336, the fourteen removals each paired with a survivor in `A5-DUPLICATES.tsv`; the unit comparison shows 90 moves and the listed splits and rewordings; the sentence diff shows 71 removed sentences, every one either a duplicate in the register, a rewording, a pointer or lead-in made obsolete by the move, or the deleted tables' framing.

Deviations from the layout: the `binding_token` presence sentence stays in both the denial and submission definitions, as the plan said; the PDP Metadata section keeps its example with a keyword-free lead-in and its three rules moved to Publish Metadata; Endpoint Protection moved whole into Access Request Service Processing as Protect the Endpoints with its anchor; Time and Clock Skew moved to Binding Integrity as a shared subsection; the Re-evaluation Request subsection dissolved into PEP Re-evaluate and PDP Verify, its anchor on the PEP subsection; the Approval Result lead-in was reworded to keep the `reevaluate` condition once the MUST moved; the Re-evaluation Denials lead-in was reworded keyword-free with the PDP SHOULD moved; the Completion Handling table, the Deadline Reference, and the `next_action` restatement paragraph were deleted, and the deadline paragraph's one informative sentence on artifact expiry was kept in Enforce and Reuse; the Manager Approval walkthrough was cut to the four exchanges that differ from the trusted-state walkthrough and the four Part II example subsections were deleted as its duplicates. Register entry G26's rule, the OPTIONAL `binding_token` echo, is unchanged.

### Corrections after the independent audit, 2026-09-18

The audit found no change in any rule's actor, condition, obligation, exceptions, or force, and every removed keyworded sentence in the register. Corrections applied from its P2 findings: rewording 4 is withdrawn and "An autonomous PEP MUST verify" stands as before, because the replacement class could be read as wider than the original, so register entry G25 keeps the undefined term; the `template` and `display` handling bullets moved from Recognize the Denial to Construct the Submission; the by-reference procedure cites the binding window at its new home in Issue a Requestable Denial; the two `result` citations and the Security Considerations availability paragraph cite the sections that now hold the rules; the `approval` member definition states its presence (REQUIRED when `result.mode` is `reevaluate`) and the service section keeps only the identifier entropy rule, so presence is stated once, in the definition; the Manager Approval intro names the two form members its denial also carries; the Document History gains an entry. The plan's claim that Security Considerations citations were retargeted in the first pass was wrong and is corrected by this pass. Three keyword-free echo sentences the plan listed as removed remain in the member definitions; harmless.
