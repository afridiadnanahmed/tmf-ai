#!/bin/bash
# Script to check cPanel Node.js app logs and status

echo "=== Checking Node.js version ==="
node -v

echo ""
echo "=== Checking if .next build exists ==="
ls -la .next/ 2>&1 | head -10

echo ""
echo "=== Checking Passenger error logs (last 100 lines) ==="
if [ -f "logs/passenger.log" ]; then
    tail -100 logs/passenger.log
elif [ -f "../logs/passenger.log" ]; then
    tail -100 ../logs/passenger.log
fi

echo ""
echo "=== Checking application error logs ==="
if [ -f "logs/error.log" ]; then
    tail -50 logs/error.log
fi

echo ""
echo "=== Checking cPanel error logs ==="
tail -50 ~/logs/ai.themetafuture.online-error_log 2>/dev/null || echo "No cPanel error logs found"

echo ""
echo "=== Attempting to start server manually to see errors ==="
NODE_ENV=production PORT=3000 timeout 10 node server.js 2>&1 || echo "Server failed to start or timed out"
