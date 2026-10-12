import { isDeepStrictEqual } from "node:util";

type SearchResult = { type?: string; id?: string; name?: string; [key: string]: unknown };

export interface SearchResponse {
  results?: SearchResult[] | null;
}

// Drops null-valued members, matching what the runner has always ignored.
const stripNulls = (_: string, value: unknown) => (value === null ? undefined : value);

// Round-trips through JSON so the comparison sees exactly the data the previous
// string-based check did, without depending on member insertion order.
const normalize = (value: unknown) => JSON.parse(JSON.stringify(value, stripNulls));

export function compareResults(response: SearchResponse, expected: SearchResponse) {
  const sortResults = (items: SearchResult[]) => {
    return [...items].sort((a, b) => {
      if (a.type) {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.id.localeCompare(b.id);
      }
      return a.name.localeCompare(b.name);
    });
  };

  const sortedActualResults = sortResults(response.results || []);
  const sortedExpectedResults = sortResults(expected.results || []);

  // RFC 8259 treats JSON objects as unordered, so compare parsed values
  // structurally. Array order stays significant.
  return isDeepStrictEqual(normalize(sortedActualResults), normalize(sortedExpectedResults))
    ? "PASS"
    : "FAIL";
}
