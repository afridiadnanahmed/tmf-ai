#!/bin/bash

# Script to trigger post publishing via cron
# This script calls the local API endpoint to publish scheduled posts

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Log file
LOG_FILE="$PROJECT_DIR/logs/cron-publish.log"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Get current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting post publishing..." >> "$LOG_FILE"

# Call the API endpoint (adjust the port if your dev server runs on a different port)
# For development: http://localhost:3000
# For production: use your actual domain
API_URL="http://localhost:3000/api/cron/publish-posts"

# Make the API call
RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json")

# Log the response
echo "[$TIMESTAMP] Response: $RESPONSE" >> "$LOG_FILE"
echo "[$TIMESTAMP] Post publishing completed" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
