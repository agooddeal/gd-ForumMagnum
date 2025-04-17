#!/bin/bash

# Absolute path to your project
PROJECT_DIR="/home/github/cicd/_work/gd-ForumMagnum/gd-ForumMagnum"

# Move to the project directory
cd "$PROJECT_DIR" || {
  echo "❌ Project directory not found: $PROJECT_DIR"
  exit 1
}

# Set Postgres URL for local development
export POSTGRES_URL="postgres://postgres:password@localhost:5432/forummagnum"
echo "📡 Using POSTGRES_URL=$POSTGRES_URL"

# Enable Corepack & set stable Yarn version
corepack enable
yarn set version stable

# Install dependencies (allow lockfile updates, ignore engine mismatch)
echo "📦 Installing dependencies..."

yarn add -D ts-node

# Check if install succeeded
if [ $? -ne 0 ]; then
  echo "❌ Yarn install failed. Check logs above."
  exit 1
fi

# Start local DB server
echo "🚀 Starting local ForumMagnum server..."
