# 梗的起源、分析与二创 — MVP 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task.

**Goal:** 构建 MVP 版梗文化搜索分析应用：梗侦探（联网搜索 + AI 整理）+ 随机冲浪

**Architecture:** Next.js 14 App Router 前端调用 FastAPI 后端，后端通过 Exa + 萌娘百科搜索后将原始网页片段交由 DeepSeek 整理为结构化梗档案

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, FastAPI (Python 3.11), DeepSeek API, Exa API

---

## 阶段 1：项目脚手架

### Task 1: 初始化 FastAPI 后端

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`

**Step 1: 创建 requirements.txt**

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
httpx==0.28.1
pydantic==2.10.3
python-dotenv==1.0.1
beautifulsoup4==4.12.3
lxml==5.3.0
```

**Step 2: 创建 FastAPI 最小应用入口**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="梗起源 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

**Step 3: 验证启动**

```bash
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000
# 验证: curl http://localhost:8000/health → {"status":"ok"}
```

**Step 4: Commit**

```bash
git add backend/ && git commit -m "feat: init FastAPI backend scaffold"
```

---

### Task 2: 初始化 Next.js 前端

**Files:**
- Run: `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`

**Step 1: 执行脚手架命令**

```bash
cd meme-origin && npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

**Step 2: 验证启动**

```bash
cd frontend && npm run dev
# 浏览器打开 http://localhost:3000 → Next.js 默认首页
```

**Step 3: Commit**

```bash
git add frontend/ && git commit -m "feat: init Next.js frontend scaffold"
```

---

## 阶段 2：后端核心

### Task 3: Pydantic 数据模型

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/meme.py`

**Step 1: 定义数据模型**

```python
# backend/app/models/meme.py
from pydantic import BaseModel, Field


class Source(BaseModel):
    title: str = Field(..., description="来源标题")
    url: str = Field(..., description="来源链接")
    platform: str = Field(..., description="来源平台")


class MemeArchive(BaseModel):
    origin: str = Field(..., description="梗的起源")
    meaning: str = Field(..., description="梗的核心含义")
    variants: list[str] = Field(default_factory=list, description="常见变体")
    credibility_score: int = Field(..., ge=1, le=10, description="可信度评分1-10")
    first_appeared: str = Field(..., description="首次出现时间")
    peak_popularity: str = Field(default="", description="爆火峰值时间")
    platforms: list[str] = Field(default_factory=list, description="传播平台")
    sources: list[Source] = Field(default_factory=list, description="信息来源列表")


class SearchRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=100, description="搜索关键词")


class SearchResponse(BaseModel):
    keyword: str
    archive: MemeArchive
    raw_snippets: list[str] = Field(default_factory=list, description="原始搜索片段")
```

**Step 2: 写测试**

```python
# backend/tests/test_models.py
from app.models.meme import SearchRequest, MemeArchive, Source


def test_search_request_valid():
    req = SearchRequest(keyword="鸡你太美")
    assert req.keyword == "鸡你太美"


def test_search_request_empty_keyword_rejected():
    from pydantic import ValidationError
    try:
        SearchRequest(keyword="")
        assert False, "Should have raised"
    except ValidationError:
        pass


def test_meme_archive_all_fields():
    archive = MemeArchive(
        origin="测试起源",
        meaning="测试含义",
        variants=["变体1", "变体2"],
        credibility_score=8,
        first_appeared="2024 Q1",
        peak_popularity="2024 Q3",
        platforms=["B站", "抖音"],
        sources=[Source(title="测试来源", url="https://test.com", platform="B站")]
    )
    assert archive.credibility_score == 8
    assert len(archive.variants) == 2
```

**Step 3: 运行测试验证失败（模型还未导入到测试环境）**

```bash
cd backend && python -m pytest tests/test_models.py -v
# 预期: ImportError 或模块未找到（需先装依赖）
```

**Step 4: Commit**

```bash
git add backend/app/models/ backend/tests/ && git commit -m "feat: add Pydantic data models + tests"
```

---

### Task 4: DeepSeek API 服务

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/deepseek.py`
- Create: `backend/.env.example`

**Step 1: 环境变量模板**

```bash
# backend/.env.example
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
EXA_API_KEY=your-exa-key-here
```

**Step 2: DeepSeek 服务实现**

```python
# backend/app/services/deepseek.py
import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

