import json

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

    for record in records:
        record_id = record["id"]
        access_matrix[record_id] = {"view": [], "edit": [], "delete": []}
        record_owner = record["owner"]
        record_department = record.get("department")

        # Determine which users can view each record
        if (
            record_owner == username or  # User owns the record
            record_department == user_department or  # Record is in the user's department
            is_manager  # User is a manager
        ):
            access_matrix[record_id]["view"].append(username)

        # Determine which records each user can edit
        if (
            record_owner == username or  # User owns the record
            (record_department == user_department and is_manager)  # Record is in the user's department and user is a manager
        ):
            access_matrix[record_id]["edit"].append(username)

        # Determine which records each user can delete
        if record_owner == username:  # User owns the record
            access_matrix[record_id]["delete"].append(username)

# Generate Markdown table
test_cases = []
markdown_lines = []
markdown_lines.append("| User   | Action | Records                  |")
markdown_lines.append("|--------|--------|--------------------------|")

for record_id, actions in access_matrix.items():
    for action, users in actions.items():
        user_list = ", ".join(map(str, users))  # Convert record IDs to a comma-separated string
        markdown_lines.append(f"| {username} | {action}   | [{user_list}] |")
        results = []
        for username in users:
            results.append({
                "type": "user",
                "name": username
            })

        test_case = {
            "request": {
                "resource": {
                    "type": "record",
                    "id": record_id
                },
                "action": {
                    "name": action
                },
                "subject": {
                    "type": "user"
                }
            },
            "expected": {
                "results": results
            }
        }

        test_cases.append(test_case)



# Write the Markdown table to a file
with open(markdown_results, "w") as file:
    file.write("\n".join(markdown_lines))

print(f"Markdown table written to '{markdown_results}'.")

with open(json_test_cases, "w") as file:
    json.dump(test_cases, file, indent=2)

print(f"Test cases written to '{json_test_cases}'.")