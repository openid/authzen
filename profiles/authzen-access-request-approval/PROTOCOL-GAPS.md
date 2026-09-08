# Gaps Register: AuthZEN Access Request and Approval Profile

Version 8. Status: register for the working group. This is not a design.

The register is organized in three parts. Part A lists protocol contracts that two independently implemented parties cannot complete from the current text and that need a working-group decision. Part B lists editorial and example corrections: the protocol is defined, but the text can be read wrongly or the examples do not follow it. Part C lists optional capabilities: behaviors the profile does not provide and could, without anything currently defined being broken. Entry numbers are stable identifiers from earlier versions and are not renumbered when an entry moves between parts.

Line references are to `authzen-access-request-approval-profile-1_0.md` on branch `arap-catalog-profile` and were checked against the file for this version. Severity, where given, is for interoperability between an independently implemented PDP and Access Request Service unless the entry states another axis. A short appendix records candidate designs drafted during review, labelled as such; no entry relies on the appendix.

Version 8 adds to G15 the headline `binding_token` example at 278, found during Pass 0. Version 7 corrects two citations from review of version 6: G13 no longer says a same-principal replacement process "recovers the task", since that depends on retained idempotency state and on G5; G18 attributes the permission to skip polling to line 630, not 935. Version 6, from a full re-check of version 5 against the profile and all twelve example-token occurrences: the register is split into the three parts above so that nineteen entries are no longer presented as nineteen protocol defects. G1 is narrowed to portable inline binding, since the hashed form is defined. G4 no longer implies that a shared JWK Set is inherently insecure. G5 no longer calls server-defined body equivalence undefined; the text permits it. G8's rationale is corrected: a prior `context.approval` can be present when a new binding set is chosen, because a re-evaluation response may carry a fresh requestable denial (835). G9 keeps the timestamp finding but no longer claims safe failure is undefined, since 813 rejects expired references and `approval_unverifiable` covers failed verification. G10 is reframed from a contradiction to an error-precedence and issuer-requirement question, because the earlier-of rules reject expired submissions without promising acceptance of unexpired ones, 256 already requires sufficient binding material, and the SHOULD at 1177 is not satisfied by an issuer that omits `denial_expires_at` while `exp` exceeds `expires_at`. G11 no longer implies the response member must be mandatory. G12 is reclassified as editorial, since 1186 defines bundle order and exempts per-item denials. G13 and G17 are reclassified as optional capabilities. G14, G7, G15, and G19 are grouped as editorial. G16 is folded under G6 as its test case. G18 no longer presents an echo and a problem type as prerequisites.

## Part A. Protocol contracts requiring decisions

### G1. The inline denial-binding form never names its claims

**Evidence.** Line 258 requires, for an independent Access Request Service, a self-contained `binding_token` carrying Subject, Resource, Action, and authorization-relevant Context "inline or as a `binding_hash`". Lines 1179 to 1180 make the inline form RECOMMENDED for interoperability and describe how it is compared, but never name the claim or claims that carry the four values. `binding_hash` (1181), `binding_context_members` (1178), and `denial_expires_at` (1177) are named; the inline claims are not.

**What is missing.** The claim names for the inline form. The hashed form is fully specified, so an independent deployment can interoperate today by using `binding_hash`; what is blocked is the portable use of the form the text recommends.

**Severity.** Blocking for portable inline binding; none for the hashed form.

**Direction.** Name the inline binding claims. Related: the list at 1171 is introduced by "SHOULD include the following claims" while members inside it carry verifier-side MUSTs (1174, 1198); how that force is expressed belongs to the same decision.

### G2. `approval.state` has no standardized signed payload

**Evidence.** Line 824 names `iss`, `aud`, and a `kid` header. Line 826 lists what the PDP must "be able to determine" without naming claims. Line 811 requires an identifier cross-check without saying which claim holds the identifier. Decoded examples: 763 carries only `approval_id`; 1767 carries `approval_id`, `scope`, and `exp`; none carries `iss` or `aud`. The `kid: pdp-1` on 1767 is permitted, since 824 allows "the PDP acting through" the Access Request Service to sign.

**What is missing.** A payload that lets an independent PDP verify a bound reference without a deployment-specific agreement. Such agreements remain possible and are how the text is implementable today.

