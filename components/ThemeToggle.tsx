'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const stored = localStorage.getItem('theme');
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored ? stored === 'dark' : prefers;
    html.classList.toggle('dark', initial);
    setDark(initial);
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    const next = !dark;
    html.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  };

  return (
    <button className="btn" onClick={toggle} aria-label="Toggle theme">
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
