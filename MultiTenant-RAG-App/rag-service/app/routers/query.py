from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
    sources: list

@router.post("", response_model=QueryResponse)
async def query(request: QueryRequest):
    return QueryResponse(
        answer="This is a placeholder answer from the RAG service.",
        sources=[],
    )