from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.models.schemas import DeviceRecord, ActionRequest, BulkActionRequest, ActionResult, DashboardMetrics
from app.services.store import device_store
from app.services.gateway import block_device, unblock_device
from app.services.logger import logger_service

router = APIRouter(prefix="/devices", tags=["devices"])

@router.get("/", response_model=List[DeviceRecord])
async def list_devices(
    status: Optional[str] = Query(None, description="ok | warning | blocked"),
    app: Optional[str] = Query(None, description="Nuovo | Knox"),
    q: Optional[str] = Query(None, description="Search by nombre, identif, num_cred"),
):
    """Return all devices with optional filters"""
    records = device_store.get_all()

    if status:
        records = [r for r in records if r.credit_status.value == status]
    if app:
        records = [r for r in records if r.app.lower() == app.lower()]
    if q:
        q_lower = q.lower()
        records = [
            r for r in records
            if q_lower in r.nombre.lower()
            or q_lower in r.identif
            or q_lower in r.num_cred
        ]

    return records

@router.get("/debug")
async def debug_store():
    records = device_store.get_all()

    return {
        "count": len(records),
        "records": records[:3]
    }
@router.get("/metrics", response_model=DashboardMetrics)
async def get_metrics():
    """Dashboard summary metrics"""
    return device_store.metrics()


@router.get("/{num_cred}", response_model=DeviceRecord)
async def get_device(num_cred: str):
    record = device_store.get_by_num_cred(num_cred)
    if not record:
        raise HTTPException(status_code=404, detail=f"Credit {num_cred} not found")
    return record


@router.post("/action", response_model=ActionResult)
async def single_action(req: ActionRequest):
    """Block or unblock a single device"""
    record = device_store.get_by_num_cred(req.num_cred)
    if not record:
        raise HTTPException(status_code=404, detail=f"Credit {req.num_cred} not found")

    if req.action == "block":
        result = await block_device(record)
    elif req.action == "unblock":
        result = await unblock_device(record)
    else:
        raise HTTPException(status_code=400, detail="action must be 'block' or 'unblock'")

    device_store.update_record(record)
    return result


@router.post("/bulk-action", response_model=List[ActionResult])
async def bulk_action(req: BulkActionRequest):
    """Block or unblock multiple devices"""
    results = []
    for num_cred in req.num_creds:
        record = device_store.get_by_num_cred(num_cred)
        if not record:
            logger_service.add("sys", f"Bulk action: num_cred {num_cred} no encontrado", "warn")
            continue
        if req.action == "block":
            result = await block_device(record)
        else:
            result = await unblock_device(record)
        device_store.update_record(record)
        results.append(result)
    return results

