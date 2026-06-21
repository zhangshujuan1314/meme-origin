"use client";

import { useState } from "react";
import { SearchResponse } from "@/lib/api";

interface Props {
  data: SearchResponse;
  onSurf: () => void;
  onBack: () => void;
}

function CredStars(score: number) {
  return (
    <span>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={i < score ? "text-meme-yellow" : "text-gray-300"}>
          {i < score ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function CredColor(score: number) {
  if (score >= 8) return "text-meme-green";
  if (score >= 5) return "text-meme-yellow";
  return "text-meme-red";
}

function formatTime() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

const cardClass =
  "border-3 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-fade-in-up";

export default function MemeArchive({ data, onSurf, onBack }: Props) {
  const { archive } = data;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}?q=${encodeURIComponent(data.keyword)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-5">
      {/* 面包屑 + 时间戳 */}
      <div className="flex items-center justify-between text-sm font-mono text-gray-500">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="hover:text-meme-coral hover:underline cursor-pointer">
            🏠 首页
          </button>
          <span>→</span>
          <span>🔍 搜索结果：{data.keyword}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>🍞 新鲜出炉 {formatTime()}</span>
          <button
            onClick={handleShare}
            className="border-2 border-black px-2 py-1 text-xs hover:bg-meme-yellow transition-colors cursor-pointer"
          >
            {copied ? "✅ 已复制！" : "📋 分享"}
          </button>
        </div>
      </div>

      {/* 标题栏 */}
      <div className={`${cardClass} stagger-1 ${archive.credibility_score >= 8 ? "credibility-high" : ""}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black">🔍 {data.keyword}</h2>
          <div className="text-right">
            <p className="font-mono text-sm text-gray-500">可信度</p>
            <p className="font-mono text-2xl font-bold">
              {CredStars(archive.credibility_score)}
            </p>
            <p className={`font-mono text-sm font-bold ${CredColor(archive.credibility_score)}`}>
              {archive.credibility_score}/10
            </p>
          </div>
        </div>
      </div>

      {/* 起源 */}
      <div className={`${cardClass} stagger-2`}>
        <h3 className="text-xl font-bold mb-3">📌 起源</h3>
        <p className="font-mono leading-relaxed">{archive.origin}</p>
      </div>

      {/* 含义 */}
      <div className={`${cardClass} stagger-3`}>
        <h3 className="text-xl font-bold mb-3">💬 含义</h3>
        <p className="font-mono leading-relaxed">{archive.meaning}</p>
      </div>

      {/* 变体 */}
      {archive.variants.length > 0 && (
        <div className={`${cardClass} stagger-4`}>
          <h3 className="text-xl font-bold mb-3">🔄 常见变体</h3>
          <div className="flex flex-wrap gap-2">
            {archive.variants.map((v, i) => (
              <span
                key={i}
                className={`border-2 border-black px-3 py-1 text-sm font-mono bg-meme-yellow inline-block ${
                  i % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"
                }`}
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 传播时间线 */}
      <div className={`${cardClass} stagger-5`}>
        <h3 className="text-xl font-bold mb-3">📊 传播时间线</h3>
        <div className="font-mono space-y-2">
          <p>
            首次出现: <strong>{archive.first_appeared}</strong>
          </p>
          {archive.peak_popularity && (
            <p>
              爆火峰值: <strong>{archive.peak_popularity}</strong>
            </p>
          )}
          <p>
            传播平台:{" "}
            {archive.platforms.map((p, i) => (
              <span
                key={i}
                className={`border-2 border-black px-2 py-0.5 text-xs font-mono bg-meme-yellow mr-1 inline-block ${
                  i % 2 === 0 ? "rotate-[-0.5deg]" : "rotate-[0.5deg]"
                }`}
              >
                {p}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* 信息来源 */}
      {archive.sources.length > 0 && (
        <div className={`${cardClass} stagger-6`}>
          <h3 className="text-xl font-bold mb-3">📎 信息来源（可点击跳转）</h3>
          <div className="space-y-2">
            {archive.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-2 border-black p-3 font-mono text-sm
                           hover:bg-meme-yellow transition-colors group"
              >
                <span className="border-2 border-black px-2 py-0.5 text-xs font-mono bg-meme-yellow mr-2">
                  {s.platform}
                </span>
                {s.title}
                <span className="float-right opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <div className="flex gap-4 justify-center pt-4 pb-8">
        <button
          onClick={onBack}
          className="border-3 border-black px-6 py-3 font-bold uppercase bg-white cursor-pointer
                     shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                     hover:shadow-[-3px_-3px_0px_0px_rgba(0,0,0,1)]
                     active:shadow-none active:translate-x-[1px] active:translate-y-[1px]
                     transition-all"
        >
          🔙 返回首页
        </button>
        <button
          onClick={onSurf}
          className="border-3 border-black px-6 py-3 font-bold uppercase bg-meme-coral text-white cursor-pointer
                     shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                     hover:shadow-[-3px_-3px_0px_0px_rgba(0,0,0,1)]
                     active:shadow-none active:translate-x-[1px] active:translate-y-[1px]
                     transition-all"
        >
          🎲 随机冲浪下一个
        </button>
      </div>
    </div>
  );
}
