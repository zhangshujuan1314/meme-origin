"use client";

import { useState } from "react";
import { SearchResponse } from "@/lib/api";

interface Props {
  data: SearchResponse;
  onSurf: () => void;
  onBack: () => void;
}

function formatTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export default function MemeArchive({ data, onSurf, onBack }: Props) {
  const { archive } = data;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}?q=${encodeURIComponent(data.keyword)}`;
    try { await navigator.clipboard.writeText(url); } catch {
      const ta = document.createElement("textarea"); ta.value = url;
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const scoreColor = archive.credibility_score >= 8 ? "text-meme-green" : archive.credibility_score >= 5 ? "text-meme-yellow" : "text-meme-red";

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between text-sm text-gray-400 px-1">
        <div className="flex items-center gap-1.5">
          <button onClick={onBack} className="hover:text-meme-coral cursor-pointer">🏠 首页</button>
          <span>›</span>
          <span className="text-gray-600">🔍 {data.keyword}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span>🍞 {formatTime()}</span>
          <button onClick={handleShare}
            className="px-2.5 py-1 border border-gray-200 rounded-full hover:bg-meme-yellow hover:border-meme-yellow transition-all cursor-pointer">
            {copied ? "✅ 已复制" : "📋 分享"}
          </button>
        </div>
      </div>

      {/* Title card */}
      <div className="card-lite animate-fade-in-up stagger-1">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{data.keyword}</h2>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end mb-1">
              {Array.from({length:10}, (_,i) => (
                <span key={i} className={`text-lg ${i < archive.credibility_score ? "text-meme-yellow" : "text-gray-200"}`}>
                  {i < archive.credibility_score ? "★" : "☆"}
                </span>
              ))}
            </div>
            <span className={`text-sm font-bold ${scoreColor}`}>{archive.credibility_score}/10</span>
          </div>
        </div>
      </div>

      {/* Origin */}
      <div className="card-lite animate-fade-in-up stagger-2">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">📌 起源</h3>
        <p className="text-sm leading-relaxed text-gray-700">{archive.origin}</p>
      </div>

      {/* Meaning */}
      <div className="card-lite animate-fade-in-up stagger-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">💬 含义</h3>
        <p className="text-sm leading-relaxed text-gray-700">{archive.meaning}</p>
      </div>

      {/* Variants */}
      {archive.variants.length > 0 && (
        <div className="card-lite animate-fade-in-up stagger-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">🔄 常见变体</h3>
          <div className="flex flex-wrap gap-2">
            {archive.variants.map((v,i) => (
              <span key={i} className="tag-pill cursor-default">{v}</span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="card-lite animate-fade-in-up stagger-5">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">📊 传播时间线</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">首次出现</span>
            <p className="font-bold mt-0.5">{archive.first_appeared}</p>
          </div>
          {archive.peak_popularity && (
            <div>
              <span className="text-gray-400">爆火峰值</span>
              <p className="font-bold mt-0.5">{archive.peak_popularity}</p>
            </div>
          )}
        </div>
        {archive.platforms.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {archive.platforms.map((p,i) => (
              <span key={i} className="tag-pill cursor-default">{p}</span>
            ))}
          </div>
        )}
      </div>

      {/* Sources */}
      {archive.sources.length > 0 && (
        <div className="card-lite animate-fade-in-up stagger-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">📎 信息来源</h3>
          <div className="space-y-2">
            {archive.sources.map((s,i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-md border border-gray-100 hover:border-meme-yellow hover:bg-meme-gray transition-all text-sm group">
                <span className="text-xs font-bold bg-meme-gray px-2 py-0.5 rounded-full border border-gray-200">{s.platform}</span>
                <span className="flex-1 text-gray-700 truncate">{s.title}</span>
                <span className="text-gray-300 group-hover:text-meme-yellow transition-colors">↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-center pt-2 pb-8">
        <button onClick={onBack}
          className="px-6 py-3 text-sm font-bold border border-gray-200 rounded-md hover:border-meme-yellow hover:bg-meme-gray transition-all cursor-pointer">
          🔙 返回首页
        </button>
        <button onClick={onSurf}
          className="btn-yellow px-6 py-3 text-sm">
          🎲 随机冲浪下一个
        </button>
      </div>
    </div>
  );
}
