#!/bin/bash

echo "🚀 Starting BudgetBites Services..."
echo ""

# Start PostgreSQL
echo "📦 Starting PostgreSQL database..."
cd "$(dirname "$0")"
docker-compose up -d

# Check if PostgreSQL started
if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL started on port 5332"
else
    echo "❌ Failed to start PostgreSQL"
    exit 1
fi

# Start MailDev for email testing
echo ""
echo "📧 Starting MailDev for email testing..."
docker run -d --name maildev \
    -p 1080:1080 \
    -p 1025:1025 \
    maildev/maildev 2>/dev/null || \
    docker start maildev 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ MailDev started"
    echo "   📬 Web UI: http://localhost:1080"
    echo "   📮 SMTP: localhost:1025"
else
    echo "⚠️  MailDev might already be running or failed to start"
fi

echo ""
echo "✅ All services started!"
echo ""
echo "Next steps:"
echo "1. Start backend: cd backend && ./mvnw spring-boot:run"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Open frontend: http://localhost:5173"
echo "4. Check emails: http://localhost:1080"
