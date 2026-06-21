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
        response.raise_for_status()
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
