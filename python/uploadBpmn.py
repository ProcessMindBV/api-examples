"""
Upload a BPMN file to a process in ProcessMind.

Configuration:
- Update api_key, tenant_id, process_id, and bpmn_file_path with your values.
"""

import requests

# === Configuration ===
api_key = ""           # Your API key
tenant_id = ""         # Your tenant ID
process_id = ""        # The process ID to upload BPMN to
bpmn_file_path = ""    # Path to the BPMN file

api_url = "https://api.processmind.com"

print("Reading BPMN file...")
with open(bpmn_file_path, "r") as f:
    bpmn_content = f.read()

print("Uploading BPMN...")
response = requests.put(
    f"{api_url}/tenant/{tenant_id}/processes/{process_id}/bpmn",
    headers={"x-api-key": api_key, "Content-Type": "application/json"},
    json={"bpmnXml": bpmn_content}
)

if not response.ok:
    print(f"Error: {response.status_code}, {response.reason}: {response.text}")
    exit(1)

result = response.json()
print(f"BPMN uploaded: {result}")
