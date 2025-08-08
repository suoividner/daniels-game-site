'use client';

import Link from 'next/link';
import Image from 'next/image';
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
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {user ? (
        <button className="btn" onClick={signOut}>Sign out</button>
      ) : (
        <button className="btn" onClick={signIn}>Sign in with Discord</button>
      )}
    </>
  );
}

function SettingsMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        aria-label="Settings"
        className="text-xl"
        onClick={() => setOpen((o) => !o)}
      >
        ⚙️
      </button>
      {open && (
        <div className="absolute right-0 mt-2 flex w-48 flex-col gap-2 rounded bg-base-200 p-2 shadow">
          <Link href="/admin">Admin</Link>
          <ThemeToggle />
          <AuthButtons />
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  return (
    <header className="flex items-center justify-between pb-4">
      <Link href="/" aria-label="Home">
        <Image src="/chrome-turtle.svg" alt="" width={32} height={32} />
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/">Home</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/inventory">My Inventory</Link>
        <SettingsMenu />
      </nav>
    </header>
  );
}
