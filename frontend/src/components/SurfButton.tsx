interface Props {
  onSurf: () => void;
  isLoading: boolean;
}

export default function SurfButton({ onSurf, isLoading }: Props) {
  return (
    <button
      onClick={onSurf}
      disabled={isLoading}
      className="border-3 border-black bg-white p-6 text-center cursor-pointer
                 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                 hover:shadow-[-4px_-4px_0px_0px_rgba(0,0,0,1)]
                 hover:-translate-x-[2px] hover:-translate-y-[2px]
                 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="text-2xl">🎲</span>
      <p className="font-bold mt-2">随机冲浪</p>
      <p className="text-sm text-gray-500 font-mono">
        {isLoading ? "正在抓取..." : "不知道搜什么？点我"}
      </p>
    </button>
  );
}
