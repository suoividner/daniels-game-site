'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function nextNoonEST() {
  const now = new Date();
  // current time in America/New_York
  const fmt = new Intl.DateTimeFormat('en-US',{ timeZone:'America/New_York', hour12:false,
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit' });
  const parts:any = Object.fromEntries(fmt.formatToParts(now).map(p=>[p.type,p.value]));
  // construct today 12:00:00 in EST, then if past, move to tomorrow
  const estTodayNoon = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00-05:00`);
  // -05/-04 issue: use the browser to parse offset; if past, add 24h
  let target = estTodayNoon;
  const estNow = new Date(fmt.format(now));
  if (estNow.getTime() >= estTodayNoon.getTime()) target = new Date(estTodayNoon.getTime()+24*3600*1000);
  return target;
}
function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(()=>{ const t=setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(t); },[]);
  const diff = Math.max(0, target.getTime() - now);
  const h = Math.floor(diff/3600000), m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000);
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

export default function ShopPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const target = useMemo(()=>nextNoonEST(),[]);
  const left = useCountdown(target);

  const load = async () => {
    const { data } = await supabase.rpc('today_shop'); setRows(data||[]);
    const u = (await supabase.auth.getUser()).data.user;
    if (u) { const { data: bal } = await supabase.from('coins').select('balance').eq('user_id', u.id).single(); setBalance(bal?.balance||0); }
  };

  useEffect(()=>{ load(); }, []);

  const buy = async (item_id: number) => {
    const u = (await supabase.auth.getUser()).data.user; if (!u) return alert('Please sign in');
    const { error } = await supabase.rpc('purchase_item', { p_user_id: u.id, p_item_id: item_id });
    if (error) return alert(error.message);
    await load(); alert('Purchased!');
  };

  return (
    <div className="grid gap-4">
      <div className="card flex items-center justify-between">
        <h2 className="text-xl font-semibold">Shop • refreshes at 12:00 PM EST</h2>
        <div>Next refresh in <b>{left}</b> • Your Coins: <b>{balance}</b></div>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Item</th><th>Price</th><th>Left</th><th></th></tr></thead>
          <tbody>
            {rows.map((r:any) => (
              <>
                <tr key={r.item_id} onClick={()=>document.getElementById('d'+r.item_id)?.toggleAttribute('open')} style={{cursor:'pointer'}}>
                  <td>{r.emoji} {r.name}</td>
                  <td>{r.price}</td>
                  <td>{r.qty_left}</td>
                  <td><button className="btn" onClick={(e)=>{e.stopPropagation(); buy(r.item_id)}}>Buy</button></td>
                </tr>
                <tr><td colSpan={4} style={{padding:0}}>
                  <details id={'d'+r.item_id} className="details">
                    <summary></summary>
                    <div className="p-3 text-sm text-slate-300">Click to view details in your database’s <code>items.description</code> (you can edit there).</div>
                  </details>
                </td></tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
