import pytest
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
from app.services.deepseek import (
    analyze_meme,
    DeepSeekError,
    DeepSeekAPIError,
    DeepSeekParseError,
)
from app.models.meme import MemeArchive

# Patch the module-level API key so the early guard doesn't block all tests
MOCK_KEY = patch("app.services.deepseek.DEEPSEEK_API_KEY", "sk-test-mock-key")


def make_mock_response(content_str: str) -> MagicMock:
    """Helper: create a mock httpx.Response with valid choices content."""
    resp = MagicMock()
    resp.json.return_value = {
        "choices": [{"message": {"content": content_str}}]
    }
    return resp


@pytest.mark.asyncio
async def test_analyze_meme_returns_meme_archive():
    """Happy path: valid JSON returns validated MemeArchive."""
    content = (
        '{"origin":"测试起源","meaning":"测试含义",'
        '"variants":["v1","v2"],"credibility_score":7,'
        '"first_appeared":"2024 Q1","peak_popularity":"2024 Q2",'
        '"platforms":["B站"]}'
    )
    resp = make_mock_response(content)

    with MOCK_KEY, patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = resp

        result = await analyze_meme("测试梗", ["片段1", "片段2"])

        assert isinstance(result, MemeArchive)
        assert result.origin == "测试起源"
        assert result.credibility_score == 7
        assert len(result.variants) == 2


@pytest.mark.asyncio
async def test_analyze_meme_passes_keyword_to_api():
    """Verify keyword and snippets reach the API call payload."""
    content = (
        '{"origin":"x","meaning":"x","variants":[],'
        '"credibility_score":5,"first_appeared":"2024","platforms":[]}'
    )
    resp = make_mock_response(content)

    with MOCK_KEY, patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = resp

        await analyze_meme("鸡你太美", ["片段"])

        call_kwargs = mock_post.call_args.kwargs
        messages = call_kwargs["json"]["messages"]
        user_msg = messages[1]["content"]
        assert "鸡你太美" in user_msg
        assert "片段" in user_msg


@pytest.mark.asyncio
async def test_empty_snippets_raises():
    """Empty search_snippets should raise ValueError before calling API."""
    with MOCK_KEY, pytest.raises(ValueError, match="不能为空"):
        await analyze_meme("test", [])


@pytest.mark.asyncio
async def test_http_error_raises_api_error():
    """HTTP 5xx raises DeepSeekAPIError with status code."""
    with MOCK_KEY, patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.HTTPStatusError(
            "Server error",
            request=MagicMock(),
            response=MagicMock(status_code=500, text="Internal Server Error"),
        )
        with pytest.raises(DeepSeekAPIError) as exc_info:
            await analyze_meme("test", ["snippet"])
        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_malformed_json_raises_parse_error():
    """Non-JSON LLM output raises DeepSeekParseError."""
    resp = MagicMock()
    resp.json.return_value = {
        "choices": [{"message": {"content": "这可不是 JSON 格式"}}]
    }

    with MOCK_KEY, patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = resp

        with pytest.raises(DeepSeekParseError, match="不是有效 JSON"):
            await analyze_meme("test", ["snippet"])


@pytest.mark.asyncio
async def test_missing_choices_raises_parse_error():
    """Response with empty choices raises DeepSeekParseError."""
    resp = MagicMock()
    resp.json.return_value = {"choices": []}

    with MOCK_KEY, patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = resp

        with pytest.raises(DeepSeekParseError, match="无 choices"):
            await analyze_meme("test", ["snippet"])


@pytest.mark.asyncio
async def test_network_error_raises_deepseek_error():
    """Network/timeout errors raise DeepSeekError."""
    with MOCK_KEY, patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.RequestError("Connection refused")

        with pytest.raises(DeepSeekError, match="网络请求失败"):
            await analyze_meme("test", ["snippet"])


@pytest.mark.asyncio
async def test_missing_api_key_raises():
    """When DEEPSEEK_API_KEY is empty, it raises DeepSeekError early."""
    with patch("app.services.deepseek.DEEPSEEK_API_KEY", None):
        with pytest.raises(DeepSeekError, match="未设置"):
            await analyze_meme("test", ["snippet"])
