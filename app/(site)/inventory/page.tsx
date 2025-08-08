'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function InventoryPage() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: bal } = await supabase.from('coins').select('balance').eq('user_id', user.id).single();
      setBalance(bal?.balance || 0);
      const { data: inv } = await supabase.from('user_items_view').select('*').eq('user_id', user.id);
      setItems(inv || []);
    })();
  }, [user]);

  const trash = async (user_item_id: number) => {
    await supabase.from('user_items').delete().eq('id', user_item_id);
    const { data: inv } = await supabase.from('user_items_view').select('*').eq('user_id', user.id);
    setItems(inv || []);
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
        <table className="table">
          <thead><tr><th>Item</th><th>Qty</th><th>Expires</th><th></th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.emoji} {it.name}</td>
                <td>{it.qty}</td>
                <td>{it.expires_at ? new Date(it.expires_at).toLocaleString() : '-'}</td>
                <td><button className="btn" onClick={() => trash(it.id)}>Trash</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
