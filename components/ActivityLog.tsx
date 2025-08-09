'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Activity = {
  id: number;
  created_at: string;
  description: string;
  type?: string;
};

export default function ActivityLog() {
  const [rows, setRows] = useState<Activity[]>([]);

  async function load() {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .neq('type', 'purchase')
      .order('created_at', { ascending: false })
      .limit(20);
    setRows((data as Activity[]) || []);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel('rt-activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
      {rows.length === 0 ? (
        <div className="text-slate-400">No recent activity.</div>
      ) : (
        <ul className="grid gap-2">
          {rows.map((r) => (
            <li key={r.id} className="row justify-between">
              <span>{r.description}</span>
              <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

