const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Source {
  title: string;
  url: string;
  platform: string;
}

export interface MemeArchive {
  origin: string;
  meaning: string;
  variants: string[];
  credibility_score: number;
  first_appeared: string;
  peak_popularity: string;
  platforms: string[];
  sources: Source[];
}

export interface SearchResponse {
  keyword: string;
  archive: MemeArchive;
  raw_snippets: string[];
}

export async function searchMeme(keyword: string): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "搜索失败" }));
    throw new Error(err.detail || `搜索失败 (${res.status})`);
  }

  return res.json();
}

export async function randomSurf(): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/api/surf`);

  if (!res.ok) {
    throw new Error("随机冲浪失败，请稍后重试");
  }

  return res.json();
}
