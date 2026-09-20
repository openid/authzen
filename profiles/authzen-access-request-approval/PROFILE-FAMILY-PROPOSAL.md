# Proposal: A Layered Profile Family with a Trusted-State Core

Version 4, 2026-09-18. Status: proposal for the working group, drafted at the editor's request. Version 4 corrects version 3 after the editor's review: the move map is measured on the current text, with bulk and callbacks already extracted; common semantics that version 3 still placed in the signed layer (`approval_unverifiable`, the opaque `approval.state` member, the shared-state half of G10) are split out explicitly; the G21 direction no longer offers an extension-point rule as an answer for silently ignored callbacks; and the sequencing defines the normative transition before any relocation. Version 3 corrected version 2 after the editor's review: the layers are named for what they bind rather than for topology; denial-side and approval-side signed binding are separate boundaries; the PEP has its own common conformance rather than relying on reserved member names; the common core keeps every rule that trusted-state resolution needs; the capability URN is given advertisement semantics; and the claim that signed-layer implementations interoperate is withdrawn in favour of what the register still has to settle. Version 1 proposed moving bulk and callbacks out, which has since been done on `arap-restructure`. This document changes nothing until the working group decides. Counts are measured on the text at 0c20d5a.

## Framing

Three layers:

- **Common PEP protocol and security invariants.** The wire format for the requestable denial, the submission, the Task Handle, and the approval object; the PEP's conditional presence rules and opaque forwarding of `binding_token` and `approval.state`; expiry enforcement; tuple and Context comparison; caller binding; approval applicability; the current-status check; task-handle authorization. Every deployment implements this, and a conforming PEP works against either backend below without knowing which it is.
- **Trusted-state backend binding.** The PDP records the denied evaluation and returns a stable `evaluation_id`; the Access Request Service resolves it against state shared with or delegated by the PDP; the PDP verifies an approval by looking up `approval.id`. This is the simplest complete deployment. The profile does not standardize the shared-state interface, so two independently built products that both claim only this layer are not thereby interoperable with each other; a conforming PEP is interoperable with either.
- **Portable signed binding.** Two separately claimable capabilities: signed denial binding (`binding_token` issued by the PDP and verified by the service) for a service that cannot resolve the PDP's denial state, and signed approval state (`approval.state` issued by the service and verified by the PDP) for a PDP that cannot resolve the approval record. A deployment may need one, both, or neither; independence on one side does not imply it on the other.

## The decision requested

Whether the profile should define these as separately claimed conformance targets, so that a deployment using only trusted-state binding is conformant without implementing signed-artifact verification, and whether the signed capabilities are a later part of this document or a companion profile.

## What changes and what does not

Today the Interoperability Baseline requires every Access Request Service to support verifying a JWS `binding_token` and every PDP to support verifying a JWS `approval.state`, without a trusted-state exception. Layering the document editorially (PR A4) does not change that: a conformance claim covers the whole document, and a rule that moves behind an optional claim changes its applicability even when every sentence moves verbatim. This is therefore a normative decision, to be made before the extraction is described as mechanical.

If adopted, the three sentences that move behind the signed claims are the Interoperability Baseline's two MUSTs, the `jwks_uri` publication rule, and the rule that an independent service requires `binding_token`, which becomes the applicability statement of signed denial binding. The baseline's JWS compact serialization becomes the mandatory-to-implement format within each signed capability.

If not adopted, the interim statement stands: shared-state deployments need not exchange signed artifacts, but conforming Access Request Services and PDPs must support their respective JWS verification paths, and section placement does not waive that.

## What the common core keeps regardless

Expiry enforcement on `denial.expires_at`, `task.expires_at`, and `approved_until`; structural comparison of Subject, Resource, Action, and authorization-relevant Context; binding of the task to the caller, requester, and client; the PDP's applicability check at re-evaluation; the current-approval-status check; and task-handle authorization. Only artifact construction and artifact verification are exclusive to the signed capabilities. Register entry G6, the identity-binding question, is not about signatures and remains a core question; extraction does not make the core publication-ready on its own.

## Capability advertisement

Each capability is declared by a URN in the PDP metadata `capabilities` array, alongside the existing `urn:openid:authzen:capability:access-request`, for example one URN for signed denial binding and one for signed approval state. The profile must define what a declaration means: that the deployment has the capability enabled for the roles the PDP speaks for, not merely that the product could support it; which role each URN covers; and that absence means the capability is not offered, so a PEP or peer does not expect the corresponding artifact. Without these semantics a URN names a contract without completing it.

## What a URN does not settle

A common mandatory-to-implement format gives two signed-capability implementations a common verification path. It does not by itself give them compatible issuance: algorithms, payload claims, issuer and audience identities, key-to-issuer trust, and current-status handling are register entries G1, G2, G4, G9, and G3. Cross-vendor interoperability of the signed capabilities is complete when those are settled, not when the URN is defined.

