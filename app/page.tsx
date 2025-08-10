'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ActivityLog from '@/components/ActivityLog';

type Row = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  score: number;
  statuses?: string[]; // <-- NEW
  change?: number;
};

export default function HomePage() {
  const [rows, setRows] = useState<Row[]>([]);

  async function load() {
    const { data } = await supabase.rpc('public_leaderboard');
    const prev = JSON.parse(localStorage.getItem('lb-prev') || '{}');
    const withChange = ((data as Row[]) || []).map((r, i) => {
      const prevPos = prev[r.user_id];
      return { ...r, change: prevPos ? prevPos - (i + 1) : 0 };
    });
    const map: Record<string, number> = {};
    withChange.forEach((r, i) => {
      map[r.user_id] = i + 1;
    });
    localStorage.setItem('lb-prev', JSON.stringify(map));
    setRows(withChange);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel('rt-scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="grid gap-4">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
        <table className="table table--lb text-lg">
          <thead>
            <tr>
              <th>Δ</th>
              <th>#</th>
              <th>Player</th>
              <th>Status</th> {/* NEW */}
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.user_id}
                className={
                  i === 0
                    ? 'first-place'
                    : i === 1
                    ? 'second-place'
                    : i === 2
                    ? 'third-place'
                    : ''
                }
              >
                <td>
                  {r.change && r.change > 0 ? (
                    <span className="text-green-500">▲</span>
                  ) : r.change && r.change < 0 ? (
                    <span className="text-red-500">▼</span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td>{i + 1}</td>
                <td>
                  <div className="row">
                    {r.avatar_url ? <img className="avatar" src={r.avatar_url} alt="" /> : null}
                    {r.username ?? 'Player'}
                  </div>
                </td>
                <td>
                  <div className="badges">
                    {(r.statuses && r.statuses.length ? r.statuses : []).map((s) => (
                      <span key={s} className={`badge badge-${s}`}>{s}</span>
                    ))}
                    {(!r.statuses || r.statuses.length === 0) && <span className="badge">—</span>}
                  </div>
                </td>
                <td>{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
// load
const { data } = await supabase
  .from('activity_log')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(50);

// realtime
const channel = supabase
  .channel('activity-log')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'activity_log' },
    (payload) => setLog((prev) => [payload.new, ...prev].slice(0,50))
  )
  .subscribe();

      <ActivityLog />
    </div>
  );
}
