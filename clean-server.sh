#!/bin/bash
# Clean server directory before fresh deployment

echo "=========================================="
echo "WARNING: This will delete all files in:"
echo "/home/themzeni/ai.themetafuture.online/"
echo "=========================================="
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Cleaning server directory..."

ssh -i ~/.ssh/id_rsa_tmf themzeni@192.64.117.125 -p 21098 'bash -lc "cd /home/themzeni && rm -rf ai.themetafuture.online/* ai.themetafuture.online/.*"'

if [ $? -eq 0 ]; then
    echo "✓ Server directory cleaned successfully!"
    echo ""
    echo "Next steps:"
    echo "1. npm run deploy:env   # Upload environment file"
    echo "2. npm run deploy       # Deploy application"
else
    echo "✗ Failed to clean server directory"
    exit 1
fi
