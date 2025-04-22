import os
import json
import random

# File paths
records_file = "../data/records.json"
output_file = "results.json"

# Delete the output file if it exists
if os.path.exists(output_file):
    os.remove(output_file)

# Load the records from the JSON file
with open(records_file, "r") as file:
    records = json.load(file)

# Define the actions
actions = ["view", "edit", "delete"]

# Define the possible user IDs
user_ids = ["alice", "bob", "carol", "dan", "erin", "felix"]

# Create a list to hold all test cases
all_tests = []

# Generate test cases
for record in records:
    record_id = record["id"]
    for action in actions:
        # Construct the test content
        test_content = {
            "request": {
                "subject": {
                    "type": "user"
                },
                "action": {
                    "name": action
                },
                "resource": {
                    "type": "record",
                    "id": str(record_id)
                }
            },
            "expected": {
                "results": [
                    {
                        "type": "user",
                        "id": random.choice(user_ids)  # Randomly assign a user ID
                    }
                ]
            }
        }
        # Add the test content to the list
        all_tests.append(test_content)

# Write all tests to a single JSON file
with open(output_file, "w") as file:
    json.dump(all_tests, file, indent=2)

print(f"All tests written to '{output_file}'.")