#!/usr/bin/env node

// Verifies the COAZ-MCP agent-identity trust anchor: the PEP establishes the
// acting-client identity from the agent-identity claim of the validated token,
// independently of the declared mapping. context.agent is enforced by
// verification when the mapping supplies the field; when it omits the field,
// the PEP supplies the trusted value from the agent-identity claim.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const vectorsPath = fileURLToPath(
  new URL("./agent-identity.json", import.meta.url),
);

class MappingError extends Error {}

// Minimal resolver for the expression subset these vectors use: a leading `$`
// marks an expression over `token` and `params`; `?` marks an optional field.
function resolve(value, inputs) {
  if (typeof value !== "string" || !value.startsWith("$")) return value;
  if (value.startsWith("$$")) return value.slice(1);

  const path = value.slice(1).split(".");
  let current = inputs;

  for (const rawSegment of path) {
    const optional = rawSegment.startsWith("?");
    const segment = optional ? rawSegment.slice(1) : rawSegment;

    if (current === undefined || !Object.hasOwn(current, segment)) {
      if (optional) return undefined;
      throw new MappingError(`expression '${value}' failed: no such key '${segment}'`);
    }
    current = current[segment];
  }
  return current;
}

function resolveObject(template, inputs) {
  if (template === undefined) return undefined;
  const out = {};
  for (const [key, value] of Object.entries(template)) {
    const resolved =
      value !== null && typeof value === "object" && !Array.isArray(value)
        ? resolveObject(value, inputs)
        : resolve(value, inputs);
    // An optional expression that resolved to nothing omits its field.
    if (resolved !== undefined) out[key] = resolved;
  }
  return out;
}

// The PEP algorithm of profiles/authzen-coaz-mcp-binding-1_0.md#pep-behavior,
// limited to the subject- and agent-identity anchoring steps.
function runPep(vector, baseline) {
  const params = vector.params ?? baseline.params;
  const token = vector.token;
  const inputs = { token, params };

  const isBulk = Object.hasOwn(vector.mapping, "evaluations");
  const envelope = isBulk ? vector.mapping.evaluations : vector.mapping.evaluation;

  const request = {
    subject: resolveObject(envelope.subject, inputs),
    action: resolveObject(envelope.action, inputs),
    resource: resolveObject(envelope.resource, inputs),
    context: resolveObject(envelope.context, inputs),
  };
  for (const key of Object.keys(request)) {
    if (request[key] === undefined) delete request[key];
  }

  if (isBulk) {
    request.evaluations = envelope.evaluations.map((entry) => {
      const resolved = {
        action: resolveObject(entry.action, inputs),
        resource: resolveObject(entry.resource, inputs),
        context: resolveObject(entry.context, inputs),
      };
      for (const key of Object.keys(resolved)) {
        if (resolved[key] === undefined) delete resolved[key];
      }
      return resolved;
    });
  }

  // Step 6: anchor the subject identity.
  const subjectClaim = token[vector.subject_identity_claim ?? "sub"];
  if (request.subject?.id !== subjectClaim) {
    throw new MappingError(
      `subject.id resolved to '${request.subject?.id}' but the subject-identity claim is '${subjectClaim}'`,
    );
  }

  // Step 7: anchor the agent identity over the EFFECTIVE context of every
  // decision. Per AUTHZEN default/override semantics, an evaluations entry
  // that specifies its own context overrides the top-level context for that
  // entry rather than merging with it -- so an overriding entry that omits
  // `agent` must still receive the anchored value.
  const trustedAgent = token[vector.agent_identity_claim];

  // Owners of an effective context. Each entry of an evaluations request is
  // owned by itself when it overrides the top-level context, and by the
  // request otherwise -- so entries sharing the top-level default resolve to
  // the same owner and are anchored once, as a shared default, rather than
  // each being given a fabricated context of its own.
  const owners = new Set();
  if (isBulk) {
    if (request.context) owners.add(request);
    for (const entry of request.evaluations) {
      owners.add(Object.hasOwn(entry, "context") ? entry : request);
    }
  } else {
    owners.add(request);
  }

  for (const owner of owners) {
    // The context object itself may be absent: a mapping can construct a
    // valid request with no context at all.
    const context = owner.context;

    if (trustedAgent === undefined) {
      // No trusted source: never populate the field, and never materialize a
      // context object merely to delete a key from it.
      if (context) delete context.agent;
    } else if (!context) {
      // Absent context, trusted claim present: create the container the
      // anchored value needs at this effective level.
      owner.context = { agent: trustedAgent };
    } else if (!Object.hasOwn(context, "agent")) {
      // Not supplied for this decision: the PEP sets it from the claim.
      context.agent = trustedAgent;
    } else if (context.agent !== trustedAgent) {
      throw new MappingError(
        `context.agent resolved to '${context.agent}' but the agent-identity claim is '${trustedAgent}'`,
      );
    }
  }

  return request;
}

