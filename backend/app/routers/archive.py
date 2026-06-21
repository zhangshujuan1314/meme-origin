import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from app.models.meme import SearchResponse, MemeArchive

router = APIRouter(prefix="/api", tags=["archive"])

ARCHIVE_PATH = Path(__file__).parent.parent / "data" / "archive.json"


def _load_archive() -> list[dict]:
    with open(ARCHIVE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/archive")
async def list_archive():
    """返回所有本地档案的摘要列表"""
    data = _load_archive()
    return [
        {"keyword": item["keyword"], "origin": item["archive"]["origin"][:80] + "..."}
        for item in data
    ]


@router.get("/archive/{keyword}", response_model=SearchResponse)
async def get_archive(keyword: str):
    """按关键词查询本地档案"""
    data = _load_archive()
    for item in data:
        if item["keyword"] == keyword:
            return SearchResponse(
                keyword=item["keyword"],
                archive=MemeArchive(**item["archive"]),
                raw_snippets=[],
            )
    raise HTTPException(status_code=404, detail="本地档案中未找到该梗")
