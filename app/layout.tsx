import '../styles/globals.css';
import Navbar from '@/components/Navbar';

export const metadata = { title: "Daniel's Game", description: 'Tracker' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <Navbar />
          <main>{children}</main>
          <footer className="pt-8 text-sm text-slate-400">
            Built for Discord game tracking • Supabase + Next.js
          </footer>
        </div>
      </body>
    </html>
  );
}
