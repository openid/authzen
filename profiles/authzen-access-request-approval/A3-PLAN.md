# PR A3 Plan: Consolidation and Part I Placements

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

## Not done here

The G20 force question and Context naming, G21, G22, and everything in register Part A. The profile-family proposal is a separate document, `PROFILE-FAMILY-PROPOSAL.md` (version 2, superseding the companion-split proposal after the feedback on issue #520), for the working group.
