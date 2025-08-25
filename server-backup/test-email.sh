#!/bin/bash

echo "🧪 Testing Email Service with New Gmail OAuth Credentials"
echo "=========================================================="
echo ""

# Test email service
echo "📧 Testing email notification system..."
response=$(curl -s http://localhost:3000/api/test-email)
echo "Response: $response"
echo ""

# Check if successful
if [[ $response == *"success\":true"* ]]; then
    echo "✅ SUCCESS! Email service is working!"
    echo "📬 Check info@mintedyachts.com for the test email"
else
    echo "❌ Email test failed. Check server logs for details."
    echo "💡 Make sure the server is running on port 3000"
fi

echo ""
echo "To test complete workflow:"
echo "1. Go to http://localhost:3000/login"
echo "2. Create a new user account (e.g., test@mintedyachts.com)"
echo "3. Check info@mintedyachts.com for admin notification email"