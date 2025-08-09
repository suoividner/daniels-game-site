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
};

export default function HomePage() {
  const [rows, setRows] = useState<Row[]>([]);

  async function load() {
    const { data } = await supabase.rpc('public_leaderboard');
    setRows((data as Row[]) || []);
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
        <table className="table leaderboard">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Status</th> {/* NEW */}
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.user_id}>
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
                <td style={{ textAlign: 'right' }}>{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ActivityLog />
    </div>
  );
}
