'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function ThemeToggle() {
  const [theme, setTheme] = useState<string>(
    (typeof window !== 'undefined' && localStorage.getItem('theme')) || 'dark'
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  return (
    <button className="toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '🌙 Dark' : '🌞 Light'}
    </button>
  );
}

function AuthButtons() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null));
    return () => sub.subscription.unsubscribe();
  }, []);
  const signIn = async () =>
    supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: window.location.origin } });
  const signOut = async () => supabase.auth.signOut();

  return user ? (
    <button className="btn" onClick={signOut}>Sign out</button>
  ) : (
    <button className="btn" onClick={sig
