# Proposal: Move Bulk Submissions and Callback Completion to Companion Profiles

Version 1, 2026-09-17. Status: proposal for the working group, drafted by the editor's request after the core-first restructure (PR A). This is not part of PR A and changes nothing until the working group decides.

## Why

The restructure made the core protocol readable in order, but the core still carries two optional features whose machinery reaches into the flow sections. Measured on the restructured text after PR A3:

| Feature | Its own section | Mentions outside it | Keywords outside it |
|---|---|---|---|
| Bulk submissions | 635 words, 19 keywords | 31 lines, about 1,250 words | 15 |
| Callback completion | 511 words, 19 keywords | 9 lines, about 480 words | 5 |

A PEP or Access Request Service that implements neither still has to read and reason about `items`, per-item and bundle denials, the bulk binding construction, the `partial` status, bulk cancellation, per-item re-evaluation, and the callback object, because they appear as conditions inside Part I rules. The catalog split showed the pattern that keeps the core thin: a companion profile that hooks in through declared extension points and registers its member names.

## What would move

**Bulk.** The `items` submission member and its per-item members; the bundle-denial coverage rules; the inline bulk claim form and the bulk `binding_hash` construction; the `partial` status and its aggregation rule; bulk cancellation semantics; per-item `result` and per-item re-evaluation; the bulk example. In the core, the conditions "when `items` is absent" on `resource`, `action`, and `denial` disappear, `partial` leaves the status enumeration, and the Idempotency-Key sentence about `items` goes with the feature.

**Callbacks.** The `callback` submission member and its members; endpoint validation and the loopback and internal-address rejection; callback authentication; the `events` filter; the PEP-side verification rules; the permission to skip polling when subscribed; the callback example; register entry G18. In the core, the polling rules lose the subscribed-PEP exception, and Task Handle Portability loses nothing.

**Not proposed to move.** Delegation and acting parties (579 words, 16 keywords): the chain-verification and authorization-input rules are behavior every Access Request Service exhibits on encountering `client.actor`, so by the Part I test they stay, and the identity questions in G6 are core questions. Cancellation (250 words, 11 keywords): small, and the Task Handle's `links.cancel` and the terminal-state rules depend on it.

## What the core must keep for the split to work

- The submission-member extension point and the ARAP Member Names registry, so `items` and `callback` remain registered names with the companion as their reference.
- The rule that implementations MAY define additional status values and that a PEP treats an unknown status as not approved, so `partial` can be defined by the bulk profile without a core change.
- A statement of what a core-only Access Request Service does on receiving `items` or `callback`. This is register entry G21 and is needed whether or not the split happens; with the split, the natural answer is the extension-point rule plus a named problem type.
- The Task Handle `links` extension point, which callbacks do not need but which keeps the pattern uniform.

## Expected effect on the core

Roughly 1,150 words and 38 keywords leave the sections a first reader must cover, and the `items` member, the `partial` status, and the second completion channel leave the core wire format. Part I would fall from about 10,100 words to about 9,200, and Part II from about 4,300 to about 3,000.

## Risks and open questions for the working group

- Interoperability: a core-only PEP meeting a bulk-capable Access Request Service is unaffected; a bulk-capable PEP meeting a core-only service needs the G21 answer. Both hold today.
- Registry: `items`, `callback`, and `partial` already appear in the OpenID Foundation registry table; the split changes their reference column, not their names.
- Sequencing: after PR A merges, as its own pull request, using the same relocation discipline (inventory, verbatim move, unit comparison) so the working group can confirm nothing changed in force. Independent of the register's Part A decisions.
- Cost: two new documents to build, publish, and maintain, and two more places for a reader who does want bulk or callbacks to look. The catalog split has already paid this cost once; the working group should decide whether the pattern scales to three companions.

## Decision requested

Whether to open a pull request that moves bulk submissions, callback completion, or both, into companion profiles following the catalog pattern.
