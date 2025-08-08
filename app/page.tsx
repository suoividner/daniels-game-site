 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/app/page.tsx b/app/page.tsx
index ff9247109c46a183fe24517fca6ae21c573c0c49..c825f23cd97eb1a74c6afd599cb030a9d61ffd89 100644
--- a/app/page.tsx
+++ b/app/page.tsx
@@ -1,57 +1,58 @@
 'use client';
-import { supabase } from '@/lib/supabaseClient';
 import { useEffect, useState } from 'react';
+import { supabase } from '@/lib/supabaseClient';
 
-export default function HomePage() {
-  const [user, setUser] = useState<any>(null);
-  const [profile, setProfile] = useState<any>(null);
-  useEffect(() => {
-    supabase.auth.getUser().then(({ data }) => setUser(data.user));
-    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
-      setUser(session?.user ?? null);
-    });
-    return () => { sub.subscription.unsubscribe(); };
-  }, []);
+interface Row {
+  user_id: string;
+  username: string;
+  score: number;
+  avatar_url?: string | null;
+}
 
-  useEffect(() => {
-    if (!user) return;
-    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
-  }, [user]);
+export default function HomePage() {
+  const [rows, setRows] = useState<Row[]>([]);
 
-  const signIn = async () => {
-    await supabase.auth.signInWithOAuth({
-      provider: 'discord',
-      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
-    });
+  const load = async () => {
+    const { data } = await supabase.rpc('public_leaderboard');
+    const ids = (data || []).map((r: any) => r.user_id);
+    const { data: profiles } = await supabase
+      .from('profiles')
+      .select('id, avatar_url')
+      .in('id', ids);
+    const avatarMap = new Map((profiles || []).map((p: any) => [p.id, p.avatar_url]));
+    setRows((data || []).map((r: any) => ({ ...r, avatar_url: avatarMap.get(r.user_id) })));
   };
-  const signOut = async () => { await supabase.auth.signOut(); };
+
+  useEffect(() => {
+    load();
+    const channel = supabase
+      .channel('leaderboard')
+      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, load)
+      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
+      .subscribe();
+    return () => { supabase.removeChannel(channel); };
+  }, []);
 
   return (
-    <div className="grid gap-4">
-      <div className="card">
-        <h2 className="text-xl font-semibold mb-2">What this site does</h2>
-        <ul className="list-disc pl-5 space-y-1 text-slate-300">
-          <li>Login with Discord to view your private inventory & balance.</li>
-          <li>Buy items from a daily-rotating shop (limited stock).</li>
-          <li>See the public leaderboard.</li>
-          <li>Only the admin can change scores and balances.</li>
-        </ul>
-      </div>
-      <div className="card flex items-center justify-between">
-        <div>
-          {user ? (
-  <p>Signed in as <b>{
-    (user.user_metadata?.global_name || profile?.username || user.email).replace(/#0$/, '')
-  }</b></p>
-) : (
-  <p>Not signed in.</p>
-)}
-        </div>
-        <div className="flex gap-2">
-          {!user && <button className="btn" onClick={signIn}>Sign in with Discord</button>}
-          {user && <button className="btn" onClick={signOut}>Sign out</button>}
-        </div>
-      </div>
+    <div className="card">
+      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
+      <table className="table">
+        <thead>
+          <tr><th>#</th><th>Player</th><th>Score</th></tr>
+        </thead>
+        <tbody>
+          {rows.map((r, i) => (
+            <tr key={r.user_id}>
+              <td>{i + 1}</td>
+              <td className="flex items-center gap-2">
+                {r.avatar_url && <img src={r.avatar_url} alt="" className="w-6 h-6 rounded-full" />}
+                {r.username}
+              </td>
+              <td>{r.score}</td>
+            </tr>
+          ))}
+        </tbody>
+      </table>
     </div>
   );
 }
 
EOF
)
