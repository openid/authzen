import fs from 'fs/promises';
import path from 'path';
import axios, { AxiosError } from 'axios';
import { deepStrictEqual } from 'assert'; // Using Node.js assert for deep comparison

// --- Configuration ---
// const AUTHZEN_PDP_API_KEY = process.env.AUTHZEN_PDP_API_KEY;
const API_ENDPOINT_URL = process.argv[2] || 'https://authzen-proxy-demo.cerbos.dev/';
const SUBJECT_SEARCH_ROUTE = 'access/v1/search/subject';
const ACTION_SEARCH_ROUTE = 'access/v1/search/action';
const RESOURCE_SEARCH_ROUTE = 'access/v1/search/resource';
const SUBJECT_RESULTS_FILE_PATH = path.join(__dirname, '../subject/results.json');
const ACTION_RESULTS_FILE_PATH = path.join(__dirname, '../action/results.json');
const RESOURCE_RESULTS_FILE_PATH = path.join(__dirname, '../resource/results.json');

// --- Interfaces based on your results.json structure ---
interface RequestResource {
  type: string;
  id?: string;
}

interface RequestAction {
  name?: string;
}

interface RequestSubject {
  type: string;
  id?: string;
}

interface RequestPayload {
  resource: RequestResource;
  action: RequestAction;
  subject: RequestSubject;
}

interface ExpectedResultItem {
  type: string;
  id: string;
}

interface ExpectedResponse {
  results: ExpectedResultItem[];
}

interface EvaluationItem {
  request: RequestPayload;
  expected: ExpectedResponse;
}

interface ResultsFile {
  evaluation: EvaluationItem[];
}

// --- Helper function for comparing results (handles order-agnostic comparison for arrays) ---
function compareResponses(actual: ExpectedResponse, expected: ExpectedResponse): { match: boolean; details: string } {
  try {
    // For a more robust comparison, especially if order of results doesn't matter:
    // 1. Sort both arrays based on a consistent key (e.g., type and id)
    // 2. Then perform a deep strict equal.

    const sortResults = (items: ExpectedResultItem[]) => {
      return [...items].sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.id.localeCompare(b.id);
      });
    };

    const sortedActualResults = sortResults(actual.results || []);
    const sortedExpectedResults = sortResults(expected.results || []);

    // Create copies of the objects to avoid modifying the original
    const comparableActual = { ...actual, results: sortedActualResults };
    const comparableExpected = { ...expected, results: sortedExpectedResults };
    
    deepStrictEqual(comparableActual, comparableExpected);
    return { match: true, details: "Actual response matches expected response." };
  } catch (error: any) {
    return { 
      match: false, 
      details: `Mismatch found: ${error.message}\nExpected: ${JSON.stringify(expected, null, 2)}\nActual: ${JSON.stringify(actual, null, 2)}`
    };
  }
}


// --- Main script logic ---
async function runTests() {
  await runTestSuite(SUBJECT_RESULTS_FILE_PATH,SUBJECT_SEARCH_ROUTE);
  await runTestSuite(ACTION_RESULTS_FILE_PATH,ACTION_SEARCH_ROUTE);
  await runTestSuite(RESOURCE_RESULTS_FILE_PATH,RESOURCE_SEARCH_ROUTE);
}
async function runTestSuite(testFile: string, apiRoute: string) {
  console.log(`Reading results from: ${testFile}`);
  let resultsData: ResultsFile;

  try {
    const fileContent = await fs.readFile(testFile, 'utf-8');
    resultsData = JSON.parse(fileContent) as ResultsFile;
  } catch (error) {
    console.error(`Failed to read or parse ${testFile}:`, error);
    return;
  }

  console.log(`Found ${resultsData.evaluation.length} test cases to evaluate.\n`);

  for (let i = 0; i < resultsData.evaluation.length; i++) {
    const testCase = resultsData.evaluation[i];
    console.log(`--- Test Case ${i + 1} ---`);
    console.log("Request Payload:", JSON.stringify(testCase.request, null, 2));
    console.log("Expected Response:", JSON.stringify(testCase.expected, null, 2));

    try {
      const response = await axios.post<ExpectedResponse>(API_ENDPOINT_URL+apiRoute, testCase.request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("Actual Response Status:", response.status);
      console.log("Actual Response Data:", JSON.stringify(response.data, null, 2));

      const comparison = compareResponses(response.data, testCase.expected);
      if (comparison.match) {
        console.log("Comparison Result: SUCCESS\n");
      } else {
        console.error("Comparison Result: FAILED");
        console.error("Details:", comparison.details, "\n");
      }

    } catch (error) {
      console.error(`Error during API call for Test Case ${i + 1}:`);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          console.error("Status:", axiosError.response.status);
          console.error("Data:", JSON.stringify(axiosError.response.data, null, 2));
        } else if (axiosError.request) {
          console.error("No response received:", axiosError.request);
        } else {
          console.error("Error message:", axiosError.message);
        }
      } else {
        console.error("Unexpected error:", error);
      }
      console.log("\n");
    }
  }
}

runTests().catch(error => {
  console.error("An unexpected error occurred during the test run:", error);
});
