#!/bin/bash

# This script fixes the Rollup native modules issue for Vercel deployments
# It's designed to be run in Vercel's build environment

# Set environment variable to disable native modules
export ROLLUP_NATIVE_DISABLE=1

# Install dependencies without optional packages
echo "📦 Installing dependencies without optional packages..."
npm install --omit=optional

# Apply the Rollup patch (this will run the postinstall script)
echo "🔧 Running build with ROLLUP_NATIVE_DISABLE=1..."

# Run the build with the environment variable
ROLLUP_NATIVE_DISABLE=1 npm run build

echo "✅ Build completed!"