// The actor-sensitive sample policy from the manifest. Each decision is
// evaluated against its own effective context.
function decide(request, policy) {
  const permit = policy.permit_when;

  const decideOne = (action, resource, context) =>
    request.subject?.id === permit["subject.id"] &&
    action?.name === permit["action.name"] &&
    resource?.id === permit["resource.id"] &&
    context?.agent === permit["context.agent"];

  if (!request.evaluations) {
    return decideOne(request.action, request.resource, request.context);
  }
  return request.evaluations.map((entry) =>
    decideOne(
      entry.action ?? request.action,
      entry.resource ?? request.resource,
      Object.hasOwn(entry, "context") ? entry.context : request.context,
    ),
  );
}

const manifest = JSON.parse(await readFile(vectorsPath, "utf8"));
const show = process.argv.includes("--show");

// Every effective context of a constructed request, for the no-dual-semantics
// check below.
function effectiveContexts(request) {
  if (!request.evaluations) return [request.context];
  return request.evaluations.map((entry) =>
    Object.hasOwn(entry, "context") ? entry.context : request.context,
  );
}

for (const vector of manifest.vectors) {
  let request;
  let outcome;
  let failure;

  try {
    request = runPep(vector, manifest.baseline);
    outcome = "request";
  } catch (error) {
    if (!(error instanceof MappingError)) throw error;
    outcome = "mapping_error";
    failure = error.message;
  }

  const decision = outcome === "request" ? decide(request, manifest.policy) : undefined;

  if (show) {
    process.stdout.write(
      `${JSON.stringify({ id: vector.id, outcome, request, decision, failure })}\n`,
    );
    continue;
  }

  const expected = vector.expected;
  assert.equal(outcome, expected.outcome, `${vector.id}: outcome`);

  if (expected.outcome === "mapping_error") {
    // The PDP must not be reached with a spoofed identity.
    assert.equal(expected.pdp_called, false, `${vector.id}: pdp_called`);
    assert.equal(failure, expected.reason, `${vector.id}: mapping-error reason`);
    assert.equal(decision, undefined, `${vector.id}: no decision on mapping error`);
  } else {
    assert.deepEqual(request, expected.request, `${vector.id}: constructed request`);
    assert.deepEqual(decision, expected.decision, `${vector.id}: policy decision`);

    // No dual-semantics wire value: any context.agent that reaches the PDP
    // equals the trusted claim. Where the claim is absent, the field is
    // absent -- it is never forwarded with weaker provenance. Both branches
    // tolerate an entirely absent context object.
    const trusted = vector.token[vector.agent_identity_claim];
    for (const context of effectiveContexts(request)) {
      if (trusted === undefined) {
        assert.equal(
          Object.hasOwn(context ?? {}, "agent"),
          false,
          `${vector.id}: no agent forwarded without a trusted claim`,
        );
      } else {
        // A trusted claim exists, so every decision must carry it -- an
        // absent context does not excuse a missing anchored value.
        assert.equal(
          Object.hasOwn(context ?? {}, "agent"),
          true,
          `${vector.id}: anchored agent must reach every decision`,
        );
        assert.equal(
          context.agent,
          trusted,
          `${vector.id}: forwarded agent must equal the trusted claim`,
        );
      }
    }
  }
}

if (!show) {
  // The core invariant: an attacker-controlled assertion of agent-A never
  // reaches the PDP as an authoritative identity when the token says agent-B.
  const spoofs = manifest.vectors.filter((v) =>
    ["mapping-literal-spoof", "caller-argument-spoof"].includes(v.id),
  );
  assert.equal(spoofs.length, 2, "both spoof vectors present");
  for (const spoof of spoofs) {
    assert.equal(spoof.expected.outcome, "mapping_error", `${spoof.id}: fails closed`);
  }

  // Same subject/action/resource, different trusted actor, different decision.
  const [permit, deny] = ["anchored-agent-a-permit", "anchored-agent-b-deny"].map((id) =>
    manifest.vectors.find((v) => v.id === id),
  );
  for (const field of ["subject", "action", "resource"]) {
    assert.deepEqual(
      permit.expected.request[field],
      deny.expected.request[field],
      `actor-difference pair: ${field} must be identical`,
    );
  }
  assert.notEqual(
    permit.expected.request.context.agent,
    deny.expected.request.context.agent,
    "actor-difference pair: agent must differ",
  );
  assert.notEqual(
    permit.expected.decision,
    deny.expected.decision,
    "actor-difference pair: decision must differ",
  );

  process.stdout.write(
    `Verified ${manifest.vectors.length} agent-identity vectors.\n`,
  );
}
