import { createClient } from '@supabase/supabase-js';
import pool from '@/lib/pg-db';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define types for auth responses
export type AuthResponse = {
  data?: {
    user: any;
    session?: any;
  };
  error?: string;
};

// Sign up function
export async function signUp(email: string, password: string, name: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) {
      return { error: error.message };
    }

    // Create user record in Neon DB if not exists
    if (data.user) {
      await createOrUpdateUserInDb(data.user.id, email, 'USER', name);
    }

    return { data };
  } catch (error: any) {
    return { error: error.message || 'An error occurred during sign up' };
  }
}

// Sign in function
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    // Create user record in Neon DB if not exists
    if (data.user) {
      const name = data.user.user_metadata?.name;
      await createOrUpdateUserInDb(data.user.id, email, 'USER', name);
    }

    return { data };
  } catch (error: any) {
    return { error: error.message || 'An error occurred during sign in' };
  }
}

// Sign out function
export async function signOut(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return {};
  } catch (error: any) {
    return { error: error.message || 'An error occurred during sign out' };
  }
}

// Get current session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Get access token
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token || null;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<boolean> {
  try {
    // Supabase uses RS256 algorithm
    const JWKS = createRemoteJWKSet(
      new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
    );
    const { payload } = await jwtVerify(token, JWKS);
    
    // Additional checks can be performed here
    if (!payload.sub) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

// Create or update user in Neon DB
export async function createOrUpdateUserInDb(supabaseUserId: string, email: string, role: string = 'USER', name?: string): Promise<boolean> {
  try {
    // Check if user already exists by supabase_user_id
    const checkResult = await pool.query(
      'SELECT id FROM users WHERE supabase_user_id = $1',
      [supabaseUserId]
    );

    if (checkResult.rows.length > 0) {
      // User already exists, update email and name if needed
      await pool.query(
        'UPDATE users SET email = $1, name = $2 WHERE supabase_user_id = $3',
        [email, name, supabaseUserId]
      );
    } else {
      // Check if email already exists with a different supabase_user_id
      const emailCheckResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (emailCheckResult.rows.length > 0) {
        // Email exists but with a different supabase_user_id, update the existing record
        await pool.query(
          'UPDATE users SET supabase_user_id = $1, name = $2 WHERE email = $3',
          [supabaseUserId, name, email]
        );
      } else {
        // Create new user
        await pool.query(
          'INSERT INTO users (supabase_user_id, email, role, name) VALUES ($1, $2, $3, $4)',
          [supabaseUserId, email, role, name]
        );
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating/updating user in DB:', error);
    return false;
  }
}

// Get user from Neon DB by Supabase user ID
export async function getUserBySupabaseId(supabaseUserId: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE supabase_user_id = $1',
      [supabaseUserId]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error fetching user from DB:', error);
    return null;
  }
}

// Get current authenticated user from Neon DB
export async function getCurrentUserFromDb(token?: string) {
  try {
    // If token is not provided, try to get it from the session
    if (!token) {
      const session = await getSession();
      token = session?.access_token;
    }
    
    if (!token) {
      return null;
    }

    // Verify the token first
    const isValid = await verifyToken(token);
    if (!isValid) {
      return null;
    }

    // Decode the token to get the user ID
    let supabaseUserId: string;
    try {
      const JWKS = createRemoteJWKSet(
        new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
      );
      const { payload } = await jwtVerify(token, JWKS);
      supabaseUserId = payload.sub as string;
    } catch (decodeError) {
      console.error('Error decoding token:', decodeError);
      return null;
    }

    // Get user from Neon DB
    const user = await getUserBySupabaseId(supabaseUserId);
    return user;
  } catch (error) {
    console.error('Error getting current user from DB:', error);
    return null;
  }
}