SYSTEM_PROMPT = """你是一个梗文化研究专家。用户会给你一组网页搜索结果片段，请你分析并整理出这个梗的结构化档案。

请严格按以下 JSON 格式输出：
{
  "origin": "梗的起源故事（200字以内）",
  "meaning": "梗的核心含义和用法（150字以内）",
  "variants": ["变体1", "变体2", "变体3"],
  "credibility_score": 8,
  "first_appeared": "首次出现时间，如 2023 Q1",
  "peak_popularity": "热度峰值时间，如 2024 Q2",
  "platforms": ["B站", "抖音", "微博", "贴吧", "知乎"]
}

注意：
- credibility_score 1-10，基于信息源多样性、时间一致性、引证充分度
- variants 列出 2-5 个常见变体称呼
- platforms 列出该梗主要流行的平台
- 只输出 JSON，不要包含其他文字"""


async def analyze_meme(keyword: str, search_snippets: list[str]) -> dict:
    """将搜索片段发送给 DeepSeek，返回结构化梗档案"""
    user_content = f"关键词：{keyword}\n\n以下是从互联网搜索到的相关片段：\n\n"
    for i, snippet in enumerate(search_snippets, 1):
        user_content += f"[{i}] {snippet}\n\n"
    user_content += "\n请分析以上信息，输出该梗的结构化 JSON 档案。"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{DEEPSEEK_BASE_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.7,
                "max_tokens": 2000,
            },
        )
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return json.loads(content)
```

**Step 3: 写测试（使用 mock）**

```python
# backend/tests/test_deepseek.py
import pytest
from unittest.mock import AsyncMock, patch
from app.services.deepseek import analyze_meme


