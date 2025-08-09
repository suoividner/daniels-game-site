'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Activity {
  id: number;
  description: string;
  created_at: string;
  type: string;
}

export default function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([]);

  async function load() {
    const { data } = await supabase
      .from('activity_log')
      .select('id, description, created_at, type')
      .neq('type', 'purchase')
      .order('created_at', { ascending: false })
      .limit(10);

    setActivities((data as Activity[]) || []);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel('rt-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      <table className="table">
        <tbody>
          {activities.map((a) => (
            <tr key={a.id}>
              <td>{a.description}</td>
              <td style={{ textAlign: 'right', color: 'var(--muted)' }}>
                {new Date(a.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
          {activities.length === 0 && (
            <tr>
              <td colSpan={2} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                No activity yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

