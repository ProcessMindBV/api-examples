"""
Create a new process in ProcessMind.

Configuration:
- Update api_key and tenant_id with your values.
"""

import requests

# === Configuration ===
api_key = ""        # Your API key
tenant_id = ""      # Your tenant ID
display_name = "My New Process"

api_url = "https://api.processmind.com"

print("Creating process...")
response = requests.post(
    f"{api_url}/tenant/{tenant_id}/processes",
    headers={"x-api-key": api_key, "Content-Type": "application/json"},
    json={"displayName": display_name, "treeNodeType": "Process"}
)

if not response.ok:
    print(f"Error: {response.status_code}, {response.reason}: {response.text}")
    exit(1)

process = response.json()
print(f"Process created: {process}")