@pytest.mark.asyncio
async def test_analyze_meme_returns_structured_data():
    mock_response = {
        "choices": [{
            "message": {
                "content": '{"origin":"测试起源","meaning":"测试含义","variants":["v1","v2"],"credibility_score":7,"first_appeared":"2024 Q1","peak_popularity":"2024 Q2","platforms":["B站"]}'
            }
        }]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value.json.return_value = mock_response

        result = await analyze_meme("测试梗", ["片段1", "片段2"])

        assert result["origin"] == "测试起源"
        assert result["credibility_score"] == 7
        assert len(result["variants"]) == 2
```

**Step 4: 运行测试**

```bash
cd backend && python -m pytest tests/test_deepseek.py -v
# 预期: PASS（使用 mock，不消耗 API）
```

**Step 5: Commit**

```bash
git add backend/app/services/deepseek.py backend/tests/test_deepseek.py backend/.env.example && git commit -m "feat: add DeepSeek API service with mock test"
```

---

### Task 5: Exa 搜索 + 萌娘百科服务

**Files:**
- Create: `backend/app/services/exa_search.py`
- Create: `backend/app/services/moegirl.py`

**Step 1: Exa 搜索实现**

```python
# backend/app/services/exa_search.py
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

EXA_API_KEY = os.getenv("EXA_API_KEY", "")


async def search_exa(keyword: str, num_results: int = 5) -> list[dict]:
    """Exa 语义搜索，返回 [{title, url, text, platform}, ...]"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.exa.ai/search",
            headers={
                "Authorization": f"Bearer {EXA_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "query": f"{keyword} 梗 含义 起源",
                "numResults": num_results,
                "useAutoprompt": True,
                "type": "auto",
                "contents": {"text": {"maxCharacters": 500}},
            },
        )
        data = response.json()
        results = []
        for r in data.get("results", []):
            results.append({
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "text": r.get("text", ""),
                "platform": _guess_platform(r.get("url", "")),
            })
        return results


def _guess_platform(url: str) -> str:
    """根据 URL 猜测来源平台"""
    platform_hints = {
        "bilibili": "B站", "zhihu": "知乎", "weibo": "微博",
        "tieba": "贴吧", "douyin": "抖音", "baike": "百度百科",
        "moegirl": "萌娘百科", "zh.wikipedia": "维基百科",
    }
    for key, name in platform_hints.items():
        if key in url.lower():
            return name
    return "网站"
```

**Step 2: 萌娘百科搜索实现**

```python
# backend/app/services/moegirl.py
import httpx
from bs4 import BeautifulSoup


MOEGIRL_SEARCH_URL = "https://zh.moegirl.org.cn/index.php"
MOEGIRL_API_URL = "https://zh.moegirl.org.cn/api.php"


async def search_moegirl(keyword: str) -> list[dict]:
    """搜索萌娘百科，返回 [{title, url, text, platform: "萌娘百科"}]"""
    results = []

    # 使用萌娘百科 API 搜索
    async with httpx.AsyncClient(timeout=30.0) as client:
        params = {
            "action": "query",
            "list": "search",
            "srsearch": keyword,
            "format": "json",
            "srlimit": 3,
        }
        response = await client.get(MOEGIRL_API_URL, params=params)
        data = response.json()

        for item in data.get("query", {}).get("search", []):
            title = item.get("title", "")
            snippet = BeautifulSoup(item.get("snippet", ""), "html.parser").get_text()
            page_url = f"https://zh.moegirl.org.cn/{title.replace(' ', '_')}"
            results.append({
                "title": title,
                "url": page_url,
                "text": snippet[:500],
                "platform": "萌娘百科",
            })

    return results
```

**Step 3: Commit**

```bash
git add backend/app/services/exa_search.py backend/app/services/moegirl.py && git commit -m "feat: add Exa search + Moegirl wiki services"
```

---

### Task 6: 搜索路由（整合搜索 + AI 分析）

**Files:**
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/search.py`
- Modify: `backend/app/main.py`（注册路由）

**Step 1: 搜索路由实现**

```python
# backend/app/routers/search.py
import asyncio
from fastapi import APIRouter, HTTPException
from app.models.meme import SearchRequest, SearchResponse, MemeArchive, Source
from app.services.exa_search import search_exa
from app.services.moegirl import search_moegirl
from app.services.deepseek import analyze_meme

router = APIRouter(prefix="/api", tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search_meme(req: SearchRequest):
    keyword = req.keyword.strip()

    # 并发搜索
    exa_results, moegirl_results = await asyncio.gather(
        search_exa(keyword),
        search_moegirl(keyword),
        return_exceptions=True,
    )

    # 处理可能的异常
    if isinstance(exa_results, Exception):
        exa_results = []
    if isinstance(moegirl_results, Exception):
        moegirl_results = []

    all_results = exa_results + moegirl_results

    if not all_results:
        raise HTTPException(status_code=404, detail="未找到相关结果，换个关键词试试？")

    # 提取文本片段给 AI
    snippets = [r["text"] for r in all_results if r["text"]]

    # DeepSeek 分析
    try:
        archive_dict = await analyze_meme(keyword, snippets)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 分析失败: {str(e)}")

    # 构造来源列表
    sources = [
        Source(title=r["title"], url=r["url"], platform=r["platform"])
        for r in all_results
    ]

    archive = MemeArchive(
        origin=archive_dict.get("origin", ""),
        meaning=archive_dict.get("meaning", ""),
        variants=archive_dict.get("variants", []),
        credibility_score=archive_dict.get("credibility_score", 5),
        first_appeared=archive_dict.get("first_appeared", ""),
        peak_popularity=archive_dict.get("peak_popularity", ""),
        platforms=archive_dict.get("platforms", []),
        sources=sources,
    )

    return SearchResponse(
        keyword=keyword,
        archive=archive,
        raw_snippets=snippets,
    )
```

**Step 2: 注册路由到 main.py**

```python
# backend/app/main.py 添加:
from app.routers import search

app.include_router(search.router)
```

**Step 3: Commit**

```bash
git add backend/app/routers/ backend/app/main.py && git commit -m "feat: add search router with search + AI integration"
```

---

### Task 7: 随机冲浪路由

**Files:**
- Create: `backend/app/routers/surf.py`
- Modify: `backend/app/main.py`（注册路由）

**Step 1: 冲浪路由实现**

```python
# backend/app/routers/surf.py
import random
from fastapi import APIRouter
from app.models.meme import SearchRequest, SearchResponse
from app.routers.search import search_meme

router = APIRouter(prefix="/api", tags=["surf"])

# 随机关键词池（后续可扩展）
SURF_KEYWORDS = [
    "鸡你太美", "电子榨菜", "i人e人", "显眼包", "遥遥领先",
    "命运的齿轮开始转动", "那咋了", "精神内耗", "整顿职场",
    "吗喽", "绝绝子", "家人们谁懂啊", "优雅永不过时",
    "你是懂XX的", "这个老六", "泰酷辣", "尊嘟假嘟",
    "哈基米", "命运的齿轮", "雪糕刺客", "疯狂星期四",
    "鼠鼠我啊", "破防了", "格局打开", "你配享太庙",
    "有人出生在罗马", "显眼包", "drama", "清澈的愚蠢",
    "公主请上车", "正式确诊为XX", "它真的我哭死",
]


@router.get("/surf", response_model=SearchResponse)
async def random_surf():
    keyword = random.choice(SURF_KEYWORDS)
    return await search_meme(SearchRequest(keyword=keyword))
```

**Step 2: 注册路由**

```python
# backend/app/main.py 添加:
from app.routers import surf
app.include_router(surf.router)
```

**Step 3: Commit**

```bash
git add backend/app/routers/surf.py backend/app/main.py && git commit -m "feat: add random surf endpoint"
```

---

### Task 8: 本地精选档案库

**Files:**
- Create: `backend/app/data/archive.json`
- Create: `backend/app/routers/archive.py`

**Step 1: 本地档案数据（8 条精选）**

```json
[
  {
    "keyword": "鸡你太美",
    "archive": {
      "origin": "2019年，蔡徐坤在《偶像练习生》自我介绍中表演篮球+舞蹈，其中一句歌词'只因你太美'因语速过快被空耳为'鸡你太美'，随后在B站鬼畜区爆发式传播。2023年因'小黑子'文化二次翻红。",
      "meaning": "对蔡徐坤篮球表演的调侃式模仿，'鸡'代指蔡徐坤。后期演变出'小黑子'（伪装成粉丝的黑粉）、'食不食油饼'（是不是有病）等衍生梗，成为中文互联网最持久的空耳梗之一。",
      "variants": ["小黑子", "你干嘛~哈哈哎哟", "食不食油饼", "树枝666", "梳中分", "露出鸡脚"],
      "credibility_score": 9,
      "first_appeared": "2019 Q1",
      "peak_popularity": "2023 Q2",
      "platforms": ["B站", "抖音", "贴吧", "微博"]
    }
  }
]
```

（完整 8 条在实现时补充）

**Step 2: 档案查询路由**

```python
# backend/app/routers/archive.py
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from app.models.meme import SearchResponse, MemeArchive, Source

router = APIRouter(prefix="/api", tags=["archive"])

ARCHIVE_PATH = Path(__file__).parent.parent / "data" / "archive.json"


def load_archive() -> list[dict]:
    with open(ARCHIVE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/archive")
async def list_archive():
    """返回所有本地档案的摘要列表"""
    data = load_archive()
    return [
        {"keyword": item["keyword"], "origin": item["archive"]["origin"][:80] + "..."}
        for item in data
    ]


@router.get("/archive/{keyword}", response_model=SearchResponse)
async def get_archive(keyword: str):
    """按关键词查询本地档案"""
    data = load_archive()
    for item in data:
        if item["keyword"] == keyword:
            return SearchResponse(
                keyword=item["keyword"],
                archive=MemeArchive(**item["archive"]),
                raw_snippets=[],
            )
    raise HTTPException(status_code=404, detail="本地档案中未找到该梗")
```

**Step 3: Commit**

```bash
git add backend/app/data/ backend/app/routers/archive.py backend/app/main.py && git commit -m "feat: add local archive + archive endpoint"
```

---

## 阶段 3：前端核心

### Task 9: Tailwind Neo-Brutalism 主题配置

**Files:**
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/src/app/globals.css`

**Step 1: Tailwind 配置**

```typescript
// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        meme: {
          yellow: "#FFD700",
          coral: "#FF6B6B",
          cream: "#FFFDF7",
          ink: "#1A1A1A",
        },
      },
      borderWidth: {
        "3": "3px",
      },
      boxShadow: {
        brutalism: "6px 6px 0px 0px rgba(0,0,0,1)",
        "brutalism-hover": "-4px -4px 0px 0px rgba(0,0,0,1)",
        "brutalism-sm": "3px 3px 0px 0px rgba(0,0,0,1)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: 全局 CSS**

```css
/* frontend/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-meme-cream text-meme-ink font-sans antialiased;
  }
}

@layer components {
  .brutal-card {
    @apply border-3 border-black bg-white p-6 shadow-brutalism;
  }
  .brutal-card:hover {
    @apply shadow-brutalism-hover -translate-x-[2px] -translate-y-[2px];
    transition: all 0.15s ease;
  }
  .brutal-btn {
    @apply border-3 border-black px-6 py-3 font-bold uppercase shadow-brutalism-sm
           hover:shadow-brutalism-hover active:translate-x-[1px] active:translate-y-[1px]
           active:shadow-none transition-all;
  }
  .brutal-input {
    @apply border-3 border-black px-4 py-3 font-mono bg-white
           focus:outline-none focus:ring-4 focus:ring-meme-yellow;
  }
  .brutal-tag {
    @apply border-2 border-black px-2 py-0.5 text-xs font-mono bg-meme-yellow;
  }
}
```

**Step 3: 验证**

```bash
cd frontend && npm run dev
# 浏览器打开 http://localhost:3000 → 无错误，背景为奶白色
```

**Step 4: Commit**

```bash
git add frontend/tailwind.config.ts frontend/src/app/globals.css && git commit -m "feat: add Neo-Brutalism Tailwind theme"
```

---

### Task 10: API 调用层

**Files:**
- Create: `frontend/src/lib/api.ts`

```typescript
// frontend/src/lib/api.ts

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
```

**Step 1: Commit**

```bash
git add frontend/src/lib/api.ts && git commit -m "feat: add frontend API client layer"
```

---

### Task 11: 首页布局 + 搜索栏组件

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/components/SearchBar.tsx`

**Step 1: 根布局**

```tsx
// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "梗的起源、分析与二创",
  description: "每个梗背后，都是一个时代的情绪切片",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={jetbrains.variable}>{children}</body>
    </html>
  );
}
```

**Step 2: SearchBar 组件**

```tsx
// frontend/src/components/SearchBar.tsx
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
        className="brutal-input flex-1 text-lg"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !keyword.trim()}
        className="brutal-btn bg-meme-yellow text-black disabled:opacity-50
                   disabled:cursor-not-allowed whitespace-nowrap"
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
```

**Step 3: 首页**

```tsx
// frontend/src/app/page.tsx
"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import SurfButton from "@/components/SurfButton";
import MemeArchive from "@/components/MemeArchive";
import { searchMeme, randomSurf, SearchResponse } from "@/lib/api";

export default function Home() {
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (keyword: string) => {
    setIsLoading(true);
    setError(null);
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
            onClick={() => handleSearch("鸡你太美")}
            className="brutal-card text-center hover:cursor-pointer"
          >
            <span className="text-2xl">📦</span>
            <p className="font-bold mt-2">梗档案库</p>
            <p className="text-sm text-gray-500 font-mono">本地精选 8 条</p>
          </button>
        </div>
      )}

      {/* 热门标签 */}
      {!result && !error && (
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
          {["鸡你太美", "电子榨菜", "i人e人", "显眼包", "遥遥领先"].map((tag) => (
            <button
              key={tag}
              onClick={() => handleSearch(tag)}
              className="brutal-tag hover:bg-meme-coral hover:text-white transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="max-w-2xl mx-auto mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="brutal-card animate-pulse">
              <div className="h-4 bg-gray-200 w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-2xl mx-auto mt-8 brutal-card bg-black text-meme-yellow">
          <p className="text-lg font-bold mb-2">⚠️ 搜索失败</p>
          <p className="font-mono">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-4 brutal-btn bg-meme-yellow text-black"
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
```

**Step 4: SurfButton 组件**

```tsx
// frontend/src/components/SurfButton.tsx
interface Props {
  onSurf: () => void;
  isLoading: boolean;
}

export default function SurfButton({ onSurf, isLoading }: Props) {
  return (
    <button
      onClick={onSurf}
      disabled={isLoading}
      className="brutal-card text-center hover:cursor-pointer
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="text-2xl">🎲</span>
      <p className="font-bold mt-2">随机冲浪</p>
      <p className="text-sm text-gray-500 font-mono">
        {isLoading ? "正在抓取..." : "不知道搜什么？点我"}
      </p>
    </button>
  );
}
```

**Step 5: Commit**

```bash
git add frontend/src/ && git commit -m "feat: add homepage layout, search bar, and surf button"
```

---

### Task 12: 梗档案展示组件

**Files:**
- Create: `frontend/src/components/MemeArchive.tsx`

```tsx
// frontend/src/components/MemeArchive.tsx
import { SearchResponse } from "@/lib/api";

interface Props {
  data: SearchResponse;
  onSurf: () => void;
  onBack: () => void;
}

function CredStars(score: number) {
  return "★".repeat(score) + "☆".repeat(10 - score);
}

export default function MemeArchive({ data, onSurf, onBack }: Props) {
  const { archive } = data;

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-6">
      {/* 标题栏 */}
      <div className="brutal-card">
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
      <div className="brutal-card">
        <h3 className="text-xl font-bold mb-3">📌 起源</h3>
        <p className="font-mono leading-relaxed">{archive.origin}</p>
      </div>

      {/* 含义 */}
      <div className="brutal-card">
        <h3 className="text-xl font-bold mb-3">💬 含义</h3>
        <p className="font-mono leading-relaxed">{archive.meaning}</p>
      </div>

      {/* 变体 */}
      {archive.variants.length > 0 && (
        <div className="brutal-card">
          <h3 className="text-xl font-bold mb-3">🔄 常见变体</h3>
          <div className="flex flex-wrap gap-2">
            {archive.variants.map((v, i) => (
              <span key={i} className="brutal-tag">
                {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 传播时间线 */}
      <div className="brutal-card">
        <h3 className="text-xl font-bold mb-3">📊 传播时间线</h3>
        <div className="font-mono space-y-2">
          <p>首次出现: <strong>{archive.first_appeared}</strong></p>
          {archive.peak_popularity && (
            <p>爆火峰值: <strong>{archive.peak_popularity}</strong></p>
          )}
          <p>传播平台:{" "}
            {archive.platforms.map((p, i) => (
              <span key={i} className="brutal-tag mr-1">{p}</span>
            ))}
          </p>
        </div>
      </div>

      {/* 信息来源 */}
      {archive.sources.length > 0 && (
        <div className="brutal-card">
          <h3 className="text-xl font-bold mb-3">📎 信息来源（可点击跳转）</h3>
          <div className="space-y-2">
            {archive.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-2 border-black p-3 font-mono text-sm
                           hover:bg-meme-yellow transition-colors hover:underline"
              >
                <span className="brutal-tag mr-2">{s.platform}</span>
                {s.title}
                <span className="float-right">→</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <div className="flex gap-4 justify-center pt-4">
        <button onClick={onBack} className="brutal-btn bg-white">
          🔙 返回首页
        </button>
        <button onClick={onSurf} className="brutal-btn bg-meme-coral text-white">
          🎲 随机冲浪下一个
        </button>
      </div>
    </div>
  );
}
```

**Step 1: Commit**

```bash
git add frontend/src/components/MemeArchive.tsx && git commit -m "feat: add MemeArchive detail display component"
```

---

## 阶段 4：端到端集成 & 验证

### Task 13: 端到端验证

**验证清单：**

1. 启动后端：`cd backend && uvicorn app.main:app --reload --port 8000`
2. 验证 `/health`：`curl http://localhost:8000/health`
3. 验证 `/api/archive`：`curl http://localhost:8000/api/archive`
4. 启动前端：`cd frontend && npm run dev`
5. 浏览器测试：
   - 输入"电子榨菜"搜索 → 等待 DeepSeek 分析 → 查看结构化档案
   - 点击"随机冲浪" → 查看随机结果
   - 测试错误状态（停掉后端再搜索）→ 黑底黄字错误卡片
   - 测试热门标签点击 → 自动搜索

6. 验证提交：
```bash
git log --oneline --all
```

---

## 任务依赖关系

```
Task 1 (后端脚手架) ──┬── Task 3 (数据模型) ── Task 4 (DeepSeek)
                     │                           │
                     ├── Task 5 (Exa+萌娘) ──────┤
                     │                           │
                     └────────────────────────── Task 6 (搜索路由)
                                                     │
                                                  Task 7 (冲浪路由)
                                                     │
                                                  Task 8 (档案库)
                                                                 
Task 2 (前端脚手架) ── Task 9 (主题) ── Task 10 (API层) ── Task 11 (首页+搜索) ── Task 12 (档案组件)
                                                                                         │
                                                                                    Task 13 (集成验证)
```

---

## 环境变量

创建 `backend/.env`（从 `.env.example` 复制并填入真实 key）：

```bash
DEEPSEEK_API_KEY=sk-your-actual-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
EXA_API_KEY=  # 留空使用 Exa 免费额度
```

前端需创建 `frontend/.env.local`：

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```
