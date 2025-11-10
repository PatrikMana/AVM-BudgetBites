# Testing Login Functionality

## Quick Start

### 1. Start Docker Desktop
Make sure Docker Desktop is running on your Mac.

### 2. Start Services
```bash
./start-services.sh
```

This will start:
- PostgreSQL database on port 5332
- MailDev email server on port 1025 (SMTP) and 1080 (Web UI)

### 3. Start Backend
```bash
cd backend
./mvnw spring-boot:run
```

The backend will run on http://localhost:8080

### 4. Start Frontend
In a new terminal:
```bash
cd frontend
npm install  # if you haven't already
npm run dev
```

The frontend will run on http://localhost:5173

## Testing the Login Flow

### Option 1: Automated Backend Test
```bash
./test-login.sh
```

This script will:
1. Register a new test user
2. Prompt you to check MailDev for the verification code
3. Verify the email
4. Test login
5. Display test credentials for frontend testing

### Option 2: Manual Frontend Test

1. **Open the frontend**: http://localhost:5173/login

2. **Register a new user**:
   - Click on "Sign Up" tab
   - Enter username, email, password
   - Click "Create Account"

3. **Check email**:
   - Open MailDev: http://localhost:1080
   - Find the verification email
   - Copy the 6-digit code

4. **Verify email** (using curl):
   ```bash
   curl -X POST http://localhost:8080/auth/verify-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","verificationCode":"123456"}'
   ```

5. **Login**:
   - Go back to frontend login page
   - Click "Login" tab
   - Enter your username and password
   - Click "Sign In"
   - You should be redirected to the home page

## Useful URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **MailDev Web UI**: http://localhost:1080
- **PostgreSQL**: localhost:5332

## API Endpoints

### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

### Verify Email
```bash
POST /auth/verify-email
Content-Type: application/json

{
  "email": "test@example.com",
  "verificationCode": "123456"
}
```

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

### List Verified Users
```bash
GET /auth/users
```

## Troubleshooting

### Backend won't start
- Make sure PostgreSQL is running: `docker ps`
- Check logs for database connection errors

### Frontend can't connect to backend
- Make sure backend is running on port 8080
- Check vite.config.js has proxy for `/auth`

### Email verification code not arriving
- Check MailDev is running: http://localhost:1080
- Check backend logs for email sending errors

### Login returns 401
- Make sure you verified your email first
- Check username and password are correct
- User must have `emailVerified=true` in database

## Current Implementation Notes

⚠️ **Important**: The backend currently returns plain text responses, not JWT tokens. The frontend creates a temporary mock token after successful login. For production, you'll need to:

1. Implement JWT token generation in the backend
2. Update frontend to handle real JWT tokens
3. Add token validation middleware
4. Store tokens securely

## Next Steps

- [ ] Implement JWT token generation in backend
- [ ] Create email verification page in frontend
- [ ] Add protected routes that require authentication
- [ ] Add token refresh mechanism
- [ ] Add "Forgot Password" functionality
