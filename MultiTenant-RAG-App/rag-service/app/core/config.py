from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "oracle://app_user:ragapppassword123@oracle-db:1521/XEPDB1"
    QDRANT_URL: str = "http://qdrant:6333"
    QDRANT_API_KEY: str = ""
    S3_ENDPOINT: str = "http://minio:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "rag-documents"
    GEMINI_API_KEY: str = ""
    OLLAMA_URL: str = "http://ollama:11434"
    TENANT_ID: str = "default"
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"

settings = Settings()