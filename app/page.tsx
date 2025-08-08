'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

type Row = { user_id:string; username:string; avatar_url:string; score:number };

export default function HomePage() {
  const [rows, setRows] = useState<Row[]>([]);

  async function load() {
    const { data, error } = await supabase.rpc('public_leaderboard');
    if (!error) setRows(data || []);
  }

  useEffect(() => {
    load();
    // realtime: listen to score inserts/updates
    const ch = supabase.channel('scores-rt')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'scores' }, load)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'scores' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
      <table className="table table--lb">
        <thead><tr><th>#</th><th>Player</th><th>Score</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={r.user_id}>
              <td>{i+1}</td>
              <td>
                <div className="row">
                  <img className="avatar" src={r.avatar_url || '/favicon.ico'} alt="" />
                  <span>{r.username}</span>
                </div>
              </td>
              <td>{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
