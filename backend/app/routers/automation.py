from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import date

from app.models.schemas import SyncResult
from app.services.scheduler import (
    run_sync_cycle, start_scheduler, stop_scheduler,
    restart_scheduler, get_last_result, scheduler,
)

router = APIRouter(prefix="/automation", tags=["automation"])


class SyncRequest(BaseModel):
    start_date: Optional[str] = None   # YYYY-MM-DD — si None usa 1ro del mes actual
    end_date: Optional[str] = None     # YYYY-MM-DD — si None usa hoy


@router.post("/sync", response_model=SyncResult)
async def trigger_sync(req: SyncRequest = SyncRequest()):
    """
    Ejecuta un ciclo completo de sync + automatización.
    start_date / end_date definen el rango del reporte LOAN_LIST de Sadmin.
    Si no se envían, se usa desde el 1ro del mes actual hasta hoy.
    """
    return await run_sync_cycle(
        start_date=req.start_date,
        end_date=req.end_date,
    )


@router.get("/status")
async def scheduler_status():
    """Estado del scheduler y último resultado"""
    last = get_last_result()
    jobs = scheduler.get_jobs()
    next_run = jobs[0].next_run_time.isoformat() if jobs else None
    return {
        "running": scheduler.running,
        "jobs": len(jobs),
        "next_run": next_run,
        "last_result": last,
    }


@router.post("/scheduler/start")
async def start():
    start_scheduler()
    return {"message": "Scheduler iniciado"}


@router.post("/scheduler/stop")
async def stop():
    stop_scheduler()
    return {"message": "Scheduler pausado"}


@router.post("/scheduler/restart")
async def restart(interval_minutes: int = None):
    restart_scheduler(interval_minutes)
    return {"message": f"Scheduler reiniciado · intervalo: {interval_minutes} min"}