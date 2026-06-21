"use client";

import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import SurfButton from "@/components/SurfButton";
import MemeArchive from "@/components/MemeArchive";
import { searchMeme, randomSurf, listArchives, SearchResponse, ArchiveSummary } from "@/lib/api";

const HOT_TAGS = ["鸡你太美", "电子榨菜", "i人e人", "显眼包", "遥遥领先"];

export default function Home() {
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [archives, setArchives] = useState<ArchiveSummary[]>([]);

  useEffect(() => {
    listArchives().then(setArchives).catch(() => {});
  }, []);

  const handleSearch = async (keyword: string) => {
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
  };

  const handleSurf = async () => {
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
  };

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
      {/* 标题 */}
      <header className="mb-12 text-center">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4">
          🔍 梗的起源、分析与二创
        </h1>
        <p className="text-xl italic text-gray-600 font-mono">
          &ldquo;每个梗背后，都是一个时代的情绪切片&rdquo;
        </p>
      </header>

      {/* 搜索栏 */}
      <div className="flex justify-center mb-8">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {/* 快捷入口 */}
      {!result && !error && (
        <div className="grid grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
          <SurfButton onSurf={handleSurf} isLoading={isLoading} />

          <button
            onClick={() => setShowArchive(!showArchive)}
            className="border-3 border-black bg-white p-6 text-center cursor-pointer
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
      )}

      {/* 档案列表面板 */}
      {showArchive && !result && !error && (
        <div className="max-w-2xl mx-auto mb-8 border-3 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-lg font-bold mb-4">📦 本地精选梗档案</h3>
          <div className="grid grid-cols-2 gap-3">
            {archives.map((a) => (
              <button
                key={a.keyword}
                onClick={() => handleSearch(a.keyword)}
                className="border-2 border-black p-3 text-left font-mono text-sm
                           hover:bg-meme-yellow transition-colors cursor-pointer"
              >
                <span className="font-bold">{a.keyword}</span>
                <p className="text-xs text-gray-500 mt-1 truncate">{a.origin}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 热门标签 */}
      {!result && !error && (
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
          {HOT_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleSearch(tag)}
              className="border-2 border-black px-2 py-0.5 text-xs font-mono bg-meme-yellow
                         hover:bg-meme-coral hover:text-white transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Loading 骨架 */}
      {isLoading && (
        <div className="max-w-2xl mx-auto mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-3 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-pulse"
            >
              <div className="h-4 bg-gray-200 w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-2xl mx-auto mt-8 border-3 border-black bg-black text-meme-yellow p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
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
      )}

      {/* 结果 */}
      {result && !isLoading && (
        <MemeArchive
          data={result}
          onSurf={handleSurf}
          onBack={() => setResult(null)}
        />
      )}
    </main>
  );
}
