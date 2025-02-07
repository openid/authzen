import clc from "cli-color";
import { evaluation } from "./decisions.json";

const AUTHZEN_PDP_URL =
  process.argv[2] || "https://authzen-gateway-proxy.demo.aserto.com";
const AUTHZEN_PDP_API_KEY = process.env.AUTHZEN_PDP_API_KEY;

enum OutputTypes {
  MARKDOWN,
  CONSOLE,
}

const FORMAT =
  process.argv[3] === "markdown" ? OutputTypes.MARKDOWN : OutputTypes.CONSOLE;

type Endpoint = "evaluation" | "evaluations";

interface Result {
  endpoint: Endpoint;
  request: (typeof evaluation)[number]["request"];
  expected: (typeof evaluation)[0]["expected"];
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

  const decisionFile ='./decisions.json'
  const { evaluation, evaluations } = require(decisionFile);

  const results: Result[] = [];

  for (const decision of evaluation || []) {
    const result = await execute(decision, "evaluation");
    results.push(result);
  }

  for (const decision of evaluations || []) {
    const result = await execute(decision, "evaluations");
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
  decision: (typeof evaluation)[number],
  endpoint: Endpoint
): Promise<Result> {
  const REQ = decision.request;
  const EXP = decision.expected;
  try {
    const response = await fetch(`${AUTHZEN_PDP_URL}/access/v1/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: AUTHZEN_PDP_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(REQ),
    });

    const data = await response.json();
    const RSP =
      endpoint === "evaluation"
        ? data.decision || false
        : data.evaluations || [];

    const result: Result = {
      endpoint,
      request: REQ,
      response: RSP,
      expected: EXP,
      status: JSON.stringify(EXP) === JSON.stringify(RSP) ? "PASS" : "FAIL",
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
