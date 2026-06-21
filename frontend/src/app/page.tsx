"use client";

import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import SurfButton from "@/components/SurfButton";
import MemeArchive from "@/components/MemeArchive";
import { searchMeme, randomSurf, listArchives, SearchResponse, ArchiveSummary } from "@/lib/api";

const HOT_TAGS = ["鸡你太美", "电子榨菜", "i人e人", "显眼包", "遥遥领先"];

const LOADING_TEXTS = [
  "正在深挖互联网的每一个角落...",
  "翻遍了B站、贴吧、微博...",
  "询问 AI 老司机中...",
  "梗文化考古中，请稍候...",
  "已找到线索，正在整理档案...",
  "正在分析这个梗的前世今生...",
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
    listArchives()
      .then((data) => {
        setArchives(data);
        // 随机选 3 条作为今日推荐
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setHotPicks(shuffled.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  // Loading 文字轮播
  useEffect(() => {
    if (!isLoading) return;
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % LOADING_TEXTS.length;
      setLoadingText(LOADING_TEXTS[i]);
    }, 2000);
    setLoadingText(LOADING_TEXTS[0]);
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleSearch = useCallback(async (keyword: string) => {
    setIsLoading(true);
    setError(null);
    setShowArchive(false);
    try {
      const data = await searchMeme(keyword);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "搜索失败");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSurf = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setShowArchive(false);
    try {
      const data = await randomSurf();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "冲浪失败");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 结果页或错误页
  if (result || error) {
    return (
      <main className="relative z-10 min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
        {error ? (
          <div className="max-w-2xl mx-auto mt-20 border-3 border-black bg-black text-meme-yellow p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-shake">
            <p className="text-lg font-bold mb-2">⚠️ 搜索失败</p>
            <p className="font-mono">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 border-3 border-meme-yellow px-6 py-3 font-bold uppercase bg-meme-yellow text-black cursor-pointer
                         shadow-[3px_3px_0px_0px_rgba(255,215,0,1)]
                         hover:shadow-[-3px_-3px_0px_0px_rgba(255,215,0,1)]
                         active:shadow-none active:translate-x-[1px] active:translate-y-[1px]
                         transition-all"
            >
              重试
            </button>
          </div>
        ) : result ? (
          <MemeArchive data={result} onSurf={handleSurf} onBack={() => setResult(null)} />
        ) : null}
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
      {/* 标题 */}
      <header className="mb-10 text-center animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4">
          🔍 梗的起源、分析与二创
        </h1>
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-meme-yellow text-xl">━━</span>
          <span className="text-meme-coral text-xl">◆</span>
          <span className="text-meme-yellow text-xl">━━</span>
        </div>
        <p className="text-xl italic text-gray-600 font-mono">
          &ldquo;每个梗背后，都是一个时代的情绪切片&rdquo;
        </p>
      </header>

      {/* 搜索栏 */}
      <div className="flex justify-center mb-4 animate-fade-in-up stagger-1">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {/* Loading 状态 */}
      {isLoading && (
        <div className="max-w-2xl mx-auto mt-6 mb-8 text-center">
          <div className="inline-block border-3 border-black bg-meme-yellow px-6 py-3 font-mono text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-typewriter">
            {loadingText}
          </div>
          <div className="mt-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-3 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex gap-3 animate-pulse">
                  <div className="h-4 bg-gray-200 w-1/4" />
                  <div className="h-4 bg-gray-100 flex-1" />
                  <div className="h-4 bg-gray-100 w-1/6" />
                </div>
                <div className="mt-3 h-3 bg-gray-100 w-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 非 loading 时显示首页内容 */}
      {!isLoading && (
        <>
          {/* 热门标签引导 */}
          <div className="text-center mb-3 animate-fade-in-up stagger-1">
            <p className="text-sm font-mono text-gray-400 mb-2">↓ 试试这些热门梗 ↓</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {HOT_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleSearch(tag)}
                  className="border-2 border-black px-3 py-1.5 text-sm font-mono bg-meme-yellow
                             hover:bg-meme-coral hover:text-white transition-colors cursor-pointer
                             hover:-translate-y-[2px] active:translate-y-0"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up stagger-2">
            <div className="flex gap-4">
              <div className="flex-[2]">
                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className="w-full border-3 border-black bg-white p-6 text-center cursor-pointer h-full
                             shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                             hover:shadow-[-4px_-4px_0px_0px_rgba(0,0,0,1)]
                             hover:-translate-x-[2px] hover:-translate-y-[2px]
                             transition-all"
                >
                  <span className="text-2xl">📦</span>
                  <p className="font-bold mt-2">梗档案库</p>
                  <p className="text-sm text-gray-500 font-mono">本地精选 {archives.length || 8} 条</p>
                </button>
              </div>
              <div className="flex-[3]">
                <SurfButton onSurf={handleSurf} isLoading={isLoading} />
              </div>
            </div>
          </div>

          {/* 档案列表面板 */}
          {showArchive && (
            <div className="max-w-2xl mx-auto mb-8 border-3 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">📦 本地精选梗档案</h3>
                <button
                  onClick={() => setShowArchive(false)}
                  className="text-gray-400 hover:text-meme-coral font-mono text-sm cursor-pointer"
                >
                  ✕ 收起
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {archives.map((a) => (
                  <button
                    key={a.keyword}
                    onClick={() => handleSearch(a.keyword)}
                    className="border-2 border-black p-3 text-left font-mono text-sm
                               hover:bg-meme-yellow transition-colors cursor-pointer
                               hover:-translate-y-[1px] active:translate-y-0"
                  >
                    <span className="font-bold">{a.keyword}</span>
                    <p className="text-xs text-gray-500 mt-1 truncate">{a.origin}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 今日梗热榜 */}
          {hotPicks.length > 0 && (
            <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up stagger-3">
              <h3 className="text-sm font-mono text-gray-400 mb-3 text-center">📊 今日梗热榜</h3>
              <div className="grid grid-cols-3 gap-3">
                {hotPicks.map((pick, i) => (
                  <button
                    key={pick.keyword}
                    onClick={() => handleSearch(pick.keyword)}
                    className="border-2 border-black bg-white p-4 text-center cursor-pointer
                               shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                               hover:shadow-[-2px_-2px_0px_0px_rgba(0,0,0,1)]
                               hover:-translate-x-[1px] hover:-translate-y-[1px]
                               transition-all"
                  >
                    <span className="text-xs font-mono text-gray-400">#{i + 1}</span>
                    <p className="font-bold mt-1">{pick.keyword}</p>
                    <p className="text-xs text-gray-400 font-mono truncate mt-1">{pick.origin}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <footer className="text-center mt-16 mb-6 animate-fade-in-up">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-gray-300 text-sm">━━━━━━━━</span>
          <span className="text-gray-400 text-xs">🔍</span>
          <span className="text-gray-300 text-sm">━━━━━━━━</span>
        </div>
        <p className="text-sm font-mono text-gray-400">
          梗的起源、分析与二创
        </p>
        <p className="text-xs font-mono text-gray-300 mb-2">
          每个梗背后，都是一个时代的情绪切片
        </p>
        <a
          href="https://github.com/zhangshujuan1314/meme-origin"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-gray-400 hover:text-meme-coral hover:underline transition-colors"
        >
          Made with ❤️ | GitHub ↗
        </a>
      </footer>
    </main>
  );
}
