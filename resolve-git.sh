#!/bin/bash

# Resolve git divergence
echo "🔄 Resolving git branch divergence..."
echo ""
echo "Step 1: Fetch latest remote changes"
git fetch origin main
echo "✓ Fetched"
echo ""

echo "Step 2: Pull remote main into local (will merge)"
git pull origin main --no-edit
echo "✓ Pulled - branches should now be synced"
echo ""

echo "Step 3: Verify status"
git status
echo ""

echo "Step 4: Push to origin main"
git push origin main
echo "✓ Pushed!"
echo ""

echo "✅ All done! Your main branch is now in sync."
