# 梗的起源、分析与二创 — Project Context

> GitHub: https://github.com/zhangshujuan1314/meme-origin

## What This Is

Next.js + FastAPI 梗文化搜索分析 Web 应用。输入一个梗关键词 → 联网搜索 → AI 整理为结构化档案（起源/含义/变体/可信度）。

## How to Start

```bash
# 后端 (Terminal 1)
cd backend
cp .env.example .env   # 编辑填入 DEEPSEEK_API_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端 (Terminal 2)
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

## Architecture

```
frontend/src/          # Next.js 16 App Router + Tailwind v4
  app/page.tsx         # 首页 (搜索栏 + 热门标签 + 随机冲浪 + 档案库面板)
  app/layout.tsx       # 根布局, Neo-Brutalism 主题
  components/
    SearchBar.tsx      # "侦探模式"搜索输入
    SurfButton.tsx     # 随机冲浪按钮
    MemeArchive.tsx    # 梗档案完整展示
  lib/api.ts           # 后端 API 调用封装

backend/app/           # FastAPI
  main.py              # 应用入口, 注册所有路由
  models/meme.py       # Pydantic 数据模型 (Source, MemeArchive...)
  routers/
    search.py          # POST /api/search — 搜索 + AI 分析 + 本地回退
    surf.py            # GET /api/surf — 随机冲浪
    archive.py         # GET /api/archive — 本地档案库
  services/
    deepseek.py        # DeepSeek API 封装 (analyze_meme → MemeArchive)
    exa_search.py      # Exa 语义搜索
    moegirl.py         # 萌娘百科 MediaWiki API
  data/archive.json    # 8 条精选梗档案 (离线可用的本地缓存)
```

## Data Flow

```
用户输入关键词 → Next.js fetch → FastAPI /api/search
  ├─→ Exa + 萌娘百科 并发搜索 (异步)
  ├─→ 有结果 → DeepSeek AI 整理为 MemeArchive
  └─→ 无结果 → 回退查本地 archive.json
      ├─→ 命中 → 返回本地档案
      └─→ 未命中 → 404 "换个关键词试试"
```

## Tests

```bash
cd backend && python -m pytest tests/ -v   # 17 tests (9 models + 8 DeepSeek)
```

## Key Decisions

- **Neo-Brutalism 设计**: border-3 + 硬阴影 + 明黄主色, 全部直角
- **Tailwind v4**: CSS-first 配置 (`@theme` 块), 无 tailwind.config.ts
- **analyze_meme 返回 MemeArchive**: 不是 raw dict — Pydantic 校验在服务层完成
- **搜索回退**: 网络搜索失败 → 本地档案, 不需要 Exa key 也能用

## Current Status (2026-06-21)

### Done
- [x] MVP 全部功能 (梗侦探 + 随机冲浪 + 档案库)
- [x] Neo-Brutalism UI
- [x] 8 条本地精选档案
- [x] 17 个后端测试全部通过

### API Keys Required
- [x] DeepSeek API key (已配置, AI 分析)
- [ ] Exa API key (未配置, 网络搜索 — 免费额度可用, 去 exa.ai 注册)

## Next Features (Roadmap)

### 高优先级
1. **Exa API key 接入** — `.env` 填入 EXA_API_KEY, 实时网络搜索即通
2. **创造工坊** (Task 14+) — AI 梗变体生成, 弹幕吐槽/伪语录/标题党
3. **传播模拟器** — 三档传播模式可视化 (标准/爆火/缓慢渗透)

### 中优先级
4. **梗盲盒** — 50% 本地档案 / 50% 实时搜索
5. **POST /api/prophecy** — 梗文化趋势预测
6. **前端测试** — Vitest + Testing Library

### 低优先级
7. **暗色模式** — Neo-Brutalism 暗色变体
8. **PostgreSQL 持久化** — 搜索历史 + 用户收藏

## Important Notes

- `.env` 已在 .gitignore 中, 真实 key 不会提交
- `.env.example` 是模板 (已在 git 中), `.env.local` 被排除
- 前端构建: `(cd frontend && npm run build)` (需要 subshell, 因为 CWD 不持久)
- Tailwind 自定义颜色用 `bg-meme-yellow` 等 (定义在 globals.css `@theme` 块)
- DeepSeek 返回中文 JSON, SYSTEM_PROMPT 是中文
- Windows 环境, bash 通过 Git Bash 运行
