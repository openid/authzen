import clc from "cli-color";

import { decisions } from "./decisions.json";

const AUTHZEN_PDP_URL =
  process.argv[2] || "https://authzen-proxy.demo.aserto.com";
const AUTHZEN_PDP_API_KEY = process.env.AUTHZEN_PDP_API_KEY;

enum OutputTypes {
  MARKDOWN,
  CONSOLE,
}

const FORMAT =
  process.argv[3] === "markdown" ? OutputTypes.MARKDOWN : OutputTypes.CONSOLE;

interface Result {
  request: (typeof decisions)[number]["request"];
  expected: (typeof decisions)[0]["expected"];
  response?: boolean;
  status: "PASS" | "FAIL" | "ERROR";
  error?: string;
}

async function main() {
  const results: Result[] = [];

  for (const decision of decisions) {
    const REQ = decision.request;
    const EXP = decision.expected;
    try {
      const response = await fetch(`${AUTHZEN_PDP_URL}/access/v1/evaluation`, {
        method: "POST",
        headers: {
          Authorization: AUTHZEN_PDP_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(REQ),
      });

      const data = await response.json();
      const RSP = data.decision || false;

      const result: Result = {
        request: REQ,
        response: RSP,
        expected: EXP,
        status: JSON.stringify(EXP) === JSON.stringify(RSP) ? "PASS" : "FAIL",
      };

      results.push(result);
      if (FORMAT === OutputTypes.CONSOLE) logResult(result);
    } catch (error) {
      const result: Result = {
        request: REQ,
        expected: EXP,
        status: "ERROR",
        error: error.message,
      };

      results.push(result);
      if (FORMAT === OutputTypes.CONSOLE) logResult(result);
    }
  }

  if (FORMAT === OutputTypes.MARKDOWN) {
    console.log(
      arrayToTable(
        results.map((d) => {
          return {
            result: d.status,
            request: JSON.stringify(d.request),
          };
        })
      )
    );
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

/* inspired by https://github.com/nijikokun/array-to-table/blob/master/index.js */
function arrayToTable (array, columns?, alignment = 'center') {
  var table = ""
  var separator = {
    'left': ':---',
    'right': '---:',
    'center': '---'
  }

  // Generate column list
  var cols = columns
    ? columns.split(",")
    : Object.keys(array[0])

  // Generate table headers
  table += `| ${cols.join(' | ')} |\r\n`

  // Generate table header seperator
  table += `| ${cols.map(function () {
    return separator[alignment] || separator.center
  }).join(' | ')} |\r\n`

  // Generate table body
  array.forEach(function (item) {

    table += `| ${cols.map(function (key) {
      if (key === 'request') {
        return '`' + String(item[key] || '') + '`'
      } else {
        return String(item[key] || '')
      }
    }).join(' | ')} |\r\n`
  })

  // Return table
  return table
}

main();
