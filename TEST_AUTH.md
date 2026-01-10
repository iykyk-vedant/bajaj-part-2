# Authentication System Test Guide

This document provides a simple way to verify that the authentication system is working correctly.

## Prerequisites

1. Make sure you have a Supabase project set up with:
   - Project URL
   - Anonymous key (anon key)

2. Ensure your `.env.local` file has the following variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Make sure the following dependencies are installed:
   ```bash
   npm install @supabase/supabase-js jose pg
   ```

## Testing Steps

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Public Routes
- Visit `http://localhost:3000/signup` - You should see the signup form
- Visit `http://localhost:3000/login` - You should see the login form

### 3. Create a New Account
- Navigate to the signup page
- Enter a valid email and password (at least 6 characters)
- Submit the form
- Check that you are redirected to the dashboard
- Verify that a user record was created in your Neon DB users table

### 4. Test Login
- Log out or open an incognito window
- Navigate to the login page
- Enter your credentials
- Submit the form
- Verify you are redirected to the dashboard

### 5. Test Protected Routes
- Navigate to `http://localhost:3000/dashboard` without logging in
- You should be redirected to the login page
- After logging in, verify you can access the dashboard

### 6. Test API Endpoints
- After logging in, your session token is stored in localStorage
- Test the `/api/auth/me` endpoint by accessing it directly or via the dashboard page
- Verify that you get your user information back

### 7. Test Admin Route Protection (if applicable)
- If you have a user with role 'ADMIN', try accessing `/api/admin`
- If you have a user with role 'USER', you should get a 403 Forbidden error

## Expected Behavior

1. **Signup Flow**: 
   - User enters email/password
   - Account is created in Supabase
   - User record is automatically created in Neon DB
   - User is redirected to dashboard

2. **Login Flow**:
   - User enters email/password
   - Authentication is verified by Supabase
   - User data is retrieved from Neon DB
   - User is redirected to dashboard

3. **Session Management**:
   - Tokens are stored in localStorage
   - AuthContext manages the session state
   - Session persists across page refreshes

4. **Route Protection**:
   - Unauthenticated users are redirected to login
   - Authenticated users can access protected routes
   - Role-based access is enforced for admin routes

## Troubleshooting

### Common Issues:

1. **"NEXT_PUBLIC_SUPABASE_URL is not set" Error**
   - Verify your environment variables are properly set
   - Make sure you're using `.env.local` file

2. **"Invalid token" or "Unauthorized" Errors**
   - Check that your Supabase project URL and anon key are correct
   - Verify that the user exists in both Supabase and your Neon DB

3. **Redirect Loops**
   - Check that your AuthProvider is properly wrapped around your app
   - Verify that the root layout includes the AuthProvider

4. **Database Connection Issues**
   - Verify your Neon DB connection settings
   - Make sure the users table exists in your database

### Verification Commands:

You can also manually test the API endpoints:

**Test signup:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "password":"password123"}'
```

**Test login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "password":"password123"}'
```

**Test protected endpoint (with token):**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Success Criteria

The authentication system is working correctly when:
- ✅ Users can sign up and log in successfully
- ✅ User data is synchronized between Supabase and Neon DB
- ✅ Protected routes redirect unauthenticated users to login
- ✅ Session persists across page refreshes
- ✅ API endpoints properly validate authentication
- ✅ Role-based access control works as expected