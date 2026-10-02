# COAZ-MCP agent-identity trust-anchor vectors

`agent-identity.json` provides repository-level, non-normative vectors for the
agent-identity trust anchor defined by the
[COAZ-MCP binding](../../../profiles/authzen-coaz-mcp-binding-1_0.md#agent-identity-claim).
Each vector pairs a validated token and a declared mapping with the AuthZEN
request a conforming PEP constructs — or the mapping error it raises instead —
and the decision an actor-sensitive sample policy then returns.

Subject, action, and resource are identical across every single-decision
vector. The only variables are the validated token, the declared mapping, and
the caller-supplied tool arguments, which isolates the acting-agent identity as
the single authorization-relevant difference. The bulk vectors additionally
exercise anchoring over the *effective context* of each decision: under
[AuthZEN default/override semantics](../../../api/authorization-api-1_0.md#default-values)
an `evaluations` entry that specifies its own `context` overrides the top-level
`context` for that entry rather than merging with it.

The corpus covers:

- the anchored case, where the mapping's resolved value equals the
  agent-identity claim and the PEP's independent verification succeeds;
- the same subject, action, and resource with a different trusted acting
  identity, yielding a different decision;
- a mapping-supplied literal and a caller-supplied tool argument that each
  attempt to assert a different acting identity, both of which are mapping
  errors rather than authoritative values;
- a mapping that omits `context.agent`, which the PEP supplies from the claim;
- a token carrying no agent-identity claim, where `context.agent` is omitted
  and an actor-dependent policy fails closed; and
- a deployment that designates a claim other than `client_id`, distinguishing
  two upstream actors associated with the same `client_id`;
- an `evaluations` request whose entries inherit the top-level anchored agent;
- an overriding per-entry `context` that supplies only an unrelated member,
  where the anchored agent must still appear in the resulting effective
  context rather than being dropped by the override;
- a per-entry `context` naming the trusted agent explicitly, and one asserting
  a different agent, which is a mapping error; and
- an `evaluations` request with no agent-identity claim, where no authoritative
  agent value appears at either level;
- a mapping that constructs a request with no `context` member at all, in the
  single-decision and `evaluations` forms, where the PEP creates the container
  the anchored value needs — establishing it once as the shared top-level
  default rather than fabricating a context per entry; and
- the same absent-`context` shape with no agent-identity claim, where no
  `context` object is manufactured and, above all, no `agent` is.

Run the dependency-free verifier with:

```sh
node interop/test-vectors/agent-identity/verify-agent-identity-vectors.mjs
```

The verifier independently implements the subject- and agent-identity anchoring
steps of the binding's PEP algorithm, resolves each mapping against the token
and params, and checks every pinned request, mapping error, and decision. It
additionally asserts the invariants the vectors exist to demonstrate: that
neither spoof reaches the PDP; that the actor-difference pair differs only in
`context.agent` and only in its decision; and that every decision carries the anchored
agent when a trusted claim exists, that no effective context ever carries an
`agent` the PEP did not corroborate against that claim, and that the field is
omitted rather than forwarded with weaker provenance when no such claim exists.
Both directions of that check tolerate an entirely absent `context`.

Pass `--show` to print the constructed request and decision for each vector
instead of asserting the pinned values.
