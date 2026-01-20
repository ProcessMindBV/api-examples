#!/bin/bash
# Map a datatable to a process in ProcessMind
# Note: The process must have a BPMN model uploaded first

# Replace the following placeholders:
API_KEY="<API_KEY>"
TENANT_ID="<TENANT_ID>"
PROCESS_ID="<PROCESS_ID>"
DATATABLE_ID="<DATATABLE_ID>"
DISPLAY_NAME="My Data"
# Color options: "data-1" through "data-8"

curl -s -X POST \
    -H "x-api-key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"dataTableId\": \"$DATATABLE_ID\", \"displayName\": \"$DISPLAY_NAME\", \"color\": {\"id\": \"data-1\"}, \"showByDefault\": true}" \
    "https://api.processmind.com/tenant/$TENANT_ID/processes/$PROCESS_ID/mappings"
