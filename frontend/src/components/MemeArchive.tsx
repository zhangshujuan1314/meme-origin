import { SearchResponse } from "@/lib/api";

interface Props {
  data: SearchResponse;
  onSurf: () => void;
  onBack: () => void;
}

function CredStars(score: number) {
  return "★".repeat(score) + "☆".repeat(10 - score);
}

const cardClass =
  "border-3 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";

export default function MemeArchive({ data, onSurf, onBack }: Props) {
  const { archive } = data;

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-6">
      {/* 标题栏 */}
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black">🔍 {data.keyword}</h2>
          <div className="text-right">
            <p className="font-mono text-sm text-gray-500">可信度</p>
            <p className="font-mono text-lg font-bold text-meme-coral">
              {CredStars(archive.credibility_score)}
            </p>
            <p className="font-mono text-xs text-gray-400">
              {archive.credibility_score}/10
            </p>
          </div>
        </div>
      </div>

      {/* 起源 */}
      <div className={cardClass}>
        <h3 className="text-xl font-bold mb-3">📌 起源</h3>
        <p className="font-mono leading-relaxed">{archive.origin}</p>
      </div>

      {/* 含义 */}
      <div className={cardClass}>
        <h3 className="text-xl font-bold mb-3">💬 含义</h3>
        <p className="font-mono leading-relaxed">{archive.meaning}</p>
      </div>

      {/* 变体 */}
      {archive.variants.length > 0 && (
        <div className={cardClass}>
          <h3 className="text-xl font-bold mb-3">🔄 常见变体</h3>
          <div className="flex flex-wrap gap-2">
            {archive.variants.map((v, i) => (
              <span
                key={i}
                className="border-2 border-black px-2 py-0.5 text-xs font-mono bg-meme-yellow"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 传播时间线 */}
      <div className={cardClass}>
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
                className="border-2 border-black px-2 py-0.5 text-xs font-mono bg-meme-yellow mr-1"
              >
                {p}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* 信息来源 */}
      {archive.sources.length > 0 && (
        <div className={cardClass}>
          <h3 className="text-xl font-bold mb-3">📎 信息来源（可点击跳转）</h3>
          <div className="space-y-2">
            {archive.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-2 border-black p-3 font-mono text-sm
                           hover:bg-meme-yellow transition-colors"
              >
                <span className="border-2 border-black px-2 py-0.5 text-xs font-mono bg-meme-yellow mr-2">
                  {s.platform}
                </span>
                {s.title}
                <span className="float-right">→</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <div className="flex gap-4 justify-center pt-4">
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
