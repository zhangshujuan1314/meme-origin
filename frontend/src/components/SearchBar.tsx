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
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export default function SearchBar({ onSearch, isLoading }: Props) {
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addToHistory = (kw: string) => {
    const updated = [kw, ...history.filter((h) => h !== kw)].slice(0, MAX_HISTORY);
    setHistory(updated);
    saveHistory(updated);
  };

  const removeFromHistory = (kw: string) => {
    const updated = history.filter((h) => h !== kw);
    setHistory(updated);
    saveHistory(updated);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
    setShowHistory(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;
    addToHistory(trimmed);
    setShowHistory(false);
    onSearch(trimmed);
  };

  const handleHistoryClick = (kw: string) => {
    setKeyword(kw);
    addToHistory(kw);
    setShowHistory(false);
    onSearch(kw);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex gap-0 w-full">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => history.length > 0 && setShowHistory(true)}
          placeholder="输入一个梗的关键词..."
          className="flex-1 border-3 border-black px-5 py-4 font-mono bg-white text-lg
                     focus:outline-hidden focus:ring-4 focus:ring-meme-yellow"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !keyword.trim()}
          className="border-3 border-black border-l-0 px-6 py-4 font-bold uppercase
                     bg-meme-yellow text-black text-lg
                     shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                     hover:shadow-[-3px_-3px_0px_0px_rgba(0,0,0,1)]
                     active:shadow-none active:translate-x-[1px] active:translate-y-[1px]
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     whitespace-nowrap cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              侦探中...
            </span>
          ) : (
            "🔍 侦探模式"
          )}
        </button>
      </form>

      {/* Search History Dropdown */}
      {showHistory && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 border-3 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
          <div className="flex items-center justify-between px-4 py-2 border-b-2 border-black">
            <span className="text-xs font-mono text-gray-500">最近搜索</span>
            <button
              onClick={clearHistory}
              className="text-xs font-mono text-meme-coral hover:underline cursor-pointer"
            >
              清除全部
            </button>
          </div>
          {history.map((h) => (
            <div
              key={h}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-meme-yellow/30 transition-colors cursor-pointer"
            >
              <button
                onClick={() => handleHistoryClick(h)}
                className="flex-1 text-left font-mono text-sm"
              >
                🕐 {h}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromHistory(h);
                }}
                className="text-gray-400 hover:text-meme-coral ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
