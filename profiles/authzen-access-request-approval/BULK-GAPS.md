# Gaps Register: AuthZEN Bulk Access Requests Profile

Version 1, 2026-09-19. Entries moved from the core register (`PROTOCOL-GAPS.md`, version 18); numbers are the core register's stable identifiers.

#### G12. Bulk bundle order is defined; the PEP-facing explanation is missing

**Evidence.** Line 1186 binds inline and hashed bulk claims to the items "in the same order as the bound Access Request", and applies single-item verification instead when every item carries its own `denial`. Nothing in Access Request Submission (344 to 352) or PEP Processing Rules (1051 to 1070) tells the PEP that bundle order is bound.

**Correction.** The wire constraint exists at 1186 and need not be repeated in a checklist to be normative. Version 5 of this register called the comparison undefined; it is not. Add a PEP-facing sentence explaining that bundle-bound submissions must preserve item order and that per-item denials are exempt.

#### G21 (items half). Whether support for `items` is mandatory, and the response when it is absent

**Evidence.** `items` (344) and `callback` (371) are defined submission members. Cancellation states that its support is optional and what follows when it is absent (771: no `links.cancel`, and `405` on attempt). No sentence says whether a service must support bulk submissions or callbacks; the OPTIONAL on each member governs presence in the submission, not implementation support. The unrecognized-member rule at 1035 applies to extension points, not to defined members. If support is optional, the response on receipt is undefined. For `items`, a service that does not support it cannot ignore the member, since `resource` and `action` are then absent, so some rejection follows, but no problem type is named for it. For `callback`, a service could accept the submission and ignore the member; a PEP that skips polling under 630 then receives neither a rejection nor an acceptance signal, which is the concern G18 records.

**What is missing.** A statement of whether support for each member is mandatory and, if not, the response on receipt: the problem type for an unsupported `items`, and callback acceptance semantics, which belong with G18.

**Severity.** Minor for `items`, where a rejection is visible but its problem type is not predictable. For `callback`, as G18.

**Direction.** State whether support is mandatory for each member. For `items`, name the problem type when it is not. For `callback`, resolve with G18.

The `callback` half of this entry is in `CALLBACK-GAPS.md` with G18.
