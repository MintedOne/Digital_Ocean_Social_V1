#!/bin/bash

echo "🔥 Warming up Digital Ocean Social V1 application..."

# Array of important pages to pre-compile (login first for fastest user experience)
pages=(
    "/login"
    "/" 
    "/api/auth/status"
    "/api/youtube/status"
    "/video-generator"
    "/admin"
    "/auth-status"
)

echo "📡 Pre-compiling ${#pages[@]} pages..."

for page in "${pages[@]}"; do
    echo "   Warming up: $page"
    curl -s -o /dev/null "http://localhost:3000$page" &
done

# Wait for all background requests to complete
wait

echo "✅ Warmup complete! All main pages are now compiled and cached."
echo "🚀 Your application should now load much faster!"