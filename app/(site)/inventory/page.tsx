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

function ItemRow({ it, onTrash }: { it: any; onTrash: (id: number) => void }) {
  const t = useCountdownTo(it.expires_at);
  return (
    <>
      <tr onClick={() => document.getElementById('inv'+it.id)?.toggleAttribute('open')} style={{ cursor: 'pointer' }}>
        <td>{it.emoji} {it.name}</td>
        <td>{it.qty}</td>
        <td title={t.title}>{t.label}</td>
        <td>
          <button title="Trash" className="btn" style={{ padding: '.3rem .5rem' }}
            onClick={(e) => { e.stopPropagation(); onTrash(it.id); }}>
            🗑️
          </button>
        </td>
      </tr>
      <tr><td colSpan={4} style={{ padding: 0 }}>
        <details id={'inv'+it.id} className="details"><summary></summary>
          <div className="p-3 text-sm text-slate-300">{it.description || 'No description.'}</div>
        </details>
      </td></tr>
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
    const { data: inv, error } = await supabase.from('user_items_view').select('*').eq('user_id', user.id);
    if (error) console.error(error);
    setItems(inv || []);
  }
  useEffect(() => { reload(); }, [user]);

  const trash = async (user_item_id: number) => { await supabase.from('user_items').delete().eq('id', user_item_id); reload(); };

  if (!user) return <div className="card">Please sign in to view your inventory.</div>;

  return (
    <div className="grid gap-4">
      <div className="card flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Balance</h2>
        <div className="text-2xl font-bold">{balance} Coins</div>
      </div>
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">My Items</h2>
        <table className="table">
          <thead><tr><th>Item</th><th>Qty</th><th>Expires</th><th></th></tr></thead>
          <tbody>
            {items.map((it) => <ItemRow key={it.id} it={it} onTrash={trash} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
