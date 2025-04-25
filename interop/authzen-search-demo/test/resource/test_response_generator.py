import json

# File paths
users_file = "../../data/users.json"
records_file = "../../data/records.json"
markdown_results = "user_access.md"
json_test_cases = "user_access.json"

# Load users and records
with open(users_file, "r") as file:
    users = json.load(file)

with open(records_file, "r") as file:
    records = json.load(file)

user_access = {}

for user in users:
    username = user["name"]
    user_department = user.get("department")
    is_manager = user.get("role") == "manager"
    user_access[username] = {"view": [], "edit": [], "delete": []}

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
            user_access[username]["view"].append(record_id)

        # Determine which records each user can edit
        if (
            record_owner == username or  # User owns the record
            (record_department == user_department and is_manager)  # Record is in the user's department and user is a manager
        ):
            user_access[username]["edit"].append(record_id)

        # Determine which records each user can delete
        if record_owner == username:  # User owns the record
            user_access[username]["delete"].append(record_id)

# Generate Markdown table
test_cases = []
markdown_lines = []
markdown_lines.append("| User   | Action | Records                  |")
markdown_lines.append("|--------|--------|--------------------------|")

for username, actions in user_access.items():
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



# Write the Markdown table to a file
with open(markdown_results, "w") as file:
    file.write("\n".join(markdown_lines))

print(f"Markdown table written to '{markdown_results}'.")

with open(json_test_cases, "w") as file:
    json.dump(test_cases, file, indent=2)

print(f"Test cases written to '{json_test_cases}'.")