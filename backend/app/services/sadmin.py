import asyncio
import httpx

from typing import List, Optional, Tuple
from datetime import datetime

from app.core.config import get_settings
from app.models.schemas import (
    SadminCredit,
    SadminMora,
    DeviceRecord,
    CreditStatus,
    GatewayStatus,
)
from app.services.logger import logger_service


# ─────────────────────────────────────────────
# Shared HTTP client (keep-alive + pooling)
# ─────────────────────────────────────────────

client = httpx.AsyncClient(
    timeout=30.0,
    limits=httpx.Limits(
        max_connections=20,
        max_keepalive_connections=10
    )
)


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

async def get_sadmin_token() -> Optional[str]:

    settings = get_settings()

    try:

        logger_service.add(
            "sadmin",
            "POST /security/login · Solicitando token...",
            "info"
        )

        resp = await client.post(
            settings.sadmin_login_url,
            json={
                "username": settings.sadmin_user,
                "password": settings.sadmin_password
            },
            headers={
                "Content-Type": "application/json"
            }
        )

        resp.raise_for_status()

        data = resp.json()

        token = data.get("data", {}).get("token")

        if not token:

            logger_service.add(
                "sadmin",
                "No se recibió token",
                "err"
            )

            return None

        logger_service.add(
            "sadmin",
            f"Token obtenido · {token[:25]}...",
            "ok"
        )

        return token

    except Exception as e:

        logger_service.add(
            "sadmin",
            f"Error autenticando · {str(e)[:120]}",
            "err"
        )

        return None


# ─────────────────────────────────────────────
# CREDITS
# ─────────────────────────────────────────────

async def fetch_credits(
    token: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[SadminCredit]:
    """
    start_date / end_date en formato YYYY-MM-DD.
    Si no se proveen, se usa el mes en curso completo.
    """
    from datetime import date

    settings = get_settings()

    today = date.today()
    default_start = today.replace(day=1).strftime("%Y-%m-%d")
    default_end = today.strftime("%Y-%m-%d")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "reportid": settings.sadmin_credit_report_id,
        "start_date": start_date or default_start,
        "end_date": end_date or default_end,
        "balance_type": settings.sadmin_balance_type,
        "credit_type": settings.sadmin_credit_type,
        "branch": settings.sadmin_branch,
        "client_group": settings.sadmin_client_group,
        "advisorid": settings.sadmin_advisor_id,
        "investorid": settings.sadmin_investor_id
    }

    logger_service.add(
        "sadmin",
        "POST generate_report · Consultando créditos...",
        "info"
    )

    try:

        resp = await client.post(
            settings.sadmin_reports_url,
            headers=headers,
            json=payload
        )

        resp.raise_for_status()

        data = resp.json()

        credits = [
            SadminCredit(**item)
            for item in data.get("data", [])
        ]

        logger_service.add(
            "sadmin",
            f"Créditos obtenidos · {len(credits)} registros",
            "ok"
        )

        return credits

    except Exception as e:

        logger_service.add(
            "sadmin",
            f"ERROR créditos · {str(e)[:120]}",
            "err"
        )

        raise


# ─────────────────────────────────────────────
# MORAS
# ─────────────────────────────────────────────

async def fetch_moras(
    identif: str,
    token: str
) -> List[SadminMora]:

    settings = get_settings()

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "reportid": settings.sadmin_mora_report_id,
        "cutoff_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "number_of_decimals": 0,
        "identif": identif
    }

    try:

        resp = await client.post(
            settings.sadmin_reports_url,
            headers=headers,
            json=payload
        )

        resp.raise_for_status()

        data = resp.json()

        moras = [
            SadminMora(**item)
            for item in data.get("data", [])
        ]

        logger_service.add(
            "sadmin",
            f"Moras consultadas · identif {identif} · {len(moras)} registros",
            "info"
        )

        return moras

    except Exception as e:

        logger_service.add(
            "sadmin",
            f"ERROR moras {identif} · {str(e)[:120]}",
            "err"
        )

        return []


# ─────────────────────────────────────────────
# CLASSIFICATION
# ─────────────────────────────────────────────

def _classify(dias_mora: int) -> CreditStatus:

    settings = get_settings()

    if dias_mora <= settings.rule_days_unblock:
        return CreditStatus.OK

    elif dias_mora == settings.rule_days_warning:
        return CreditStatus.WARNING

    return CreditStatus.BLOCKED


