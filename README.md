# 🔍 梗的起源、分析与二创

> *"每个梗背后，都是一个时代的情绪切片"*

基于 AI 的网络梗文化搜索分析平台。输入一个梗关键词，自动联网搜索并整理为结构化档案——起源、含义、变体、传播路径、可信度评分，一站式呈现。

[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

---

## ✨ 功能

| 功能 | 说明 | 状态 |
|---|---|---|
| 🔍 **梗侦探** | 联网搜索 + AI 整理梗档案（起源/含义/变体/可信度） | ✅ |
| 🎲 **随机冲浪** | 随机抓取关键词搜索，每次都不一样 | ✅ |
| 📦 **梗档案库** | 8 条深度研究本地档案，离线可用 | ✅ |
| 🎨 **创造工坊** | AI 生成梗变体（弹幕吐槽/伪语录/标题党） | 🚧 规划中 |
| 📡 **传播模拟器** | 可视化梗传播路径（标准/爆火/缓慢渗透） | 🚧 规划中 |
| 🃏 **梗盲盒** | 50% 本地档案 + 50% 实时搜索，开盒惊喜 | 🚧 规划中 |

## 🚀 快速开始

### 环境要求

- **Python 3.11+** + pip
- **Node.js 20+** + npm
- **DeepSeek API Key** ([获取](https://platform.deepseek.com)) — 必需
- **Exa API Key** ([获取](https://exa.ai)) — 可选（用于实时网络搜索，免费额度即可）

### 安装运行

```bash
# 1. 克隆仓库
git clone https://github.com/zhangshujuan1314/meme-origin.git
cd meme-origin

# 2. 后端
cd backend
cp .env.example .env              # 编辑 .env，填入 DEEPSEEK_API_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. 前端 (新终端)
cd frontend
npm install
npm run dev
# → 打开 http://localhost:3000
```

### 配置 API Key

编辑 `backend/.env`：

```env
DEEPSEEK_API_KEY=sk-your-key-here     # 必需：AI 分析
DEEPSEEK_BASE_URL=https://api.deepseek.com
EXA_API_KEY=your-exa-key-here         # 可选：实时网络搜索
```

> 没有 Exa key 也能用——搜索会自动回退到本地档案库。

---

## 🏗️ 技术架构

```
┌──────────────────────────────────────────┐
│               Next.js 16                  │
│         (App Router + Tailwind v4)        │
│            Neo-Brutalism UI               │
└──────────────┬───────────────────────────┘
               │ HTTP
┌──────────────▼───────────────────────────┐
│              FastAPI                      │
│  ┌──────────┬──────────┬──────────────┐   │
│  │ /search  │  /surf   │  /archive    │   │
│  └────┬─────┴────┬─────┴──────┬───────┘   │
│       │          │            │           │
│  ┌────▼──────────▼────────────▼───────┐   │
│  │         Search Layer               │   │
│  │  Exa AI ┃ 萌娘百科 ┃ Local Archive │   │
│  └────────────────┬───────────────────┘   │
│                   │                       │
│  ┌────────────────▼───────────────────┐   │
│  │         DeepSeek AI                │   │
│  │    结构化档案生成 + 可信度评分      │   │
│  └────────────────────────────────────┘   │
└───────────────────────────────────────────┘
```

### 前端

- **Next.js 16** App Router + TypeScript
- **Tailwind CSS v4** — CSS-first 配置
- **Neo-Brutalism** 设计风格 — 粗边框、硬阴影、明黄主色

### 后端

- **FastAPI** — 异步 REST API
- **Pydantic v2** — 数据校验
- **DeepSeek** — AI 文本分析与生成
- **Exa** — 语义搜索
- **萌娘百科** — ACG 梗补充来源

---

## 📂 项目结构

```
meme-origin/
├── frontend/                # Next.js 前端
│   └── src/
│       ├── app/
│       │   ├── page.tsx     # 首页
│       │   ├── layout.tsx   # 根布局
│       │   └── globals.css  # Neo-Brutalism 主题
│       ├── components/
│       │   ├── SearchBar.tsx
│       │   ├── SurfButton.tsx
│       │   └── MemeArchive.tsx
│       └── lib/api.ts       # API 封装
├── backend/                 # FastAPI 后端
│   └── app/
│       ├── main.py          # 应用入口
│       ├── models/meme.py   # 数据模型
│       ├── routers/         # API 路由
│       ├── services/        # 搜索 & AI 服务
│       ├── data/archive.json # 本地档案
│       └── tests/           # 17 个单元测试
├── docs/plans/              # 设计 & 实施计划
├── CLAUDE.md                # AI 开发上下文
└── README.md
```

## 🧪 测试

```bash
cd backend
python -m pytest tests/ -v    # 17 tests
```

---

## 🗺️ 路线图

- [x] 梗侦探 — 搜索 + AI 分析
- [x] 随机冲浪
- [x] 本地精选档案库 (8 条)
- [x] Neo-Brutalism UI
- [ ] 创造工坊 — AI 梗变体生成
- [ ] 传播模拟器 — 可视化传播路径
- [ ] 梗盲盒 — 惊喜开盒
- [ ] 梗文化趋势预测
- [ ] 前端测试覆盖
- [ ] 暗色模式

---

## 📄 License

MIT © 2026
