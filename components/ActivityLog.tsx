'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ActivityLog() {
  const [log, setLog] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;

    supabase.from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) console.error(error);
        if (alive && data) setLog(data);
      });

    const ch = supabase
      .channel('activity-log')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        (payload) => setLog((prev) => [payload.new, ...prev].slice(0, 50))
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      <ul className="space-y-2">
        {log.map((e) => (
          <li key={e.id}>
            <span className="font-medium">{e.kind}</span>{' '}
            <span className="opacity-70">
              {new Date(e.created_at).toLocaleString()}
            </span>
          </li>
        ))}
        {log.length === 0 && <li className="opacity-70">No activity yet.</li>}
      </ul>
    </div>
  );
}
