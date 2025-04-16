#!/bin/bash

# Absolute path to your project
PROJECT_DIR="/home/github/cicd/_work/gd-ForumMagnum/gd-ForumMagnum"

# Move to the project directory
cd "$PROJECT_DIR" || {
  echo "❌ Directory not found: $PROJECT_DIR"
  exit 1
}

echo "📦 Installing dependencies with Yarn (v4+) and skipping lockfile restrictions..."

# Run yarn install normally (no --immutable, no lockfile check)
corepack enable
yarn set version stable
yarn install --mode=update-lockfile

# Check if it was successful
if [ $? -eq 0 ]; then
  echo "✅ Yarn install completed successfully."
else
  echo "❌ Yarn install failed."
  exit 1
fi