**Severity.** Blocking for the portable bound-reference flow the text promises.

**Direction.** A named claim set that accommodates the broadened-scope approvals the profile relies on (1750, 861, 121) and settles the semantics of any per-artifact identifier together with the meaning of "replayed" at 813, given that reuse within scope is the normal case (856 to 858).

### G3. Purely signed approval verification has no standardized way to satisfy the current-status requirement

**Evidence.** Line 850: the PDP MUST check current approval status including revocation before `approved_until`. Line 795: re-evaluation does not require the PDP to retain state. Line 661: terminal task states never transition, so the Task Status Endpoint cannot report that an `approved` task's approval was later revoked.

**What is missing.** Where approval provisions backing state the PDP evaluates, which 799 and 856 describe as normal and 844 to 845 assume, the check is satisfiable. For an approval whose only artifact is a signed `approval.state` with no provisioned entitlement, such as the tool-class case at 1750 to 1767, no standardized path carries revocation to a PDP that shares no state.

**Severity.** Significant.

**Direction.** State what a PDP without shared state is expected to do at 850. A withdrawn candidate is recorded in the appendix as C1.

### G4. Issuer and audience identifiers and key-to-issuer trust are undefined

**Evidence.** Line 1173: `iss` is "PDP identifier" with no definition. Line 1174: `aud` is "Access Request Service identifier" with no definition. Line 202: one `jwks_uri` holds keys for both artifacts "distinguished by their `kid` and by the JWS `iss`". Line 824: a PDP that resolves a key "not trusted for the claimed `iss`" MUST reject, which presupposes an issuer-to-key trust configuration no section defines, while 1095 matches keys by `kid` alone. The registry description of `jwks_uri` is at 1294 to 1298.

**What is missing.** Identifier values and an interoperable statement of which keys a verifier trusts for which issuer. Sharing one JWK Set is not itself insecure; the question is how the trust configuration is expressed so that 824 and 1095 describe the same procedure.

**Severity.** Significant.

**Direction.** Define both identifiers and the key-to-issuer trust configuration. Candidate mechanisms are recorded in the appendix as C3 and have not been evaluated.

### G5. Retry processing versus fresh-submission validation is not ordered

**Evidence.** Line 419: same `Idempotency-Key`, requester, and equivalent body returns the same task, where equivalence is "a deterministic comparison chosen by the Access Request Service" that "need not be interoperable". Line 970: same key with a non-equivalent body is `duplicate_request`. Line 1176: the service SHOULD track `jti` to detect replay. Lines 1190 to 1198 fix an order within token verification but say nothing about where the idempotency lookup sits relative to it.

**What is missing.** Whether a repeated submission is recognized as a retry before or after token verification, replay detection, and freshness. A retry after a lost response repeats the same token and `jti`; a repeated token and key with a changed body meets both 970 and the replay rule; a freshness check before retry recognition makes a lost response unrecoverable after expiry. Server-defined body equivalence is explicitly permitted by 419 and is not itself a gap; the question is only where the equivalence check sits in the order.

**Severity.** Significant.

**Direction.** Define the precedence between retry recognition and fresh-submission validation. A candidate design is recorded in the appendix as C2.

### G6. Caller, requester, and client binding lack identity and comparison semantics

**Evidence.** Line 826 binds the approval record to "requester and client". Line 1099 binds the task to "requester, and client". Line 813 verifies applicability to "the authenticated caller or requester". Line 374 defines `client` as supplementary application metadata with no verification. "Requester" means the Subject at 544 and 1248 and the authenticated caller at 419 and 1099.

**What is missing.** Four identities are in play: the Subject of the evaluation; the principal the Access Request Service authenticated as submitter; the client identity associated with the submitter's credential; and the principal that later presents `context.approval`. Each binding rule must name which identity it compares. A rule keyed on the self-asserted `client.id` at 374 is satisfiable by any requester behind a shared client. JWT access tokens carry `client_id` (RFC 9068 Section 2.2) and introspection returns it (RFC 7662 Section 2.2); these identify the token's client, not necessarily its presenter.

