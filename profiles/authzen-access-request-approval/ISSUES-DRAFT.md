# Working-Group Issue Drafts

Drafted 2026-09-19 from `PROTOCOL-GAPS.md` version 18. Not filed. Each draft is one GitHub issue: title, body, and the register entries it closes. File in the order listed.

---

## Issue 5. ARAP: the PEP's re-evaluation round trip is underspecified

Four gaps a PEP implementer hits on the first re-evaluation. (1) The text does not say what Context the PEP sends at re-evaluation; the examples send only `time` and `approval`, but exact-match scope compares the authorization-relevant Context, so a PEP that copies the examples is denied `out_of_scope` whenever the original evaluation had relevant Context. (2) The PEP must stop enforcing past "an approval expiry (typically as `context.approval.approved_until`)", but no response-side member is defined. (3) Retries stop "once the approval expires" without saying which expiry, and polling has no bound when `task.expires_at` is absent. (4) `next_action`, `retry_after`, `reason`, a reason-to-default-action registry, and a fallback cascade form a mini-protocol whose complexity the group should confirm it wants.

Proposed direction: state that the PEP resends the original evaluation's Context; define the response-side expiry member; name the governing expiry and a polling bound; make `next_action` authoritative and `reason` informational, withdrawing the default-action registry.

Register: G23, G11, G24, G29.

---

## Issue 4. ARAP: binding rules do not name which identity they compare

Four identities are in play: the Subject, the authenticated submitter, the submitter's client, and the principal that later presents `context.approval`. The binding rules use "requester", "caller", and "client" without saying which; "requester" means the Subject in some places and the authenticated caller in others. The acting-party test case: `subject.properties.act` is excluded from scope matching and `client.actor` appears in no comparison rule, so scope matching alone cannot distinguish two agents acting for the same person. Separately, the PDP's binding of the approval to the tuple is a MUST in one place and a SHOULD in another, and the bound Context is named three ways.

Proposed direction: define the four identities in Terminology; state each binding rule against a named identity; settle the force difference; use one name for the bound Context.

Register: G6 (with G16), G20 remainder.

---

## Issue 1. ARAP: signed approval state has no interoperable payload

The Interoperability Baseline requires every PDP to support verifying a JWS `approval.state`, but no claim set is defined, so two vendors can both support the container and share no payload. Four dependent questions ride on the claim set: how a broader approval scope reaches a PDP that shares no state; what `approved_until` bounds (use of the Approval Result, or the authority granted), and whether REQUIRED is right for provisioning-backed approvals; whether a signed artifact expiring before `approved_until` is intended and whether recovery exists; and what a PDP that verifies only the artifact does for the current-status check.

Proposed direction: a minimum claim set (candidate: `iss`, `aud`, `iat`, `exp`, `jti`, `approval_id`, `task_id`, optional `evaluation_id`, `subject`, `resource` and `action` or `approval_scope`, `binding_context_members`, requester and client binding); a rule that scope reaches the PDP through trusted state or the artifact; a statement of what `approved_until` bounds; a defined answer for current status without shared state.

Register: G2, G27, G28, G9, G3.

---

## Issue 2. ARAP: the inline denial-binding form and the PEP's echo

The inline form is RECOMMENDED for interoperability but its claims are never named; the claim list is introduced by SHOULD while members inside it carry verifier-side MUSTs. On the PEP side, `denial.binding_token` is OPTIONAL when `evaluation_id` is present, so a PEP holding both may omit the token and remain conformant while an independent service rejects the submission.

Proposed direction: name the inline claims; decide the force of the issuer-side claims; make the PEP echo every `denial` member the PDP supplied.

Register: G1, G10 (force half), G26.

---

## Issue 3. ARAP: issuer and audience identifiers and key discovery

`iss` and `aud` are described as "PDP identifier" and "Access Request Service identifier" with no definition. The PDP's `jwks_uri` publishes the Access Request Service's approval-state keys, so PDP metadata advertises keys belonging to another actor, leaving rotation, multiple services, and `kid` collisions unaddressed, and the key-to-issuer trust configuration that one rule presupposes is defined nowhere.

Proposed direction: define both identifiers; choose between a separate service `jwks_uri` in PDP metadata and a service issuer identifier whose own metadata resolves its keys (the latter scales to federation); state the trust configuration.

Register: G4.

---

## Issue 6. ARAP: submission processing order

Whether a repeated submission is recognized as a retry before or after token verification, replay detection, and freshness is not stated; a retry after a lost response repeats the same token and `jti`. Which error a service returns when a submission is both expired and insufficiently bound is not stated. An `evaluation_id` may be reused after its binding window while also serving as the audit thread, which makes reconstruction by identifier alone ambiguous.

Proposed direction: define the precedence between retry recognition and validation; state the error precedence; key audit reconstruction on the identifier together with the task or evaluation time.

Register: G5, G10 (precedence half), G22.

---

## Issue 7. ARAP: the base Task Handle surface

`progress` (including `awaiting`, approver identifiers) and `links.review` (an approver action URL) expose workflow-engine surface the Introduction places out of scope. Two optional capabilities have been proposed and not decided: recovery of a lost Task Handle by a different principal, and an advertised maximum pending duration.

Proposed direction: move `progress` and `links.review` to registered extension members or say why the scope statement admits them; adopt or decline the two capabilities.

Register: G30, G13, G17.

---

## Callback profile: acceptance semantics

A service validates a callback endpoint and rejects unauthorized or internal addresses, but no problem type is defined for that rejection and nothing says whether the submission fails or the callback is dropped; an omitted `events` filter has no defined meaning; and a service that does not support `callback` may accept the submission and ignore the member, leaving a PEP that skips polling with no signal.

Proposed direction: define callback acceptance and rejection semantics, the meaning of an omitted `events`, and the response when `callback` is unsupported.

Register: G18, G21 (callback half). File against the Callback Notifications Profile.

---

## Bulk profile: unsupported `items` and the PEP-facing order explanation

No problem type is named for a service that does not support `items`, which cannot ignore the member since `resource` and `action` are then absent. The bundle-order constraint exists on the wire but the PEP-facing explanation that bundle-bound submissions preserve item order, with per-item denials exempt, is missing.

Proposed direction: name the problem type; add the PEP-facing sentence.

Register: G12, G21 (`items` half). File against the Bulk Access Requests Profile.
