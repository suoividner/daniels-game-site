'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Settings"
        className="text-xl"
        onClick={() => setOpen((o) => !o)}
      >
        ⚙️
      </button>
      <div
        className={`absolute right-0 mt-2 flex w-48 flex-col items-center gap-2 rounded bg-[var(--card)] p-2 text-center shadow transition-transform transition-opacity duration-200 ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}`}
      >
        <Link href="/admin">Admin</Link>
        <ThemeToggle />
        <AuthButtons />
      </div>
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
