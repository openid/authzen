# Gaps Register: AuthZEN Callback Notifications Profile

Version 1, 2026-09-19. Entries moved from the core register (`PROTOCOL-GAPS.md`, version 18); numbers are the core register's stable identifiers.

#### G18. Callback acceptance and omitted-event semantics are undefined

**Evidence.** Line 921 requires the service to validate that a callback endpoint is authorized for the PEP and to reject unauthorized or internal addresses. The problem types at 955 to 995 define nothing for that rejection, and nothing says whether the submission fails or the callback is dropped. Line 927 does not say whether an omitted `events` means all events. Line 630 lets a PEP that has registered a callback skip polling on the strength of notification.

**What is missing.** What a PEP can conclude about whether its callback was accepted, and what an omitted `events` filter means. An echo of the accepted callback in the Task Handle and a dedicated problem type are possible answers, not prerequisites.

**Severity.** Significant for callback deployments.

**Direction.** Define callback acceptance and rejection semantics and the meaning of an omitted `events`.

#### G21 (callback half). Whether support for `callback` is mandatory, and the response when it is absent

A service that accepts a submission and ignores an unsupported `callback` leaves a PEP that skips polling with no signal; the answer is an acceptance or rejection signal, which is G18. The `items` half of this entry is in `BULK-GAPS.md`.
