#!/bin/bash
# Add a user to a tenant in ProcessMind
# The API generates and returns the user ID

# Replace the following placeholders:
API_KEY="<API_KEY>"
TENANT_ID="<TENANT_ID>"
EMAIL="user@example.com"
FIRST_NAME="John"
LAST_NAME="Doe"
IS_ACTIVE_IN_TENANT=true
IS_ADMIN_IN_TENANT=false
IS_DEVELOPER_IN_TENANT=false

curl -s -X POST \
    -H "x-api-key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\", \"firstName\": \"$FIRST_NAME\", \"lastName\": \"$LAST_NAME\", \"isActiveInTenant\": $IS_ACTIVE_IN_TENANT, \"isAdminInTenant\": $IS_ADMIN_IN_TENANT, \"isDeveloperInTenant\": $IS_DEVELOPER_IN_TENANT}" \
    "https://api.processmind.com/tenant/$TENANT_ID/users"
