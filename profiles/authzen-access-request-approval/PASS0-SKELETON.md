# Target Skeleton for PR A1 (commit 2)

Generated from `PASS0-INVENTORY.tsv` (`a1_dest`) and the plan. Each heading lists its level, anchor, and the units it receives in order. Order within a heading is source order; where several source ranges feed one heading they appear in the order listed. Every anchor in `PASS0-ANCHORS.tsv` appears on exactly one heading below.

**Text without a row.** Blank lines, code blocks, and prose without a keyword travel with the nearest preceding unit of the same source range; where a range has no preceding unit, it travels with the heading listed for that range. Definition-list whitespace stays with the list's lead-in. Headings of source sections that dissolve are dropped under precedence rule 5 unless an anchor listed here keeps them; sub-headings of sections that move whole are enumerated below and move with their body text.

**Structure decisions for A1.** Section 6 becomes a level-1 heading and absorbs the two paragraphs of the current level-1 Access Request Endpoint (323 to 328). Sections 11 and 15 are not created in A1; the units with final destination 11 stay in Section 5 and are moved in A2. Section 22 is created with a pointer list (below) and no other content. Section 4 carries an A1 title matching its content; A2 renames it when the roles prose arrives.

**A1 insertions (cross-references and pointers only; no other wording changes).**
- Pointer lines at the four definition-list lead-ins whose sub-entries leave: `access_request` (231) to Section 20 for `form_url` and `request_schema_url`; `requested_access` (365 to 366) to Section 19 for `emergency`; `client` (374 to 375) to Section 19 for `actor` and `source`; `task` (516) to Section 18 for `progress` and to Section 14 for `items`.
- A cross-reference line between the eligibility rules at 1104 (Section 10.3) and 1218 (Section 10.4.1).
- Citations `{{binding-token-integrity}}` added after "these claims" at 1190 (Section 6) and after "the binding claims" at 1186 (Section 12).
- A cross-reference from Section 7 (`partial` definition at 654) to Section 14, and from Section 6.2 (Actor and Source Verification) to the Section 19 definitions.
- Section 22 pointer list, one line each: Denial Remains Denial (1153) to Section 1; Confused Deputy and Request Substitution (1157) and Approval Reference Substitution (1161) and Approval Replay (1206) to Section 8; Binding Token Integrity (1167) to Sections 5, 6, 12, and 4; Overbroad Approval (1212) and Approver Eligibility (1216) to Section 10; Emergency Access (1220) to Section 19; Trusting URLs (1226) to Section 5; Task Handle Leakage (1232) and PEP-Facing vs End-Client-Facing Surfaces (1236) and Availability (1268) to Section 7; Callback Security (1256) to Section 16; PEP Acting on Behalf of the Subject (1260) and Idempotency Key Abuse (1264) to Section 6.
- The editor's notes listed in the plan's Section 8.

