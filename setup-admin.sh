#!/bin/bash

# Admin Upload System Setup Script
# This script helps you set up the admin system step by step

set -e

echo "🎨 Mingyi Portfolio - Admin Upload System Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found${NC}"
    echo "Installing wrangler..."
    npm install -g wrangler
fi

echo -e "${GREEN}✅ Wrangler CLI installed${NC}"
echo ""

# Check if logged in to Cloudflare
echo "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Cloudflare${NC}"
    echo "Logging in..."
    wrangler login
fi

echo -e "${GREEN}✅ Authenticated with Cloudflare${NC}"
echo ""

# Step 1: Create R2 Bucket
echo "Step 1: Creating R2 Bucket"
echo "-------------------------"
read -p "Create R2 bucket 'mingyi-artworks'? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler r2 bucket create mingyi-artworks || echo -e "${YELLOW}Bucket may already exist${NC}"
    echo -e "${GREEN}✅ R2 bucket ready${NC}"
else
    echo "Skipped R2 bucket creation"
fi
echo ""

# Step 2: GitHub Token
echo "Step 2: GitHub Personal Access Token"
echo "------------------------------------"
echo "You need a GitHub Personal Access Token with 'repo' permissions"
echo "Create one at: https://github.com/settings/tokens"
echo ""
read -p "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
read -p "Enter your GitHub repository (username/repo): " GITHUB_REPO
read -p "Enter your GitHub branch (default: main): " GITHUB_BRANCH
GITHUB_BRANCH=${GITHUB_BRANCH:-main}

echo -e "${GREEN}✅ GitHub credentials collected${NC}"
echo ""

# Step 3: Admin Token
echo "Step 3: Admin Token"
echo "-------------------"
read -p "Enter your admin token (or press Enter to generate one): " ADMIN_TOKEN
if [ -z "$ADMIN_TOKEN" ]; then
    ADMIN_TOKEN=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-20)
    echo -e "${YELLOW}Generated admin token: ${ADMIN_TOKEN}${NC}"
    echo "⚠️  Save this token securely!"
fi
echo ""

# Step 4: Save to .dev.vars for local development
echo "Step 4: Creating .dev.vars for local development"
echo "------------------------------------------------"
cat > .dev.vars << EOF
ADMIN_TOKEN=${ADMIN_TOKEN}
GITHUB_TOKEN=${GITHUB_TOKEN}
GITHUB_REPO=${GITHUB_REPO}
GITHUB_BRANCH=${GITHUB_BRANCH}
EOF

echo -e "${GREEN}✅ Created .dev.vars${NC}"
echo ""

# Step 5: Display next steps
echo "=========================================="
echo "🎉 Setup Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Add R2 bucket binding in Cloudflare Dashboard:"
echo "   - Go to: Workers & Pages → mingyizou → Settings → Functions"
echo "   - Add binding: Variable name: ARTWORKS_BUCKET, Bucket: mingyi-artworks"
echo ""
echo "2. Add environment variables in Cloudflare Dashboard:"
echo "   - Go to: Workers & Pages → mingyizou → Settings → Environment variables"
echo "   - Add these variables (as Secret type):"
echo "     • ADMIN_TOKEN: ${ADMIN_TOKEN}"
echo "     • GITHUB_TOKEN: ${GITHUB_TOKEN}"
echo "     • GITHUB_REPO: ${GITHUB_REPO}"
echo "     • GITHUB_BRANCH: ${GITHUB_BRANCH}"
echo ""
echo "3. Enable R2 public access:"
echo "   - Go to: R2 → mingyi-artworks → Settings → Public Access"
echo "   - Click 'Allow Access'"
echo "   - Copy the R2.dev URL and add R2_PUBLIC_URL to environment variables"
echo ""
echo "4. Deploy your site:"
echo "   npm run deploy"
echo ""
echo "5. Test the admin panel:"
echo "   https://mingyizou.pages.dev/admin.html"
echo ""
echo "📖 For detailed instructions, see ADMIN_SETUP_GUIDE.md"
echo ""
