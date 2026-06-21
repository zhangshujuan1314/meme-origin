import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.deepseek import analyze_meme


@pytest.mark.asyncio
async def test_analyze_meme_returns_structured_data():
    mock_response = {
        "choices": [{
            "message": {
                "content": '{"origin":"测试起源","meaning":"测试含义","variants":["v1","v2"],"credibility_score":7,"first_appeared":"2024 Q1","peak_popularity":"2024 Q2","platforms":["B站"]}'
            }
        }]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_resp = MagicMock()
        mock_resp.json.return_value = mock_response
        mock_post.return_value = mock_resp

        result = await analyze_meme("测试梗", ["片段1", "片段2"])

        assert result["origin"] == "测试起源"
        assert result["credibility_score"] == 7
        assert len(result["variants"]) == 2


@pytest.mark.asyncio
async def test_analyze_meme_passes_keyword_to_api():
    mock_response = {
        "choices": [{
            "message": {
                "content": '{"origin":"x","meaning":"x","variants":[],"credibility_score":5,"first_appeared":"2024","platforms":[]}'
            }
        }]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_resp = MagicMock()
        mock_resp.json.return_value = mock_response
        mock_post.return_value = mock_resp

        await analyze_meme("鸡你太美", ["片段"])

        call_args = mock_post.call_args
        # Verify the keyword appears in the user message
        messages = call_args[1]["json"]["messages"]
        user_msg = messages[1]["content"]
        assert "鸡你太美" in user_msg
        assert "片段" in user_msg