# [1] Introduction
- REQ-463 L80 (Editor) narrative: opening paragraph: what the AuthZEN Authorization API does
- REQ-464 L82 (Editor) narrative: classic deployments: authority fixed at provisioning time
- REQ-004 L95 (Editor) Lead-in sentence introducing the six-step flow
- REQ-005 L97 (PEP) Step 1: the PEP evaluates access using the AuthZEN Access Evaluation API
- REQ-006 L98 (PDP) Step 2: the PDP returns `decision: false` and a structured `access_request` object in the Decis
- REQ-007 L99 (PEP) Step 3: the PEP submits an access request to the Access Request Endpoint
- REQ-008 L100 (ARS) Step 4: the Access Request Service returns an opaque task handle
- REQ-009 L101 (PEP) Step 5: the PEP can poll, receive a callback, or otherwise use the task handle to determine com
- REQ-010 L102 (PEP) Step 6: the PEP performs a new AuthZEN Authorization API evaluation; the PDP remains authoritat
- REQ-011 L104 (Editor) Non-goals: no workflow engine, approval policy language, ticketing system, catalog, UI, or appr
- REQ-370 L1155 (PEP) MUST NOT grant access on a requestable denial; access only after an enforced approved completio
## [1] Protocol Overview
- REQ-024 L160-186 (Editor) ASCII-art sequence diagram of the six-step flow across PEP, PDP, and Access Request Service
- REQ-025 L188 (PEP) PEP MUST NOT permit the requested operation based only on the presence of `context.access_reque

# [2] Requirements Notation and Conventions
- REQ-013 L110 (Editor) BCP 14 boilerplate directive supplying the RFC 2119 and RFC 8174 keyword definitions
- REQ-014 L112 (Definition) PDP, PEP, Subject, Resource, Action, Context, and Decision are used as defined by {{AuthZEN}}

# [3] Terminology
- REQ-017 L131-132 (Definition) Access Request: a request submitted after a denied decision asking that access be approved, gra
- REQ-018 L134-137 (Definition) The Access Request Service role MAY be played by the PDP, a trusted service, or an independent 
- REQ-019 L139-140 (Definition) Requestable Denial: a Decision with `decision` false and a Decision Context indicating the acce
- REQ-020 L142-143 (Definition) Task Handle: an opaque identifier and associated status endpoint representing the lifecycle of 
- REQ-021 L145-146 (Definition) Approval Result: the completed result of a task; it does not itself permit access
- REQ-022 L148-156 (PDP) PDP SHOULD exclude volatile members and MUST make any authorization-relevant member explicit an
- REQ-023 L148-156 (ARS) Access Request Service MUST use exactly the PDP's integrity-protected or server-resolved author

# [4] PDP Metadata, Endpoint Protection, and Interoperability Baseline  (no rows in A1)
## [4] PDP Metadata {#discovery}
- REQ-028 L196 (PDP) PDP MUST publish an `access_request_endpoint` in PDP metadata; the value MUST be an HTTPS URI
- REQ-029 L198 (PDP) PDP SHOULD include `urn:openid:authzen:capability:access-request` in the `capabilities` array
- REQ-030 L202 (PDP) PDP MUST publish a `jwks_uri` in PDP metadata pointing at a JWK Set of the verification keys
- REQ-031 L204 (PDP) Each JWK SHOULD include a `kid` and SHOULD include a `use` parameter distinguishing signing key
- REQ-032 L206 (Verifier) Verifier SHOULD refresh the JWK Set before rejecting the input
- REQ-033 L208-221 (Editor) Non-normative PDP metadata example showing `access_request_endpoint`, `jwks_uri`, and the capab
- REQ-034 L223 (PDP) PDP metadata MUST identify the endpoint actually used by the PEP to submit access requests
## [4] Endpoint Protection
- REQ-350 L1109 (ARS) Endpoints are protected APIs; OAuth 2.0 RECOMMENDED; with bearer tokens they MUST follow RFC675
- REQ-351 L1111 (ARS) MUST authenticate the PEP or caller and verify authorization for the supplied Subject, Resource
## [4] Interoperability Baseline {#interoperability-baseline}
- REQ-402 L1204 (ARS) MUST support verifying a binding_token presented as a JWS in compact serialization
- REQ-403 L1204 (PDP) MUST support verifying an approval.state presented as a JWS in compact serialization

# [5] Requestable Denial  (no rows in A1)
## [5] Requestable Denial Context {#requestable-denial-context}
- REQ-035 L227 (PDP) PDP MAY include an `access_request` object in the Decision Context
- REQ-036 L229 (PDP) PDP MUST include `context.access_request` only when the denied access is eligible for submissio
- REQ-037 L229 (PEP) PEP MUST treat the absence as a non-requestable denial regardless of any other context members
- REQ-038 L231 (Editor) Lead-in introducing the `access_request` member definition list
- REQ-039 L233-234 (PEP) PEP MUST use the `access_request_endpoint` from PDP metadata
- REQ-040 L236-237 (PEP) PEP MUST NOT interpret the `template` value
- REQ-041 L239-240 (PDP) `expires_at` is REQUIRED in the `access_request` object
- REQ-042 L239-240 (ARS) Access Request Service MUST reject the submission, after applying any clock-skew tolerance it h
- REQ-043 L242-243 (PDP) Value MUST be integrity protected, SHOULD be a PDP-signed JWS; JWE MAY be added for PEP-invisib
- REQ-044 L242-243 (PEP) PEP MUST NOT decode, modify, or interpret it, and returns it unchanged as `denial.binding_token
- REQ-045 L245-246 (PEP) PEP MAY ignore this member
- REQ-048 L254 (Definition) `context.reason` is the machine-readable Decision reason code, echoed by the PEP as `denial.rea
- REQ-049 L256 (PDP) PDP MUST provide denial-binding material; the denial MUST include `expires_at` and at least one
- REQ-050 L258 (PDP) `binding_token` is REQUIRED and MUST be self-contained, carrying Subject, Resource, Action, and
- REQ-051 L259 (Definition) Defines the `evaluation_id` by-reference binding form resolved against shared state within a se
- REQ-052 L261 (PDP) PDP MAY emit both forms and MAY return a stable `context.evaluation_id` alongside a `binding_to
- REQ-053 L261 (ARS) Access Request Service resolves `evaluation_id` as a binding form only when no `binding_token` 
- REQ-054 L263 (PDP) PDP MUST NOT include `context.access_request` in the Decision Context
- REQ-055 L265-288 (Editor) Non-normative example of a requestable denial carrying evaluation_id, evaluated_at, reason, and
## [5] Evaluation Identifier {#evaluation-identifier}
- REQ-056 L292 (Definition) Defines `evaluation_id` as a first-class identifier for an evaluation, used to bind a submissio
- REQ-057 L294 (ARS) Access Request Service SHOULD retain the original `evaluation_id` in the approval record for au
- REQ-058 L296 (Definition) `context.evaluation_id` is a string returned by the PDP and echoed by the PEP as `denial.evalua
- REQ-059 L298 (PDP) `evaluation_id` MUST be stable; SHOULD be namespace-unique; MAY be reused only after the bindin
- REQ-060 L300 (PDP) PDP MUST include `evaluation_id` as verifiable denial-binding material
- REQ-061 L302 (Profile) Bridging profiles MAY use `evaluation_id` directly as the transaction-binding identifier
- REQ-062 L304 (PDP) PDP MAY return `context.evaluated_at`, an RFC 3339 timestamp of when the Decision was produced
## [5] Structural Comparison {#structural-comparison}
- REQ-390 L1184 (Definition) defines structural comparison of JSON values: JCS number equality, codepoint strings, ordered a
## [5] Denial Binding Claims {#binding-token-integrity}
- REQ-376 L1169 (PDP) MUST integrity-protect binding_token verifiably by the ARS, SHOULD issue it as a JWS, MAY add J
- REQ-377 L1171 (PDP) SHOULD include the claims listed at 1173-1182
- REQ-378 L1173 (PDP) iss carries the PDP identifier so the ARS can select the verification key from the PDP JWK Set
- REQ-379 L1174 (PDP) aud REQUIRED: the ARS identifier, or an array of identifiers including it
- REQ-380 L1174 (ARS) MUST reject a JWT that lacks aud or whose aud does not include the ARS identifier
- REQ-381 L1175 (PDP) include iat and exp; expiry SHOULD be short, typically minutes, aligned with the denial hint li
- REQ-382 L1176 (PDP) include jti, a unique token identifier
- REQ-383 L1176 (ARS) SHOULD track recently-seen jti values until exp to detect replay
- REQ-384 L1177 (PDP) denial_expires_at carries context.access_request.expires_at from the requestable denial
- REQ-385 L1178 (PDP/ARS) binding_context_members present and MAY be empty; the ARS uses exactly this set when comparing 
- REQ-386 L1179 (PDP) include binding claims identifying the denied evaluation; the inline form is RECOMMENDED
- REQ-387 L1180 (PDP/ARS) bind full Subject, Resource, Action objects and authorization-relevant Context; the ARS compare
- REQ-388 L1181 (Implementation) MUST use exactly the base64url SHA-256 over RFC8785 JCS serialization construction given
- REQ-389 L1182 (PDP) evaluation_id claim carries the PDP identifier for the evaluation
## [5] Trusting URLs from the Requestable Denial
- REQ-409 L1228 (PEP) threat narrative: URLs delivered in or via a denial may point at attacker-controlled hosts
- REQ-410 L1230 (PEP) MUST verify the host is trusted (same origin as advertised endpoint, or allowlist) before fetch

# [6] Submitting the Access Request
- REQ-072 L325 (Definition) The Access Request Endpoint accepts an Access Request submission and returns a Task Handle
- REQ-073 L327 (Definition) The endpoint is identified by `access_request_endpoint` metadata or by `context.access_request.
## [6] Access Request Submission {#access-request-submission}
- REQ-074 L331 (PEP) PEP submits the Access Request using the HTTP `POST` method as defined in {{RFC9110}}
- REQ-075 L333 (Definition) the request body is a JSON object with the members that follow
- REQ-076 L335-336 (PEP) `subject` REQUIRED: the submission carries the AuthZEN Subject from the denied evaluation
- REQ-077 L338-339 (PEP) `resource` REQUIRED when `items` is absent; MUST be omitted when `items` is present
- REQ-078 L341-342 (PEP) `action` REQUIRED when `items` is absent; MUST be omitted when `items` is present
- REQ-084 L352-353 (PEP) submission-time augmentations MUST NOT change or remove authorization-relevant context from the
- REQ-085 L352-353 (Deployment) deployments SHOULD place submission-time input in well-defined extension members rather than ov
- REQ-086 L355-356 (PEP) `denial` object REQUIRED, binding the Access Request to the denied AuthZEN Decision
- REQ-087 L358 (Definition) the `denial` binds the single submitted Subject, Resource, Action, and authorization-relevant C
- REQ-088 L359 (PEP) bundle `denial` binding material MUST cover the Subject, authorization-relevant Context, and ev
- REQ-089 L361 (PEP) top-level `denial` is OPTIONAL
- REQ-090 L363 (ARS) MUST reject with `urn:openid:authzen:access-request:error:invalid_denial_binding`
- REQ-091 L365-366 (PEP) `requested_access` OPTIONAL object; additional members MAY be included subject to {{extension-n
- REQ-092 L368 (Definition) `requested_until` is a String {{RFC3339}} timestamp requesting access through a specific absolu
- REQ-095 L374-375 (PEP) `client` OPTIONAL object identifying the PEP or calling application; implementations MAY includ
- REQ-096 L377 (PEP) `client.id` OPTIONAL string identifying the calling application or PEP deployment
- REQ-097 L378 (PEP) `client.name` OPTIONAL string, human-readable name of the calling application
- REQ-107 L389 (ARS) MUST NOT rely on them as authorization input unless the values are independently verified by th
- REQ-108 L391 (Definition) each `denial` field maps to one member of the denied evaluation response; the object does not e
- REQ-109 L393-394 (PEP) `evaluation_id` echoed unchanged from `context.evaluation_id`; SHOULD be preferred over `evalua
- REQ-110 L393-394 (ARS) MUST be able to resolve or validate `evaluation_id` before relying on it
- REQ-111 L396-397 (PEP) `evaluated_at` OPTIONAL {{RFC3339}} timestamp echoed from `context.evaluated_at` of the denied 
- REQ-112 L399-400 (PEP) `expires_at` REQUIRED, echoed unchanged from `context.access_request.expires_at` of the denied 
- REQ-113 L399-400 (ARS) MUST reject the submission, after applying any configured clock-skew tolerance
- REQ-114 L402-403 (PEP) `reason` OPTIONAL string, echoed unchanged from `context.reason` of the denied evaluation
- REQ-115 L405-406 (PEP) `binding_token` echoed byte-for-byte; the PEP MUST NOT decode, modify, or interpret the value
- REQ-116 L408-409 (PEP) `template` OPTIONAL string echoed unchanged; the service uses it to route the request to a work
- REQ-117 L411 (PEP) PEP determines the additional `context` and `requested_access` members from the referenced JSON
- REQ-118 L413 (PEP) MUST submit an Access Request only for a Decision with `decision` false and a `context.access_r
- REQ-119 L415 (PEP) submitted `denial` MUST include either `denial.binding_token` or `denial.evaluation_id`
- REQ-120 L415 (ARS) MUST reject with `urn:openid:authzen:access-request:error:invalid_denial_binding`
- REQ-121 L417 (PEP) SHOULD include an `Idempotency-Key` header covering the entire submission body, including all `
- REQ-122 L419 (ARS) SHOULD return the same Task Handle for an equivalent body; MUST reject a materially different b
- REQ-123 L421 (ARS) SHOULD retain Idempotency-Key state until `task.expires_at` plus 24 hours after terminal status
- REQ-124 L423-459 (Editor) non-normative single-item submission example
### [6] Idempotency Key Abuse
- REQ-425 L1266 (Implementation) SHOULD scope idempotency keys to the authenticated caller and avoid storing them longer than ne
## [6] Actor and Source Verification
- REQ-362 L1133 (ARS) MUST authenticate the PEP, verify the credential authorizes the whole chain, and reject unverif
- REQ-363 L1135 (ARS) MUST NOT treat it as authorization input; MAY retain it as audit metadata only
- REQ-424 L1262 (ARS) MUST reject submissions whose claimed chain cannot be verified
## [6] Verifying the Denial Binding {#verifying-denial-binding}
- REQ-393 L1190 (ARS) stem of the five-step receipt procedure at 1192-1196
- REQ-394 L1192 (ARS) parses the JWS header and resolves the verification key from the JWK Set at the PDP jwks_uri
- REQ-395 L1193 (ARS) verifies the signature, the aud claim, and the expiry
- REQ-396 L1194 (ARS) checks jti against recently-seen tokens to detect replay
- REQ-397 L1195 (ARS) compares binding claims against the submission, rejecting a mismatch with invalid_denial_bindin
- REQ-398 L1196 (ARS) enforces freshness as the earlier of token exp and denial.expires_at, rejecting with expired_de
- REQ-399 L1198 (ARS) MUST enforce the earlier deadline, MUST verify the echoed expires_at, reject with invalid_denia
## [6] Access Request Response {#access-request-response}
- REQ-126 L504 (ARS) returns `201 Created` or `202 Accepted` with a `task` member; MAY include a `Location` header e
- REQ-127 L506 (Definition) the response object has the top-level members that follow
- REQ-128 L508-509 (ARS) `task` REQUIRED: the Task Handle returned for the submitted Access Request
- REQ-129 L511-512 (ARS) `result` OPTIONAL except where {{completed-task-response}} requires it
- REQ-130 L511-512 (PEP) MUST NOT treat `result` as approval unless the task is approved and the result is enforceable u
- REQ-131 L514 (ARS) SHOULD return `201 Created` with `task.status` already terminal and a populated `result`
- REQ-132 L514 (PEP) MUST handle the synchronous-completion case without polling
- REQ-133 L516 (Definition) the `task` object has the members that follow
- REQ-134 L518-519 (ARS) `id` REQUIRED, opaque and unguessable; MUST have sufficient entropy and MUST NOT encode semanti
- REQ-135 L521-522 (ARS) `status` REQUIRED, current task status using the values defined in {{task-status}}
- REQ-136 L524-525 (ARS) `status_endpoint` REQUIRED HTTPS URI used to retrieve task status
- REQ-142 L535-536 (ARS) `expires_at` OPTIONAL {{RFC3339}} timestamp after which the task handle is no longer valid
- REQ-143 L538-539 (ARS) `display` OPTIONAL object of user-interface hints for the pending request
- REQ-144 L541-542 (ARS) `links` OPTIONAL object mapping link relation types to HTTPS URIs; implementations MAY define a
- REQ-145 L544 (Definition) `ticket` is the URL where the requester (Subject) can view the request and its status
- REQ-146 L545 (Definition) `review` is the URL where an approver or administrator can review or act on the request
- REQ-147 L546 (Definition) `cancel` is the URL where the PEP can cancel the request
- REQ-158 L564-586 (Editor) non-normative pending Task Handle response example
- REQ-159 L588-609 (Editor) non-normative synchronous-completion response example

# [7] Checking the Task  (no rows in A1)
## [7] Task Status Endpoint {#task-status-endpoint}
- REQ-160 L611 (Editor) Section heading carrying the anchor {#task-status-endpoint}
- REQ-161 L613 (Definition) Defines the Task Status Endpoint as where the PEP retrieves the state of a previously submitted
- REQ-162 L615 (PEP) Calls `status_endpoint` using the HTTP `GET` method as defined in {{RFC9110}}
- REQ-164 L619-626 (Editor) Non-normative example of a Task Status Endpoint GET request
- REQ-165 L628 (ARS) Returns a JSON object containing a `task` member; completed responses include `result` per {{co
- REQ-166 L630 (PEP) MAY poll; SHOULD use exponential backoff with jitter; MUST honour `Retry-After`; MUST stop at `
## [7] Task Handle Authorization {#authorization-and-authentication}
- REQ-352 L1113 (Definition) Defines Task Handle authorization as bound to Subject, Resource, Action, task and operation, no
- REQ-353 L1115 (ARS) MUST authorize independently; status authorization implies no cancel, approver-detail, or resul
- REQ-354 L1117 (ARS) token refresh does not invalidate Task Handle access; another PEP instance or agent MAY interac
- REQ-355 L1119 (ARS) task status response MUST NOT disclose approval details, approver identities, policy ids, resou
### [7] Task Handle Leakage {#task-handle-leakage}
- REQ-411 L1234 (ARS) Task handles MUST be opaque, unguessable, protected by authn/authz; a leaked handle MUST NOT su
### [7] PEP-Facing and End-Client-Facing Surfaces
- REQ-412 L1238 (Definition) classifies task and approval members as PEP-facing machine surfaces rather than end-client surf
- REQ-413 L1240 (Definition) task.status_endpoint is the ARS polling URL and is PEP-facing
- REQ-414 L1241 (Definition) task.links.cancel is the cancellation endpoint and is PEP-facing
- REQ-415 L1242 (Definition) approval.id and approval.state are round-trip material the PEP places at context.approval; PEP-
- REQ-416 L1244 (PEP) SHOULD NOT forward status_endpoint, links.cancel, approval.id or approval.state to end clients 
- REQ-417 L1246 (Definition) classifies human-facing surfaces rendered only to callers authorized for the human workflow
- REQ-418 L1248 (Definition) task.links.ticket is the requester-facing status URL
- REQ-419 L1249 (Definition) task.links.review is the approver or administrator review URL
- REQ-420 L1250 (Definition) task.display carries localizable user-interface hints
- REQ-421 L1252 (PEP) SHOULD render task.display and task.links.ticket; MUST NOT expose task.links.review to an unaut
## [7] Task Status Values {#task-status}
- REQ-167 L632 (Editor) Subsection heading carrying the anchor {#task-status}
- REQ-168 L634 (Definition) Introduces the list of defined task status values
- REQ-169 L636-637 (Definition) `pending`: request accepted and awaiting processing or approval
- REQ-170 L639-640 (Definition) `approved`: request approved; approval alone does not grant access without an enforceable resul
- REQ-171 L642-643 (Definition) `denied`: request denied by the approval workflow
- REQ-172 L645-646 (Definition) `expired`: request expired before completion
- REQ-173 L648-649 (Definition) `cancelled`: request cancelled by requester, approver, administrator, or system
- REQ-174 L651-652 (Definition) `failed`: request could not be completed due to an error
- REQ-175 L654-655 (PEP) MUST consult `task.items[].status` for per-item outcomes and MUST NOT infer aggregate access pe
- REQ-176 L657 (Implementation) MAY define additional task status values beyond the seven defined
- REQ-177 L657 (PEP) MUST treat the task as not approved
### [7] Status Mapping Obligation
- REQ-194 L711 (Implementation) SHOULD document the mapping applied so PEP behavior remains predictable
## [7] State Transitions {#state-transitions}
- REQ-178 L659 (Editor) Subsection heading carrying the anchor {#state-transitions}
- REQ-179 L661 (Definition) Base state machine: a task is created `pending` and transitions exactly once to a terminal stat
- REQ-181 L680-683 (Definition) Introduces the table of transitions defined from `pending` and its column headings
- REQ-182 L684 (Definition) Transition to `approved`: approval workflow completes successfully
- REQ-183 L685 (Definition) Transition to `denied`: approval workflow rejects the request
- REQ-184 L686 (Definition) Transition to `expired`: `task.expires_at` reached before a terminal state
- REQ-185 L687 (Definition) Transition to `cancelled`: cancelled by requester, approver, administrator, or PEP via the canc
- REQ-186 L688 (Definition) Transition to `failed`: a system error prevents completion
- REQ-187 L689 (Definition) Transition to `partial`: all items terminal with two or more distinct terminal statuses; see ag
## [7] Pending Task Response
- REQ-195 L713 (Editor) Subsection heading (no anchor)
- REQ-196 L715 (ARS) Response echoes the Task Handle from submission; later polls return the same shape with status,
- REQ-197 L717-731 (Editor) Non-normative example of a pending task status response
## [7] Completed Task Response {#completed-task-response}
- REQ-198 L733 (Editor) Subsection heading carrying the anchor {#completed-task-response}
- REQ-199 L735 (Definition) Introduces the four rules governing result information in a completed task response
- REQ-200 L737 (ARS) Response MUST include a top-level `result` object
- REQ-201 L738 (ARS) Each approved item in `task.items[]` MUST include its own `result`; response MAY also include a
- REQ-202 L738 (PEP) MUST NOT use that top-level `result` to authorize an individual item
- REQ-203 L739 (ARS) Response MAY include a `result` object for diagnostic or workflow information
- REQ-204 L739 (PEP) MUST NOT treat that `result` as approval
- REQ-205 L740 (ARS) MUST use one of the completion forms defined in {{completion-semantics}}
- REQ-206 L742 (ARS) Task remains retrievable until expiry or removal; afterwards the endpoint MUST return `task_exp
- REQ-208 L746-767 (Editor) Non-normative example of an approved completed task response with a `reevaluate` result
## [7] Unsupported Cancellation
- REQ-217 L785 (ARS) Omits `links.cancel`; a cancellation attempted at any cancellation endpoint returns `405 Method
## [7] Availability
- REQ-426 L1270 (PEP) SHOULD fail closed
- REQ-427 L1270 (ARS) SHOULD apply rate limits and abuse detection to request submission and polling endpoints

# [8] Approval and Re-evaluation {#completion-semantics}
- REQ-220 L793 (Definition) Defines the single completion mode `reevaluate`: the PEP performs a new Access Evaluation after
- REQ-221 L795 (Definition) Defines the input-attribute model: the approval is carried at `context.approval` and read like 
- REQ-222 L797 (Profile) Profiles MAY define additional completion modes through the `result.mode` extension point ({{ex
- REQ-223 L797 (Implementation) MUST do so through a profile that defines a completion mode for that flow; the base profile def
- REQ-224 L797 (PEP) MUST treat the task as not approved and MUST NOT permit access on the basis of that result
- REQ-225 L799 (Editor) Non-normative: existing approval, IGA, and ITSM systems map onto Re-evaluation Mode; points to 
- REQ-227 L803 (ARS) The result MUST include an `approval` member identifying the approval that completed the task
- REQ-228 L805 (ARS) `id` REQUIRED string; value MUST have sufficient entropy and MUST NOT encode PEP-parseable sema
- REQ-229 L806 (ARS) `approved_at` OPTIONAL {{RFC3339}} timestamp indicating when the approval completed
- REQ-230 L807 (ARS) `approved_until` REQUIRED {{RFC3339}} latest time the approval remains valid
- REQ-231 L809 (PDP/ARS) The `approval` object MAY include an opaque `state` member populated by the Access Request Serv
- REQ-232 L811 (PDP) MUST resolve or verify `approval.id`/`approval.state` and bind the approval to task, denial, Su
- REQ-233 L813 (PDP) MUST NOT authorize on a known `approval.id` alone; MUST verify applicability and MUST ignore or
- REQ-234 L815 (Definition) Lead-in: an approval reference has two deployment patterns (the bullets at 817 and 818)
- REQ-235 L817 (PDP) Lookup pattern: the PDP resolves `approval.id` in trusted server-side state
- REQ-236 L818 (PDP) Bound reference pattern: the PDP verifies `approval.state`, which carries integrity-protected p
- REQ-237 L820 (Deployment) Deployments MAY use both approval-reference patterns (lookup and bound reference) together
- REQ-238 L820 (PDP) MUST verify the approval against trusted state or integrity-protected binding material; neither
- REQ-239 L822 (ARS) Approval Result MUST include `approval.state` or another PDP-verifiable artifact; MUST NOT retu
- REQ-240 L824 (PDP) MUST discover the signer key from the PDP `jwks_uri`, MUST verify `aud`, and MUST reject unreso
- REQ-241 L826 (PDP/ARS) The approval record or binding material MUST contain, or let the PDP determine, id, task, denia
- REQ-242 L828 (PEP) MUST include the `approval` object unchanged at `context.approval` in the AuthZEN re-evaluation
- REQ-243 L830 (PDP) MUST evaluate the new request using current policy and the approval reference; MAY still deny
- REQ-244 L832 (PDP) SHOULD tell the PEP what to do next, using the Decision Context members defined below
- REQ-245 L834 (PDP) `next_action` RECOMMENDED string; one of `request`, `retry`, `none`; the durable interoperabili
- REQ-246 L835 (PDP) MUST also include a fresh `context.access_request` ({{requestable-denial-context}}) so the PEP 
- REQ-247 L836 (PEP) Defines the `retry` value: re-evaluate the same request after a delay; the denial is expected t
- REQ-248 L837 (PEP) Defines the `none` value: do not retry or re-request; the denial is terminal for this approval
- REQ-249 L839 (PEP) MUST act on `next_action` when recognized; when absent or unrecognized, falls back to the defau
- REQ-250 L840 (PDP) `retry_after` RECOMMENDED integer seconds before the PEP re-evaluates; delta-seconds semantics 
- REQ-251 L841 (PDP) `reason` OPTIONAL string machine-readable reason code; the profile defines the well-known codes
- REQ-252 L842 (Definition) Defines reason code `approval_expired`, default `next_action` `request`: approval expired, revo
- REQ-253 L843 (Definition) Defines reason code `out_of_scope`, default `next_action` `request`: approval valid but the eva
- REQ-254 L844 (Definition) Defines reason code `grant_pending`, default `next_action` `retry`: backing entitlement, role, 
- REQ-255 L845 (Definition) Defines reason code `policy_denied`, default `next_action` `none`: current policy, subject stat
- REQ-256 L846 (Definition) Defines reason code `approval_unverifiable`, default `next_action` `none`: reference could not 
- REQ-257 L848 (Implementation) MAY register additional reason codes; a registered default applies only when `next_action` is a
- REQ-258 L850 (PDP) MUST check current approval status, including revocation, cancellation, supersession, or other 
- REQ-259 L852 (PEP) MUST NOT enforce past that timestamp and MUST bound downstream credential lifetimes by the earl
- REQ-261 L856 (Editor) Non-normative: approvals in this mode typically cover a class of future evaluations, which is w
- REQ-262 L858 (Definition) Defines approval scope and states that the profile defines only one portable baseline, leaving 
- REQ-263 L860 (PDP) Exact member-by-member match of Subject, Resource, Action, and authorization-relevant Context; 
- REQ-264 L861 (Deployment) Broadened-scope representation and matching are deployment-specific or profile-defined; this pr
- REQ-266 L865 (PDP/ARS) Default approval scope is the bound Subject, Resource, Action, and relevant Context; per item f
- REQ-267 L867 (PDP) MUST only consider an Approval Result applicable when the current evaluation is within the appr
- REQ-268 L869 (PEP) MUST NOT treat an Approval Result as authorizing future evaluations; MAY include or cache it bu
- REQ-269 L871 (Deployment) MAY omit `approval.state` and have the PDP resolve `approval.id` by server-side lookup
- REQ-270 L873-912 (Editor) Non-normative re-evaluation request and response examples (JSON code blocks)
## [8] Decision and Binding Integrity
- REQ-371 L1159 (Implementation) MUST bind Access Requests and approval results to Subject, Resource, Action, Context, task, and
- REQ-372 L1159 (PDP) MUST validate the binding of Access Request and approval result
- REQ-373 L1163 (PDP) MUST resolve or verify the reference and confirm binding to caller, S/R/A/Context, scope, and e
- REQ-374 L1165 (PDP/ARS) MUST protect the backing approval record against unauthorized lookup and mutation
- REQ-375 L1165 (PDP) MUST verify integrity, issuer, audience or intended recipient, expiry, and binding before accep
- REQ-404 L1208 (ARS) Approval results MUST expire; Re-evaluation Mode SHOULD bind approval references to the origina
- REQ-405 L1208 (Profile) responsible for defining the token's audience restriction, lifetime, and binding to the approve

# [9] Error Responses {#error-responses}
- REQ-281 L957 (ARS) MUST use `application/problem+json` ({{RFC9457}}) and MUST carry the problem type URI in `type`
- REQ-282 L959 (Definition) Lead-in: the following problem types are defined
- REQ-283 L961-962 (Definition) `urn:openid:authzen:access-request:error:not_requestable`: HTTP 400; the submitted denial is no
- REQ-284 L964-965 (Definition) `...:expired_denial`: HTTP 410; the freshness deadline (earlier of `denial.expires_at` and `bin
- REQ-285 L967-968 (Definition) `...:invalid_denial_binding`: HTTP 400; the submitted Access Request cannot be bound to the den
- REQ-286 L970-971 (Definition) `...:duplicate_request`: HTTP 409; `Idempotency-Key` reused by the same requester with a non-eq
- REQ-287 L973-974 (Definition) `...:unknown_task`: HTTP 404; the task handle is unknown or unavailable to the caller
- REQ-288 L976-977 (Definition) `...:task_expired`: HTTP 410; the task handle has expired
- REQ-289 L979-980 (Definition) `...:invalid_task_state`: HTTP 409; the operation cannot be performed in the current task state
- REQ-290 L982-994 (Editor) Non-normative `application/problem+json` example for `not_requestable`

# [10] Core Conformance  (no rows in A1)
## [10] PEP Processing Rules {#pep-processing-rules}
- REQ-306 L1053 (PEP) List lead-in scoping the bullets that follow to a PEP implementing this profile
- REQ-307 L1055 (PEP) MUST treat decision: false as a denial
- REQ-308 L1056 (PEP) MUST NOT submit an Access Request
- REQ-309 L1057 (PEP) MUST use denial-context endpoint when present, otherwise access_request_endpoint from PDP metad
- REQ-310 L1058 (PEP) MUST preserve Subject principal, Resource, Action, relevant Context; actor identity MUST NOT be
- REQ-311 L1059 (PEP) MUST construct the context and requested_access augmentations per {{machine-readable-forms}}, o
- REQ-312 L1060 (PEP) MUST include denial.expires_at taken from context.access_request.expires_at
- REQ-313 L1061 (PEP) MUST include denial.evaluation_id; SHOULD include it whenever the PDP returned an evaluation id
- REQ-314 L1062 (PEP) SHOULD include an idempotency key for Access Request submissions
- REQ-315 L1063 (PEP) MUST treat a Task Handle as opaque
- REQ-316 L1064 (PEP) MUST NOT infer approval from a task identifier, link, or display text
- REQ-317 L1065 (PEP) MUST treat the task as not approved
- REQ-318 L1066 (PEP) MUST enforce an approved result only according to {{completion-semantics}}
- REQ-319 L1067 (PEP) MUST treat the result as not approved
- REQ-320 L1068 (PEP) MUST include the returned approval object unchanged at context.approval in the re-evaluation re
- REQ-321 L1069 (PEP) MUST re-evaluate access through the AuthZEN Access Evaluation API
- REQ-322 L1070 (PEP) MUST NOT treat the Approval Result as authorizing any future Access Evaluation on that basis al
## [10] PDP Processing Rules
- REQ-323 L1074 (PDP) List lead-in scoping the bullets that follow to a PDP implementing this profile
- REQ-324 L1076 (PDP) MAY include context.access_request in a denied Decision
- REQ-325 L1077 (PDP) MUST NOT include context.access_request
- REQ-326 L1078 (PDP) SHOULD include a stable machine-readable reason code
- REQ-327 L1079 (PDP) MUST include an expiration time as context.access_request.expires_at
- REQ-328 L1080 (PDP) MAY include form_url and request_schema_url in the requestable denial
- REQ-329 L1081 (PDP) MUST provide binding_token or a resolvable evaluation_id; MUST use binding_token when the ARS i
- REQ-330 L1082 (PDP) SHOULD return a stable context.evaluation_id the PEP can supply as denial.evaluation_id
- REQ-331 L1083 (PDP) MUST integrity-protect it verifiably and SHOULD issue it as a JWS in compact serialization
- REQ-332 L1084 (PDP) MUST validate approval references presented
- REQ-333 L1085 (PDP) MUST consider it applicable only when the request is within the recorded approval scope
- REQ-334 L1086 (PDP) MUST ensure approval does not override policy conditions that remain mandatory
## [10] Access Request Service Processing Rules
- REQ-335 L1090 (ARS) List lead-in scoping the bullets that follow to an Access Request Service implementing this pro
- REQ-336 L1092 (ARS) MUST authenticate and authorize the PEP
- REQ-337 L1093 (ARS) MUST validate the submission is based on a requestable denial, else reject with not_requestable
- REQ-338 L1094 (ARS) MUST verify the denial-binding material, applying the sub-rules at 1095-1098
- REQ-339 L1095 (ARS) MUST verify its integrity; for a JWS MUST verify the signature with a key from the PDP jwks_uri
- REQ-340 L1096 (ARS) MUST resolve evaluation_id, compare the recorded tuple structurally, and enforce the recorded e
- REQ-341 L1097 (ARS) MUST reject with expired_denial
- REQ-342 L1098 (ARS) MUST reject with invalid_denial_binding
- REQ-343 L1099 (ARS) MUST bind the task to Subject, Resource, Action, Context, denial, requester, and client
- REQ-344 L1100 (ARS) MUST return an opaque Task Handle
- REQ-345 L1101 (ARS) SHOULD support idempotent request submission using the Idempotency-Key header
- REQ-346 L1102 (ARS) MUST expire Access Requests and approvals according to local policy
- REQ-347 L1103 (ARS) MUST NOT return approved
- REQ-348 L1104 (ARS) MUST evaluate approver eligibility (self-approval, delegation, separation of duties, conflict o
- REQ-349 L1105 (ARS) MUST retain audit records sufficient to reconstruct request, approval, denial, and completion r
## [10] Policy and Approver Hygiene {#overbroad-approval}
- REQ-406 L1214 (Implementation) MUST NOT treat template, requested_access, or display as sufficient authorization policy
### [10] Approver Eligibility and Separation of Duties {#approver-eligibility}
- REQ-407 L1218 (ARS) MUST evaluate approver eligibility: self-approval, delegated authority, separation of duties, o

# [12] Denial Binding Alternatives
- REQ-391 L1186 (PDP/ARS) binding claims cover the whole items array and Context; a bulk hashed form MUST use exactly the
- REQ-392 L1188 (PDP) MAY add deployment-specific claims; wraps the signed payload in JWE when they must stay opaque 
- REQ-400 L1200 (ARS) MUST perform equivalent verification of issuer, audience, expiry, replay resistance, and bindin
- REQ-401 L1202 (Verifier) MAY satisfy both; verifiers process only the claims they understand and tolerate additional one

# [13] Approval Scope Extensions
- REQ-265 L863 (ARS) Approval workflow policy determines how broad an approval grants; the profile does not constrai

# [14] Bulk Submissions {#section-14-bulk}  (no rows in A1)
## [14] Request Items
- REQ-079 L344-345 (PEP) `items` OPTIONAL array; when present `resource` and `action` MUST be omitted at the top level
- REQ-080 L347 (PEP) each item `resource` REQUIRED: the AuthZEN Resource for this item
- REQ-081 L348 (PEP) each item `action` REQUIRED: the AuthZEN Action for this item
- REQ-082 L349 (PEP) per-item `requested_access` OPTIONAL; merged with the top level, item values taking precedence
- REQ-083 L350 (PEP) per-item `denial` OPTIONAL, using the same members as the top-level `denial`
- REQ-125 L461-500 (Editor) non-normative bulk-submission example
## [14] Response Items and Aggregation
- REQ-148 L548-549 (ARS) `task.items` REQUIRED, each element corresponding positionally to the submission's `items` memb
- REQ-149 L551 (ARS) each item `resource` REQUIRED, echoing the submission
- REQ-150 L552 (ARS) each item `action` REQUIRED, echoing the submission
- REQ-151 L553 (ARS) each item `status` REQUIRED, using the values defined in {{task-status}}
- REQ-152 L554 (ARS) per-item `result` REQUIRED; OPTIONAL before the item reaches a terminal status
- REQ-153 L556 (Definition) aggregate `task.status` is computed from per-item statuses by the three rules that follow
- REQ-154 L558 (Definition) the aggregate is `pending`
- REQ-155 L559 (Definition) the aggregate is that status
- REQ-156 L560 (Definition) the aggregate is `partial`
- REQ-157 L562 (PEP) MUST consult `task.items[].status` and `[].result`; MUST NOT infer per-item outcomes from the a
## [14] Bulk Status, Cancellation, and Re-evaluation
- REQ-188 L691 (Definition) Each item independently follows the base state machine; aggregate `task.status` computed per {{
- REQ-218 L787 (ARS) Cancels every `pending` item; SHOULD document handling of implementation-defined non-terminal s
- REQ-226 L801 (ARS) Each approved item MUST include a per-item `result` independently enforceable according to its 
- REQ-260 L854 (Definition) Describes per-item re-evaluation carrying each item's `result.approval` at `context.approval`; 

# [16] Callback Completion {#callback-completion}
- REQ-027 L192 (ARS) Access Request Service MAY publish lifecycle events through deployment-level event subscription
- REQ-094 L371-372 (PEP) `callback` OPTIONAL object describing a callback endpoint for completion notifications
- REQ-271 L916 (PEP) MAY request callback notification by including a `callback` object in the Access Request submis
- REQ-272 L918 (Definition) Lead-in: the `callback` object has the following members (`endpoint`, `state`, `events`)
- REQ-273 L920-921 (ARS) `endpoint` REQUIRED HTTPS URI; MUST validate it is authorized for the PEP and MUST reject inter
- REQ-274 L923-924 (PEP) `state` OPTIONAL opaque value supplied by the PEP and returned unmodified in the callback
- REQ-275 L926-927 (PEP) `events` OPTIONAL array of event names: `approved`, `denied`, `expired`, `cancelled`, `failed`,
- REQ-276 L929 (ARS) MUST contain a `task` member, MAY contain a `result`, and any `result` MUST use a completion fo
- REQ-277 L931 (ARS) MUST authenticate to the callback endpoint; SHOULD use bearer token, mutual TLS, or HMAC; unaut
- REQ-278 L933 (PEP) Callback delivery is a notification optimization; the Task Status Endpoint remains authoritativ
- REQ-279 L935 (Implementation) MAY satisfy notification that way and the PEP MAY omit `callback`; subscriptions MUST NOT be tr
- REQ-280 L937-953 (Editor) Non-normative callback example (notification-only, no `result`)
- REQ-422 L1258 (ARS) MUST validate callback destinations and MUST authenticate callback notifications
- REQ-423 L1258 (PEP) SHOULD verify callback origin, bind callbacks to expected task identifiers and state, treat cal

# [17] Cancellation {#cancellation}
- REQ-207 L744 (ARS) Cancellation MAY be performed by the ARS, the requester, an approver, or the PEP via the cancel
- REQ-209 L769 (Editor) Subsection heading carrying the anchor {#cancellation}
- REQ-210 L771 (ARS) MAY support cancellation; when supported the Task Handle MUST include `links.cancel`; MAY also 
- REQ-211 L771 (PEP) Cancels by issuing an HTTP `POST` to `links.cancel` (`DELETE` only where the service accepts it
- REQ-212 L773 (PEP) The request body is an OPTIONAL JSON object with the members `reason` and `comment`
- REQ-213 L775-776 (Definition) `reason`: OPTIONAL string; stable, machine-readable reason code
- REQ-214 L778-779 (Definition) `comment`: OPTIONAL string; human-readable cancellation note for audit
- REQ-215 L781 (ARS) Returns `200 OK` with the updated `task` whose status is `cancelled`; returns `409 Conflict` wi
- REQ-216 L783 (ARS) MUST authenticate the PEP and MUST verify authorization for the original Subject, Resource, Act
- REQ-219 L789 (PEP) MAY stop polling and rely on `task.expires_at` and ARS expiry to release resources

# [18] Task Lifecycle Details {#task-lifecycle-details}
- REQ-026 L190 (Definition) Portability of the Task Handle: it survives PEP restart, replacement, or handoff and can be pol
- REQ-137 L527-528 (ARS) `progress` OPTIONAL object; with `items` present it describes aggregate progress, per-item prog
- REQ-138 L530 (ARS) `current_step` OPTIONAL integer, one-based index of the step in progress
- REQ-139 L531 (ARS) `total_steps` OPTIONAL integer, total approval steps configured for the task
- REQ-140 L532 (ARS) `step_name` OPTIONAL string, short identifier of the current step
- REQ-141 L533 (ARS) `awaiting` OPTIONAL array of expected approvers; implementations SHOULD apply privacy controls 
- REQ-163 L617 (PEP) MAY interact with the Task Handle, such as polling status or initiating cancellation
- REQ-180 L663-678 (Editor) ASCII-art diagram of the base state machine, including the bulk-only `partial` box
- REQ-189 L693 (Implementation) SHOULD specify the transitions into and out of the new state and document them with the value d

# [19] Delegation and Acting Parties {#delegation}
- REQ-356 L1123 (Definition) Describes the delegation patterns and names subject plus client.actor as the protocol surface f
- REQ-357 L1125 (Implementation) SHOULD follow the act-claim conventions of the OAuth actor profile; canonical actor id is the (
- REQ-358 L1127 (Editor) List lead-in for the three delegation statements at 1129-1131
- REQ-359 L1129 (Definition) Defines that the AuthZEN subject carries the principal on whose behalf the operation is perform
- REQ-360 L1130 (PEP) client.actor carries the immediate actor and MAY include a nested act claim walking the chain
- REQ-361 L1131 (PEP) MAY preserve it in the submission subject or normalize to client.actor; identity MUST NOT be dr
- REQ-364 L1137 (ARS) MAY consider any identity in the chain; identities must be verifiable before routing decisions
- REQ-365 L1139 (Deployment) SHOULD document the Subject shape, actor convention, and accepted credential format
## [19] Client Actor and Source {#section-19-client-actor}
- REQ-098 L379 (PEP) `client.actor` OPTIONAL object identifying the immediate actor; implementations MAY include add
- REQ-099 L380 (PEP) `actor.id` REQUIRED string, stable identifier for the actor
- REQ-100 L381 (PEP) `actor.issuer` OPTIONAL string, issuer or identity provider for the actor identifier
- REQ-101 L382 (PEP) `actor.type` OPTIONAL string, actor category such as `user`, `service`, `workload`, `ai_agent`
- REQ-102 L383 (PEP) `act` OPTIONAL nested actor object following {{?I-D.mcguinness-oauth-actor-profile}}
- REQ-103 L384 (PEP) `client.source` OPTIONAL object of audit-trail context; implementations MAY include additional 
- REQ-104 L385 (PEP) `session_id` OPTIONAL string identifying the bounded interaction context that produced the requ
- REQ-105 L386 (PEP) `external_url` OPTIONAL HTTPS URI of the external system that motivated the request
- REQ-106 L387 (PEP) `integration_id` OPTIONAL string identifying the upstream integration or workflow
## [19] Emergency Access
- REQ-093 L369 (Definition) requests an expedited or emergency-access path subject to additional auditing
- REQ-408 L1222 (Implementation) SHOULD require justification, shortest practical lifetime, owner notification, post-use review,

# [20] Machine-Readable Forms {#machine-readable-forms}
- REQ-046 L248-249 (Definition) OPTIONAL. HTTPS URI of a form where a human requester supplies additional information
- REQ-047 L251-252 (ARS) `request_schema_url` is RECOMMENDED to be a JSON Schema document
- REQ-063 L308 (PEP) PEP MAY omit form-schema processing entirely
- REQ-064 L310 (Definition) `form_url` identifies a form hosted by the Access Request Service or a trusted service, for PEP
- REQ-065 L311 (Definition) `request_schema_url` identifies a machine-readable description of the same augmentations, for a
- REQ-066 L313 (PEP) PEP MUST NOT fabricate values or submit incomplete; MUST surface, hand off, or treat the denial
- REQ-067 L313 (Deployment) Requestable denial SHOULD include `request_schema_url` referencing a JSON Schema describing the
- REQ-068 L315 (Implementation) Implementations MAY publish a derived JSON Schema, which SHOULD suffice for an autonomous PEP t
- REQ-069 L317 (Editor) Catalog-backed form fields are out of scope; {{CATALOG}} defines the companion document that co
- REQ-070 L319 (Deployment) Deployments MAY layer an out-of-band UI vocabulary, typically keyed by `template`
- REQ-071 L321 (Deployment) Deployments MAY expose Access Request submission through an agent protocol keyed to the `reques

# [21] Extensibility and Profiles {#extensibility}
- REQ-291 L998 (Editor) Non-normative framing: the base wire format is intentionally extensible for profiles and deploy
## [21] Extension Points
- REQ-292 L1002 (Implementation) Additional members MAY appear only at the listed extension points and MUST follow {{extension-n
- REQ-293 L1004-1013 (Definition) Enumerates the ten permitted extension points that the MAY at 1002 admits
- REQ-294 L1015-1019 (Definition) Enumerates the three extensible enumerated-value sets: task.status, result.mode, and problem ty
- REQ-295 L1021 (Profile) SHOULD define stable names or URIs and processing rules; profile result.mode values SHOULD use 
## [21] Naming Extensions {#extension-naming}
- REQ-296 L1025 (Implementation) MUST be a registered name, an absolute URI, or a reverse-DNS-prefixed identifier
- REQ-297 L1027 (Definition) Defines option 1 of the naming rule: a name registered in the AuthZEN Access Request Member Nam
- REQ-298 L1028 (Profile) MUST be an absolute URI (HTTPS or URN); profiles SHOULD use a stable URI under the change contr
- REQ-299 L1029 (Definition) Defines option 3 of the naming rule: a reverse-DNS-prefixed identifier for deployment-private m
- REQ-300 L1031 (Definition) approval.state contents are opaque and exempt from the member naming rules
## [21] Forward Compatibility
- REQ-301 L1035 (Implementation) MUST ignore it and MUST NOT fail processing on the basis of the unrecognized name
## [21] Profiles
- REQ-302 L1039 (Definition) Defines what a profile of this specification is, with three illustrative examples
- REQ-303 L1041 (Profile) SHOULD identify itself by URI, specify extension points, register names, define semantics, enum
- REQ-304 L1043-1047 (Profile) The five items a profile SHOULD do: identify by URI, specify extension points, register names, 
- REQ-305 L1049 (Definition) Defines profile conformance as the presence and processing of registered or namespaced members;

# [22] Security Considerations  (no rows in A1)

# [23] Privacy Considerations {#privacy-considerations}
- REQ-366 L1143 (Implementation) SHOULD minimize the information returned to the PEP and displayed to the end user
- REQ-367 L1145 (ARS) SHOULD separate end-user display reasons from administrator diagnostic reasons
- REQ-368 L1145 (PDP) SHOULD avoid exposing internal policy identifiers
- REQ-369 L1147 (ARS) Approval records SHOULD be retained only as long as business, security, and compliance policy r

# [24] IANA Considerations
- REQ-428 L1274 (Editor) states that the document has no IANA actions and points to the OIDF registry section

# [25] OpenID Foundation Registry Considerations {#openid-foundation-registry-considerations}  (no rows in A1)
## [25] AuthZEN Policy Decision Point Metadata Registry
- REQ-429 L1280 (Editor) requests registration of the listed PDP metadata parameters
- REQ-430 L1282-1292 (Definition) registration record for access_request_endpoint: name, description, change controller, specific
- REQ-431 L1294-1304 (Definition) registration record for jwks_uri: name, description, change controller, specification document
## [25] AuthZEN Policy Decision Point Capabilities Registry
- REQ-432 L1307 (Editor) requests registration of the listed PDP capabilities
- REQ-433 L1309-1322 (Definition) registration record for the access-request capability and its URN
- REQ-434 L1324 (Editor) explains use of the urn:openid:authzen namespace rather than urn:ietf:params:authzen for capabi
## [25] AuthZEN Access Request Member Names Registry {#iana-member-names}
- REQ-435 L1328 (Editor) requests creation of the AuthZEN Access Request Member Names registry
- REQ-436 L1330 (Definition) registry scope (extension-point member names), Specification Required policy, and the entry fie
- REQ-437 L1332-1333 (Definition) Name: the member name as it appears on the wire
- REQ-438 L1335-1336 (Definition) Extension Point: one of the extension points in Section 21 or one defined by a profile
- REQ-439 L1338-1339 (Definition) Description: a short description of the member semantics
- REQ-440 L1341-1342 (Definition) Change Controller: the registering specification's change controller
- REQ-441 L1344-1345 (Definition) Specification Document: the document defining the member
- REQ-442 L1347-1365 (Definition) initial member-name entries: 15 rows of Name, Extension Point, Description
- REQ-443 L1367 (Editor) change controller and specification document for all initial member-name entries
## [25] AuthZEN Access Request Re-evaluation Denial Reason Registry {#iana-reeval-reasons}
- REQ-444 L1371 (Editor) requests creation of the AuthZEN Access Request Re-evaluation Denial Reason registry
- REQ-445 L1373 (Definition) registry scope (context.reason values on re-evaluation denial), Specification Required policy, 
- REQ-446 L1375-1376 (Definition) Reason: the context.reason value as it appears on the wire
- REQ-447 L1378-1379 (Definition) Default Next Action carries the RECOMMENDED next_action for the value: request, retry, or none
- REQ-448 L1381-1382 (Definition) Description: a short description of the denial condition
- REQ-449 L1384-1385 (Definition) Change Controller: the registering specification's change controller
- REQ-450 L1387-1388 (Definition) Specification Document: the document defining the value
- REQ-451 L1390-1398 (Definition) initial reason entries: five codes with default next_action and description
- REQ-452 L1400 (Editor) change controller and specification document for all initial reason entries

--- back

# [A] Examples
- REQ-453 L1404 (Editor) insert non-normative editor's note before the first example: tokens omit `aud` (REQUIRED at 117
## [A] End-to-End Manager Approval  (body text, no rows)
## [A] End-to-End Agent Tool Discovery  (body text, no rows)

# [B] Motivation and Use Cases
- REQ-002 L84 (Editor) Lead-in sentence naming delegation, dynamic discovery, scope expansion, and long-running agent 
- REQ-003 L86-89 (Editor) Four motivating scenarios (AI agent, OAuth AS, gateway PEP, STS) illustrating requestable denia
- REQ-465 L91 (Editor) narrative: the denial is a signal that further authority is required; autonomous callers
- REQ-466 L93 (Editor) narrative: the same need in user-facing patterns; vendor-specific integrations
- REQ-012 L106 (Editor) Defines the boundary against partial evaluation: this profile resolves missing authority, not m
- REQ-015 L116-127 (Editor) Lead-in plus ten design goals for the profile
- REQ-016 L119 (Definition) Stateless evaluation model: durable request, approval, and denial-binding state lives in the Ac

# [C] Implementation Considerations {#impl-considerations}  (body text, no rows)
## [C] Identity Governance and Approval Platforms
- REQ-454 L1845 (Implementation) SHOULD follow the status-mapping guidance at {{status-mapping}}
## [C] Form Translation  (body text, no rows)
## [C] Notification Channels  (body text, no rows)
## [C] Time and Clock Skew
- REQ-455 L1859 (Implementation) SHOULD allow a small skew tolerance when comparing across hosts
- REQ-456 L1859 (PEP) MAY treat the approval as valid until `approved_until` plus the tolerance
- REQ-457 L1859 (ARS) MAY accept submissions arriving up to the tolerance after that timestamp
- REQ-458 L1861 (Implementation) SHOULD synchronize clocks against a reliable time source (e.g. NTP, PTP) to keep skew below the
- REQ-459 L1861 (Deployment) MAY define a tighter clock-skew tolerance and document it as part of its deployment profile
## [C] Evaluators and Workflow Design  (body text, no rows)
## [C] Mapping Backend States {#status-mapping}
- REQ-190 L695 (Editor) Subsection heading carrying the anchor {#status-mapping}
- REQ-191 L697 (Implementation) Non-normative: backend models are richer; implementations are expected to collapse them into th
- REQ-192 L699 (Editor) Introduces the illustrative backend-to-canonical mapping table as non-normative
- REQ-193 L701-709 (Definition) Illustrative mapping table from common backend states to the seven canonical statuses

# [D] Design Rationale {#design-rationale}  (body text, no rows)
## [D] (fourteen rationale subsections, 1890 to 1950, each moves whole with its heading)
- REQ-460 L1904 (PEP) MAY proxy the endpoint and present a different URL to its own callers while preserving the prot
- REQ-461 L1925 (PDP) `binding_token` MUST be integrity-protected (typically JWS), per token-hygiene claims at {{bind
- REQ-462 L1929 (ARS) `approval.id` REQUIRED even when `approval.state` is signed, for uniform audit/correlation and 

# [E] Acknowledgements  (body text, no rows)
# [E] Document History  (body text, no rows)
