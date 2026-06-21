import asyncio
from fastapi import APIRouter, HTTPException
from app.models.meme import SearchRequest, SearchResponse, MemeArchive, Source
from app.services.exa_search import search_exa, ExaError
from app.services.moegirl import search_moegirl, MoegirlError
from app.services.deepseek import analyze_meme, DeepSeekError

router = APIRouter(prefix="/api", tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search_meme(req: SearchRequest):
    keyword = req.keyword.strip()

    # 并发搜索 Exa + 萌娘百科
    exa_results, moegirl_results = await asyncio.gather(
        search_exa(keyword),
        search_moegirl(keyword),
        return_exceptions=True,
    )

    # 收集所有搜索结果（跳过异常的搜索源）
    all_results: list[dict] = []
    if not isinstance(exa_results, (ExaError, Exception)):
        all_results.extend(exa_results)
    if not isinstance(moegirl_results, (MoegirlError, Exception)):
        all_results.extend(moegirl_results)

    if not all_results:
        raise HTTPException(
            status_code=404,
            detail="未找到相关结果，换个关键词试试？",
        )

    # 提取文本片段给 AI
    snippets = [r["text"] for r in all_results if r.get("text")]

    # DeepSeek 分析（返回已校验的 MemeArchive）
    try:
        archive = await analyze_meme(keyword, snippets)
    except DeepSeekError as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI 分析失败: {e}",
        )

    # 构造来源列表
    sources = [
        Source(title=r["title"], url=r["url"], platform=r["platform"])
        for r in all_results
    ]

    return SearchResponse(
        keyword=keyword,
        archive=archive,
        raw_snippets=snippets,
    )
