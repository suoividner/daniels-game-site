'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Row = {
  user_id: string;
  username: string;
  score: number;
  coins: number;
  change?: number;
};

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    const { data } = await supabase.rpc('public_leaderboard');
    const prev = JSON.parse(localStorage.getItem('lb-prev') || '{}');
    const withChange = (data as Row[] || []).map((r, i) => {
      const prevPos = prev[r.user_id];
      return { ...r, change: prevPos ? prevPos - (i + 1) : 0 };
    });
    const map: Record<string, number> = {};
    withChange.forEach((r, i) => { map[r.user_id] = i + 1; });
    localStorage.setItem('lb-prev', JSON.stringify(map));
    setRows(withChange);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
      <table className="table table--lb text-lg">
        <thead>
          <tr>
            <th>#</th>
            <th>Δ</th>
            <th>Player</th>
            <th>Score</th>
            <th>Coins</th>
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
              <td>{i + 1}</td>
              <td>
                {r.change > 0 ? (
                  <span className="text-green-500">▲</span>
                ) : r.change < 0 ? (
                  <span className="text-red-500">▼</span>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </td>
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
