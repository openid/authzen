import json

def generate_test_cases_and_markdown(header, access_matrix):
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

    for username, actions in access_matrix.items():
        for action, records in actions.items():
            record_list = ", ".join(map(str, records))  # Convert record IDs to a comma-separated string
            markdown_lines.append(f"| {username} | {action}   | [{record_list}] |")
            results = []
            for record_id in records:
                results.append({
                    "type": "record",
                    "id": str(record_id)
                })

            test_case = {
                "request": {
                    "subject": {
                        "type": "user",
                        "id": username
                    },
                    "action": {
                        "name": action
                    },
                    "resource": {
                        "type": "record"
                    }
                },
                "expected": {
                    "results": results
                }
            }

            test_cases.append(test_case)

    return test_cases, markdown_lines

# File paths
users_file = "../../data/users.json"
records_file = "../../data/records.json"
markdown_results = "results.md"
json_test_cases = "results.json"

# Load users and records
with open(users_file, "r") as file:
    users = json.load(file)

with open(records_file, "r") as file:
    records = json.load(file)

access_matrix = {}

for user in users:
    username = user["name"]
    user_department = user.get("department")
    is_manager = user.get("role") == "manager"
    access_matrix[username] = {"view": [], "edit": [], "delete": []}

    for record in records:
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
test_cases, markdown_lines = generate_test_cases_and_markdown("| User   | Action | Records                  |", access_matrix)



# Write the Markdown table to a file
with open(markdown_results, "w") as file:
    file.write("\n".join(markdown_lines))

print(f"Markdown table written to '{markdown_results}'.")

with open(json_test_cases, "w") as file:
    json.dump(test_cases, file, indent=2)

print(f"Test cases written to '{json_test_cases}'.")

# Now invert access matrix to get the users for each record
# Interchange record and username in access_matrix
record_access_matrix = {}

for username, actions in access_matrix.items():
    for action, records in actions.items():
        for record_id in records:
            if record_id not in record_access_matrix:
                record_access_matrix[record_id] = {"view": [], "edit": [], "delete": []}
            record_access_matrix[record_id][action].append(username)

test_cases, markdown_lines = generate_test_cases_and_markdown("| Record   | Action | Users                  |", record_access_matrix)

# Write the Markdown table to a file
with open("resource_"+markdown_results, "w") as file:
    file.write("\n".join(markdown_lines))

print(f"Markdown table written to resource_'{markdown_results}'.")

with open("resource_"+json_test_cases, "w") as file:
    json.dump(test_cases, file, indent=2)

print(f"Test cases written to resource_'{json_test_cases}'.")


