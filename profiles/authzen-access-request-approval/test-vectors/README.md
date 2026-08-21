# `binding_hash` conformance vectors

`binding-hash.json` provides byte-identical known-answer vectors for the
`binding_hash` construction defined by the Access Request Approval profile.
Each vector contains the original request values, the integrity-protected
`binding_context_members` selection, the projected hash input, its RFC 8785
JSON Canonicalization Scheme (JCS) serialization, and the resulting SHA-256
digest in hexadecimal and unpadded base64url forms.

The corpus covers:

- single-item and bulk hash inputs;
- removal of `subject.properties.act`;
- authorization-relevant Context selection and an empty selection;
- the distinction between an absent member and a member whose value is `null`;
- JCS number serialization;
- array and bulk item ordering.

Run the dependency-free verifier with:

```sh
node test-vectors/verify-binding-hash-vectors.mjs
```

The verifier independently reconstructs each hash input from `request` and
`binding_context_members`, canonicalizes it, and checks all pinned outputs.
