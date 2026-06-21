from pydantic import BaseModel, Field


class Source(BaseModel):
    title: str = Field(..., description="来源标题")
    url: str = Field(..., description="来源链接")
    platform: str = Field(..., description="来源平台")


class MemeArchive(BaseModel):
    origin: str = Field(..., description="梗的起源")
    meaning: str = Field(..., description="梗的核心含义")
    variants: list[str] = Field(default_factory=list, description="常见变体")
    credibility_score: int = Field(..., ge=1, le=10, description="可信度评分1-10")
    first_appeared: str = Field(..., description="首次出现时间")
    peak_popularity: str = Field(default="", description="爆火峰值时间")
    platforms: list[str] = Field(default_factory=list, description="传播平台")
    sources: list[Source] = Field(default_factory=list, description="信息来源列表")


class SearchRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=100, description="搜索关键词")


class SearchResponse(BaseModel):
    keyword: str
    archive: MemeArchive
    raw_snippets: list[str] = Field(default_factory=list, description="原始搜索片段")
