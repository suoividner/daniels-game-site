'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LeaderboardPage() {
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.rpc('public_leaderboard');
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
      <table className="table">
        <thead><tr><th>#</th><th>Player</th><th>Score</th><th>Coins</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.user_id}>
              <td>{i+1}</td>
              <td>{r.username}</td>
              <td>{r.score}</td>
              <td>{r.coins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
