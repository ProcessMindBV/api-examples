#!/bin/bash
# Minimal Bash script to upload a file to ProcessMind using two curl calls, with placeholders for all values

# Replace the following placeholders with your actual values:
# <API_KEY>, <TENANT_ID>, <DATATABLE_ID>, <FILE_PATH>

curl -s -H "x-api-key: <API_KEY>" \
    "https://api.processmind.com/tenant/<TENANT_ID>/datatable/<DATATABLE_ID>/uploads/presignedurl" \
    | grep -oP '"PreSignedUploadUrl"\s*:\s*"\K[^"]+' \
    | xargs -I {} curl -s -X PUT --upload-file "<FILE_PATH>" "{}"