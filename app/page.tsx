'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Row {
  user_id: string;
  username: string;
  score: number;
  avatar_url?: string | null;
}

export default function HomePage() {
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    const { data } = await supabase.rpc('public_leaderboard');
    const ids = (data || []).map((r: any) => r.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .in('id', ids);
    const avatarMap = new Map((profiles || []).map((p: any) => [p.id, p.avatar_url]));
    setRows((data || []).map((r: any) => ({ ...r, avatar_url: avatarMap.get(r.user_id) })));
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
      <table className="table">
        <thead>
          <tr><th>#</th><th>Player</th><th>Score</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.user_id}>
              <td>{i + 1}</td>
              <td className="flex items-center gap-2">
                {r.avatar_url && <img src={r.avatar_url} alt="" className="w-6 h-6 rounded-full" />}
                {r.username}
              </td>
              <td>{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
