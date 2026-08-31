'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { getOrCreateUserProfile } from '@/lib/firestore-service';
import { UserProfile, UserPlan } from '@/lib/types';
import { PLANS } from '@/lib/plans';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  upgradePlanMock: (newPlan: UserPlan) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        try {
          const prof = await getOrCreateUserProfile({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || (fbUser.isAnonymous ? 'Visitante Demo' : 'Usuário'),
            photoURL: fbUser.photoURL,
          });
          setProfile(prof);
        } catch (e) {
          console.warn('Error loading user profile:', e);
          setProfile({
            uid: fbUser.uid,
            email: fbUser.email || 'demo@meuqrcode.com.br',
            displayName: fbUser.displayName || 'Visitante Demo',
            photoURL: fbUser.photoURL,
            plan: 'free',
            subscriptionStatus: 'active',
            dynamicQRLimit: 1,
            totalScansLimit: 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        const prof = await getOrCreateUserProfile({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
          photoURL: cred.user.photoURL,
        });
        setProfile(prof);
      }
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      const prof = await getOrCreateUserProfile({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
      });
      setProfile(prof);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      const prof = await getOrCreateUserProfile({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name || 'Novo Usuário',
      });
      setProfile(prof);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signInAsGuest = async () => {
    try {
      const cred = await signInAnonymously(auth);
      if (cred.user) {
        const prof = await getOrCreateUserProfile({
          uid: cred.user.uid,
          email: 'demo@meuqrcode.com.br',
          displayName: 'Visitante Demo',
        });
        setProfile(prof);
      }
    } catch {
      // Fallback local mock user if anonymous auth is not enabled in Firebase console yet
      const demoUid = `guest_${Date.now()}`;
      const mockProf: UserProfile = {
        uid: demoUid,
        email: 'demo@meuqrcode.com.br',
        displayName: 'Visitante Demo',
        photoURL: null,
        plan: 'free',
        subscriptionStatus: 'active',
        dynamicQRLimit: 1,
        totalScansLimit: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProfile(mockProf);
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const upgradePlanMock = async (newPlan: UserPlan) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      plan: newPlan,
      subscriptionStatus: 'active',
      dynamicQRLimit: PLANS[newPlan].dynamicQRLimit,
      totalScansLimit: PLANS[newPlan].scansLimit === 'unlimited' ? 999999 : (PLANS[newPlan].scansLimit as number),
      updatedAt: new Date().toISOString(),
    };
    setProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signInAsGuest,
        signOut,
        upgradePlanMock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
