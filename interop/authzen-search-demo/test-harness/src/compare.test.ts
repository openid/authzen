import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { compareResults } from "./compare";
import { evaluation as actions } from "./action/results.json";
import { evaluation as subjects } from "./subject/results.json";
import { evaluation as resources } from "./resource/results.json";

const reverseMembers = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(reverseMembers);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .reverse()
        .map(([k, v]) => [k, reverseMembers(v)])
    );
  }
  return value;
};

describe("compareResults", () => {
  test("objects with different member order are equal (#693)", () => {
    assert.equal(
      compareResults(
        { results: [{ id: "alice", type: "user" }] },
        { results: [{ type: "user", id: "alice" }] }
      ),
      "PASS"
    );
  });

  test("nested objects with different member order are equal", () => {
    assert.equal(
      compareResults(
        { results: [{ id: "101", type: "record", properties: { b: 2, a: { y: 1, x: 0 } } }] },
        { results: [{ type: "record", id: "101", properties: { a: { x: 0, y: 1 }, b: 2 } }] }
      ),
      "PASS"
    );
  });

  test("different property values fail", () => {
    assert.equal(
      compareResults(
        { results: [{ type: "user", id: "alice" }] },
        { results: [{ type: "user", id: "bob" }] }
      ),
      "FAIL"
    );
    assert.equal(
      compareResults(
        { results: [{ type: "record", id: "101", properties: { n: 1 } }] },
        { results: [{ type: "record", id: "101", properties: { n: "1" } }] }
      ),
      "FAIL"
    );
  });

  test("missing or extra fields fail", () => {
    assert.equal(
      compareResults(
        { results: [{ type: "user", id: "alice" }] },
        { results: [{ type: "user", id: "alice", properties: { role: "admin" } }] }
      ),
      "FAIL"
    );
    assert.equal(
      compareResults(
        { results: [{ type: "user", id: "alice", extra: true }] },
        { results: [{ type: "user", id: "alice" }] }
      ),
      "FAIL"
    );
  });

  test("result arrays in different order are equal (existing sorting preserved)", () => {
    assert.equal(
      compareResults(
        { results: [{ name: "delete" }, { name: "view" }, { name: "edit" }] },
        { results: [{ name: "view" }, { name: "edit" }, { name: "delete" }] }
      ),
      "PASS"
    );
    assert.equal(
      compareResults(
        {
          results: [
            { type: "user", id: "bob" },
            { id: "alice", type: "user" },
          ],
        },
        {
          results: [
            { type: "user", id: "alice" },
            { type: "user", id: "bob" },
          ],
        }
      ),
      "PASS"
    );
  });

  test("multiple entities with the same type but different ids", () => {
    const expected = {
      results: [
        { type: "user", id: "alice" },
        { type: "user", id: "bob" },
        { type: "user", id: "carol" },
      ],
    };
    assert.equal(
      compareResults(
        {
          results: [
            { id: "carol", type: "user" },
            { id: "alice", type: "user" },
            { id: "bob", type: "user" },
          ],
        },
        expected
      ),
      "PASS"
    );
    assert.equal(
      compareResults(
        {
          results: [
            { type: "user", id: "alice" },
            { type: "user", id: "bob" },
          ],
        },
        expected
      ),
      "FAIL"
    );
    assert.equal(
      compareResults(
        {
          results: [
            { type: "user", id: "alice" },
            { type: "user", id: "alice" },
            { type: "user", id: "carol" },
          ],
        },
        expected
      ),
      "FAIL"
    );
  });

  test("null handling matches the previous behaviour", () => {
    // null-valued members are ignored
    assert.equal(
      compareResults(
        { results: [{ type: "user", id: "alice", properties: null }] },
        { results: [{ type: "user", id: "alice" }] }
      ),
      "PASS"
    );
    // missing or null results are treated as empty
    assert.equal(compareResults({ results: null }, { results: [] }), "PASS");
    assert.equal(compareResults({}, { results: [] }), "PASS");
    // nulls inside arrays are still significant
    assert.equal(
      compareResults(
        { results: [{ type: "user", id: "alice", properties: { tags: ["a", null] } }] },
        { results: [{ type: "user", id: "alice", properties: { tags: ["a"] } }] }
      ),
      "FAIL"
    );
  });

  test("nested arrays remain order-sensitive", () => {
    assert.equal(
      compareResults(
        { results: [{ type: "record", id: "101", properties: { tags: ["b", "a"] } }] },
        { results: [{ type: "record", id: "101", properties: { tags: ["a", "b"] } }] }
      ),
      "FAIL"
    );
    assert.equal(
      compareResults(
        { results: [{ type: "record", id: "101", properties: { tags: ["a", "b"] } }] },
        { results: [{ type: "record", id: "101", properties: { tags: ["a", "b"] } }] }
      ),
      "PASS"
    );
  });

  test("empty results", () => {
    assert.equal(compareResults({ results: [] }, { results: [] }), "PASS");
    assert.equal(compareResults({ results: [{ name: "view" }] }, { results: [] }), "FAIL");
    assert.equal(compareResults({ results: [] }, { results: [{ name: "view" }] }), "FAIL");
  });
});

describe("compareResults against the interop fixtures", () => {
  const suites = { action: actions, subject: subjects, resource: resources };

  for (const [endpoint, cases] of Object.entries(suites)) {
    test(endpoint + ": every expected result matches itself", () => {
      for (const { expected } of cases) {
        assert.equal(compareResults(expected, expected), "PASS");
      }
    });

    test(endpoint + ": reordered members and results still pass", () => {
      for (const { expected } of cases) {
        const reordered = reverseMembers({ results: [...expected.results].reverse() });
        assert.equal(compareResults(reordered, expected), "PASS");
      }
    });

    test(endpoint + ": dropping a result fails", () => {
      for (const { expected } of cases.filter((c) => c.expected.results.length > 0)) {
        assert.equal(compareResults({ results: expected.results.slice(1) }, expected), "FAIL");
      }
    });
  }
});
