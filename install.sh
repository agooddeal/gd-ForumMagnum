#!/bin/bash

# Move to the project directory
cd /home/github/cicd/_work/gd-ForumMagnum/gd-ForumMagnum || {
  echo "❌ Directory not found!"
  exit 1
}

echo "📦 Running yarn install with --ignore-engines..."

# Run yarn install ignoring engine restrictions
yarn install 

# Check if it was successful
if [ $? -eq 0 ]; then
  echo "✅ Yarn dependencies installed successfully."
else
  echo "❌ Yarn install failed."
  exit 1
fi
