'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ShopPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);

  const load = async () => {
    const { data } = await supabase.rpc('today_shop');
    setRows(data || []);
  };

  useEffect(() => {
    load();
    (async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const { data: bal } = await supabase.from('coins').select('balance').eq('user_id', user.id).single();
        setBalance(bal?.balance || 0);
      }
    })();
  }, []);

  const buy = async (item_id: number) => {
    const u = (await supabase.auth.getUser()).data.user;
    if (!u) return alert('Please sign in');
    const { error } = await supabase.rpc('purchase_item', { p_user_id: u.id, p_item_id: item_id });
    if (error) { alert(error.message); return; }
    alert('Purchased!');
    load();
    const { data: bal } = await supabase.from('coins').select('balance').eq('user_id', u.id).single();
    setBalance(bal?.balance || 0);
  };

  return (
    <div className="grid gap-4">
      <div className="card flex items-center justify-between">
        <h2 className="text-xl font-semibold">Shop • Today</h2>
        <div>My Balance: <b>{balance}</b> Coins</div>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Item</th><th>Price</th><th>Left</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.item_id}>
                <td>{r.emoji} {r.name}</td>
                <td>{r.price}</td>
                <td>{r.qty_left}</td>
                <td><button className="btn" onClick={() => buy(r.item_id)}>Buy</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
