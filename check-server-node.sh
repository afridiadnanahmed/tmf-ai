#!/bin/bash
# Check Node.js setup on the server

echo "Checking Node.js configuration on server..."
echo "=========================================="

ssh -i ~/.ssh/id_rsa_tmf themzeni@192.64.117.125 -p 21098 << 'ENDSSH'
echo "1. Checking Node.js paths:"
which node 2>/dev/null || echo "  node: not found in PATH"
which npm 2>/dev/null || echo "  npm: not found in PATH"
echo ""

echo "2. Checking common Node.js locations:"
ls -la /usr/local/bin/node 2>/dev/null || echo "  /usr/local/bin/node: not found"
ls -la /usr/bin/node 2>/dev/null || echo "  /usr/bin/node: not found"
ls -la ~/bin/node 2>/dev/null || echo "  ~/bin/node: not found"
echo ""

echo "3. Checking for NVM:"
ls -la ~/.nvm 2>/dev/null || echo "  NVM not found"
echo ""

echo "4. Checking for cPanel Node.js:"
ls -la ~/nodevenv 2>/dev/null | head -5 || echo "  cPanel nodevenv not found"
echo ""

echo "5. Checking environment files:"
echo "  .bashrc:"
grep -i "node\|nvm\|nodevenv" ~/.bashrc 2>/dev/null | head -5 || echo "    No Node.js config found"
echo ""
echo "  .bash_profile:"
grep -i "node\|nvm\|nodevenv" ~/.bash_profile 2>/dev/null | head -5 || echo "    No Node.js config found"
echo ""

echo "6. Current PATH:"
echo $PATH
echo ""

echo "7. Testing with bash -lc (login shell):"
bash -lc 'which node && which npm' 2>/dev/null || echo "  Still not found"
ENDSSH

echo ""
echo "=========================================="
echo "Run this script to diagnose the issue"
