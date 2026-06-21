interface Props {
  onSurf: () => void;
  isLoading: boolean;
}

export default function SurfButton({ onSurf, isLoading }: Props) {
  return (
    <button
      onClick={onSurf}
      disabled={isLoading}
      className="card-lite w-full h-full flex flex-col items-center justify-center text-center cursor-pointer
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="text-3xl mb-2">🎲</span>
      <p className="font-bold text-base">随机冲浪</p>
      <p className="text-sm text-gray-400 mt-1">
        {isLoading ? "正在抓取..." : "不知道搜什么？点我"}
      </p>
    </button>
  );
}
