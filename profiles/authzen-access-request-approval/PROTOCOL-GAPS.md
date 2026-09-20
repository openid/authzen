# Gaps Register: AuthZEN Access Request and Approval Profile

Version 21. Status: register for the working group. This is not a design. Version 21 adds G33 (workflow input mixed into the submission `context`) under Issue 4 and G34 (`approval_revoked` as a registered reason code) under Issue 5, from the fourth reviewer's confirmation pass (2026-09-19), which otherwise found the five remaining blockers already recorded; no entry is resolved. Version 20 records, from a fourth independent review (2026-09-19), a three-case validity model under G3 that converts it from an open question into a concrete direction, the reuse-versus-retry rule under G5, the reviewer's three identity terms under G6, the inline-or-hash direction for the approval claim set under G2 and G27, the REQUIRED claim set under G1, and the `act` exclusion note under Issue 4; no entry is resolved. Version 19 adds G31 (composition with obligations) and G32 (the closed extension-point list versus the extensibility model's recursive rule) to issue 7, renamed Base task surface and extensibility, and adds the mandatory-to-understand reading under G11 and G28, all from reading the draft against the AuthZEN Extensibility Model (Draft 2, 2026-09-19).

Version 18 reorganizes the register into the eight working-group issues it will be filed as, each with its member entries, one summary, and one direction. Entry numbers are stable identifiers and are unchanged. Three entries are closed: G19 (the clock-skew guidance now sits in the normative body), G16 (folded into G6), and G21 (split between the companion registers). Three entries moved to registers beside the profiles that now own their subject: G12 and the `items` half of G21 to `BULK-GAPS.md`, G18 and the `callback` half of G21 to `CALLBACK-GAPS.md`. Editorial entries G7, G8, G14, and G25 are addressed by stage A7 and are listed under Editorial with their status; G15 stays open, tied to issue 1. The Tracking table is retired; each issue carries a status line. Version history before 18 is in the git log of this file.

Line references inside entries are to the profile at the version each entry was written against and were not renumbered; the issue summaries cite sections by name.

The register is organized in three parts. Part A lists the issues that need a working-group decision. Part B lists editorial corrections. Part C lists closed entries. A short appendix records candidate designs drafted during review, labelled as such; no entry relies on the appendix.

## Part A. Issues for the working group

Issues 1 to 3 concern the signed layer and go with the conformance-layering decision in `PROFILE-FAMILY-PROPOSAL.md`. Issue 5 is the one PEP implementers meet first. Issue 6 blocks nothing today. Filing order: 5, 4, 1, 2, 3, 6, 7.

### Issue 1. Signed approval state contract

**Entries.** G2, G27, G28, G9, G3.

**Summary.** What an `approval.state` artifact carries, what `approved_until` means, and how scope and revocation reach a PDP that shares no state with the Access Request Service. The five entries are facets of one contract: a named claim set (G2) must convey scope (G27) and a lifetime whose meaning is settled (G28, G9), and a PDP verifying only the artifact needs a defined answer for current status (G3).

**Direction.** Adopt a minimum `approval.state` claim set that includes scope and the artifact's own validity bound; state that `approved_until` bounds use of the Approval Result, not the authority granted; state what a stateless PDP does for current status.

**Status.** Not filed.

#### G2. `approval.state` has no standardized signed payload

**Evidence.** Line 824 names `iss`, `aud`, and a `kid` header. Line 826 lists what the PDP must "be able to determine" without naming claims. Line 811 requires an identifier cross-check without saying which claim holds the identifier. Decoded examples: 763 carries only `approval_id`; 1767 carries `approval_id`, `scope`, and `exp`; none carries `iss` or `aud`. The `kid: pdp-1` on 1767 is permitted, since 824 allows "the PDP acting through" the Access Request Service to sign.

**What is missing.** A payload that lets an independent PDP verify a bound reference without a deployment-specific agreement. Such agreements remain possible and are how the text is implementable today.

**Severity.** Blocking for the portable bound-reference flow the text promises.

**Direction.** A named claim set that accommodates the broadened-scope approvals the profile relies on (1750, 861, 121) and settles the semantics of any per-artifact identifier together with the meaning of "replayed" at 813, given that reuse within scope is the normal case (856 to 858). Candidate minimum claim set from the 2026-09-19 review, recorded not adopted: `iss`, `aud`, `iat`, `exp`, `jti`, `approval_id`, `task_id`, `evaluation_id` (optional), `subject`, `resource` and `action` or `approval_scope`, `binding_context_members`, and requester and client binding. The review's point stands on its own: supporting the JWS container without agreeing on its payload is not interoperability.

#### G27. Approval scope must reach the PDP in the signed topology

**Evidence.** Approval Scope says the exact-match baseline is the default unless the Access Request Service or PDP records a broader or narrower scope; the bound-reference paragraph requires the verifiable material to convey the authorization-relevant Context set. Nothing requires a broader scope the service recorded to reach a PDP that shares no state.

**What is missing.** A general rule that approval scope is determined by the approval authority and reaches the PDP through trusted state or integrity-protected approval binding material, with exact match as the default when no broader scope is represented. This also names the future extension point, `approval_scope`, without defining a scope language.

**Severity.** Significant for the signed topology.

**Direction.** State the general rule; it also feeds the G2 claim set. The 2026-09-19 review's direction for both: the Approval State JWT carries the approved Subject, Resource, Action, and authorization-relevant Context either inline or as a hash using the same canonical construction as denial binding, so denial binding proves the tuple that may be requested and approval binding proves the tuple that was approved, and exact-match scope becomes portable without trusted lookup. Broader scope stays profile-defined.

#### G28. `approved_until` conflates approval-evidence validity with granted-authority lifetime

**Evidence.** `approved_until` is REQUIRED on the Approval Result and bounds PEP reuse and enforcement. An approval that results in a durable entitlement has at least three lifetimes: the approval as an audit fact, the granted authority, and the artifact that bridges the workflow into the PDP. The text mostly treats the member as the third but the name invites reading it as the second, and a workflow that grants a durable entitlement has no natural value for it.

**What is missing.** A statement that the member bounds use of the Approval Result, not the lifetime of authority the approval established, and a decision on whether REQUIRED is right for provisioning-backed approvals. Related: G9 and G11.

**Severity.** Minor for interoperability, significant for correct implementation.

**Direction.** Clarify the semantics first; consider renaming (for example `approval_valid_until`) only as a wire change with the G2 claim set. See the extensibility-model reading under G11: whatever the member means, a PEP that does not understand it cannot be relied on to stop at it.

#### G9. Signed approval state may expire before `approved_until`: intended, and is recovery supported?

**Evidence.** The agent example's `approval.state` at 1767 and 1810 carries `exp` 1779210000, which is 2026-05-19T17:00:00Z; the surrounding `approval` objects at 1766 and 1809 carry `approved_until` 2026-05-19T17:30:00Z. Line 1165 requires the PDP to verify expiry of a by-value artifact; 813 rejects an expired reference; 846 defines `approval_unverifiable` for failed verification; 807 lets the PEP present the approval until `approved_until`.

**What is missing.** Failure is defined and safe: between 17:00 and 17:30 the PDP rejects the artifact under 813 and may return `approval_unverifiable`. `approved_until` is a maximum bound, not a guarantee that every proof stays usable until then. What the text does not say is whether proof shorter than the approval is intended, and whether a PEP holding a live approval with an expired artifact has any defined way to continue other than a new request.

**Severity.** Minor on the PDP and Access Request Service axis; a lifecycle question for PEPs.

**Direction.** State whether artifact lifetime shorter than `approved_until` is intended and whether any recovery is supported.

#### G3. Purely signed approval verification has no standardized way to satisfy the current-status requirement

**Evidence.** Line 850: the PDP MUST check current approval status including revocation before `approved_until`. Line 795: re-evaluation does not require the PDP to retain state. Line 661: terminal task states never transition, so the Task Status Endpoint cannot report that an `approved` task's approval was later revoked.

**What is missing.** Where approval provisions backing state the PDP evaluates, which 799 and 856 describe as normal and 844 to 845 assume, the check is satisfiable. For an approval whose only artifact is a signed `approval.state` with no provisioned entitlement, such as the tool-class case at 1750 to 1767, no standardized path carries revocation to a PDP that shares no state.

**Severity.** Significant.

**Direction.** State what a PDP without shared state is expected to do at 850. A withdrawn candidate is recorded in the appendix as C1. The 2026-09-19 review supplies a concrete model, recorded as the candidate direction: three validity cases. Lookup approval (`approval.id` resolved in trusted state): current status can be checked, so revocation and cancellation MUST be enforced. Signed approval with an online status source: current status can be checked and MUST be. Self-contained signed approval (`approval.state` with a protected expiry and no status source): the artifact is valid through its protected expiry unless current PDP policy independently denies, and early revocation requires an additional profile or mechanism. The reviewer's point is that a signed artifact proves what was true when signed and cannot answer a question about later events; the current MUST pretends otherwise for the topology the profile promises.

### Issue 2. Signed denial binding contract

**Entries.** G1, G10, G26.

**Summary.** What a `binding_token` carries in the inline form, how the force of its claims is expressed, and whether the PEP's echo of the token is unconditional. G10's error-precedence half belongs to issue 6.

**Direction.** Name the inline claims; decide whether the issuer-side claims are MUST; make the PEP echo every `denial` member the PDP supplied.

**Status.** Not filed.

#### G1. The inline denial-binding form never names its claims

**Evidence.** Line 258 requires, for an independent Access Request Service, a self-contained `binding_token` carrying Subject, Resource, Action, and authorization-relevant Context "inline or as a `binding_hash`". Lines 1179 to 1180 make the inline form RECOMMENDED for interoperability and describe how it is compared, but never name the claim or claims that carry the four values. `binding_hash` (1181), `binding_context_members` (1178), and `denial_expires_at` (1177) are named; the inline claims are not.

**What is missing.** The claim names for the inline form. The hashed form is fully specified, so an independent deployment can interoperate today by using `binding_hash`; what is blocked is the portable use of the form the text recommends.

**Severity.** Blocking for portable inline binding; none for the hashed form.

**Direction.** Name the inline binding claims. Related: the list at 1171 is introduced by "SHOULD include the following claims" while members inside it carry verifier-side MUSTs (1174, 1198); how that force is expressed belongs to the same decision. Candidate from the 2026-09-19 review: `iss`, `aud`, `exp`, the binding representation (inline or `binding_hash`), and `binding_context_members` when applicable are REQUIRED; `iat`, `jti`, and `evaluation_id` remain RECOMMENDED or OPTIONAL. The current SHOULD introduction understates the contract the verification steps enforce.

#### G10. Error precedence when a submission is both expired and insufficiently bound, and the force of the issuer-side freshness claim

**Evidence.** Line 965 defines `expired_denial` by the earlier of `denial.expires_at` and `exp`; step 5 at 1196 and the first sentence of 1198 enforce that deadline. The third sentence of 1198 adds a distinct rejection: when no protected denial-expiry value is present and `exp` is later than the echoed `denial.expires_at`, the binding material is insufficient and the submission is rejected with `invalid_denial_binding`. Line 256 requires the PDP to provide enough binding material to verify freshness. Line 1177 recommends `denial_expires_at` "unless the token's `exp` is no later than that value". The deadline itself is stated three ways: 240 rejects submissions received after the PEP-echoed `expires_at`; 1096 enforces freshness against the `expires_at` recorded in shared state "rather than the PEP-echoed `denial.expires_at`"; 1097 rejects submissions after "the verified `denial.expires_at`". The signed path is consistent: the verified value at 1097 is the protected one and the earlier-of rule applies. The open case is the shared-state path: 1096 selects the recorded value "rather than" the echoed one, while the general rule at 240 rejects after the echoed value. When the two differ, whether 240 still applies (so the deadline is the earlier of the two) or 1096 alone governs is not stated.

**What is missing.** The earlier-of rules reject expired submissions; they do not promise acceptance of unexpired ones, and 1198's third sentence is a legitimate additional validation with a clear rationale (an unprotected echoed `expires_at` must not be the only bound). An issuer that omits `denial_expires_at` while `exp` exceeds `expires_at` is not following 1177, and 256 already obliges it to supply sufficient material. Two things remain open: which error a service returns when a submission is both past its deadline and insufficiently bound, and whether the issuer-side obligation at 1177 and 256 should be stated as a MUST given that 1198 rejects its absence. Version 5 of this register called this a blocking contradiction; it is not.

**Severity.** Minor for error precedence; the force question belongs with G1.

**Direction.** State the error precedence, and decide the force of the issuer-side freshness claim as part of the G1 conversation.

#### G26. The PEP's echo of `binding_token` is OPTIONAL when an identifier is present

**Evidence.** The submission `binding_token` member is "REQUIRED when `denial.evaluation_id` is absent; otherwise OPTIONAL". A PEP that holds both may therefore omit the token and remain conformant, while an Independent Access Request Service requires it and rejects the submission. The PDP-side rule (a token is REQUIRED for an independent service) and the PEP-side presence rule do not compose.

**What is missing.** A PEP-side rule that the token is echoed whenever the PDP supplied it. Making it a MUST changes force, so it is a working-group decision, not an editorial fix; the A5 plan keeps the current force and records this entry.

**Severity.** Minor in practice, since PEPs echo what they receive, but a conformance checker reads the letter.

**Direction.** Make the PEP echo unconditional for every `denial` member the PDP supplied.

### Issue 3. Issuers, keys, and trust

**Entries.** G4.

**Summary.** Identifier values for `iss` and `aud`, the key-to-issuer trust configuration, and where an Access Request Service's approval-state keys are discovered. The current text publishes another actor's keys in PDP metadata.

**Direction.** Define both identifiers; choose between a separate service `jwks_uri` in PDP metadata and a service issuer identifier with its own metadata.

**Status.** Not filed.

#### G4. Issuer and audience identifiers and key-to-issuer trust are undefined

**Evidence.** Line 1173: `iss` is "PDP identifier" with no definition. Line 1174: `aud` is "Access Request Service identifier" with no definition. Line 202: one `jwks_uri` holds keys for both artifacts "distinguished by their `kid` and by the JWS `iss`". Line 824: a PDP that resolves a key "not trusted for the claimed `iss`" MUST reject, which presupposes an issuer-to-key trust configuration no section defines, while 1095 matches keys by `kid` alone. The registry description of `jwks_uri` is at 1294 to 1298.

**What is missing.** Identifier values and an interoperable statement of which keys a verifier trusts for which issuer. Sharing one JWK Set is not itself insecure; the question is how the trust configuration is expressed so that 824 and 1095 describe the same procedure.

**Severity.** Significant.

**Direction.** Define both identifiers and the key-to-issuer trust configuration. Candidate mechanisms are recorded in the appendix as C3 and have not been evaluated. The 2026-09-19 review adds two, recorded not adopted: a separate `access_request_service_jwks_uri` in PDP metadata, or an Access Request Service issuer identifier whose own metadata resolves its signing keys. The review's objection to the current text is that PDP metadata advertises keys belonging to another logical actor, leaving rotation, multiple services, and `kid` collisions unaddressed; the second candidate scales to federation. A 2026-09-19 review adds a third, deferrable to a later draft: keep the PDP's `jwks_uri` and document explicitly that PDP metadata establishes trust in the Access Request Service's signers.

### Issue 4. Identities in binding rules

Note (2026-09-19): the `subject.properties.act` exclusion in structural comparison depends on a permission the actor companion grants; stage A15 states that the exclusion applies whether or not that companion is implemented, so two core implementations compare identically. Recorded here because it fixes what is compared rather than who is bound.

**Entries.** G6, G20, G33.

**Summary.** Which of the four identities (Subject, authenticated submitter, submitter's client, presenter at re-evaluation) each binding rule compares, with the acting-party test case; the remaining force difference and Context naming drift among the binding statements.

**Direction.** Define the four identities in Terminology; state each binding rule against a named identity; settle MUST versus SHOULD for binding the approval to the tuple; use the Terminology name for bound Context.

**Status.** Not filed.

#### G6. Caller, requester, and client binding lack identity and comparison semantics

**Evidence.** Line 826 binds the approval record to "requester and client". Line 1099 binds the task to "requester, and client". Line 813 verifies applicability to "the authenticated caller or requester". Line 374 defines `client` as supplementary application metadata with no verification. "Requester" means the Subject at 544 and 1248 and the authenticated caller at 419 and 1099.

**What is missing.** Four identities are in play: the Subject of the evaluation; the principal the Access Request Service authenticated as submitter; the client identity associated with the submitter's credential; and the principal that later presents `context.approval`. Each binding rule must name which identity it compares. A rule keyed on the self-asserted `client.id` at 374 is satisfiable by any requester behind a shared client. JWT access tokens carry `client_id` (RFC 9068 Section 2.2) and introspection returns it (RFC 7662 Section 2.2); these identify the token's client, not necessarily its presenter.

**Test case (formerly G16): the acting party.** Line 860 excludes `subject.properties.act` from scope matching and `client.actor` appears in no comparison rule, so scope matching alone does not distinguish one agent from another acting for the same person. In the agent example the denial is for a person acting through a named agent (1610 to 1616), the re-evaluation presents the same chain (1786 to 1796), and the approval is a seven-day tool-class grant (1750, 1766). Whether that matters depends on how the applicability check at 813 and 1163 is defined: if the acting party is established there through an authenticated identity or a verified chain, scope matching need not carry it; if 813 binds only the human requester, two agents sharing a runtime identity are indistinguishable. Passing scope matching does not by itself permit reuse. Any resolution of G6 must say what happens in this case.

**Severity.** Significant.

**Direction.** Define the four identities in Terminology, then state each binding rule against a named identity, and answer the acting-party test case. The 2026-09-19 review names three of them usably: the Subject, whose authority is requested; the submitting principal, the authenticated identity that created the Access Request; and the authorized task caller, an identity currently permitted to poll, cancel, resume, or use the task. Approval provenance records the submitting principal without requiring the same principal to re-evaluate; the PDP decides whether the current caller may use the approval. This is what makes Task Handle Portability and the requester-binding rule compatible; read literally as instance identity, the binding rule would break portability.

#### G20. One force difference, one duplicate, and naming drift among the binding statements in the completion section

**Evidence.** The completion section and the material relocated beside it from the old Security Considerations state binding obligations six times. Three are complementary obligations on different operations and are not defects: 1099 binds the task at submission (Access Request Service: "Subject, Resource, Action, Context, denial, requester, and client"), 1159 binds requests and results generally (implementations: "Subject, Resource, Action, Context, task, and requester"), and 811 binds the approval at re-evaluation (PDP). Their differing member lists follow from their different purposes; the identity question they share, who "requester", "client", and "caller" are, stays under G6. Two are the same operation: 813 (the PDP MUST verify the reference "is applicable to the authenticated caller or requester, current Subject, Resource, Action, relevant Context, approval scope, and approval expiry") and 1163 (PDPs MUST "confirm that it is bound to" the same list "before using it as an input to an allow decision") restate one check; the A2 wording pass left both because the trailing condition at 1163 makes them not identical. One differs in force for the same operation: 811 makes the PDP's binding of the approval to the tuple a MUST, while 1208 says "Re-evaluation Mode SHOULD bind approval references to the original request tuple". Across all six, the bound Context is called "Context", "relevant Context", and "authorization-relevant Context", although the Terminology entry (148) defines only the last.

**Correction.** Decide whether 1208's SHOULD is intended alongside 811's MUST. The fold of 813 and 1163 into one statement, keeping the 1163 condition, was applied in PR A3 (see `A3-PLAN.md`, item 1); the rest of this entry remains open. Use the Terminology name for the bound Context wherever it is meant. The complementary obligations at 1099, 1159, and 811 stay as they are. The force decision needs working-group visibility; the other two are editorial.

#### G33. The submission `context` mixes original authorization input with workflow input

**Evidence.** Request Body defines `context` as the AuthZEN Context from the denied evaluation "augmented with submission-time fields such as business justification". Structural comparison binds only the authorization-relevant subset, so one member of the object (for example `project`) is bound and its neighbour (`business_justification`) is not; the Section 6 example shows exactly this. The rule that submission-time augmentations not change or remove authorization-relevant context is a MUST NOT, but placing them in distinct extension members is only a SHOULD.

**What is missing.** Either a separate home for workflow input (`requested_access`, or a new `request_input` extension point) so the submission `context` is exactly the evaluation Context, or a rule that submission-time members MUST NOT reuse names in the authorization-relevant set and are placed in explicitly defined extension members. Without one, schemas and binding implementations can blur evaluation context with form data.

**Severity.** Minor for interoperability today, since the bound set is integrity-protected or server-resolved; significant for implementation clarity.

**Direction.** Prefer the separate home; it also simplifies `request_schema_url`, which then describes only workflow input.

### Issue 5. The PEP's re-evaluation round trip

**Entries.** G23, G11, G24, G29, G34.

**Summary.** What Context the PEP sends at re-evaluation, where a PDP returns approval expiry, what bounds retries and polling when no expiry is supplied, and whether `next_action` alone governs the PEP's response to a denial. This is the issue PEP implementers hit first.

**Direction.** State that the PEP resends the original evaluation's Context; define the response-side expiry member; name the governing expiry and a polling bound; make `next_action` authoritative and `reason` informational, withdrawing the default-action registry.

**Status.** Not filed.

#### G23. The Context a PEP sends at re-evaluation is unspecified

**Evidence.** The exact-match approval scope compares the current evaluation's authorization-relevant Context with the bound values (Approval Scope). The re-evaluation examples send only `context.time` and `context.approval`. No sentence tells the PEP to resend the original evaluation's Context, and the PEP cannot compute the authorization-relevant set, which the PDP fixes in the token or in shared state.

**What is missing.** A rule for what Context the PEP includes at re-evaluation. A PEP that copies the examples is denied `out_of_scope` whenever the original evaluation had authorization-relevant Context.

**Severity.** Significant: two conforming implementations can fail on the first re-evaluation.

**Direction.** State that the PEP resends the original evaluation's Context, or that the PDP compares only members present in both, and make the examples match.

#### G11. The response-side expiry has no defined location or shape

Extensibility-model reading (2026-09-19): a response-side expiry the PEP must honour is mandatory-to-understand on a permit. Under the model a PDP cannot rely on it against a PEP that has not adopted the extension, so either the permit's own lifetime bounds enforcement some other way, or the re-evaluation permit needs the model's opt-in. This is the same question as G28 seen from the consumer side.

PEP-side evidence (2026-09-18): the PEP rule to stop enforcing past "an approval expiry (typically as `context.approval.approved_until`)" and the retry stop rule both depend on this undefined member; see G24.

**Evidence.** Line 852 hangs a MUST NOT on an expiry "typically as `context.approval.approved_until`" in the re-evaluation response. The examples at 906 to 910 and 1825 to 1828 return it. The registry at 1365 defines `approval` only as the request-side reference the PEP supplies.

**What is missing.** Where and in what shape a PDP conveys approval expiry in a response, so that the PEP obligation at 852 and the OAuth companion's use of `approved_until` as a token-lifetime bound rest on a defined member. Making the member mandatory is one option, not a requirement.

**Severity.** Minor between PDP and Access Request Service; significant for PEPs and for the OAuth companion.

**Direction.** Standardize the response-side location and shape, or reword 852 to not depend on it.

#### G24. Retry and polling bounds without an expiry

**Evidence.** "MUST stop retrying once the approval expires" (Re-evaluation Denials) does not say whether the Approval Result's `approved_until` or an expiry returned by the PDP governs, and the response-side member is undefined (G11). "MUST stop polling once `task.expires_at` is reached" (Task Status Endpoint) has no counterpart when `task.expires_at`, which is OPTIONAL, is absent.

**What is missing.** The governing expiry for retries, and a polling bound when the Task Handle carries none.

**Severity.** Minor; a naive PEP polls or retries indefinitely.

**Direction.** Name the expiry, and either require `task.expires_at` or state a PEP-side bound.

#### G29. The re-evaluation denial fallback and reason registry may be more than the protocol needs

**Evidence.** Re-evaluation Denials defines `next_action`, `retry_after`, `reason`, a registry mapping each reason to a default action, a fallback from a missing or unrecognized `next_action` to the reason's default and then to the presence of `context.access_request`, and a precedence rule. An independent PEP read produced a 25-step design with guesses at exactly this point, and the 2026-09-19 review calls it a mini-protocol inside the protocol.

**What is missing.** A decision whether `next_action` alone is authoritative, with `reason` informational and no reason-to-action registry. The presence of `context.access_request` already carries the strongest signal that a new request is possible.

**Severity.** Minor for interoperability; the current rules are complete. The cost is implementation complexity and a registry to maintain.

**Direction.** Make `next_action` authoritative and `reason` informational; withdraw the default-action column and the fallback cascade. This removes a registry and is a working-group decision.

#### G34. `approval_expired` conflates expiry with revocation, cancellation, and supersession

**Evidence.** The reason code is defined as "the approval is no longer valid because `approved_until` has passed or it was revoked, cancelled, or superseded". All four lead to `request`, so PEP behaviour is unchanged, but the reason registry exists so that UX and audit can distinguish conditions, and `approval_revoked` is mentioned only as an example of a code an implementation might register.

**What is missing.** A registered `approval_revoked` (with cancelled and superseded folded in, or separate), or a statement that the registry does not distinguish them.

**Severity.** Low.

**Direction.** Register `approval_revoked` in the same decision as G29, which settles whether the registry keeps a default-action column at all.

### Issue 6. Submission processing order

**Entries.** G5, G22.

**Summary.** The order of retry recognition against token verification, replay detection, and freshness; the error precedence when a submission is both expired and insufficiently bound (G10's second half); and audit correlation when an `evaluation_id` is reused.

**Direction.** Define the precedence; state the error precedence; key audit reconstruction on the identifier together with the task or evaluation time.

**Status.** Not filed.

#### G5. Retry processing versus fresh-submission validation is not ordered

**Evidence.** Line 419: same `Idempotency-Key`, requester, and equivalent body returns the same task, where equivalence is "a deterministic comparison chosen by the Access Request Service" that "need not be interoperable". Line 970: same key with a non-equivalent body is `duplicate_request`. Line 1176: the service SHOULD track `jti` to detect replay. Lines 1190 to 1198 fix an order within token verification but say nothing about where the idempotency lookup sits relative to it.

**What is missing.** Whether a repeated submission is recognized as a retry before or after token verification, replay detection, and freshness. A retry after a lost response repeats the same token and `jti`; a repeated token and key with a changed body meets both 970 and the replay rule; a freshness check before retry recognition makes a lost response unrecoverable after expiry. Server-defined body equivalence is explicitly permitted by 419 and is not itself a gap; the question is only where the equivalence check sits in the order.

**Severity.** Significant.

**Direction.** Define the precedence between retry recognition and fresh-submission validation. A candidate design is recorded in the appendix as C2. The 2026-09-19 review states the rule more simply than C2: reuse of a `binding_token` and its `jti` is valid for an equivalent idempotent retry, keyed on `Idempotency-Key` and request identity, and invalid when reused for a materially different body. Recorded as the preferred candidate.

#### G22. Audit correlation by `evaluation_id` alone is ambiguous after reuse

**Evidence.** Line 298 permits an identifier to be "reused across distinct evaluations only after the original evaluation's binding window has expired". Line 294 makes `evaluation_id` "the audit thread" and recommends the Access Request Service retain it in the approval record so the sequence "can be reconstructed for audit". An approval record outlives the binding window, so a record that retains only the identifier can match more than one evaluation. A record that also retains the task identity, the evaluation time, or an explicit link to the evaluation is not ambiguous.

**Correction.** Guidance at 294 that audit reconstruction keys on the identifier together with the task or the evaluation time, not on the identifier alone. Withdrawing the reuse permission at 298 would be a protocol change and is not proposed here.

### Issue 7. Base task surface and extensibility

**Entries.** G30, G13, G17, G31, G32.

**Summary.** Whether `progress` and `links.review` are base members or registered extensions, and two optional capabilities: recovery of a lost Task Handle across principals, and an advertised maximum pending duration.

**Direction.** Decide the base member set for the Task Handle; adopt or decline the two capabilities; define composition with obligations; decide whether the extension-point list opens to the extensibility model's recursive rule.

**Status.** Not filed.

#### G30. `progress` and `task.links.review` expose workflow-engine surface in the base

**Evidence.** The Task Handle defines `progress` with `current_step`, `total_steps`, `step_name`, and `awaiting` (approver identifiers), and `links.review`, an approver action URL, while the Introduction places workflow engines and approver-facing surfaces out of scope.

**What is missing.** A decision whether these are base members or registered extensions. `links.ticket` and `display` are requester-facing and stay.

**Direction.** Move `progress` and `links.review` to registered extension members, or keep them and say why the scope statement admits them.

#### G13. Cross-principal recovery of a lost Task Handle

**Evidence.** Line 419 keys an idempotent retry on the same `Idempotency-Key`, the same authenticated requester, and an equivalent body. Lines 617 and 1117 let a different principal that already holds a Task Handle interact with it.

**Status.** Existing behavior is not broken: a replacement process authenticating as the same requester remains within the existing idempotency scope, subject to G5 and to retained idempotency state (the retry rule at 419 is itself a SHOULD), and a different principal holding the handle uses the portability rules. A different principal that lost the response before obtaining the handle has no recovery path. That is a new capability with its own authorization question, should the working group want it.

#### G17. An advertised maximum pending duration

**Evidence.** Line 536 makes `task.expires_at` OPTIONAL. Line 630 has PEPs stop polling at terminal status or when `task.expires_at` is reached; 742 requires `task_expired` or `unknown_task` after expiry or removal; 686 makes `task.expires_at` the trigger for the `expired` transition.

**Status.** Completion detection does not depend on the member. What the profile does not guarantee is an advertised bound on how long a task may stay `pending`; a PEP can choose its own wait budget. Making `task.expires_at` REQUIRED, or defining a default deadline policy, would be an additional guarantee.

#### G31. Composition with obligations is undefined

**Evidence.** The AuthZEN extensibility model (Draft 2) requires that where two extensions can interact, the composition and any precedence be defined, and names the access-request case. A denied Decision can carry both `context.access_request` and obligations; a re-evaluation permit can carry obligations. This document defines neither.

**What is missing.** Which governs when both are present: whether obligations on a requestable denial are enforced before submission, and whether a re-evaluation permit's obligations are subject to the same fail-closed rule as any other permit.

**Severity.** Minor until an obligations profile is deployed alongside this one.

**Direction.** Define the composition in the extension half of this document once the obligations profile's strength model is settled.

#### G32. The extension-point list is closed; the extensibility model's rule is recursive

**Evidence.** Extension Points says members may appear only at the listed locations and that no other object may be extended without a revision. The extensibility model proposes that any named object carries registered, namespaced members, with the registered name as the signal that the extension applies.

**What is missing.** A decision whether to open the list to the recursive rule. Opening it widens what a conforming implementation may emit and is therefore a working-group decision; the naming discipline in Naming Extensions would carry over unchanged.

**Severity.** None for interoperability today.

**Direction.** Align with the model when it is adopted; until then the list stands, with a note recording the divergence (stage A8).

## Part B. Editorial

Addressed by stage A7 (2026-09-19) unless noted; each stays listed until the stage is merged.

#### G7. Wording at 860 that can be misread, and the separate usability question

**Status.** Applied in A7: the comparison sentence no longer says "including any".

**Evidence.** Line 1184 defines object equality as the same member names with recursively equal values. Line 860 requires equality "member by member, to the bound values, using the same structural comparison" and says the comparison includes the full objects "including any `properties` members present in the bound values".

**Correction.** The phrase "including any" can be misread as a subset rule, but the same sentence requires full-object equality under 1184; the text does not license a subset reading. Clearer wording removes the temptation. Whether bound-subset matching should be allowed, to tolerate attribute drift at re-evaluation, is a separate behavior change needing a security justification.

#### G8. Exclude approval machinery from authorization-relevant Context explicitly

**Status.** Applied in A7: `approval` added to the profile machinery list.

**Evidence.** The Authorization-Relevant Context definition at 148 to 156 excludes `access_request`, `evaluation_id`, `evaluated_at`, and `reason` (149). `approval` is placed at `context.approval` on re-evaluation (828) and is not on the list. A re-evaluation that presents an approval can be denied and receive a fresh requestable denial (835), so a prior `context.approval` can be present in the request whose Context the PDP is binding.

**Correction.** Add `approval` to the list at 149. Version 5 of this register argued that `approval` could never be present at denial time; that is wrong given 835, which makes the explicit exclusion more useful, not less. Whether volatile-member exclusion should become a MUST is a policy change and not part of this correction.

#### G14. PEP-side handling when a denial-supplied `endpoint` is not trusted

**Status.** Applied in A7 with G25: the Check the URLs subsection says the PEP does not fetch or submit when a URL fails the check.

**Evidence.** Line 1057: the PEP MUST use `context.access_request.endpoint` when present, and the metadata endpoint otherwise. Line 1230: an autonomous PEP MUST verify that URLs from the denial resolve to trusted hosts before acting on them.

**Correction.** No submission is already the required outcome when a denial overrides `endpoint` to an untrusted host; 1057's "otherwise" clause does not fire. The wire protocol is not in question. Guidance on what the PEP surfaces to a human requester and whether it reports the event is a separate, non-protocol clarification.

#### G25. The trusted-URL check assumes metadata the PEP may not have

**Status.** Applied in A7: the PEP performing the origin check obtains the Access Request Endpoint from PDP metadata even when the denial supplies `endpoint`; "autonomous PEP" is defined in Terminology as a PEP acting without a human present to confirm what it fetches or submits, which is the sense the document already uses. The editor approves the definition separately, since it fixes the actor of a MUST.

**Evidence.** Trusting URLs requires the PEP to compare denial-supplied URLs against the same origin as the Access Request Endpoint advertised in PDP metadata, or an allowlist. A PEP that takes `endpoint` from the denial is never told to fetch metadata, and the rule's actor, "an autonomous PEP", is undefined.

**Correction.** Say that a PEP performing the origin check obtains the metadata endpoint, and define or replace "autonomous PEP". Editorial.

#### G15. Example defects

**Status.** Open; the token payloads are fixed together with issue 1.

**Evidence.** Decoding all twelve token occurrences (five distinct tokens): no `binding_token` (278, 455, 496, 1449, 1489, 1648, 1705) carries `aud`, which 1174 marks REQUIRED and whose absence a conformant Access Request Service MUST reject. The headline token at 278 (echoed at 455) decodes to `evaluation_id` alone, which 258 says does not satisfy the independent-service requirement, and carries no `binding_context_members` although 153 requires the set whenever Context is authorization-relevant. All five `approval.state` tokens (763, 893, 1536, 1767, 1810) omit the `iss` and `aud` that 824 makes MUST. Three (763, 893, 1536) carry no `exp`; the two that do (1767, 1810) expire thirty minutes before their `approved_until` (G9). The bulk token at 496 flattens items to strings and omits `subject`, against 1186. The denial and re-evaluation examples differ on `context.time` (1626, 1805) without a sentence saying the example PDP does not bind it. The re-evaluation request in the end-to-end example (1542 onward) omits `approval.state` although the preceding approval response returned it and 828 requires the `approval` object to be included unchanged. The completed-task examples carry only `id` and `status`, while the pending response is defined as echoing the Task Handle; the text does not state which shape a completed response uses.

**Correction.** Fix the remaining examples together once G1, G2, G4, and G9 settle what the tokens should contain. These are defects in illustrations, not additional protocol gaps. Gap tracking stays in this register, not in specification editor's notes.

**A4 partial correction (2026-09-18).** The former main Completed Task Response example, now under `artifact-completed-example`, includes `task.status_endpoint`. The re-evaluation request in End-to-End Manager Approval now echoes the exact `state` returned by its preceding completed-task response. The Completed Task response in that walkthrough now includes `task.status_endpoint`, matching its Part II copy. The new trusted-state examples contain no tokens; their completed Task Handles include `status_endpoint`, and the new end-to-end walkthrough explicitly states that its authorization-relevant Context is empty. These changes do not repair the illustrative JWT payloads, the other completed-task examples (including the original manager walkthrough), or the remaining context and expiry issues above. G15 remains open.

## Part C. Closed

- **G19.** The Time and Clock Skew guidance moved into Binding Integrity in the normative body (stage A5); its SHOULDs no longer sit in a non-normative appendix.
- **G16.** Folded into G6 as its test case.
- **G21.** Split: the `items` half to `BULK-GAPS.md`, the `callback` half to `CALLBACK-GAPS.md`.
- **G12, G18.** Moved to the companion registers.

## Coordination

- **The Access Request OAuth Profile** deploys the PEP and PDP roles in more than one place (its line 125): the authorization server may evaluate and defer its own token request, a protected resource may assert the denial as a signed challenge, or both may act as PEP. Its mapping (line 639 onward) consumes the `approval` object at `context.approval` as input to the issuance-time re-evaluation, binds `binding_token` and `evaluation_id` in issuer state without exposing them to the client, and uses `approved_until` as the bound on token lifetime. Resolutions of G2, G3, G6, G8, G9, and G11 must be checked against all three placements.

## Appendix. Candidate designs recorded during review

These were drafted while reviewing and are kept so the reasoning is not lost. They are not proposals, no entry relies on them, and each has failed or not yet had review.

**C1 (for G3).** Three configurations were sketched: aligned lifetime, where `exp` equals `approved_until` and revocation before then is unavailable, with a documented cap on approval lifetime; refreshed proof, where a status resource keyed by `approval_id` reissues `approval.state` to an authorized PEP while the approval is active; and shared state. The refreshed-proof sketch failed review as written: the PEP cannot read `exp` (809); refresh at enforcement time makes service availability a dependency of held access, and 1270's fail-closed guidance then turns an outage into fleet-wide revocation; and it needs a distinct reason code (G9).

**C2 (for G5).** An ordered algorithm was sketched: authenticate; resolve the idempotency record, returning the stored response for an equivalent retry without re-verifying the token and rejecting a changed body with `duplicate_request`; then, for new submissions only, verify signature and issuer, check replay on the pair of verified `iss` and `jti`, enforce freshness, compare binding, and record. It requires the service to store full response bodies and a normative equivalence such as JCS.

**C3 (for G4).** Two directions were sketched: a second JWK Set metadata member for Access Request Service keys, or a per-key role marker within the single set (RFC 7517 Section 4 permits additional JWK members) with issuer-first key selection. Neither has been evaluated against the profile's registration requests at 1276 onward.
