# Authentication System Setup Guide

This project implements a complete authentication system using Supabase Auth with a PostgreSQL database for user management.

## Features Implemented

1. **Supabase Auth** - Email/password authentication with session management
2. **PostgreSQL User Sync** - Automatic synchronization with Neon DB users table
3. **Protected Routes** - Both frontend and backend route protection
4. **Role-based Access Control** - Support for USER and ADMIN roles
5. **Reusable Components** - Auth context and helper functions

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.io](https://supabase.io) and create an account
2. Create a new project
3. Note down your:
   - Project URL
   - Anonymous key (anon key)

### 2. Configure Environment Variables
Create/update `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Setup
The system creates the users table automatically. Run the migration:

```sql
-- Migration file: migrations/002_create_users_table.sql
-- This creates the users table with proper indexes and UUID support
```

### 4. Install Dependencies
Make sure you have these dependencies installed:

```bash
npm install @supabase/supabase-js jose pg
npm install --save-dev @types/pg
```

### 5. Available Routes

#### Public Routes:
- `GET /` - Home page
- `GET /login` - Login page
- `GET /signup` - Signup page

#### Protected Routes:
- `GET /dashboard` - User dashboard (requires authentication)
- `GET /api/auth/me` - Get current user (requires authentication)
- `GET /api/user` - User-protected API route (requires authentication)
- `GET /api/admin` - Admin-protected API route (requires ADMIN role)

#### Auth API Endpoints:
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End user session

## How It Works

### Frontend Authentication Flow:
1. Users sign up/log in via the frontend forms
2. Credentials are sent to the backend auth APIs
3. Supabase creates/validates the user session
4. User data is synced to the Neon DB users table
5. Session tokens are stored in localStorage
6. The AuthContext manages the authentication state across the app

### Backend Protection:
1. All protected API routes use the `withAuth` middleware
2. Middleware verifies the JWT token using Supabase's JWKS endpoint
3. Extracts user information from the token (subject ID)
4. Looks up the user in the Neon DB users table
5. Checks role permissions if required
6. Attaches the user object to the request for the handler to use

### User Synchronization:
1. When a user signs up/signs in, their Supabase user ID and email are stored in the Neon DB
2. The system checks if the user already exists before creating a new record
3. Role information is stored in the Neon DB (not in Supabase), allowing for custom role management

## Testing the System

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/signup` to create an account

3. Log in at `http://localhost:3000/login`

4. Access the dashboard at `http://localhost:3000/dashboard`

5. Test the protected APIs:
   - `http://localhost:3000/api/user` (requires auth)
   - `http://localhost:3000/api/admin` (requires ADMIN role)

## Customization

### Adding More Protected Routes:
```typescript
// Frontend components can use the useAuth hook
import { useAuth } from '@/contexts/AuthContext';

export default function MyComponent() {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated()) {
    // Redirect to login or show unauthorized message
    return <div>Please log in</div>;
  }
  
  return <div>Welcome {user?.email}!</div>;
}
```

### Protecting Additional API Routes:
```typescript
import { withAuth, jsonRes } from '@/lib/auth/middleware';

// Protect with any authenticated user
export const GET = withAuth(async (req) => {
  return jsonRes({ message: 'Protected data', user: req.user });
});

// Protect with specific role
export const POST = withAuth(async (req) => {
  return jsonRes({ message: 'Admin data', user: req.user });
}, 'ADMIN');
```

## Security Notes

- JWT tokens are verified using Supabase's JWKS endpoint
- All database queries use parameterized queries to prevent SQL injection
- Session tokens are stored in localStorage (consider using httpOnly cookies in production)
- Passwords are handled securely by Supabase (never exposed to the application)
- Role-based access control prevents unauthorized access to sensitive features