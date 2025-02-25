#!/bin/bash

# Start the first process
./external-pdp &

# Start the second process
./envoy-entry.sh &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