**Test case (formerly G16): the acting party.** Line 860 excludes `subject.properties.act` from scope matching and `client.actor` appears in no comparison rule, so scope matching alone does not distinguish one agent from another acting for the same person. In the agent example the denial is for a person acting through a named agent (1610 to 1616), the re-evaluation presents the same chain (1786 to 1796), and the approval is a seven-day tool-class grant (1750, 1766). Whether that matters depends on how the applicability check at 813 and 1163 is defined: if the acting party is established there through an authenticated identity or a verified chain, scope matching need not carry it; if 813 binds only the human requester, two agents sharing a runtime identity are indistinguishable. Passing scope matching does not by itself permit reuse. Any resolution of G6 must say what happens in this case.

**Severity.** Significant.

**Direction.** Define the four identities in Terminology, then state each binding rule against a named identity, and answer the acting-party test case.

### G9. Signed approval state may expire before `approved_until`: intended, and is recovery supported?

**Evidence.** The agent example's `approval.state` at 1767 and 1810 carries `exp` 1779210000, which is 2026-05-19T17:00:00Z; the surrounding `approval` objects at 1766 and 1809 carry `approved_until` 2026-05-19T17:30:00Z. Line 1165 requires the PDP to verify expiry of a by-value artifact; 813 rejects an expired reference; 846 defines `approval_unverifiable` for failed verification; 807 lets the PEP present the approval until `approved_until`.

**What is missing.** Failure is defined and safe: between 17:00 and 17:30 the PDP rejects the artifact under 813 and may return `approval_unverifiable`. `approved_until` is a maximum bound, not a guarantee that every proof stays usable until then. What the text does not say is whether proof shorter than the approval is intended, and whether a PEP holding a live approval with an expired artifact has any defined way to continue other than a new request.

**Severity.** Minor on the PDP and Access Request Service axis; a lifecycle question for PEPs.

**Direction.** State whether artifact lifetime shorter than `approved_until` is intended and whether any recovery is supported.

### G10. Error precedence when a submission is both expired and insufficiently bound, and the force of the issuer-side freshness claim

**Evidence.** Line 965 defines `expired_denial` by the earlier of `denial.expires_at` and `exp`; step 5 at 1196 and the first sentence of 1198 enforce that deadline. The third sentence of 1198 adds a distinct rejection: when no protected denial-expiry value is present and `exp` is later than the echoed `denial.expires_at`, the binding material is insufficient and the submission is rejected with `invalid_denial_binding`. Line 256 requires the PDP to provide enough binding material to verify freshness. Line 1177 recommends `denial_expires_at` "unless the token's `exp` is no later than that value".

**What is missing.** The earlier-of rules reject expired submissions; they do not promise acceptance of unexpired ones, and 1198's third sentence is a legitimate additional validation with a clear rationale (an unprotected echoed `expires_at` must not be the only bound). An issuer that omits `denial_expires_at` while `exp` exceeds `expires_at` is not following 1177, and 256 already obliges it to supply sufficient material. Two things remain open: which error a service returns when a submission is both past its deadline and insufficiently bound, and whether the issuer-side obligation at 1177 and 256 should be stated as a MUST given that 1198 rejects its absence. Version 5 of this register called this a blocking contradiction; it is not.

**Severity.** Minor for error precedence; the force question belongs with G1.

**Direction.** State the error precedence, and decide the force of the issuer-side freshness claim as part of the G1 conversation.

### G11. The response-side expiry has no defined location or shape

**Evidence.** Line 852 hangs a MUST NOT on an expiry "typically as `context.approval.approved_until`" in the re-evaluation response. The examples at 906 to 910 and 1825 to 1828 return it. The registry at 1365 defines `approval` only as the request-side reference the PEP supplies.

**What is missing.** Where and in what shape a PDP conveys approval expiry in a response, so that the PEP obligation at 852 and the OAuth companion's use of `approved_until` as a token-lifetime bound rest on a defined member. Making the member mandatory is one option, not a requirement.

**Severity.** Minor between PDP and Access Request Service; significant for PEPs and for the OAuth companion.

**Direction.** Standardize the response-side location and shape, or reword 852 to not depend on it.

### G18. Callback acceptance and omitted-event semantics are undefined

**Evidence.** Line 921 requires the service to validate that a callback endpoint is authorized for the PEP and to reject unauthorized or internal addresses. The problem types at 955 to 995 define nothing for that rejection, and nothing says whether the submission fails or the callback is dropped. Line 927 does not say whether an omitted `events` means all events. Line 630 lets a PEP that has registered a callback skip polling on the strength of notification.

