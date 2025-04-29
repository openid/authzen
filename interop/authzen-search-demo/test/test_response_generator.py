import json

def generate_test_cases_and_markdown(header, access_matrix, searchResultType, searchResultCategory, lookupType, lookupCategory, destination_md="results.md", destination_json="results.json"):
    """
    Generates test cases and a Markdown table from the access matrix.

    Args:
        access_matrix (dict): A dictionary where keys are usernames and values are dictionaries
                              containing actions (view, edit, delete) and their corresponding record lists.

    Returns:
        tuple: A tuple containing:
            - test_cases (list): A list of test case dictionaries.
            - markdown_lines (list): A list of strings representing the Markdown table.
    """
    test_cases = []
    markdown_lines = []
    markdown_lines.append(header)
    markdown_lines.append("|--------|--------|--------------------------|")

    for key, actions in access_matrix.items():
        for action, result_set in actions.items():
            result_list = ", ".join(map(str, result_set))  # Convert record IDs to a comma-separated string
            markdown_lines.append(f"| {key} | {action}   | [{result_list}] |")
            results = []
            for result_id in result_set:
                results.append({
                    "type": searchResultType,
                    "id": str(result_id)
                })

            test_case = {
                "request": {
                    lookupCategory: {
                        "type": lookupType,
                        "id": key
                    },
                    "action": {
                        "name": action
                    },
                    searchResultCategory: {
                        "type": searchResultType
                    }
                },
                "expected": {
                    "results": results
                }
            }

            test_cases.append(test_case)

    # Write the Markdown table to a file
    with open(destination_md, "w") as file:
        file.write("\n".join(markdown_lines))

    with open(destination_json, "w") as file:
        json.dump(test_cases, file, indent=2)
    return test_cases, markdown_lines

# File paths
users_file = "../data/users.json"
records_file = "../data/records.json"
markdown_results = "results.md"
json_test_cases = "results.json"

# Load users and records
with open(users_file, "r") as file:
    allUsers = json.load(file)

with open(records_file, "r") as file:
    allRecords = json.load(file)

access_matrix = {}

for user in allUsers:
    username = user["id"]
    user_department = user.get("department")
    is_manager = user.get("role") == "manager"
    access_matrix[username] = {"view": [], "edit": [], "delete": []}

    for record in allRecords:
        record_id = record["id"]
        record_owner = record["owner"]
        record_department = record.get("department")

        # Determine which records each user can view
        if (
            record_owner == username or  # User owns the record
            record_department == user_department or  # Record is in the user's department
            is_manager  # User is a manager
        ):
            access_matrix[username]["view"].append(record_id)

        # Determine which records each user can edit
        if (
            record_owner == username or  # User owns the record
            (record_department == user_department and is_manager)  # Record is in the user's department and user is a manager
        ):
            access_matrix[username]["edit"].append(record_id)

        # Determine which records each user can delete
        if record_owner == username:  # User owns the record
            access_matrix[username]["delete"].append(record_id)


# Generate test cases and Markdown table
test_cases, markdown_lines = generate_test_cases_and_markdown("| User   | Action | Records                  |", access_matrix, "record", "resource", "user", "subject", "resource/results.md", "resource/results.json")

# Now invert access matrix to get the users for each record
# Interchange record and username in access_matrix
record_access_matrix = {}

for username, actions in access_matrix.items():
    for action, records in actions.items():
        for record_id in records:
            if record_id not in record_access_matrix:
                record_access_matrix[record_id] = {"view": [], "edit": [], "delete": []}
            record_access_matrix[record_id][action].append(username)

test_cases, markdown_lines = generate_test_cases_and_markdown("| Record   | Action | Users                  |", record_access_matrix, "user", "subject", "record", "resource", "subject/results.md", "subject/results.json")

# Now invert access matrix to get the actions for each record and user
# interchange action and username in access_matrix
# Invert access matrix to get actions for each username and record ID
# Invert access matrix to get actions for each user and record ID
user_record_action_matrix = {}

for username, actions in access_matrix.items():
    if username not in user_record_action_matrix:
        user_record_action_matrix[username] = {}

    for action, records in actions.items():
        for record_id in records:
            if record_id not in user_record_action_matrix[username]:
                user_record_action_matrix[username][record_id] = []
            user_record_action_matrix[username][record_id].append(action)

test_cases, markdown_lines = generate_test_cases_and_markdown("| User   | Record ID | Action List                  |", user_record_action_matrix, "action", "action", "user", "subject", "action/results.md", "action/results.json")

# Generate the action results - my generate_test_cases_and_markdown is not generic enough to cater to action so hacking together a
# file for action here.
action_results = []

for user in allUsers:
    username = user["id"]
    for record in allRecords:
        record_id = record["id"]
        actions = user_record_action_matrix.get(username, {}).get(record_id, [])
        resultContent = []
        for action in actions:
            resultContent.append({
                "name": action
            })
        result = {
            "request": {
                "subject": {
                    "type": "user",
                    "id": username
                },
                "resource": {
                    "type": "record",
                    "id": record_id
                }
            },
            "expected": {
                "results": resultContent
            }
        }
        action_results.append(result)

# Write the transformed results to the output file
output_file = "action/results.json"
with open(output_file, "w") as file:
    json.dump(action_results, file, indent=2)

print(f"Converted results written to '{output_file}'.")
        

