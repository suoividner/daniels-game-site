'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
  }, [user]);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
    });
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <div className="grid gap-4">
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">What this site does</h2>
        <ul className="list-disc pl-5 space-y-1 text-slate-300">
          <li>Login with Discord to view your private inventory & balance.</li>
          <li>Buy items from a daily-rotating shop (limited stock).</li>
          <li>See the public leaderboard.</li>
          <li>Only the admin can change scores and balances.</li>
        </ul>
      </div>
      <div className="card flex items-center justify-between">
        <div>
          {user ? <p>Signed in as <b>{user.user_metadata?.user_name || profile?.username || user.email}</b></p> : <p>Not signed in.</p>}
        </div>
        <div className="flex gap-2">
          {!user && <button className="btn" onClick={signIn}>Sign in with Discord</button>}
          {user && <button className="btn" onClick={signOut}>Sign out</button>}
        </div>
      </div>
    </div>
  );
}