**What is missing.** What a PEP can conclude about whether its callback was accepted, and what an omitted `events` filter means. An echo of the accepted callback in the Task Handle and a dedicated problem type are possible answers, not prerequisites.

**Severity.** Significant for callback deployments.

**Direction.** Define callback acceptance and rejection semantics and the meaning of an omitted `events`.

## Part B. Editorial and example corrections

### G7. Wording at 860 that can be misread, and the separate usability question

**Evidence.** Line 1184 defines object equality as the same member names with recursively equal values. Line 860 requires equality "member by member, to the bound values, using the same structural comparison" and says the comparison includes the full objects "including any `properties` members present in the bound values".

**Correction.** The phrase "including any" can be misread as a subset rule, but the same sentence requires full-object equality under 1184; the text does not license a subset reading. Clearer wording removes the temptation. Whether bound-subset matching should be allowed, to tolerate attribute drift at re-evaluation, is a separate behavior change needing a security justification.

### G8. Exclude approval machinery from authorization-relevant Context explicitly

**Evidence.** The Authorization-Relevant Context definition at 148 to 156 excludes `access_request`, `evaluation_id`, `evaluated_at`, and `reason` (149). `approval` is placed at `context.approval` on re-evaluation (828) and is not on the list. A re-evaluation that presents an approval can be denied and receive a fresh requestable denial (835), so a prior `context.approval` can be present in the request whose Context the PDP is binding.

**Correction.** Add `approval` to the list at 149. Version 5 of this register argued that `approval` could never be present at denial time; that is wrong given 835, which makes the explicit exclusion more useful, not less. Whether volatile-member exclusion should become a MUST is a policy change and not part of this correction.

### G12. Bulk bundle order is defined; the PEP-facing explanation is missing

**Evidence.** Line 1186 binds inline and hashed bulk claims to the items "in the same order as the bound Access Request", and applies single-item verification instead when every item carries its own `denial`. Nothing in Access Request Submission (344 to 352) or PEP Processing Rules (1051 to 1070) tells the PEP that bundle order is bound.

**Correction.** The wire constraint exists at 1186 and need not be repeated in a checklist to be normative. Version 5 of this register called the comparison undefined; it is not. Add a PEP-facing sentence explaining that bundle-bound submissions must preserve item order and that per-item denials are exempt.

### G14. PEP-side handling when a denial-supplied `endpoint` is not trusted

**Evidence.** Line 1057: the PEP MUST use `context.access_request.endpoint` when present, and the metadata endpoint otherwise. Line 1230: an autonomous PEP MUST verify that URLs from the denial resolve to trusted hosts before acting on them.

**Correction.** No submission is already the required outcome when a denial overrides `endpoint` to an untrusted host; 1057's "otherwise" clause does not fire. The wire protocol is not in question. Guidance on what the PEP surfaces to a human requester and whether it reports the event is a separate, non-protocol clarification.

### G15. Example defects

**Evidence.** Decoding all twelve token occurrences (five distinct tokens): no `binding_token` (278, 455, 496, 1449, 1489, 1648, 1705) carries `aud`, which 1174 marks REQUIRED and whose absence a conformant Access Request Service MUST reject. The headline token at 278 (echoed at 455) decodes to `evaluation_id` alone, which 258 says does not satisfy the independent-service requirement, and carries no `binding_context_members` although 153 requires the set whenever Context is authorization-relevant. All five `approval.state` tokens (763, 893, 1536, 1767, 1810) omit the `iss` and `aud` that 824 makes MUST. Three (763, 893, 1536) carry no `exp`; the two that do (1767, 1810) expire thirty minutes before their `approved_until` (G9). The bulk token at 496 flattens items to strings and omits `subject`, against 1186. The denial and re-evaluation examples differ on `context.time` (1626, 1805) without a sentence saying the example PDP does not bind it.

**Correction.** Fix the examples together once G1, G2, G4, and G9 settle what the tokens should contain. These are defects in illustrations, not additional protocol gaps. The restructure plan deliberately leaves them and adds a note.

### G19. Appendix guidance with normative dependents

