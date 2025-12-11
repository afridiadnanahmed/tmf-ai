#!/bin/bash
# Check if the Node.js application is running on the server

echo "=========================================="
echo "Checking Node.js Application Status"
echo "=========================================="
echo ""

ssh -i ~/.ssh/id_rsa_tmf themzeni@192.64.117.125 -p 21098 'bash -lc "
echo \"1. Checking if Node.js app is running:\"
ps aux | grep node | grep -v grep || echo \"   No Node.js processes found\"
echo \"\"

echo \"2. Checking application directory:\"
ls -la /home/themzeni/ai.themetafuture.online/ | head -20
echo \"\"

echo \"3. Checking if .next directory exists:\"
ls -la /home/themzeni/ai.themetafuture.online/.next/ 2>/dev/null | head -10 || echo \"   .next directory not found!\"
echo \"\"

echo \"4. Checking server.js:\"
ls -la /home/themzeni/ai.themetafuture.online/server.js 2>/dev/null || echo \"   server.js not found!\"
echo \"\"

echo \"5. Checking package.json:\"
ls -la /home/themzeni/ai.themetafuture.online/package.json 2>/dev/null || echo \"   package.json not found!\"
echo \"\"

echo \"6. Checking .env file:\"
ls -la /home/themzeni/ai.themetafuture.online/.env 2>/dev/null || echo \"   .env not found!\"
echo \"\"

echo \"7. Trying to start the app manually:\"
cd /home/themzeni/ai.themetafuture.online
node server.js &
sleep 2
echo \"\"

echo \"8. Checking if app started:\"
ps aux | grep node | grep -v grep || echo \"   Still not running\"
"'

echo ""
echo "=========================================="
echo "Next steps:"
echo "1. Go to cPanel → Setup Node.js App"
echo "2. Make sure the app is configured and running"
echo "3. Check Application URL and startup file"
echo "=========================================="
