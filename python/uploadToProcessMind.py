
"""
Uploads a local CSV file to a remote API using a presigned URL.

Steps:
1. Fetch a presigned upload URL from the API.
2. Read the local file from disk.
3. Upload the file to the presigned URL using HTTP PUT.

Configuration:
- Update api_key, tenant_id, datatable_id, file_path as needed.
"""

import requests

# === Configuration ===
api_key = ""  # API key for authentication
tenant_id = ""  # Tenant identifier
datatable_id = ""  # Datatable identifier
file_path = ""  # Path to the file to upload


print("Fetching upload URL...")
api_url = "https://api.processmind.com"  # Base API URL
presign_url = f"{api_url}/tenant/{tenant_id}/datatable/{datatable_id}/uploads/presignedurl"
presign_res = requests.get(presign_url, headers={"x-api-key": api_key})
if not presign_res.ok:
	print(f"Error fetching upload URL: {presign_res.status_code}, {presign_res.reason}: {presign_res.text}")
	exit(1)

presign_body = presign_res.json()
upload_url = presign_body.get("PreSignedUploadUrl")
if not upload_url:
	print("No presigned upload URL returned.")
	exit(1)

print("Uploading file...")
with open(file_path, "rb") as f:
	upload_res = requests.put(upload_url, data=f)
if not upload_res.ok:
	print(f"Upload failed: {upload_res.status_code}, {upload_res.reason}")
else:
	print("File uploaded successfully.")
