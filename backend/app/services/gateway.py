import httpx
import base64
from typing import List
from datetime import datetime

from app.core.config import get_settings
from app.models.schemas import ActionResult, DeviceRecord, GatewayStatus, CreditStatus
from app.services.logger import logger_service


def _basic_auth(user: str, password: str) -> dict:
    token = base64.b64encode(f"{user}:{password}".encode()).decode()
    return {"Authorization": f"Basic {token}", "Content-Type": "application/json"}


async def _call_gateway(
    api: str,          # "nuovo" | "knox"
    action: str,       # "block" | "unblock"
    num_cred: str,
    identif: str,
) -> ActionResult:
    """
    Generic gateway caller for Nuovo and Knox.
    Sends POST to the appropriate endpoint with Basic Auth.
    """
    settings = get_settings()

    if api == "nuovo":
        base_url = settings.nuovo_base_url
        user = settings.nuovo_user
        password = settings.nuovo_password
        endpoint = settings.nuovo_ep_block if action == "block" else settings.nuovo_ep_unblock
    else:  # knox
        base_url = settings.knox_base_url
        user = settings.knox_user
        password = settings.knox_password
        endpoint = settings.knox_ep_block if action == "block" else settings.knox_ep_unblock

    url = f"{base_url}{endpoint}"
    headers = _basic_auth(user, password)
    payload = {"num_cred": num_cred, "identif": identif}
    action_label = "BLOQUEO" if action == "block" else "DESBLOQUEO"
    log_level = "err" if action == "block" else "ok"

    logger_service.add(
        api,
        f"POST {endpoint} · num_cred: {num_cred} · identif: {identif} · {action_label}...",
        "info",
        num_cred=num_cred,
        identif=identif
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            logger_service.add(
                api,
                f"POST {endpoint} · {action_label} OK · HTTP {resp.status_code} · num_cred: {num_cred}",
                log_level,
                num_cred=num_cred,
                identif=identif
            )
            return ActionResult(
                num_cred=num_cred,
                identif=identif,
                app=api.capitalize(),
                action=action,
                success=True,
                message=f"{action_label} exitoso · HTTP {resp.status_code}"
            )
    except httpx.HTTPStatusError as e:
        msg = f"HTTP {e.response.status_code} · {str(e)[:60]}"
        logger_service.add(api, f"POST {endpoint} · ERROR · {msg} · num_cred: {num_cred}", "err", num_cred=num_cred)
        return ActionResult(num_cred=num_cred, identif=identif, app=api.capitalize(),
                            action=action, success=False, message=msg)
    except Exception as e:
        msg = str(e)[:80]
        logger_service.add(api, f"POST {endpoint} · EXCEPCIÓN · {msg}", "err", num_cred=num_cred)
        return ActionResult(num_cred=num_cred, identif=identif, app=api.capitalize(),
                            action=action, success=False, message=msg)


async def block_device(record: DeviceRecord) -> ActionResult:
    api = record.app.lower()
    result = await _call_gateway(api, "block", record.num_cred, record.identif)
    if result.success:
        record.gateway = GatewayStatus.BLOCKED
        record.last_action = "block"
        record.last_action_at = datetime.utcnow()
    return result


async def unblock_device(record: DeviceRecord) -> ActionResult:
    api = record.app.lower()
    result = await _call_gateway(api, "unblock", record.num_cred, record.identif)
    if result.success:
        record.gateway = GatewayStatus.UNLOCKED
        record.last_action = "unblock"
        record.last_action_at = datetime.utcnow()
    return result


async def apply_automation_rules(records: List[DeviceRecord]) -> List[ActionResult]:
    """
    Applies business logic to all records:
    - dias_mora = 0  → unblock if currently blocked
    - dias_mora = 1  → warning only, no action
    - dias_mora >= 2 → block if not already blocked
    """
    settings = get_settings()
    results: List[ActionResult] = []

    for record in records:
        if record.dias_mora <= settings.rule_days_unblock:
            # Should be unblocked
            if record.gateway == GatewayStatus.BLOCKED and settings.scheduler_auto_unblock:
                result = await unblock_device(record)
                results.append(result)

        elif record.dias_mora == settings.rule_days_warning:
            # Warning — log only
            if settings.scheduler_auto_warn:
                logger_service.add(
                    "sys",
                    f"⚠ ADVERTENCIA · {record.nombre} · num_cred: {record.num_cred} · 1 día mora · bloqueo pendiente",
                    "warn",
                    num_cred=record.num_cred,
                    identif=record.identif
                )

        elif record.dias_mora >= settings.rule_days_block:
            # Should be blocked
            if record.gateway == GatewayStatus.UNLOCKED and settings.scheduler_auto_block:
                result = await block_device(record)
                results.append(result)

    return results


async def test_connection(api: str) -> dict:
    """
    Test connection against:
    - Sadmin (Bearer login)
    - Nuovo (Basic Auth)
    - Knox (Basic Auth)
    """

    settings = get_settings()

    try:

        # ─────────────────────────────────────────
        # SADMIN
        # ─────────────────────────────────────────
        if api == "sadmin":

            payload = {
                "username": settings.sadmin_user,
                "password": settings.sadmin_password
            }

            async with httpx.AsyncClient(timeout=15.0) as client:

                # LOGIN

                login_resp = await client.post(
                    settings.sadmin_login_url,
                    json={
                        "username": settings.sadmin_user,
                        "password": settings.sadmin_password
                    },
                    headers={
                        "Content-Type": "application/json"
                    }
                )

                login_resp.raise_for_status()

                token_data = login_resp.json()

                access_token = (
                    token_data
                    .get("data", {})
                    .get("token")
                )

                if not access_token:
                    return {
                        "success": False,
                        "status_code": 401,
                        "message": "No access_token received"
                    }

                # TEST REPORT
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }

                report_payload = {
                    "reportid": settings.sadmin_credit_report_id,
                    "start_date": "2026-01-01",
                    "end_date": "2026-05-31",
                    "balance_type": settings.sadmin_balance_type,
                    "credit_type": settings.sadmin_credit_type,
                    "branch": settings.sadmin_branch,
                    "client_group": "ALL",
                    "advisorid": "ALL",
                    "investorid": "ALL"
                }

                report_resp = await client.post(
                    settings.sadmin_reports_url,
                    headers=headers,
                    json=report_payload
                )

                ok = report_resp.status_code < 500

                logger_service.add(
                    "sadmin",
                    f"Sadmin test → HTTP {report_resp.status_code}",
                    "ok" if ok else "err"
                )

                return {
                    "success": ok,
                    "status_code": report_resp.status_code,
                    "message": f"HTTP {report_resp.status_code}"
                }

        # ─────────────────────────────────────────
        # NUOVO
        # ─────────────────────────────────────────
        elif api == "nuovo":

            headers = _basic_auth(
                settings.nuovo_user,
                settings.nuovo_password
            )

            url = f"{settings.nuovo_base_url}{settings.nuovo_ep_block}"

            async with httpx.AsyncClient(timeout=10.0) as client:

                resp = await client.get(url, headers=headers)

                ok = resp.status_code < 500

                return {
                    "success": ok,
                    "status_code": resp.status_code,
                    "message": f"HTTP {resp.status_code}"
                }

        # ─────────────────────────────────────────
        # KNOX
        # ─────────────────────────────────────────
        else:

            headers = _basic_auth(
                settings.knox_user,
                settings.knox_password
            )

            url = f"{settings.knox_base_url}{settings.knox_ep_block}"

            async with httpx.AsyncClient(timeout=10.0) as client:

                resp = await client.get(url, headers=headers)

                ok = resp.status_code < 500

                return {
                    "success": ok,
                    "status_code": resp.status_code,
                    "message": f"HTTP {resp.status_code}"
                }

    except Exception as e:

        msg = str(e)[:120]

        logger_service.add(
            api,
            f"Test conexión → ERROR · {msg}",
            "err"
        )

        return {
            "success": False,
            "status_code": None,
            "message": msg
        }