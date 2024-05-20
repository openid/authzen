import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

const OK_COLOR = chalk.green.bold;
const ERR_COLOR = chalk.red.bold;
const ATTN_COLOR = chalk.yellow.bold;

const decisionsPath = path.resolve(__dirname, "test/decisions.json");
const decisions = JSON.parse(fs.readFileSync(decisionsPath, "utf-8")).decisions;

const AUTHZEN_PDP_URL =
  process.argv[2] || "https://authzen-proxy.demo.aserto.com";
const AUTHZEN_PDP_API_KEY = process.env.AUTHZEN_PDP_API_KEY;

decisions.forEach(async (decision: any) => {
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

    if (JSON.stringify(EXP) === JSON.stringify(RSP)) {
      console.log(OK_COLOR("PASS"), "REQ:", JSON.stringify(REQ));
    } else {
      console.log(
        ERR_COLOR("FAIL"),
        "REQ:",
        JSON.stringify(REQ),
        ATTN_COLOR("EXP:", JSON.stringify(EXP))
      );
    }
  } catch (error) {
    console.error(
      ERR_COLOR("ERROR"),
      "REQ:",
      JSON.stringify(REQ),
      "Error:",
      error.message
    );
  }
});

console.log("<<< done checking decisions\n");
