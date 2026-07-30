from fastapi import APIRouter, UploadFile, File, Depends
from app.core.config import settings

router = APIRouter()

@router.post("")
async def ingest_document(file: UploadFile = File(...)):
    return {
        "message": "Document received",
        "filename": file.filename,
        "tenant_id": settings.TENANT_ID,
    }