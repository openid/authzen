# PR A6 Plan: Review Corrections

Version 1, 2026-09-19. Status: applied in the working tree on c3795ed; awaiting the editor's review; not committed. Source: an independent review of the restructured draft against the published source (2026-09-19). The review's normative recommendations went to the register as version 17 (candidate directions under G2 and G4; new entries G27 to G30); its editorial recommendations are this stage.

## Applied

- The Design Rationale anchor for "Why present trusted-state binding first?" no longer says the opposite; nothing cited the old anchor.
- The Document History entry says "Protocol restructuring and modularization, with each requirement's force preserved" instead of "Editorial restructure", and states that the conformance surface of this document changed only by what moved to companion profiles.
- A non-normative Protocol Invariants subsection after the Protocol Overview lists the seven invariants the review named; each is stated normatively elsewhere and the subsection is keyword-free.
- One sentence added to Approval Verification: values carried outside `approval.state` (`approval.id`, `approved_at`, `approved_until`) MUST NOT be treated as authoritative by the PDP unless resolved from trusted state or proven by integrity-protected material. This is the review's explicit rule for what the verification model already implies; it is the stage's only keyword (317 to 318) and the editor approves it separately.

## Not applied

- Cutting the Motivation appendix: the review read an earlier copy; the appendix is already 230 words.
- Reducing actor delegation further: now a question for the Actor Delegation Profile.
- Everything normative: G2, G4, G27 to G30, and the two-mode baseline, which is the profile-family proposal.

## Verification

Build clean; all anchors resolve; `git diff --check` clean; keyword total 318, the one listed addition.
