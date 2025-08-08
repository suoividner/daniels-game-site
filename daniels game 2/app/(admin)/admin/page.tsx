'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [target, setTarget] = useState<string>('');
  const [scoreDelta, setScoreDelta] = useState<number>(0);
  const [coinDelta, setCoinDelta] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setIsAdmin(prof?.role === 'admin');
      const { data } = await supabase.from('profiles').select('id, username').order('username');
      setPlayers(data || []);
    })();
  }, [user]);

  const applyScore = async () => {
    const { error } = await supabase.rpc('admin_adjust_score', { p_target_user_id: target, p_delta: scoreDelta });
    if (error) return alert(error.message);
    alert('Score updated.');
  };
  const applyCoins = async () => {
    const { error } = await supabase.rpc('admin_adjust_coins', { p_target_user_id: target, p_delta: coinDelta });
    if (error) return alert(error.message);
    alert('Coins updated.');
  };
  const refreshShop = async () => {
    const { error } = await supabase.rpc('refresh_shop_today');
    if (error) return alert(error.message);
    alert('Shop refreshed.');
  };

  if (!user) return <div className="card">Please sign in.</div>;
  if (!isAdmin) return <div className="card">You must be the admin to view this page.</div>;

  return (
    <div className="grid gap-4">
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Admin Controls</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold mb-2">Pick a Player</h3>
            <select className="input w-full" value={target} onChange={e=>setTarget(e.target.value)}>
              <option value="">Select...</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
            </select>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Adjust Score</h3>
            <input className="input w-full mb-2" type="number" value={scoreDelta} onChange={e=>setScoreDelta(parseInt(e.target.value||'0'))} />
            <button className="btn" onClick={applyScore}>Apply Score Change</button>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Adjust Coins</h3>
            <input className="input w-full mb-2" type="number" value={coinDelta} onChange={e=>setCoinDelta(parseInt(e.target.value||'0'))} />
            <button className="btn" onClick={applyCoins}>Apply Coin Change</button>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Shop</h3>
            <button className="btn" onClick={refreshShop}>Refresh Shop (Today)</button>
          </div>
        </div>
      </div>
      <div className="card text-sm text-slate-400">
        Note: Complex item effects are tracked as inventory only. Apply outcomes manually via score/coin updates.
      </div>
    </div>
  );
}
