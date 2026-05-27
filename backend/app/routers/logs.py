from fastapi import APIRouter, Query
from typing import Optional, List
from app.models.schemas import LogEntry
from app.services.logger import logger_service

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("/", response_model=List[LogEntry])
async def get_logs(
    source: Optional[str] = Query(None, description="sadmin | nuovo | knox | sys | all"),
    level: Optional[str] = Query(None, description="info | ok | warn | err | all"),
    limit: int = Query(200, le=500),
):
    return logger_service.get_all(source=source, level=level, limit=limit)


@router.delete("/")
async def clear_logs():
    logger_service.clear()
    return {"message": "Logs eliminados"}