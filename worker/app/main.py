import os
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("flowforge_worker")

app = FastAPI(
    title="FlowForge Worker",
    version="1.0.0",
    description="FlowForge background worker and ASGI task processing service"
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://flowforge:flowforgepassword@db:5432/flowforge")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")


class JobPayload(BaseModel):
    name: str
    payload: Optional[Dict[str, Any]] = None


@app.get("/")
def read_root():
    return {
        "service": "flowforge_worker",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "flowforge_worker",
        "connections": {
            "database_configured": bool(DATABASE_URL),
            "rabbitmq_configured": bool(RABBITMQ_URL),
            "redis_configured": bool(REDIS_URL)
        }
    }


@app.get("/status")
def get_status():
    return {
        "status": "active",
        "queue_service": "rabbitmq",
        "cache_service": "redis",
        "storage": "postgresql"
    }


@app.get("/health/db")
def check_db():
    if not DATABASE_URL:
        raise HTTPException(status_code=503, detail="DATABASE_URL not configured")
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"database": "connected"}
    except Exception as e:
        return {"database": "unreachable", "error": str(e)}


@app.get("/health/redis")
def check_redis():
    if not REDIS_URL:
        raise HTTPException(status_code=503, detail="REDIS_URL not configured")
    try:
        import redis
        client = redis.from_url(REDIS_URL, socket_timeout=3)
        client.ping()
        return {"redis": "connected"}
    except Exception as e:
        return {"redis": "unreachable", "error": str(e)}