# ─────────────────────────────────────────────
# APP ASSIGNMENT
# ─────────────────────────────────────────────

def _assign_app(
    num_cred: str,
    subempresa: Optional[str] = None
) -> str:

    try:

        last = int(num_cred[-1])

        return "Knox" if last % 2 == 0 else "Nuovo"

    except Exception:

        return "Knox"


# ─────────────────────────────────────────────
# PIPELINE
# ─────────────────────────────────────────────

async def build_device_records(
    existing_records: dict,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Tuple[List[DeviceRecord], dict]:

    started_at = datetime.utcnow()

    # ─────────────────────────────────────────
    # TOKEN
    # ─────────────────────────────────────────

    token = await get_sadmin_token()

    if not token:

        logger_service.add(
            "sadmin",
            "No se pudo obtener token",
            "err"
        )

        return [], {}

    # ─────────────────────────────────────────
    # CREDITS
    # ─────────────────────────────────────────

    credits = await fetch_credits(token, start_date=start_date, end_date=end_date)

    logger_service.add(
        "sadmin",
        f"Procesando {len(credits)} créditos...",
        "info"
    )

    # ─────────────────────────────────────────
    # GROUP BY IDENTIF
    # ─────────────────────────────────────────

    identif_map: dict[str, List[SadminCredit]] = {}

    for c in credits:
        identif_map.setdefault(c.identif, []).append(c)

    logger_service.add(
        "sadmin",
        f"{len(identif_map)} identificaciones únicas",
        "info"
    )

    # ─────────────────────────────────────────
    # CONCURRENT MORA FETCH
    # ─────────────────────────────────────────

    semaphore = asyncio.Semaphore(10)

    async def fetch_with_limit(identif: str):

        async with semaphore:
            return await fetch_moras(identif, token)

    tasks = [
        fetch_with_limit(identif)
        for identif in identif_map.keys()
    ]

    results = await asyncio.gather(
        *tasks,
        return_exceptions=True
    )

    # ─────────────────────────────────────────
    # BUILD MORA LOOKUP
    # ─────────────────────────────────────────

    mora_lookup: dict[str, SadminMora] = {}

    for moras in results:

        if isinstance(moras, Exception):
            continue

        for m in moras:
            mora_lookup[m.num_cred] = m

    # ─────────────────────────────────────────
    # BUILD RECORDS
    # ─────────────────────────────────────────

    records: List[DeviceRecord] = []

    for c in credits:

        mora = mora_lookup.get(c.num_cred)

        dias_mora = mora.dias_mora if mora else 0
        mora_total = mora.mora_total if mora else 0.0

        status = _classify(dias_mora)

        prev = existing_records.get(c.num_cred)

        gateway = (
            prev.gateway
            if prev
            else (
                GatewayStatus.BLOCKED
                if status == CreditStatus.BLOCKED
                else GatewayStatus.UNLOCKED
            )
        )

        record = DeviceRecord(
            identif=c.identif,
            nombre=c.nombre,
            num_cred=c.num_cred,
            nom_tipocred=c.nom_tipocred,
            app=_assign_app(c.num_cred, c.subempresa),
            dias_mora=dias_mora,
            mora_total=mora_total,
            credit_status=status,
            gateway=gateway,
            saldo_cap_hoy=c.saldo_cap_hoy,
            fecha_ini=c.fecha_ini,
            last_action=prev.last_action if prev else None,
            last_action_at=prev.last_action_at if prev else None,
            last_synced_at=datetime.utcnow()
        )

        records.append(record)

    # ─────────────────────────────────────────
    # FINAL LOG
    # ─────────────────────────────────────────

    elapsed_ms = int(
        (datetime.utcnow() - started_at).total_seconds() * 1000
    )

    logger_service.add(
        "sys",
        f"Sync completa · "
        f"{len(records)} registros · "
        f"OK: {sum(1 for r in records if r.credit_status == CreditStatus.OK)} · "
        f"Warning: {sum(1 for r in records if r.credit_status == CreditStatus.WARNING)} · "
        f"Blocked: {sum(1 for r in records if r.credit_status == CreditStatus.BLOCKED)} · "
        f"{elapsed_ms}ms",
        "ok"
    )

    return records, mora_lookup