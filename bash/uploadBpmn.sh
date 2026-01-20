#!/bin/bash
# Upload a BPMN file to a process in ProcessMind

# Replace the following placeholders:
API_KEY="<API_KEY>"
TENANT_ID="<TENANT_ID>"
PROCESS_ID="<PROCESS_ID>"
BPMN_FILE="<PATH_TO_BPMN_FILE>"

# Read BPMN content and escape for JSON
BPMN_CONTENT=$(cat "$BPMN_FILE" | jq -Rs .)

curl -s -X PUT \
    -H "x-api-key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"bpmnXml\": $BPMN_CONTENT}" \
    "https://api.processmind.com/tenant/$TENANT_ID/processes/$PROCESS_ID/bpmn"
