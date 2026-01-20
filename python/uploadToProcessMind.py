
"""
Uploads a local CSV file to a remote API using a presigned URL.

Steps:
1. Fetch a presigned upload URL from the API.
2. Read the local file from disk.
3. Upload the file to the presigned URL using HTTP PUT.

Configuration:
- Update api_key, tenant_id, datatable_id, dataset_id, and file_path as needed.
"""

import os
import requests

# === Configuration ===
api_key = ""        # API key for authentication
tenant_id = ""      # Tenant identifier
datatable_id = ""   # Datatable identifier
dataset_id = ""     # Dataset identifier (required)
file_path = ""      # Path to the file to upload

api_url = "https://api.processmind.com"  # Base API URL

# Get file info for the presigned URL request
file_name = os.path.basename(file_path)
file_size = os.path.getsize(file_path)
file_last_modified = int(os.path.getmtime(file_path) * 1000)  # Convert to milliseconds

print("Fetching upload URL...")
presign_url = f"{api_url}/tenant/{tenant_id}/datatable/{datatable_id}/uploads/presignedurl"
presign_params = {
    "datasetid": dataset_id,
    "filename": file_name,
    "filesize": str(file_size),
    "filelastmodified": str(file_last_modified)
}
presign_res = requests.get(presign_url, headers={"x-api-key": api_key}, params=presign_params)

print("Uploading file...")
with open(file_path, "rb") as f:
	upload_res = requests.put(upload_url, data=f)
if not upload_res.ok:
	print(f"Upload failed: {upload_res.status_code}, {upload_res.reason}")
else:
	print("File uploaded successfully.")
