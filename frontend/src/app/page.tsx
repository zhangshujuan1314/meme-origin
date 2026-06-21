"use client";

import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import SurfButton from "@/components/SurfButton";
import MemeArchive from "@/components/MemeArchive";
import { searchMeme, randomSurf, listArchives, SearchResponse, ArchiveSummary } from "@/lib/api";

const HOT_TAGS = ["鸡你太美", "电子榨菜", "i人e人", "显眼包", "遥遥领先", "吗喽", "尊嘟假嘟"];

const LOADING_TEXTS = [
  "正在深挖互联网的每一个角落...",
  "翻遍了B站、贴吧、微博...",
  "询问 AI 老司机中...",
  "梗文化考古中，请稍候...",
  "已找到线索，正在整理档案...",
];

export default function Home() {
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [archives, setArchives] = useState<ArchiveSummary[]>([]);
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  const [hotPicks, setHotPicks] = useState<ArchiveSummary[]>([]);

  useEffect(() => {
    listArchives().then(data => {
      setArchives(data);
      setHotPicks([...data].sort(() => Math.random() - 0.5).slice(0, 3));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % LOADING_TEXTS.length; setLoadingText(LOADING_TEXTS[i]); }, 2000);
    setLoadingText(LOADING_TEXTS[0]);
    return () => clearInterval(t);
  }, [isLoading]);

  const handleSearch = useCallback(async (keyword: string) => {
    setIsLoading(true); setError(null); setShowArchive(false);
    try { setResult(await searchMeme(keyword)); } catch (e) {
      setError(e instanceof Error ? e.message : "搜索失败"); setResult(null);
    } finally { setIsLoading(false); }
  }, []);

  const handleSurf = useCallback(async () => {
    setIsLoading(true); setError(null); setShowArchive(false);
    try { setResult(await randomSurf()); } catch (e) {
      setError(e instanceof Error ? e.message : "冲浪失败"); setResult(null);
    } finally { setIsLoading(false); }
  }, []);

  /* ── Result / Error view ── */
  if (result || error) {
    return (
      <main className="relative z-10 min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
        {error ? (
          <div className="max-w-2xl mx-auto mt-20 bg-white border border-red-200 rounded-md p-8 text-center shadow-sm animate-shake">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-lg font-bold mb-2">搜索失败</p>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button onClick={() => setError(null)} className="btn-yellow px-8 py-3">重试</button>
          </div>
        ) : result ? (
          <MemeArchive data={result} onSurf={handleSurf} onBack={() => setResult(null)} />
        ) : null}
      </main>
    );
  }

  /* ── Home view ── */
  return (
    <main className="relative z-10 min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
      {/* Header */}
      <header className="text-center mb-10 animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
          🔍 梗的起源、分析与二创
        </h1>
        <p className="text-base text-gray-400">
          每个梗背后，都是一个时代的情绪切片
        </p>
      </header>

      {/* Search */}
      <div className="flex justify-center mb-5 animate-fade-in-up stagger-1">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="max-w-2xl mx-auto mt-8 text-center">
          <div className="inline-block bg-meme-yellow/10 border border-meme-yellow/20 rounded-full px-6 py-2.5 text-sm text-meme-yellow animate-typewriter mb-8">
            {loadingText}
          </div>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white border border-gray-100 rounded-md p-5 shadow-sm">
                <div className="flex gap-3 animate-pulse">
                  <div className="h-3 bg-gray-100 w-1/4 rounded" />
                  <div className="h-3 bg-gray-50 flex-1 rounded" />
                </div>
                <div className="mt-3 h-2.5 bg-gray-50 w-full rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Hot tags */}
          <div className="text-center mb-8 animate-fade-in-up stagger-1">
            <p className="text-xs text-gray-300 mb-3 tracking-wide uppercase">热门搜索</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {HOT_TAGS.map(tag => (
                <button key={tag} onClick={() => handleSearch(tag)} className="tag-pill">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up stagger-2">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowArchive(!showArchive)}
                className="card-lite flex flex-col items-center justify-center text-center cursor-pointer">
                <span className="text-3xl mb-2">📦</span>
                <p className="font-bold text-base">梗档案库</p>
                <p className="text-sm text-gray-400 mt-1">精选 {archives.length || 8} 条</p>
              </button>
              <SurfButton onSurf={handleSurf} isLoading={isLoading} />
            </div>
          </div>

          {/* Archive panel */}
          {showArchive && (
            <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">📦 本地精选梗档案</h3>
                <button onClick={() => setShowArchive(false)}
                  className="text-xs text-gray-300 hover:text-meme-coral cursor-pointer">✕ 收起</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {archives.map(a => (
                  <button key={a.keyword} onClick={() => handleSearch(a.keyword)}
                    className="card-lite text-left cursor-pointer">
                    <p className="font-bold text-sm mb-1">{a.keyword}</p>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{a.origin}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hot picks */}
          {hotPicks.length > 0 && (
            <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up stagger-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide text-center mb-4">📊 今日推荐</h3>
              <div className="grid grid-cols-3 gap-3">
                {hotPicks.map((pick, i) => (
                  <button key={pick.keyword} onClick={() => handleSearch(pick.keyword)}
                    className="card-lite text-center cursor-pointer">
                    <span className="text-xs text-gray-300">#{i + 1}</span>
                    <p className="font-bold mt-1">{pick.keyword}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{pick.origin}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <footer className="text-center mt-12 mb-6 animate-fade-in-up">
        <div className="text-xs text-gray-300 space-y-1">
          <p>梗的起源、分析与二创</p>
          <a href="https://github.com/zhangshujuan1314/meme-origin"
            target="_blank" rel="noopener noreferrer"
            className="text-gray-400 hover:text-meme-yellow transition-colors">
            GitHub ↗
          </a>
        </div>
      </footer>
    </main>
  );
}
