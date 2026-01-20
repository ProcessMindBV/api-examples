#!/bin/bash
# Upload a file to ProcessMind using presigned URL

# Replace the following placeholders with your actual values:
API_KEY="<API_KEY>"
TENANT_ID="<TENANT_ID>"
DATATABLE_ID="<DATATABLE_ID>"
DATASET_ID="<DATASET_ID>"
FILE_PATH="<FILE_PATH>"

# Get file information
FILE_NAME=$(basename "$FILE_PATH")
FILE_SIZE=$(stat -c%s "$FILE_PATH")
FILE_LAST_MODIFIED=$(stat -c%Y "$FILE_PATH")000  # Convert to milliseconds

# URL encode the filename
ENCODED_FILENAME=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$FILE_NAME'))")

# Get presigned upload URL
echo "Fetching presigned URL..."
PRESIGN_URL="https://api.processmind.com/tenant/$TENANT_ID/datatable/$DATATABLE_ID/uploads/presignedurl?datasetid=$DATASET_ID&filename=$ENCODED_FILENAME&filesize=$FILE_SIZE&filelastmodified=$FILE_LAST_MODIFIED"

UPLOAD_URL=$(curl -s -H "x-api-key: $API_KEY" "$PRESIGN_URL" | grep -oP '"PreSignedUploadUrl"\s*:\s*"\K[^"]+')

if [ -z "$UPLOAD_URL" ]; then
    echo "Error: Could not get presigned URL"
    exit 1
fi

# Upload file
echo "Uploading file..."
curl -s -X PUT -T "$FILE_PATH" "$UPLOAD_URL"
echo "Upload complete." \
    | xargs -I {} curl -s -X PUT --upload-file "<FILE_PATH>" "{}"