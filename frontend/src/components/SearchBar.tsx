"use client";

import { useState, useEffect, useRef, FormEvent } from "react";

interface Props {
  onSearch: (keyword: string) => void;
  isLoading: boolean;
}

const HISTORY_KEY = "meme-search-history";
const MAX_HISTORY = 6;

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(h: string[]) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }

export default function SearchBar({ onSearch, isLoading }: Props) {
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowHistory(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addToHistory = (kw: string) => {
    const u = [kw, ...history.filter(h => h !== kw)].slice(0, MAX_HISTORY);
    setHistory(u); saveHistory(u);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = keyword.trim();
    if (!t) return;
    addToHistory(t); setShowHistory(false); onSearch(t);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex gap-0 w-full search-card">
        <input
          type="text"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onFocus={() => history.length > 0 && setShowHistory(true)}
          placeholder="输入一个梗的关键词..."
          className="flex-1 px-5 py-4 font-mono text-base bg-transparent border-none
                     outline-hidden rounded-l-md"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !keyword.trim()}
          className="btn-yellow px-6 py-4 text-base uppercase whitespace-nowrap
                     disabled:opacity-50 disabled:cursor-not-allowed rounded-r-md"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              侦探中...
            </span>
          ) : ("🔍 侦探模式")}
        </button>
      </form>

      {showHistory && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <span className="text-xs text-gray-400">最近搜索</span>
            <button onClick={() => { setHistory([]); saveHistory([]); setShowHistory(false); }}
              className="text-xs text-meme-coral hover:underline cursor-pointer">清除全部</button>
          </div>
          {history.map(h => (
            <div key={h} className="flex items-center justify-between px-4 py-2.5 hover:bg-meme-gray transition-colors cursor-pointer">
              <button onClick={() => { setKeyword(h); addToHistory(h); setShowHistory(false); onSearch(h); }}
                className="flex-1 text-left text-sm">🕐 {h}</button>
              <button onClick={e => { e.stopPropagation(); const u = history.filter(x => x !== h); setHistory(u); saveHistory(u); }}
                className="text-gray-300 hover:text-meme-coral ml-2 cursor-pointer">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
