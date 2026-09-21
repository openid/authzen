# Unfiled Issue Drafts

The seven questions about the base profile were filed on 2026-09-20 as openid/authzen#659 through #665, and the gaps register that held them was retired in the same pass. The two drafts below are the questions that belong to companion profiles and have not been filed. They are in the same shape as the filed issues: problem, then recommendation.

---

## Callback Notifications Profile: acceptance semantics are undefined

### Problem

**A rejected callback endpoint has no defined outcome.** The Access Request Service must validate that a callback endpoint is authorized for the authenticated PEP and must reject endpoints resolving to loopback, link-local, private-use, or otherwise internal addresses. No problem type is defined for that rejection, and nothing says whether the submission fails or the callback is simply dropped.

**An omitted `events` filter has no defined meaning.** Whether it selects all events or none is not stated.

**A service that does not support callbacks at all has no defined response.** `callback` is a defined submission member whose support is optional, by contrast with cancellation, whose optionality and consequence are both stated. A service may accept the submission and ignore the member, and a PEP that relies on notification and skips polling then waits for a notification that never arrives. The unrecognized-member rule does not help: `callback` is a defined name, not an unknown one.

### Recommendation

**Define callback acceptance as an observable outcome.** Echo the accepted callback in the Task Handle, so a PEP can see that its destination was accepted, and define a problem type for a submission rejected because its callback endpoint is not authorized.

**State that an omitted `events` means all terminal events**, which is the reading that makes a callback useful by default.

**State the response when callbacks are unsupported**: reject the submission with the same problem type rather than accepting it and dropping the member, so a PEP that skips polling fails fast instead of hanging.

---

## Bulk Access Requests Profile: unsupported `items` and the bundle-order explanation

### Problem

**A service that does not support bulk has no defined response.** `items` is a defined submission member whose support is optional. Unlike `callback`, it cannot simply be ignored: when `items` is present, `resource` and `action` are absent, so the submission is unprocessable. Some rejection necessarily follows, but no problem type is named for it, so the failure is visible but not predictable.

**The bundle-order constraint has no PEP-facing explanation.** Inline bulk binding claims list each submitted item in the same order as the bound Access Request, and a bulk `binding_hash` is computed over the items in that order. The constraint exists on the wire, but nothing tells a PEP that a bundle-bound submission must preserve item order, or that per-item denials are exempt from it.

### Recommendation

**Name the problem type** a service returns for an `items` submission it does not support, or state that support is mandatory for any service advertising this profile.

**Add one PEP-facing sentence**: a submission bound by a bundle denial preserves the item order of the denial, and items carrying their own per-item denial are exempt.

### Related

The illustrative bulk `binding_token` needs correcting once the denial claim set settles (openid/authzen#660). It flattens each item to a string such as `document:q4-plan` rather than carrying the Resource and Action objects the construction requires, and omits the bound Subject entirely.
