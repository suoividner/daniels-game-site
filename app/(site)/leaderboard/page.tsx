'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LeaderboardPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({});

  const load = async () => {
    // capture current ranks before fetching new data
    setPrevRanks(
      rows.reduce((acc, r, idx) => {
        acc[r.user_id] = idx + 1;
        return acc;
      }, {} as Record<string, number>)
    );
    const { data } = await supabase.rpc('public_leaderboard');
    setRows(data || []);
  };
  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card text-lg">
      <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
      <table className="table text-lg">
        <thead>
          <tr>
            <th>#</th>
            <th>Change</th>
            <th>Player</th>
            <th>Score</th>
            <th>Coins</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const rank = i + 1;
            const prev = prevRanks[r.user_id];
            const diff = prev ? prev - rank : 0;
            return (
              <tr
                key={r.user_id}
                className={
                  rank === 1
                    ? 'text-yellow-500 font-bold'
                    : rank === 2
                    ? 'text-gray-400'
                    : rank === 3
                    ? 'text-orange-400'
                    : ''
                }
              >
                <td>{rank}</td>
                <td>
                  {diff > 0 && <span className="text-green-500">↑</span>}
                  {diff < 0 && <span className="text-red-500">↓</span>}
                </td>
                <td>{r.username}</td>
                <td>{r.score}</td>
                <td>{r.coins}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
