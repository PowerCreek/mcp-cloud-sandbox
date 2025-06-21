#!/bin/bash
set -e

echo "🔍 Validating Sandbox MCP Architecture..."

# Check if we're in the right directory
if [ ! -f "SANDBOX-ARCHITECTURE.md" ]; then
    echo "❌ Error: This script must be run from the cloud-dev root directory"
    exit 1
fi

echo "✅ Directory structure check:"

# Check sandbox structure
echo "📁 Checking sandbox/ directory..."
[ -d "sandbox" ] && echo "  ✓ sandbox/ exists" || { echo "  ❌ sandbox/ missing"; exit 1; }
[ -d "sandbox/container" ] && echo "  ✓ sandbox/container/ exists" || { echo "  ❌ sandbox/container/ missing"; exit 1; }
[ -f "sandbox/docker-compose.yml" ] && echo "  ✓ docker-compose.yml exists" || { echo "  ❌ docker-compose.yml missing"; exit 1; }
[ -f "sandbox/build.sh" ] && echo "  ✓ build.sh exists" || { echo "  ❌ build.sh missing"; exit 1; }
[ -f "sandbox/container/mcp.json" ] && echo "  ✓ container/mcp.json exists" || { echo "  ❌ container/mcp.json missing"; exit 1; }

# Check sandbox-template structure  
echo "📁 Checking sandbox-template/ directory..."
[ -d "sandbox-template" ] && echo "  ✓ sandbox-template/ exists" || { echo "  ❌ sandbox-template/ missing"; exit 1; }
[ -f "sandbox-template/package.json" ] && echo "  ✓ package.json exists" || { echo "  ❌ package.json missing"; exit 1; }
[ -f "sandbox-template/server.js" ] && echo "  ✓ server.js exists" || { echo "  ❌ server.js missing"; exit 1; }
[ -f "sandbox-template/Dockerfile" ] && echo "  ✓ Dockerfile exists" || { echo "  ❌ Dockerfile missing"; exit 1; }
[ -f "sandbox-template/test-client.js" ] && echo "  ✓ test-client.js exists" || { echo "  ❌ test-client.js missing"; exit 1; }

# Check original MCP scripts
echo "📁 Checking init/ directory..."
[ -d "init" ] && echo "  ✓ init/ exists" || { echo "  ❌ init/ missing"; exit 1; }

# Validate JSON files
echo "🔧 Validating JSON configurations..."
if command -v node >/dev/null 2>&1; then
    echo "  📋 Validating sandbox/container/mcp.json..."
    node -e "JSON.parse(require('fs').readFileSync('sandbox/container/mcp.json', 'utf8'))" && echo "  ✓ Valid JSON" || { echo "  ❌ Invalid JSON"; exit 1; }
    
    echo "  📦 Validating sandbox-template/package.json..."
    node -e "JSON.parse(require('fs').readFileSync('sandbox-template/package.json', 'utf8'))" && echo "  ✓ Valid JSON" || { echo "  ❌ Invalid JSON"; exit 1; }
else
    echo "  ⚠️  Node.js not found, skipping JSON validation"
fi

# Check environment file
echo "🔑 Checking environment configuration..."
if [ -f ".env" ]; then
    echo "  ✓ .env file exists"
    if grep -q "SUPABASE_URL" .env && grep -q "SUPABASE_ANON_KEY" .env; then
        echo "  ✓ Required Supabase environment variables found"
    else
        echo "  ⚠️  Some Supabase environment variables might be missing"
    fi
else
    echo "  ⚠️  .env file not found (you may need to create one)"
fi

# Check Docker
echo "🐳 Checking Docker availability..."
if command -v docker >/dev/null 2>&1; then
    echo "  ✓ Docker is available"
    if command -v docker-compose >/dev/null 2>&1; then
        echo "  ✓ Docker Compose is available"
    else
        echo "  ❌ Docker Compose not found"
        exit 1
    fi
else
    echo "  ❌ Docker not found"
    exit 1
fi

echo ""
echo "🎉 Validation complete! Your sandbox MCP architecture is ready."
echo ""
echo "🚀 Next steps:"
echo "   1. Ensure you have a .env file with required environment variables"
echo "   2. Run 'cd sandbox && ./build.sh' to build the containers"
echo "   3. Run 'docker-compose up -d' to start the services"
echo "   4. Test with 'curl http://localhost:8080/health'"
echo ""
echo "📖 See SANDBOX-ARCHITECTURE.md for detailed usage instructions."
