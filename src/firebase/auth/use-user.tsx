'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, Auth, User } from 'firebase/auth';

export interface UserHookResult {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * React hook to subscribe to Firebase auth state changes.
 * @param {Auth | null | undefined} auth - The Firebase Auth instance.
 * @returns {UserHookResult} Object with user, isLoading, error.
 */
export function useUser(auth: Auth | null | undefined): UserHookResult {
  const [userState, setUserState] = useState<UserHookResult>({
    user: null,
    isLoading: true, // Start loading until first auth event
    error: null,
  });

  useEffect(() => {
    if (!auth) {
      setUserState({ user: null, isLoading: false, error: new Error("Auth service not provided.") });
      return;
    }

    // Set loading state true whenever auth instance changes
    setUserState(prevState => ({ ...prevState, isLoading: true }));

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        // Auth state determined
        setUserState({ user: firebaseUser, isLoading: false, error: null });
      },
      (error) => {
        // Auth listener error
        console.error("useUser: onAuthStateChanged error:", error);
        setUserState({ user: null, isLoading: false, error: error });
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]); // Depends on the auth instance

  return userState;
}
