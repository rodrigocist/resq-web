'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, getMerchantProfile, type UserProfile, type MerchantProfile, type UserRole } from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  merchantDoc: MerchantProfile | null;
  role: UserRole | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  merchantDoc: null,
  role: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [merchantDoc, setMerchantDoc] = useState<MerchantProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
          setRole(userProfile?.role ?? 'user');

          if (userProfile?.role === 'merchant') {
            const merchant = await getMerchantProfile(firebaseUser.uid);
            setMerchantDoc(merchant);
          } else {
            setMerchantDoc(null);
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
        }
      } else {
        setProfile(null);
        setMerchantDoc(null);
        setRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, merchantDoc, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
