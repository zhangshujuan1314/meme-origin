import urllib.parse
import httpx
from bs4 import BeautifulSoup


MOEGIRL_API_URL = "https://zh.moegirl.org.cn/api.php"
MOEGIRL_PAGE_BASE = "https://zh.moegirl.org.cn/"
USER_AGENT = "MemeOrigin/0.1 (meme-research-tool)"


class MoegirlError(Exception):
    """萌娘百科搜索异常基类"""
    pass


class MoegirlAPIError(MoegirlError):
    """HTTP/API 层面错误"""
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        super().__init__(f"Moegirl API HTTP {status_code}: {message}")


async def search_moegirl(keyword: str) -> list[dict]:
    """搜索萌娘百科，返回 [{title, url, text, platform: "萌娘百科"}]"""
    results = []

    async with httpx.AsyncClient(
        timeout=30.0,
        headers={"User-Agent": USER_AGENT},
    ) as client:
        try:
            response = await client.get(MOEGIRL_API_URL, params={
                "action": "query",
                "list": "search",
                "srsearch": keyword,
                "format": "json",
                "srlimit": 3,
            })
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise MoegirlAPIError(
                status_code=e.response.status_code,
                message=e.response.text[:500],
            ) from e
        except httpx.RequestError as e:
            raise MoegirlError(f"Moegirl 网络请求失败: {e}") from e

        data = response.json()

        for item in data.get("query", {}).get("search", []):
            title = item.get("title", "")
            snippet = BeautifulSoup(item.get("snippet", ""), "html.parser").get_text()
            page_url = MOEGIRL_PAGE_BASE + urllib.parse.quote(
                title.replace(" ", "_"), safe="/"
            )
            results.append({
                "title": title,
                "url": page_url,
                "text": snippet[:500],
                "platform": "萌娘百科",
            })

    return results
