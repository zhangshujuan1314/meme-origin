from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import search, surf, archive

app = FastAPI(title="梗起源 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router)
app.include_router(surf.router)
app.include_router(archive.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
