import asyncio
from fastapi import APIRouter, HTTPException
from app.models.meme import SearchRequest, SearchResponse, MemeArchive, Source
from app.services.exa_search import search_exa, ExaError
from app.services.moegirl import search_moegirl, MoegirlError
from app.services.deepseek import analyze_meme, DeepSeekError
from app.routers.archive import _load_archive

router = APIRouter(prefix="/api", tags=["search"])


def _lookup_local(keyword: str) -> SearchResponse | None:
    """在本地档案中查找，命中则返回 SearchResponse，否则返回 None"""
    for item in _load_archive():
        if item["keyword"] == keyword:
            return SearchResponse(
                keyword=item["keyword"],
                archive=MemeArchive(**item["archive"]),
                raw_snippets=[],
            )
    return None


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

    # 网络搜索无结果 → 尝试本地档案回退
    if not all_results:
        local = _lookup_local(keyword)
        if local:
            return local
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
