import clc from "cli-color";
import { evaluation as actions } from "./action/results.json";
import { evaluation as subjects } from "./subject/results.json";
import { evaluation as resources } from "./resource/results.json";

const AUTHZEN_PDP_URL =
  process.argv[2] || "https://topaz-search.demoauthzen-interop.net";
const AUTHZEN_PDP_API_KEY = process.env.AUTHZEN_PDP_API_KEY;

enum OutputTypes {
  MARKDOWN,
  CONSOLE,
}

const FORMAT =
  process.argv[3] === "markdown" ? OutputTypes.MARKDOWN : OutputTypes.CONSOLE;

type Endpoint = "action" | "resource" | "subject";

type Expected = (typeof actions)[0]["expected"] | (typeof subjects)[0]["expected"] | (typeof resources)[0]["expected"];
type ExpectedResult = Expected["results"]

interface Result {
  endpoint: Endpoint;
  request: (typeof actions)[number]["request"] | (typeof subjects)[number]["request"] | (typeof resources)[number]["request"];
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

  //const decisionFile ='./action/results.json'
  //const { evaluation } = require(decisionFile);

  const results: Result[] = [];

  for (const subject of subjects || []) {
    const result = await execute(subject, "subject");
    results.push(result);
  }

  for (const resource of resources || []) {
    const result = await execute(resource, "resource");
    results.push(result);
  }

  for (const action of actions || []) {
    const result = await execute(action, "action");
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
  decision: (typeof actions)[number] | (typeof subjects)[number] | (typeof resources)[number],
  endpoint: Endpoint
): Promise<Result> {
  const REQ = decision.request;
  const EXP = decision.expected;
  try {
    const response = await fetch(`${AUTHZEN_PDP_URL}/access/v1/search/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: AUTHZEN_PDP_API_KEY,
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
      if (aAsTypeId.type) {
        if (aAsTypeId.type !== bAsTypeId.type) return aAsTypeId.type.localeCompare(bAsTypeId.type);
        return aAsTypeId.id.localeCompare(bAsTypeId.id);  
      }
      const aAsName = (a as { name: string });
      const bAsName = (b as { name: string });
      return aAsName.name.localeCompare(bAsName.name);
    });
  };

  const sortedActualResults = sortResults(response.results || []);
  const sortedExpectedResults = sortResults(expected.results || []);

  const actualResults = sortedActualResults.filter((r) => {
    const actionResult = r as { name: string };
    if (actionResult.name) {
      return actionResult.name === "delete" || actionResult.name === "edit" || actionResult.name === "view"
    }
    return r;
  })

  const actualJson = JSON.stringify(actualResults, (_, value) => value === null ? undefined : value);
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
