#!/bin/bash

echo "🧪 Testing BudgetBites Login Flow..."
echo ""

BASE_URL="http://localhost:8080"
FRONTEND_URL="http://localhost:5173"

# Test 1: Register a new user
echo "1️⃣  Testing user registration..."
TIMESTAMP=$(date +%s)
TEST_USERNAME="testuser${TIMESTAMP}"
TEST_EMAIL="test${TIMESTAMP}@example.com"
TEST_PASSWORD="password123"

REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${TEST_USERNAME}\",\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REGISTER_RESPONSE" | head -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Registration successful"
    echo "   Username: ${TEST_USERNAME}"
    echo "   Email: ${TEST_EMAIL}"
    echo "   Response: ${RESPONSE_BODY}"
else
    echo "❌ Registration failed (HTTP ${HTTP_CODE})"
    echo "   Response: ${RESPONSE_BODY}"
    exit 1
fi

echo ""
echo "2️⃣  Check MailDev for verification code..."
echo "   Open: http://localhost:1080"
echo "   Look for email sent to: ${TEST_EMAIL}"
echo ""
read -p "Enter the verification code from the email: " VERIFICATION_CODE

# Test 2: Verify email
echo ""
echo "3️⃣  Testing email verification..."
VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${BASE_URL}/auth/verify-email" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"verificationCode\":\"${VERIFICATION_CODE}\"}")

HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$VERIFY_RESPONSE" | head -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Email verification successful"
    echo "   Response: ${RESPONSE_BODY}"
else
    echo "❌ Email verification failed (HTTP ${HTTP_CODE})"
    echo "   Response: ${RESPONSE_BODY}"
    exit 1
fi

# Test 3: Login
echo ""
echo "4️⃣  Testing login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${TEST_USERNAME}\",\"password\":\"${TEST_PASSWORD}\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | head -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Login successful"
    echo "   Response: ${RESPONSE_BODY}"
else
    echo "❌ Login failed (HTTP ${HTTP_CODE})"
    echo "   Response: ${RESPONSE_BODY}"
    exit 1
fi

# Test 4: Check users list
echo ""
echo "5️⃣  Checking verified users list..."
USERS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/auth/users")
HTTP_CODE=$(echo "$USERS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$USERS_RESPONSE" | head -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Users list retrieved"
    echo "   Users: ${RESPONSE_BODY}"
else
    echo "❌ Failed to get users (HTTP ${HTTP_CODE})"
fi

echo ""
echo "🎉 All backend tests passed!"
echo ""
echo "Now test the frontend:"
echo "1. Open: ${FRONTEND_URL}/login"
echo "2. Try logging in with:"
echo "   Username: ${TEST_USERNAME}"
echo "   Password: ${TEST_PASSWORD}"
