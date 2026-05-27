from fastapi import APIRouter
from app.models.schemas import SettingsUpdate
from app.services.gateway import test_connection
from app.core.config import get_settings

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/")
async def get_current_settings():
    s = get_settings()

    return {
        "sadmin": {
            "login_url": s.sadmin_login_url,
            "reports_url": s.sadmin_reports_url,
            "user": s.sadmin_user,
            "credit_report_id": s.sadmin_credit_report_id,
            "mora_report_id": s.sadmin_mora_report_id,
            "balance_type": s.sadmin_balance_type,
            "credit_type": s.sadmin_credit_type,
            "sadmin_branch": s.sadmin_branch,
        },

        "nuovo": {
            "base_url": s.nuovo_base_url,
            "user": s.nuovo_user,
            "ep_block": s.nuovo_ep_block,
            "ep_unblock": s.nuovo_ep_unblock,
        },

        "knox": {
            "base_url": s.knox_base_url,
            "user": s.knox_user,
            "ep_block": s.knox_ep_block,
            "ep_unblock": s.knox_ep_unblock,
        },

        "rules": {
            "days_unblock": s.rule_days_unblock,
            "days_warning": s.rule_days_warning,
            "days_block": s.rule_days_block,
        },

        "scheduler": {
            "interval_minutes": s.scheduler_interval_minutes,
            "auto_block": s.scheduler_auto_block,
            "auto_unblock": s.scheduler_auto_unblock,
            "auto_warn": s.scheduler_auto_warn,
        },
    }

@router.post("/test-connection/{api}")
async def test_api_connection(api: str):
    """Test Basic Auth connection to sadmin | nuovo | knox"""
    if api not in ("sadmin", "nuovo", "knox"):
        return {"success": False, "message": "api must be sadmin | nuovo | knox"}
    return await test_connection(api)