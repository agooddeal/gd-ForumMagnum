# Absolute path to your project
PROJECT_DIR="/home/github/cicd/_work/gd-ForumMagnum/gd-ForumMagnum"

cd "$PROJECT_DIR" || {
  echo "❌ Project directory not found: $PROJECT_DIR"
  exit 1
}

# Set Postgres URL for local development
export POSTGRES_URL="postgres://postgres:password@localhost:5432/forummagnum"
echo "📡 Using POSTGRES_URL=$POSTGRES_URL"

# Enable Corepack & activate Yarn 4
corepack enable
yarn set version stable

# 🧹 Clean Yarn cache (optional but good for CI)

# 📦 Install all packages from package.json
echo "📦 Running full install..."
yarn install

# Ensure correct ts-node dev dependency (safe overwrite)
yarn remove ts-node || true
yarn add -D ts-node

# Install any runtime deps if needed
yarn add ws body-parser lodash node-fetch

if [ $? -ne 0 ]; then
  echo "❌ Dependency install failed."
  exit 1
fi

echo "🚀 Setup complete. Ready to start ForumMagnum."
