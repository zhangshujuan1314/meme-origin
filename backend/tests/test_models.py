from app.models.meme import SearchRequest, MemeArchive, Source


def test_search_request_valid():
    req = SearchRequest(keyword="鸡你太美")
    assert req.keyword == "鸡你太美"


def test_search_request_empty_keyword_rejected():
    from pydantic import ValidationError
    try:
        SearchRequest(keyword="")
        assert False, "Should have raised"
    except ValidationError:
        pass


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


def test_credibility_score_out_of_range():
    from pydantic import ValidationError
    try:
        MemeArchive(
            origin="test",
            meaning="test",
            credibility_score=11,
            first_appeared="2024"
        )
        assert False, "Should have raised"
    except ValidationError:
        pass
