'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Row = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  score: number;
};

export default function HomePage() {
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    const { data } = await supabase.rpc('public_leaderboard');
    setRows(data || []);
  };

  useEffect(() => {
    load();
    // realtime refresh when scores change
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
              <th>Status</th>   // between Player and Score
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.user_id}>
                <td>{i + 1}</td>
                <td>
                  <div className="row">
                    {r.avatar_url ? (
                      <img className="avatar" src={r.avatar_url} alt="" />
                    ) : null}
                    {r.username ?? 'Player'}
                  </div>
                </td>
                <td>
  <div className="badges">
    {(r.statuses?.length ? r.statuses : []).map((s:string)=>(
      <span key={s} className={`badge badge-${s}`}>{s}</span>
    ))}
    {!r.statuses?.length && <span className="badge">—</span>}
  </div>
</td>
<td style={{ textAlign:'right' }}>{r.score}</td>

                <td style={{ textAlign: 'right' }}>{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
