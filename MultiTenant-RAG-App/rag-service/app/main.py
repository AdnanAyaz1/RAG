from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import ingest, query, health as health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="RAG Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router.router, prefix="/health", tags=["health"])
app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
app.include_router(query.router, prefix="/rag", tags=["rag"])

@app.get("/")
def root():
    return {"status": "ok", "service": "rag-service"}