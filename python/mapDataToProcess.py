"""
Map a datatable to a process in ProcessMind.

Note: The process must have a BPMN model uploaded first.

Configuration:
- Update api_key, tenant_id, process_id, and datatable_id with your values.
"""

import requests

# === Configuration ===
api_key = ""           # Your API key
tenant_id = ""         # Your tenant ID
process_id = ""        # The process ID to map to
datatable_id = ""      # The datatable ID to map
display_name = "My Data"
color = {"id": "data-1"}  # Color options: "data-1" through "data-8"
show_by_default = True

api_url = "https://api.processmind.com"

print("Creating mapping...")
response = requests.post(
    f"{api_url}/tenant/{tenant_id}/processes/{process_id}/mappings",
    headers={"x-api-key": api_key, "Content-Type": "application/json"},
    json={
        "dataTableId": datatable_id,
        "displayName": display_name,
        "color": color,
        "showByDefault": show_by_default
    }
)

if not response.ok:
    print(f"Error: {response.status_code}, {response.reason}: {response.text}")
    exit(1)

mapping = response.json()
print(f"Mapping created: {mapping}")
