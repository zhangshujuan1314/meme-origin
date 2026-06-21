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
