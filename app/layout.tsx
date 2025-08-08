import '../styles/globals.css';
import Link from 'next/link';

export const metadata = { title: "Daniel's Game", description: 'Tracker' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="flex items-center justify-between pb-4">
            <h1 className="text-2xl font-bold">Daniel&apos;s Game</h1>
            <nav className="flex gap-4">
              <Link href="/">Home</Link>
              <Link href="/leaderboard">Leaderboard</Link>
              <Link href="/shop">Shop</Link>
              <Link href="/inventory">My Inventory</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="pt-8 text-sm text-slate-400">Built for Discord game tracking • Supabase + Next.js</footer>
        </div>
      </body>
    </html>
  );
}