**Evidence.** The clock-skew clauses at 240, 400, and 1097 condition MUST-rejects on "any clock-skew tolerance it has configured" and point to Implementation Considerations, which is declared non-normative at 1835 yet carries SHOULDs at 1855 to 1861.

**Correction.** The configured-tolerance behavior is defined. What needs clarifying is the status of the appendix guidance: either move its normative sentences into the section that first needs them or reword them as non-normative.

## Part C. Optional capabilities

### G13. Cross-principal recovery of a lost Task Handle

**Evidence.** Line 419 keys an idempotent retry on the same `Idempotency-Key`, the same authenticated requester, and an equivalent body. Lines 617 and 1117 let a different principal that already holds a Task Handle interact with it.

**Status.** Existing behavior is not broken: a replacement process authenticating as the same requester remains within the existing idempotency scope, subject to G5 and to retained idempotency state (the retry rule at 419 is itself a SHOULD), and a different principal holding the handle uses the portability rules. A different principal that lost the response before obtaining the handle has no recovery path. That is a new capability with its own authorization question, should the working group want it.

### G17. An advertised maximum pending duration

**Evidence.** Line 536 makes `task.expires_at` OPTIONAL. Line 630 has PEPs stop polling at terminal status or when `task.expires_at` is reached; 742 requires `task_expired` or `unknown_task` after expiry or removal; 686 makes `task.expires_at` the trigger for the `expired` transition.

**Status.** Completion detection does not depend on the member. What the profile does not guarantee is an advertised bound on how long a task may stay `pending`; a PEP can choose its own wait budget. Making `task.expires_at` REQUIRED, or defining a default deadline policy, would be an additional guarantee.

## Coordination

- **Order, by cost to fix and by dependency, not by severity.** (1) Part B corrections G8, G7, G12, G19: editorial, no design. (2) G6 with its acting-party test case, before any binding rule. (3) G1, G2, G4, and G10's force question as one conversation about what an independent Access Request Service can verify and how the claim list's force is expressed; a negotiation mechanism such as a capability URN belongs here. (4) G9. (5) G5 as an issue; the candidate design in the appendix is input, not a proposal. (6) G3. (7) G11, G18, and G10's error precedence as short individual issues. (8) Part C, if the working group wants either capability. (9) G15 after (3) and (4) settle; G14's guidance whenever convenient.
- **The Access Request OAuth Profile** deploys the PEP and PDP roles in more than one place (its line 125): the authorization server may evaluate and defer its own token request, a protected resource may assert the denial as a signed challenge, or both may act as PEP. Its mapping (line 639 onward) consumes the `approval` object at `context.approval` as input to the issuance-time re-evaluation, binds `binding_token` and `evaluation_id` in issuer state without exposing them to the client, and uses `approved_until` as the bound on token lifetime. Resolutions of G2, G3, G6, G8, G9, and G11 must be checked against all three placements.

## Appendix. Candidate designs recorded during review

These were drafted while reviewing and are kept so the reasoning is not lost. They are not proposals, no entry relies on them, and each has failed or not yet had review.

**C1 (for G3).** Three configurations were sketched: aligned lifetime, where `exp` equals `approved_until` and revocation before then is unavailable, with a documented cap on approval lifetime; refreshed proof, where a status resource keyed by `approval_id` reissues `approval.state` to an authorized PEP while the approval is active; and shared state. The refreshed-proof sketch failed review as written: the PEP cannot read `exp` (809); refresh at enforcement time makes service availability a dependency of held access, and 1270's fail-closed guidance then turns an outage into fleet-wide revocation; and it needs a distinct reason code (G9).

**C2 (for G5).** An ordered algorithm was sketched: authenticate; resolve the idempotency record, returning the stored response for an equivalent retry without re-verifying the token and rejecting a changed body with `duplicate_request`; then, for new submissions only, verify signature and issuer, check replay on the pair of verified `iss` and `jti`, enforce freshness, compare binding, and record. It requires the service to store full response bodies and a normative equivalence such as JCS.

**C3 (for G4).** Two directions were sketched: a second JWK Set metadata member for Access Request Service keys, or a per-key role marker within the single set (RFC 7517 Section 4 permits additional JWK members) with issuer-first key selection. Neither has been evaluated against the profile's registration requests at 1276 onward.
