import pytest
from pydantic import ValidationError
from app.models.meme import SearchRequest, SearchResponse, MemeArchive, Source


def test_search_request_valid():
    req = SearchRequest(keyword="鸡你太美")
    assert req.keyword == "鸡你太美"


def test_search_request_empty_keyword_rejected():
    with pytest.raises(ValidationError):
        SearchRequest(keyword="")


def test_search_request_keyword_too_long():
    with pytest.raises(ValidationError):
        SearchRequest(keyword="x" * 101)


def test_meme_archive_all_fields():
    archive = MemeArchive(
        origin="测试起源",
        meaning="测试含义",
        variants=["变体1", "变体2"],
        credibility_score=8,
        first_appeared="2024 Q1",
        peak_popularity="2024 Q3",
        platforms=["B站", "抖音"],
        sources=[Source(title="测试来源", url="https://test.com", platform="B站")]
    )
    assert archive.credibility_score == 8
    assert len(archive.variants) == 2


def test_meme_archive_default_values():
    archive = MemeArchive(
        origin="测试",
        meaning="测试",
        credibility_score=5,
        first_appeared="2024",
    )
    assert archive.variants == []
    assert archive.platforms == []
    assert archive.sources == []
    assert archive.peak_popularity == ""


def test_credibility_score_too_high():
    with pytest.raises(ValidationError):
        MemeArchive(
            origin="test", meaning="test",
            credibility_score=11, first_appeared="2024"
        )


def test_credibility_score_too_low():
    with pytest.raises(ValidationError):
        MemeArchive(
            origin="test", meaning="test",
            credibility_score=0, first_appeared="2024"
        )


def test_source_min_length_validation():
    with pytest.raises(ValidationError):
        Source(title="", url="https://test.com", platform="B站")

    with pytest.raises(ValidationError):
        Source(title="test", url="", platform="B站")

    with pytest.raises(ValidationError):
        Source(title="test", url="https://test.com", platform="")


def test_search_response_construction():
    archive = MemeArchive(
        origin="测试起源",
        meaning="测试含义",
        credibility_score=7,
        first_appeared="2024 Q1",
        variants=["v1"],
        platforms=["B站"],
    )
    resp = SearchResponse(
        keyword="测试梗",
        archive=archive,
        raw_snippets=["片段1", "片段2"],
    )
    assert resp.keyword == "测试梗"
    assert resp.archive.credibility_score == 7
    assert len(resp.raw_snippets) == 2
