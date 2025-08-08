'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
    });
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <button className="btn" onClick={user ? signOut : signIn}>
      {user ? 'Sign out' : 'Sign in'}
    </button>
  );
}
