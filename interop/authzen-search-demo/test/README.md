# README
Use `npm run test-clean` or `yarn test` to execute the runner.

The runner (`src/runner.ts`) reads the data from all 3 Search APIs test files and POSTs the requests to the API endpoints.

It then does an unordered comparison of the response with the expected response.

# TODO
Generate a report of the results