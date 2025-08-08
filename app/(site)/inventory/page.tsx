'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function useCountdownTo(dateStr?: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!dateStr) return { label: '—', title: '' };
  const ts = new Date(dateStr).getTime();
  const diff = Math.max(0, ts - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return {
    label: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,
    title: new Date(dateStr).toLocaleString()
  };
}

function ItemRow({
  it,
  onTrash,
  onUseTargeted
}: {
  it: any;
  onTrash: (id: number) => void;
  onUseTargeted: (userItemId: number, targetId: string) => void;
}) {
  const t = useCountdownTo(it.expires_at);
  const [showPicker, setShowPicker] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [target, setTarget] = useState<string>('');

  useEffect(() => {
    if (!showPicker) return;
    supabase.from('profiles').select('id, username').order('username')
      .then(({ data }) => setPlayers(data || []));
  }, [showPicker]);

  return (
    <>
      <tr
        onClick={() => document.getElementById('inv' + it.id)?.toggleAttribute('open')}
        style={{ cursor: 'pointer' }}
        title="Click for details"
      >
        <td>{it.emoji} {it.name}</td>
        <td>{it.qty}</td>
        <td title={t.title}>{t.label}</td>
        <td className="flex gap-2">
          {it.is_targeted ? (
            <button className="btn" onClick={(e)=>{ e.stopPropagation(); setShowPicker(true); }}>
              Select Target
            </button>
          ) : (
            <button className="btn" title="Trash" onClick={(e)=>{ e.stopPropagation(); onTrash(it.id); }}>
              🗑️
            </button>
          )}
        </td>
      </tr>

      <tr><td colSpan={4} style={{ padding: 0 }}>
        <details id={'inv'+it.id} className="details"><summary></summary>
          <div className="p-3 text-sm text-slate-300">{it.description || 'No description.'}</div>
        </details>
      </td></tr>

      {showPicker && (
        <tr>
          <td colSpan={4} style={{ padding: 0 }}>
            <div className="card p-3" onClick={(e)=>e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <select className="input" value={target} onChange={(e)=>setTarget(e.target.value)}>
                  <option value="">Choose a player…</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
                </select>
                <button
                  className="btn"
                  onClick={()=>{ if(!target) return; onUseTargeted(it.id, target); setShowPicker(false); }}
                >
                  Confirm
                </button>
                <button className="btn" onClick={()=>setShowPicker(false)}>Cancel</button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function InventoryPage() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  async function reload() {
    if (!user) return;
    const { data: bal } = await supabase.from('coins').select('balance').eq('user_id', user.id).single();
    setBalance(bal?.balance || 0);
    const { data: inv } = await supabase.from('user_items_view').select('*').eq('user_id', user.id);
    setItems(inv || []);
  }
  useEffect(() => { reload(); }, [user]);

  const trash = async (user_item_id: number) => {
    await supabase.from('user_items').delete().eq('id', user_item_id);
    reload();
  };

  const useTargeted = async (user_item_id: number, target_id: string) => {
    const { error } = await supabase.rpc('use_targeted_item', { p_user_item_id: user_item_id, p_target: target_id });
    if (error) { alert(error.message); return; }
    reload();
  };

  if (!user) return <div className="card">Please sign in to view your inventory.</div>;

  return (
    <div className="grid gap-4">
      <div className="card flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Balance</h2>
        <div className="text-2xl font-bold">{balance} Coins</div>
      </div>
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">My Items</h2>
        <table className="table table--inv">
          <thead><tr><th>Item</th><th>Qty</th><th>Expires</th><th></th></tr></thead>
          <tbody>
            {items.map((it) => (
              <ItemRow
                key={it.id}
                it={it}
                onTrash={trash}
                onUseTargeted={useTargeted}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
