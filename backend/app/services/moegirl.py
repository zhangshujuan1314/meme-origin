import httpx
from bs4 import BeautifulSoup


MOEGIRL_API_URL = "https://zh.moegirl.org.cn/api.php"


async def search_moegirl(keyword: str) -> list[dict]:
    """搜索萌娘百科，返回 [{title, url, text, platform: "萌娘百科"}]"""
    results = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        params = {
            "action": "query",
            "list": "search",
            "srsearch": keyword,
            "format": "json",
            "srlimit": 3,
        }
        response = await client.get(MOEGIRL_API_URL, params=params)
        response.raise_for_status()
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
