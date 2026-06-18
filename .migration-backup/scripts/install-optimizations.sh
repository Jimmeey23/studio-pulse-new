#!/bin/bash

# Performance Optimization Dependencies Installation Script

echo "📦 Installing performance optimization dependencies..."

# Check if already installed
if npm list @tanstack/react-query-persist-client > /dev/null 2>&1; then
  echo "✅ Dependencies already installed"
else
  echo "⬇️  Installing React Query persistence and DevTools..."
  npm install @tanstack/react-query-persist-client @tanstack/react-query-devtools idb-keyval
fi

echo ""
echo "🗑️  Removing googleapis package (589MB) - now using direct fetch..."
npm uninstall googleapis

echo ""
echo "🔍 Checking for unused dependencies..."
npx depcheck --ignores="@types/*,typescript,eslint,vite,@vitejs/*,tailwindcss,postcss,autoprefixer"

echo ""
echo "✨ Dependencies updated successfully!"
echo ""
echo "📊 Current node_modules size:"
du -sh node_modules 2>/dev/null || echo "Could not calculate size"

echo ""
echo "🎯 Next steps:"
echo "1. Run: npm run dev (to test changes)"
echo "2. Run: npm run build (to verify production build)"
echo "3. Run: node scripts/analyze-performance.js (to analyze components)"
echo ""
