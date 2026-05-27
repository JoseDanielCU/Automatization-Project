from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timezone
import asyncio

from app.core.config import get_settings
from app.services.sadmin import build_device_records
from app.services.gateway import apply_automation_rules
from app.services.store import device_store
from app.services.logger import logger_service
from app.models.schemas import SyncResult


scheduler = AsyncIOScheduler(timezone="America/Bogota")
_last_result: SyncResult | None = None


async def run_sync_cycle(
    start_date: str | None = None,
    end_date: str | None = None,
) -> SyncResult:
    """
    Full sync + automation cycle:
    1. Fetch all credits from Sadmin
    2. Fetch moras per identif
    3. Apply block/unblock rules via Nuovo and Knox
    4. Update device store
    """
    global _last_result
    start = datetime.utcnow()
    logger_service.add("sys", "─── Iniciando ciclo de automatización ───", "info")

    try:
        # Step 1 & 2: Sadmin sync
        existing = device_store.get_as_dict()
        records, mora_lookup = await build_device_records(
            existing,
            start_date=start_date,
            end_date=end_date,
        )
        device_store.update_all(records)

        # Step 3: Apply rules
        actions = await apply_automation_rules(records)

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        blocked = sum(1 for a in actions if a.action == "block" and a.success)
        unblocked = sum(1 for a in actions if a.action == "unblock" and a.success)
        errors = sum(1 for a in actions if not a.success)
        warnings = sum(1 for r in records if r.credit_status.value == "warning")

        result = SyncResult(
            success=True,
            total_credits=len(records),
            blocked=blocked,
            unblocked=unblocked,
            warnings=warnings,
            errors=errors,
            duration_ms=duration,
            actions=actions,
        )
        logger_service.add(
            "sys",
            f"─── Ciclo completo ✓ · {len(records)} créditos · "
            f"Bloqueados: {blocked} · Desbloqueados: {unblocked} · "
            f"Advertencias: {warnings} · Errores: {errors} · {duration}ms ───",
            "ok"
        )
        _last_result = result
        return result

    except Exception as e:
        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger_service.add("sys", f"─── Error en ciclo · {str(e)[:100]} ───", "err")
        result = SyncResult(
            success=False,
            total_credits=0,
            blocked=0,
            unblocked=0,
            warnings=0,
            errors=1,
            duration_ms=duration,
        )
        _last_result = result
        return result


def get_last_result() -> SyncResult | None:
    return _last_result


def start_scheduler():
    settings = get_settings()
    interval = settings.scheduler_interval_minutes

    if scheduler.running:
        scheduler.remove_all_jobs()
    else:
        scheduler.start()

    scheduler.add_job(
        run_sync_cycle,
        trigger=IntervalTrigger(minutes=interval),
        id="sync_cycle",
        name="Gateway Automation Sync",
        replace_existing=True,
        misfire_grace_time=60,
    )
    logger_service.add(
        "sys",
        f"Scheduler iniciado · ciclo cada {interval} min · "
        f"auto_block={settings.scheduler_auto_block} · "
        f"auto_unblock={settings.scheduler_auto_unblock}",
        "ok"
    )


def stop_scheduler():
    if scheduler.running:
        scheduler.pause()
        logger_service.add("sys", "Scheduler pausado", "warn")


def restart_scheduler(interval_minutes: int | None = None):
    settings = get_settings()
    interval = interval_minutes or settings.scheduler_interval_minutes
    if scheduler.running:
        scheduler.remove_all_jobs()
        scheduler.add_job(
            run_sync_cycle,
            trigger=IntervalTrigger(minutes=interval),
            id="sync_cycle",
            name="Gateway Automation Sync",
            replace_existing=True,
        )
    logger_service.add("sys", f"Scheduler reiniciado · cada {interval} min", "info")