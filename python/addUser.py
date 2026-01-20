"""
Add a user to a tenant in ProcessMind.

Configuration:
- Update api_key, tenant_id, and user details with your values.
"""

import requests

# === Configuration ===
api_key = ""                    # Your API key
tenant_id = ""                  # Your tenant ID

# User details
email = "user@example.com"      # User's email
first_name = "John"             # Optional
last_name = "Doe"               # Optional
is_active_in_tenant = True      # User is active in this tenant
is_admin_in_tenant = False      # User is not an admin
is_developer_in_tenant = False  # User is not a developer

api_url = "https://api.processmind.com"

print(f"Adding user {email}...")
response = requests.post(
    f"{api_url}/tenant/{tenant_id}/users",
    headers={"x-api-key": api_key, "Content-Type": "application/json"},
    json={
        "email": email,
        "firstName": first_name,
        "lastName": last_name,
        "isActiveInTenant": is_active_in_tenant,
        "isAdminInTenant": is_admin_in_tenant,
        "isDeveloperInTenant": is_developer_in_tenant
    }
)

if not response.ok:
    print(f"Error: {response.status_code}, {response.reason}: {response.text}")
    exit(1)

result = response.json()
print(f"User added: {result}")
print(f"New user ID: {result['id']}")
