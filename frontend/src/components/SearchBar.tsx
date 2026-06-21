"use client";

import { useState, FormEvent } from "react";

interface Props {
  onSearch: (keyword: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: Props) {
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed) onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-0 w-full max-w-2xl">
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="输入一个梗的关键词..."
        className="flex-1 border-3 border-black px-4 py-3 font-mono bg-white text-lg
                   focus:outline-hidden focus:ring-4 focus:ring-meme-yellow"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !keyword.trim()}
        className="border-3 border-black px-6 py-3 font-bold uppercase
                   bg-meme-yellow text-black
                   shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                   hover:shadow-[-3px_-3px_0px_0px_rgba(0,0,0,1)]
                   active:shadow-none active:translate-x-[1px] active:translate-y-[1px]
                   transition-all disabled:opacity-50 disabled:cursor-not-allowed
                   whitespace-nowrap cursor-pointer"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            侦探中...
          </span>
        ) : (
          "🔍 侦探模式"
        )}
      </button>
    </form>
  );
}
