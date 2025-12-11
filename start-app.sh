#!/bin/bash
# Start the Node.js application on the server

echo "Starting Node.js application..."

ssh -i ~/.ssh/id_rsa_tmf themzeni@192.64.117.125 -p 21098 'bash -lc "
cd /home/themzeni/ai.themetafuture.online

echo \"Checking if app is already running...\"
ps aux | grep \"node server.js\" | grep -v grep

echo \"\"
echo \"Starting the application...\"
NODE_ENV=production nohup node server.js > app.log 2>&1 &

sleep 2

echo \"\"
echo \"Checking if app started...\"
ps aux | grep \"node server.js\" | grep -v grep

echo \"\"
echo \"Recent logs:\"
tail -20 app.log
"'
