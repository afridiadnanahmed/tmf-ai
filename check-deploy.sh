#!/bin/bash
# Check what files will be deployed
# This does a dry-run to show you what will be uploaded

echo "=========================================="
echo "Deployment Dry Run - Files to be uploaded"
echo "=========================================="
echo ""

rsync -avzn --exclude-from='.deployignore' ./ /tmp/deploy-check/ | grep -v '/$' | head -50

echo ""
echo "=========================================="
echo "Summary of deployment:"
echo "=========================================="
echo "✓ .next/ (built application)"
echo "✓ public/ (static assets)"
echo "✓ app/, components/, lib/ (source code)"
echo "✓ package.json, package-lock.json"
echo "✓ next.config.mjs"
echo ""
echo "✗ Excluded: node_modules, .git, logs, etc."
echo "  (See .deployignore for full list)"
echo ""
echo "To deploy, run: npm run deploy"
