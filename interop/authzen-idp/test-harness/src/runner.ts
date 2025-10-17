import clc from "cli-color";
import { search } from "./results.json";

const AUTHZEN_PDP_URL =
  process.argv[2] || "https://topaz-search.authzen-interop.net";
const AUTHZEN_PDP_API_KEY = process.env.AUTHZEN_PDP_API_KEY;
const AUTHZEN_PDP_API_HEADER = process.env.AUTHZEN_PDP_API_HEADER;

enum OutputTypes {
  MARKDOWN,
  CONSOLE,
}

const FORMAT =
  process.argv[3] === "markdown" ? OutputTypes.MARKDOWN : OutputTypes.CONSOLE;

type Endpoint = "resource";

type Expected = (typeof search)[0]["expected"];
type ExpectedResult = Expected["results"]

interface Result {
  endpoint: Endpoint;
  request: (typeof search)[number]["request"];
  expected: Expected;
  response?: boolean;
  status: "PASS" | "FAIL" | "ERROR";
  error?: string;
}

async function main() {
  if (process.argv.length < 3) {
    console.log(`Usage: yarn test <authorizer-url> [<format>]

    <format> should be one of:
      console
      markdown

      and defaults to markdown
  `);
    process.exit(0);
  }

  const results: Result[] = [];

  for (const resource of search || []) {
    const result = await execute(resource, "resource");
    results.push(result);
  }

  if (FORMAT === OutputTypes.MARKDOWN) {
    console.log(
      arrayToTable(
        results.map((d) => {
          return {
            result: d.status,
            request: JSON.stringify(d.request, null, 2),
          };
        })
      )
    );
  }
}

async function execute(
  decision: (typeof search)[number],
  endpoint: Endpoint
): Promise<Result> {
  const REQ = decision.request;
  const EXP = decision.expected;
  try {
    const response = await fetch(`${AUTHZEN_PDP_URL}/access/v1/search/${endpoint}`, {
      method: "POST",
      headers: {
        [process.env.AUTHZEN_PDP_API_HEADER || "authorization"]: AUTHZEN_PDP_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(REQ),
    });

    const data = await response.json();
    const RSP = data || [];

    const result: Result = {
      endpoint,
      request: REQ,
      response: RSP,
      expected: EXP,
      status: status(RSP, EXP),
    };

    if (FORMAT === OutputTypes.CONSOLE) logResult(result);
    return result;
  } catch (error) {
    const result: Result = {
      endpoint,
      request: REQ,
      expected: EXP,
      status: "ERROR",
      error: error.message,
    };
    if (FORMAT === OutputTypes.CONSOLE) logResult(result);
    return result;
  }
}

function status(response: Expected, expected: Expected) {
  const sortResults = (items: Expected["results"]) => {
    return [...items].sort((a, b) => {
      const aAsTypeId = (a as { type: string, id: string });
      const bAsTypeId = (b as { type: string, id: string });
      if (aAsTypeId.type !== bAsTypeId.type) return aAsTypeId.type.localeCompare(bAsTypeId.type);
      return aAsTypeId.id.localeCompare(bAsTypeId.id);
    });
  };

  const sortedActualResults = sortResults(response.results || []);
  const sortedExpectedResults = sortResults(expected.results || []);

  const actualJson = JSON.stringify(sortedActualResults, (_, value) => value === null ? undefined : value);
  const expectedjson = JSON.stringify(sortedExpectedResults, (_, value) => value === null ? undefined : value);

  return actualJson === expectedjson ? "PASS" : "FAIL"
}

function logResult(result: Result) {
  switch (result.status) {
    case "PASS":
      console.log(clc.green("PASS"), "REQ:", JSON.stringify(result.request));
      break;

    case "FAIL":
      console.log(clc.red("FAIL"), "REQ:", JSON.stringify(result.request));
      break;

    default:
      console.log(
        clc.yellow("ERROR"),
        "REQ:",
        JSON.stringify(result.request),
        "Error:",
        result.error
      );
      break;
  }
}

function arrayToTable(array) {
  var cols = Object.keys(array[0]);
  var table = `<table>
  <tr>
    <th>result</th>
    <th>request</th>
  </tr>
`;
  // Generate table body
  array.forEach(function (item) {
    const bgColor = item.result ? "green" : "red";
    table += `  <tr>
    <td bgColor="${bgColor}">${String(item.result)}</td>
    <td>

`;
    table += "```js\r\n" + item.request + "\r\n```\r\n\r\n";
    table += `  </td>
  </tr>
`;
  });

  table += "</table>";

  // Return table
  return table;
}

main();
