'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [players, setPlayers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [target, setTarget] = useState<string>('');
  const [inv, setInv] = useState<any[]>([]);

  // existing controls
  const [scoreDelta, setScoreDelta] = useState<number>(0);
  const [coinDelta, setCoinDelta] = useState<number>(0);
  const [giveItem, setGiveItem] = useState<number>(0);
  const [giveQty, setGiveQty] = useState<number>(1);

  // new: award points
  const [awardPoints, setAwardPoints] = useState<number>(0);
  const [awardImposter, setAwardImposter] = useState<boolean>(false);

  // new: wound spend
  const [woundSpend, setWoundSpend] = useState<number>(10);

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

      // use RPC that builds a display name
      const { data: ps } = await supabase.rpc('list_players');
      setPlayers(ps || []);

      const { data: its } = await supabase.from('items').select('id, name, emoji').order('name');
      setItems(its || []);
    })();
  }, [user]);

  async function loadInv(uid: string) {
    const { data } = await supabase.from('user_items_view').select('*').eq('user_id', uid);
    setInv(data || []);
  }

  // ===== existing admin RPCs =====
  const applyScore = async () => {
    if (!target) return alert('Pick a player');
    const { error } = await supabase.rpc('admin_adjust_score', { p_target_user_id: target, p_delta: scoreDelta });
    if (error) return alert(error.message);
    alert('Score updated.');
  };

  const applyCoins = async () => {
    if (!target) return alert('Pick a player');
    const { error } = await supabase.rpc('admin_adjust_coins', { p_target_user_id: target, p_delta: coinDelta });
    if (error) return alert(error.message);
    alert('Coins updated.');
  };

  const give = async () => {
    if (!target) return alert('Pick a player');
    if (!giveItem) return alert('Pick an item');
    const { error } = await supabase.rpc('admin_give_item', { p_target: target, p_item_id: giveItem, p_qty: giveQty });
    if (error) return alert(error.message);
    await loadInv(target);
  };

  const remove = async (user_item_id:number) => {
    const { error } = await supabase.rpc('admin_remove_item', { p_user_item_id: user_item_id });
    if (error) return alert(error.message);
    await loadInv(target);
  };

  // ===== new actions (Phase 2) =====
  const doAwardPoints = async () => {
    if (!target) return alert('Pick a player');
    const { error, data } = await supabase.rpc('award_points', {
      p_user: target,
      p_points: Number(awardPoints) || 0,
      p_is_imposter: awardImposter,
    });
    if (error) return alert(error.message);
    alert(`Awarded points${typeof data === 'number' ? ` (applied: ${data})` : ''}.`);
  };

  const doWound = async () => {
    if (!user) return alert('Not signed in.');
    if (!target) return alert('Pick a target');
    if (!woundSpend || woundSpend <= 0) return alert('Enter coins to spend (> 0)');
    const { error, data } = await supabase.rpc('use_wound', {
      p_attacker: user.id,
      p_target: target,
      p_spend: Number(woundSpend),
    });
    if (error) return alert(error.message);
    alert(`WOUND dealt ${data ?? 0} damage.`);
  };

  const doPublishSnapshot = async () => {
    const { error } = await supabase.rpc('admin_mark_leaderboard_update');
    if (error) return alert(error.message);
    alert('Leaderboard snapshot saved.');
  };

  const doRollbackTarget = async () => {
    if (!target) return alert('Pick a player');
    const { error } = await supabase.rpc('rollback_to_last_update', { p_user: target });
    if (error) return alert(error.message);
    alert('Rolled back to last snapshot.');
  };

  const poisonMissedFirst = async () => {
    if (!target) return alert('Pick a player');
    const { error, data } = await supabase.rpc('poison_missed_first', { p_user: target });
    if (error) return alert(error.message);
    alert(data ? `Applied poison penalty: -${data}` : 'No active poison to penalize.');
  };

  const poisonReset = async () => {
    if (!target) return alert('Pick a player');
    const { error } = await supabase.rpc('poison_reset', { p_user: target });
    if (error) return alert(error.message);
    alert('Poison chain reset.');
  };

  if (!user) return <div className="card">Please sign in.</div>;
  if (!isAdmin) return <div className="card">You must be the admin to view this page.</div>;

  return (
    <div className="grid gap-4">
      {/* Select player */}
      <div className="card grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Pick a Player</h3>
          <select
            className="input w-full"
            value={target}
            onChange={e => { setTarget(e.target.value); if (e.target.value) loadInv(e.target.value); }}
          >
            <option value="">Select...</option>
            {players.map((p:any) => <option key={p.id} value={p.id}>{p.username}</option>)}
          </select>
        </div>

        {/* Quick ops */}
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

      {/* Award Points (uses central logic) */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Award Points</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">Points</label>
            <input className="input w-full" type="number" min={0} value={awardPoints}
                   onChange={e=>setAwardPoints(Number(e.target.value)||0)} />
          </div>
          <label className="flex items-center gap-2 md:col-span-2">
            <input type="checkbox" checked={awardImposter} onChange={e=>setAwardImposter(e.target.checked)} />
            Treat as “imposter” message?
          </label>
          <div className="md:col-span-1 flex items-end">
            <button className="btn w-full" onClick={doAwardPoints}>Give Points</button>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          Respects DOUBLER, GOLD RUSH (coins), FRIENDSHIP, ALLIANCE, COPYCAT automatically.
        </p>
      </div>

      {/* WOUND attack */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">WOUND Attack</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Coins to Spend</label>
            <input className="input w-full" type="number" min={1} value={woundSpend}
                   onChange={e=>setWoundSpend(Number(e.target.value)||1)} />
          </div>
          <div className="md:col-span-1 flex items-end">
            <button className="btn w-full" onClick={doWound}>Spend & Attack</button>
          </div>
          <div className="md:col-span-1 flex items-center text-sm text-slate-400">
            Deals floor(spend/2) damage. Respects IMMUNITY/SHIELD/DOUBLE DAMAGE.
          </div>
        </div>
      </div>

      {/* POISON controls */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Poison Controls</h3>
        <div className="flex gap-2 flex-wrap">
          <button className="btn" onClick={poisonMissedFirst}>Apply “Missed First” Penalty</button>
          <button className="btn" onClick={poisonReset}>Reset Poison Chain</button>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          Penalties: -3 / -5 / -7 / -9 (first four misses while poisoned). Reset when the player gets first.
        </p>
      </div>

      {/* Inventory management (existing) */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Player Inventory</h3>
        {!target && <div className="text-slate-400">Select a player above.</div>}
        {target && (
          <>
            <div className="flex gap-2 items-end mb-3">
              <select className="input" value={giveItem} onChange={e=>setGiveItem(parseInt(e.target.value))}>
                <option value="0">Select item…</option>
                {items.map((i:any)=><option key={i.id} value={i.id}>{i.emoji} {i.name}</option>)}
              </select>
              <input className="input" type="number" min={1} value={giveQty} onChange={e=>setGiveQty(parseInt(e.target.value||'1'))}/>
              <button className="btn" onClick={give}>Give</button>
            </div>
            <table className="table table--inv">
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

      {/* Leaderboard snapshots */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Leaderboard Snapshots</h3>
        <div className="flex gap-2 flex-wrap">
          <button className="btn" onClick={doPublishSnapshot}>Publish Snapshot (save rollback point)</button>
          <button className="btn" onClick={doRollbackTarget}>Rollback Selected Player</button>
        </div>
      </div>
    </div>
  );
}
