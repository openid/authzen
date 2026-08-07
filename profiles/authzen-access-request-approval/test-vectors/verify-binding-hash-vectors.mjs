#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const vectorsPath = fileURLToPath(
  new URL("./binding-hash.json", import.meta.url),
);

function canonicalize(value) {
  if (value === null) return "null";

  switch (typeof value) {
    case "boolean":
    case "number":
    case "string":
      return JSON.stringify(value);
    case "object":
      if (Array.isArray(value)) {
        return `[${value.map(canonicalize).join(",")}]`;
      }
      return `{${Object.keys(value)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
        .join(",")}}`;
    default:
      throw new TypeError(`Unsupported JSON value: ${typeof value}`);
  }
}

function projectContext(context, members) {
  const selected = {};
  for (const member of members) {
    if (Object.hasOwn(context, member)) selected[member] = context[member];
  }
  return selected;
}

function projectSubject(subject) {
  const projected = structuredClone(subject);
  if (projected.properties) delete projected.properties.act;
  return projected;
}

function constructHashInput(vector) {
  const common = {
    subject: projectSubject(vector.request.subject),
    context: projectContext(
      vector.request.context ?? {},
      vector.binding_context_members,
    ),
  };

  if (vector.kind === "single") {
    return {
      ...common,
      resource: vector.request.resource,
      action: vector.request.action,
    };
  }

  if (vector.kind === "bulk") {
    return {
      ...common,
      items: vector.request.items.map(({ resource, action }) => ({
        resource,
        action,
      })),
    };
  }

  throw new TypeError(`Unknown vector kind: ${vector.kind}`);
}

const manifest = JSON.parse(await readFile(vectorsPath, "utf8"));

for (const vector of manifest.vectors) {
  const hashInput = constructHashInput(vector);
  const jcs = canonicalize(hashInput);
  const digest = createHash("sha256").update(jcs, "utf8").digest();
  const sha256Hex = digest.toString("hex");
  const bindingHash = digest.toString("base64url");

  if (process.argv.includes("--show")) {
    process.stdout.write(
      `${JSON.stringify({
        id: vector.id,
        hash_input: hashInput,
        jcs,
        sha256_hex: sha256Hex,
        binding_hash: bindingHash,
      })}\n`,
    );
    continue;
  }

  assert.deepEqual(hashInput, vector.hash_input, `${vector.id}: hash input`);
  assert.equal(jcs, vector.jcs, `${vector.id}: JCS serialization`);
  assert.equal(sha256Hex, vector.sha256_hex, `${vector.id}: SHA-256 hex`);
  assert.equal(bindingHash, vector.binding_hash, `${vector.id}: binding_hash`);
}

if (!process.argv.includes("--show")) {
  process.stdout.write(`Verified ${manifest.vectors.length} binding_hash vectors.\n`);
}
