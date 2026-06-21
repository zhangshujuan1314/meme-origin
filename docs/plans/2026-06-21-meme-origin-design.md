# 梗的起源、分析与二创 — 设计文档

> 2026-06-21 | 设计阶段 | MVP 范围

## 项目概述

基于 Next.js + FastAPI 的梗文化搜索与分析 Web 应用。MVP 包含两大核心功能：**梗侦探**（联网搜索 + AI 整理梗档案）和**随机冲浪**（随机关键词搜索）。

## 关键决策

- **部署：** 本地开发优先，不引入 Docker
- **API 密钥：** 只有 DeepSeek key；搜索层用 Exa 免费额度 + 萌娘百科，Bing 暂不接入
- **发布节奏：** MVP 先行（梗侦探 + 随机冲浪），创造工坊 / 传播模拟器 / 梗盲盒后续迭代

---

## 项目结构

```
meme-origin/
├── frontend/                    # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # 首页（梗侦探入口 + 随机冲浪按钮）
│   │   │   ├── layout.tsx       # 根布局（Neo-Brutalism 全局样式）
│   │   │   ├── globals.css      # Tailwind + Neo-Brutalism 工具类
│   │   │   └── meme/
│   │   │       └── [slug]/
│   │   │           └── page.tsx # 梗详情页（档案展示）
│   │   ├── components/
│   │   │   ├── SearchBar.tsx    # 搜索输入 + loading 态
│   │   │   ├── MemeCard.tsx     # 搜索结果卡片
│   │   │   ├── MemeArchive.tsx  # 梗档案完整展示（起源/变体/来源）
│   │   │   └── SurfButton.tsx   # 随机冲浪入口按钮
│   │   └── lib/
│   │       └── api.ts           # 后端 API 调用封装
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                     # FastAPI
│   ├── app/
│   │   ├── main.py              # FastAPI 应用入口
│   │   ├── routers/
│   │   │   ├── search.py        # POST /api/search
│   │   │   └── surf.py          # GET /api/surf
│   │   ├── services/
│   │   │   ├── deepseek.py      # DeepSeek API 封装
│   │   │   ├── exa_search.py    # Exa 语义搜索
│   │   │   └── moegirl.py       # 萌娘百科爬取
│   │   ├── models/
│   │   │   └── meme.py          # Pydantic 数据模型
│   │   └── data/
│   │       └── archive.json     # 本地精选档案（8条）
│   └── requirements.txt
```

---

## 数据流

```
用户输入关键词 → Next.js → FastAPI /api/search
                                ├─→ Exa 语义搜索 (同步)
                                └─→ 萌娘百科搜索 (同步)
                                    ↓
                              原始网页片段拼接
                                    ↓
                              DeepSeek 整理为结构化档案
                                    ↓
                              返回 JSON → 前端渲染
```

---

## API 设计

### POST /api/search

```
Request:  { "keyword": "鸡你太美" }
Response: {
  "keyword": "鸡你太美",
  "archive": {
    "origin": "...",
    "meaning": "...",
    "variants": [...],
    "credibility_score": 8,
    "first_appeared": "2019 Q1",
    "peak_popularity": "2023 Q2",
    "platforms": ["B站", "抖音", "贴吧"],
    "sources": [{ "title": "...", "url": "...", "platform": "..." }]
  },
  "raw_snippets": [...]
}
```

### GET /api/surf

从后端关键词池随机选取，返回结构同 `/api/search`。

---

## Pydantic 数据模型

```python
class Source(BaseModel):
    title: str
    url: str
    platform: str

class MemeArchive(BaseModel):
    origin: str
    meaning: str
    variants: list[str]
    credibility_score: int
    first_appeared: str
    peak_popularity: str
    platforms: list[str]
    sources: list[Source]
```

---

## DeepSeek 调用策略

搜索层返回原始网页文本 → 拼接成 prompt → DeepSeek 按固定 JSON schema 输出结构化档案。使用 `response_format: { type: "json_object" }` 约束输出格式。

---

## 前端 UI：Neo-Brutalism 设计语言

- **配色：** 主色 `#FFD700`（明黄）+ `#FF6B6B`（珊瑚红），背景奶白 `#FFFDF7`
- **边框：** `border-3 border-black`（3px 黑实线）
- **阴影：** `shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`（硬偏移无模糊）
- **字体：** 标题 `font-black`，正文 `font-mono`
- **边角：** 全部 `rounded-none`
- **Hover：** 阴影偏移翻转 `-6px`（按压感）

### 首页布局

- 大字标题 + 斜体副标题
- 搜索栏（3px 黑边框）+ 「侦探模式」按钮
- 两个特色入口：🎲 随机冲浪 / 📦 梗档案库
- 热门搜索快速入口标签

### 搜索结果页

- 可信度评分（星级 + 数字 1-10）
- 分区展示：起源 / 含义 / 常见变体（标签云）/ 传播时间线 / 信息来源（可点击跳转）
- 底部导航：返回首页 + 随机冲浪下一个

### 状态处理

- **Loading：** 像素风 spinner + 骨架脉冲块
- **Empty：** 引导文案 → 随机冲浪
- **Error：** 黑底黄字告示牌风格
- **Not Found：** 友好提示 + 建议换关键词

---

## 后续迭代（非 MVP）

- 创造工坊 — AI 梗变体生成
- 传播模拟器 — 三档传播模式可视化
- 梗盲盒 — 50% 本地 / 50% 实时
- POST /api/prophecy — 梗文化趋势预测
- POST /api/generate — 梗变体生成
