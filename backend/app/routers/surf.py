import random
from fastapi import APIRouter
from app.models.meme import SearchRequest, SearchResponse
from app.routers.search import search_meme

router = APIRouter(prefix="/api", tags=["surf"])

# 随机关键词池
SURF_KEYWORDS = [
    "鸡你太美", "电子榨菜", "i人e人", "显眼包", "遥遥领先",
    "命运的齿轮开始转动", "那咋了", "精神内耗", "整顿职场",
    "吗喽", "绝绝子", "家人们谁懂啊", "优雅永不过时",
    "你是懂XX的", "这个老六", "泰酷辣", "尊嘟假嘟",
    "哈基米", "雪糕刺客", "疯狂星期四", "鼠鼠我啊",
    "破防了", "格局打开", "你配享太庙", "它真的我哭死",
]


@router.get("/surf", response_model=SearchResponse)
async def random_surf():
    keyword = random.choice(SURF_KEYWORDS)
    return await search_meme(SearchRequest(keyword=keyword))
