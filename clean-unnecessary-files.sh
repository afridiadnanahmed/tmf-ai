#!/bin/bash
# Remove unnecessary files from server

echo "Cleaning unnecessary files from server..."

ssh -i ~/.ssh/id_rsa_tmf themzeni@192.64.117.125 -p 21098 'bash -lc "
cd /home/themzeni/ai.themetafuture.online

# Remove test and check scripts
rm -f check-*.sh check-*.js test-*.js clean-server.sh restart-dev.sh

# Remove documentation
rm -f *SETUP*.md *GUIDE*.md README.md DEPLOYMENT*.md

# Remove config files not needed
rm -f drizzle.config.ts next-env.d.ts tsconfig.json tailwind.config.ts postcss.config.mjs components.json
rm -f pnpm-lock.yaml .gitignore .deployignore

# Remove images and zone identifiers
rm -f *.png *.jpg *.jpeg *.gif *.svg *:Zone.Identifier

echo 'Cleanup complete!'
"'

echo "✓ Unnecessary files removed from server"
echo ""
echo "Files that remain on server:"
echo "- .next/ (build output)"
echo "- app/, components/, lib/ (source code)"
echo "- public/ (static assets, excluding uploads)"
echo "- server.js (startup file)"
echo "- package.json, package-lock.json"
echo "- next.config.mjs"
echo "- .env (environment variables)"
