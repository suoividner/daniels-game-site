diff --git a/app/layout.tsx b/app/layout.tsx
index eddad58d252b200c1bd22b5492374b167a4d358b..27af20bd5b344e96e90b18f7cca141626c14e07c 100644
--- a/app/layout.tsx
+++ b/app/layout.tsx
@@ -1,27 +1,30 @@
 import '../styles/globals.css';
 import Link from 'next/link';
+import AuthButton from '@/components/AuthButton';
+import ThemeToggle from '@/components/ThemeToggle';
 
 export const metadata = { title: "Daniel's Game", description: 'Tracker' };
 
 export default function RootLayout({ children }: { children: React.ReactNode }) {
   return (
     <html lang="en">
       <body>
         <div className="container">
           <header className="flex items-center justify-between pb-4">
             <h1 className="text-2xl font-bold">Daniel&apos;s Game</h1>
-            <nav className="flex gap-4">
+            <nav className="flex items-center gap-4">
               <Link href="/">Home</Link>
-              <Link href="/leaderboard">Leaderboard</Link>
               <Link href="/shop">Shop</Link>
               <Link href="/inventory">My Inventory</Link>
               <Link href="/admin">Admin</Link>
+              <AuthButton />
+              <ThemeToggle />
             </nav>
           </header>
           <main>{children}</main>
           <footer className="pt-8 text-sm text-slate-400">Built for Discord game tracking • Supabase + Next.js</footer>
         </div>
       </body>
     </html>
   );
 }
