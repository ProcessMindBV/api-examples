#!/bin/bash
# Create a new process in ProcessMind

# Replace the following placeholders:
API_KEY="<API_KEY>"
TENANT_ID="<TENANT_ID>"
DISPLAY_NAME="My New Process"

curl -s -X POST \
    -H "x-api-key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"displayName\": \"$DISPLAY_NAME\", \"treeNodeType\": \"Process\"}" \
    "https://api.processmind.com/tenant/$TENANT_ID/processes"