## The family

| Document | Answers the question | Status |
|---|---|---|
| Core | there was a deny; how does the caller find out what to do next, correlating by `evaluation_id` and the Task Handle | this document after PR A4 |
| Binding Artifacts | a role cannot resolve the other role's state, or a deployment chooses portable proof | Part II of this document; two separately claimable capabilities if the decision is adopted |
| Forms | the PEP cannot build the request from the denial alone | Part III today; a companion if the working group prefers |
| Catalog | form fields come from a backing catalog | published companion |
| Bulk | many items in one request | companion, extracted 2026-09-18 |
| Callbacks | push instead of poll | companion, extracted 2026-09-18 |

## Move map, if the decision is adopted

Measured on the text at 0c20d5a. Units marked "split" have both a common and an artifact-specific part.

**Common core keeps.** Everything in Part I of the A4 layout, including: the opaque `approval.state` member definition and the PEP's preservation rule (766 to 768), because a common PEP forwards it whatever the backend; the `binding_token` presence rule and opacity bullets (255 to 258); `approval_unverifiable` (799) and `expired_denial` (897 to 898), which cover unresolved `approval.id` and the trusted-state deadline as well as artifact failures; Structural Comparison including the `binding_context_members` bullet, which applies whenever a `binding_token` is used; Decision and Binding Integrity, including the by-value sentence (960), which is triggered by use; the PDP rule at 1300, which names both forms; the shared-state half of G10 (which value governs when the recorded and echoed deadlines differ).

**Signed denial binding capability (about 1,900 words, 40 keywords).** Interoperability Baseline's service clause; the `jwks_uri` publication rule as it applies to `binding_token`; the integrity and JWE bullets (259 to 260); Denial Binding (964 to 974) including the Independent Access Request Service requirement, which becomes this capability's applicability statement; Denial Binding Claims, JWT Claim Reference, Binding the Denied Request, Hash Construction, Verifying the Denial Binding, Denial Binding Alternatives (976 to 1052); the conformance bullet 1302 and the artifact clauses of 1313 to 1317; the binding-token threat paragraph; register entries G1, G4 (denial side), G9 (denial side), and the issuer-side force question of G10.

**Signed approval state capability (about 900 words, 25 keywords).** Interoperability Baseline's PDP clause; the `jwks_uri` rule as it applies to `approval.state`; Approval State (1056 to 1066), whose first sentence becomes this capability's applicability statement; the bound-reference sentences (748, 1082, 1102); the identifier cross-check (1074), which is triggered by use of a state artifact carrying an identifier; the approval-substitution threat paragraph's by-value clause; register entries G2, G4 (approval side), G9 (approval side), and G3's stateless case.

## What the core must say for the layers to work

- A one-paragraph reading guide: which profile a deployment needs, by the question it answers.
- Common PEP conformance: the conditional presence rules for `binding_token` and `approval.state` and the opaque-forwarding rules, stated for every PEP so a core PEP accepts either backend. Reserving the member names is not sufficient on its own.
- The rule that implementations MAY define additional status values and that a PEP treats an unknown status as not approved, so Bulk can define `partial` without a core change.
- The response of a core-only Access Request Service to a member it does not implement (register entry G21). For `items` a named problem type suffices. For `callback` it does not: a service that accepts the submission and ignores the member leaves a PEP that skips polling with no signal, so the answer is an acceptance or rejection signal, which is G18.
- The capability URN pattern and the requirement that a profile declare one.

## The cost

Cross-vendor interoperability between an independent PDP and Access Request Service becomes a property of both roles claiming the relevant capability, not of the core, and is complete only when the register's artifact entries are settled. The Design Rationale entry on presentation order is rewritten. Two more conformance targets to name, test, and explain, and a reader who wants the whole picture reads Part II as well as Part I; the reading guide mitigates this.

## Sequencing

1. Merge `arap-restructure` (PR A, including the A4 layout). Its inventory, isolated sections, threat statements, and register make the split cheap and provable; the layering does not undo any of it.
2. The working group decides the conformance question.
3. If adopted, one normative pull request defines the transition before anything moves: the scope conditions of the Interoperability Baseline and `jwks_uri` rule; the two capability URNs with their advertisement semantics (enabled behaviour, role covered, meaning of absence); the common PEP conformance statement; the G21 answer for `items`. A capability must be defined before a rule can be placed behind it.
4. Then the relocation, as a verbatim move with the Pass 0 tooling, into Part II of this document or into a companion, as decided in step 2.
5. Register Part A entries are worked in the layer that owns them, per the move map.

## Not proposed

Delegation and Acting Parties was moved to the AuthZEN Actor Delegation Profile on 2026-09-19 by the editor's decision, reversing this document's earlier position; the preservation, comparison, and authorization-input rules that reference `client.actor` stay in the core, as does G6.
