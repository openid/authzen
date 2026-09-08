# Review Brief: PR A1 commit 2 (verbatim relocation of the Access Request and Approval Profile)

Give this file, unchanged, to a reviewer who has not seen any of the work. Everything it needs is in this directory. The reviewer must not modify any file here.

## What was done

The specification `authzen-access-request-approval-profile-1_0.md` was reorganized into a new section structure so that a reader meets the core protocol first. The claim of this commit is narrow: **every normative unit was relocated verbatim; no requirement was added, removed, reworded, or merged.** The only new text is headings, keyword-free pointer sentences, and editor's notes. Seven citations were retargeted to new anchors.

## Files

- `authzen-access-request-approval-profile-1_0.before-A1.md` — the source before relocation (1,960 lines).
- `authzen-access-request-approval-profile-1_0.md` — the source after relocation (2,006 lines).
- `authzen-access-request-approval-profile-1_0.before-A1.html` and `authzen-access-request-approval-profile-1_0.html` — rendered versions of each, for reading.
- `PASS0-SKELETON.md` — the intended structure: every new heading with level and anchor, and the units under it in order.
- `PASS0-INVENTORY.tsv` — one row per unit: `src_lines` (line range in the before file), `actor`, `condition`, `obligation`, `exceptions`, `dest` (final destination), `a1_dest` (where this commit puts it), `note` (recorded decisions).
- `PASS0-ANCHORS.tsv` — where every heading anchor went and which citations were retargeted.
- `PASS0-EXPECTED-MOVES.tsv` — what the comparison script should report.
- `PASS0-REPORT.md` — the decisions taken and the verification already performed.
- `RESTRUCTURE-PROPOSAL.md` — the plan (Sections 3, 4, 5, 7, 8, and Appendix X hold the rules and the scripts).

## What to check, in priority order

1. **Verbatim preservation.** Pick at least 40 units from the inventory across all source sections, including definition-list entries, numbered steps, table rows, and the multi-actor units (`multi_actor` = yes). For each, find the text at `src_lines` in the before file and confirm it appears byte-for-byte (apart from the seven anchor retargets) in the after file under the heading the skeleton names. Report any unit that is missing, altered, split, or merged with a neighbor.
2. **Nothing added with normative force.** Search the after file for every sentence that is not in the before file. Each must be a heading, a pointer sentence, an editor's note, or the Section 22 pointer list, and none may contain MUST, SHOULD, MAY, REQUIRED, RECOMMENDED, or OPTIONAL. Report any exception.
3. **Reading order of Part I.** Read Sections 1 through 10 of the after document as a newcomer. Report every place a term, member, or claim is used before it is defined, with the two line numbers. The known A2 items (the Introduction's "that protocol layer" sentence whose antecedent moved to Appendix B, and the six-step list beside the diagram) need not be reported.
4. **Keyword-free prose placement.** The scripts cannot see prose without an RFC 2119 keyword. Find at least ten keyword-free paragraphs in the before file (definitions, examples, explanatory prose) and confirm each sits under a sensible heading in the after file, next to the unit it explains. Report any that landed somewhere that changes its meaning or leaves it orphaned.
5. **Definition lists and tables.** Where a definition list's sub-entries left for another section (`access_request`, `requested_access`, `client`, `task`), confirm the lead-in still reads correctly with the pointer sentence, and confirm no table lost a row or gained a headerless fragment.
6. **Anchors and citations.** Confirm every `{{...}}` in the after file resolves to a heading, and for the seven retargets (before lines 655, 689, 691, 787, 801 to `section-14-bulk`; 1096 to `structural-comparison`; 1130 to `section-19-client-actor`) confirm the target heading holds what the citing sentence refers to.
7. **Companion.** `authzen-access-request-catalog-profile-1_0.md` cites the core by the section titles "Extensibility and Profiles" and "Naming Extensions"; confirm both still exist.
8. **Scripts.** Run the four scripts in the plan's Appendix X against the after file (and the first one against before and after with the seven new anchor names replaced by their originals in the after copy). Report whether the results match `PASS0-EXPECTED-MOVES.tsv` and the totals in `PASS0-REPORT.md` (250 units, 408 keyword occurrences, 0 missing anchors).

## How to report

Lead with anything that lost or changed a requirement. Cite before-file line numbers and after-file line numbers for every finding. Distinguish "defect in the relocation" from "pre-existing issue in the text" and from "A2 wording work". Finish with a yes or no on whether this commit can merge as a verbatim relocation, and what must change first if not.
