'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [target, setTarget] = useState<string>('');
  const [scoreDelta, setScoreDelta] = useState<number>(0);
  const [coinDelta, setCoinDelta] = useState<number>(0);
  const [inv, setInv] = useState<any[]>([]);
  const [giveItem, setGiveItem] = useState<number>(0);
  const [giveQty, setGiveQty] = useState<number>(1);

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
      const { data: ps } = await supabase.from('profiles').select('id, username').order('username');
      setPlayers(ps || []);
      const { data: its } = await supabase.from('items').select('id, name, emoji').order('name');
      setItems(its || []);
    })();
  }, [user]);

  async function loadInv(uid: string) {
    const { data } = await supabase.from('user_items_view').select('*').eq('user_id', uid);
    setInv(data || []);
  }

  const applyScore = async () => { const { error } = await supabase.rpc('admin_adjust_score', { p_target_user_id: target, p_delta: scoreDelta }); if (error) return alert(error.message); alert('Score updated.'); };
  const applyCoins = async () => { const { error } = await supabase.rpc('admin_adjust_coins', { p_target_user_id: target, p_delta: coinDelta }); if (error) return alert(error.message); alert('Coins updated.'); };
  const give = async () => { const { error } = await supabase.rpc('admin_give_item', { p_target: target, p_item_id: giveItem, p_qty: giveQty }); if (error) return alert(error.message); await loadInv(target); };
  const remove = async (user_item_id:number) => { const { error } = await supabase.rpc('admin_remove_item', { p_user_item_id: user_item_id }); if (error) return alert(error.message); await loadInv(target); };

  if (!user) return <div className="card">Please sign in.</div>;
  if (!isAdmin) return <div className="card">You must be the admin to view this page.</div>;

  return (
    <div className="grid gap-4">
      <div className="card grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Pick a Player</h3>
          <select className="input w-full" value={target} onChange={e=>{setTarget(e.target.value); if(e.target.value) loadInv(e.target.value);}}>
            <option value="">Select...</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
          </select>
        </div>
        <div className="grid gap-3">
          <div>
            <h3 className="font-semibold mb-1">Adjust Score</h3>
            <input className="input w-full mb-2" type="number" value={scoreDelta} onChange={e=>setScoreDelta(parseInt(e.target.value||'0'))} />
            <button className="btn" onClick={applyScore}>Apply Score Change</button>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Adjust Coins</h3>
            <input className="input w-full mb-2" type="number" value={coinDelta} onChange={e=>setCoinDelta(parseInt(e.target.value||'0'))} />
            <button className="btn" onClick={applyCoins}>Apply Coin Change</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Player Inventory</h3>
        {!target && <div className="text-slate-400">Select a player above.</div>}
        {target && (
          <>
            <div className="flex gap-2 items-end mb-3">
              <select className="input" value={giveItem} onChange={e=>setGiveItem(parseInt(e.target.value))}>
                <option value="0">Select item…</option>
                {items.map(i=><option key={i.id} value={i.id}>{i.emoji} {i.name}</option>)}
              </select>
              <input className="input" type="number" min={1} value={giveQty} onChange={e=>setGiveQty(parseInt(e.target.value||'1'))}/>
              <button className="btn" onClick={give}>Give</button>
            </div>
            <table className="table">
              <thead><tr><th>Item</th><th>Qty</th><th>Expires</th><th></th></tr></thead>
              <tbody>
                {inv.map((it:any)=>(
                  <tr key={it.id}>
                    <td>{it.emoji} {it.name}</td>
                    <td>{it.qty}</td>
                    <td>{it.expires_at ? new Date(it.expires_at).toLocaleString() : '—'}</td>
                    <td><button className="btn" onClick={()=>remove(it.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="card text-sm text-slate-400">
        Note: Complex item effects are still manual (use score/coin changes). This panel is for inventory management.
      </div>
    </div>
  );
}
