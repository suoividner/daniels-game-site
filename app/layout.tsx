import '../styles/globals.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const metadata = { title: "Daniel's Game", description: 'Tracker' };

function ThemeToggle() {
  const [theme, setTheme] = useState<string>((typeof window!=='undefined' && localStorage.getItem('theme')) || 'dark');
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('theme', theme); }, [theme]);
  return (
    <button className="toggle" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>
      {theme==='dark' ? '🌙 Dark' : '🌞 Light'}
    </button>
  );
}

function AuthButtons() {
  const [user,setUser] = useState<any>(null);
  useEffect(()=>{ supabase.auth.getUser().then(({data})=>setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user||null)); return ()=>sub.subscription.unsubscribe(); },[]);
  const signIn = async () => { await supabase.auth.signInWithOAuth({ provider:'discord', options:{ redirectTo: typeof window!=='undefined'?window.location.origin:undefined } }); };
  const signOut= async () => { await supabase.auth.signOut(); };
  return user
    ? <button className="btn" onClick={signOut}>Sign out</button>
    : <button className="btn" onClick={signIn}>Sign in with Discord</button>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="flex items-center justify-between pb-4">
            <div className="row">
              <h1 className="text-2xl font-bold">Daniel&apos;s Game</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/">Home</Link>
              <Link href="/shop">Shop</Link>
              <Link href="/inventory">My Inventory</Link>
              <Link href="/admin">Admin</Link>
              <ThemeToggle />
              <AuthButtons />
            </nav>
          </header>
          <main>{children}</main>
          <footer className="pt-8 text-sm text-slate-400">Built for Discord game tracking • Supabase + Next.js</footer>
        </div>
      </body>
    </html>
  );
}
