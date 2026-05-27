from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class GatewayStatus(str, Enum):
    UNLOCKED = "unlocked"
    BLOCKED = "blocked"


class CreditStatus(str, Enum):
    OK = "ok"
    WARNING = "warning"
    BLOCKED = "blocked"


# ─── Sadmin models ────────────────────────────────────────────────────────────

class SadminCredit(BaseModel):
    """Maps directly to Sadmin /reportes/listado-credito data[] items"""
    identif: str
    nombre: str
    num_cred: str
    nom_tipocred: str
    monto_ini: Optional[float] = None
    saldo_cap_corte: Optional[float] = None
    saldo_cap_hoy: Optional[float] = None
    fecha_ini: Optional[str] = None
    num_cuotas: Optional[int] = None
    tasa: Optional[float] = None
    pendientes: Optional[int] = None
    subempresa: Optional[str] = None
    formapago: Optional[str] = None
    numdoc: Optional[str] = None
    id_asesor: Optional[str] = None
    nom_asesor: Optional[str] = None


class SadminMora(BaseModel):
    """Maps directly to Sadmin /reportes/moras/{identif} data[] items"""
    num_cred: str
    mora_total: float
    dias_mora: int


class SadminCreditsResponse(BaseModel):
    success: bool
    status: int
    variables: Optional[dict] = None
    data: List[SadminCredit] = []


class SadminMorasResponse(BaseModel):
    success: bool
    status: int
    data: List[SadminMora] = []


# ─── Device / Credit enriched model ──────────────────────────────────────────

class DeviceRecord(BaseModel):
    """Enriched record: Sadmin credit + mora data + gateway state"""
    identif: str
    nombre: str
    num_cred: str
    nom_tipocred: str
    app: str = "Knox"               # Nuovo or Knox — set from core/mapping
    dias_mora: int = 0
    mora_total: float = 0.0
    credit_status: CreditStatus = CreditStatus.OK
    gateway: GatewayStatus = GatewayStatus.UNLOCKED
    saldo_cap_hoy: Optional[float] = None
    fecha_ini: Optional[str] = None
    last_action: Optional[str] = None
    last_action_at: Optional[datetime] = None
    last_synced_at: Optional[datetime] = None


# ─── Action models ────────────────────────────────────────────────────────────

class ActionRequest(BaseModel):
    num_cred: str
    identif: str
    app: str  # "Nuovo" | "Knox"
    action: str  # "block" | "unblock"


class BulkActionRequest(BaseModel):
    num_creds: List[str]
    action: str  # "block" | "unblock"


class ActionResult(BaseModel):
    num_cred: str
    identif: str
    app: str
    action: str
    success: bool
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ─── Log entry ────────────────────────────────────────────────────────────────

class LogEntry(BaseModel):
    id: int
    timestamp: datetime
    source: str       # "sadmin" | "nuovo" | "knox" | "sys"
    message: str
    level: str        # "info" | "ok" | "warn" | "err"
    num_cred: Optional[str] = None
    identif: Optional[str] = None


# ─── Sync / Automation result ─────────────────────────────────────────────────

class SyncResult(BaseModel):
    success: bool
    total_credits: int
    blocked: int
    unblocked: int
    warnings: int
    errors: int
    duration_ms: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    actions: List[ActionResult] = []


# ─── Settings update ──────────────────────────────────────────────────────────

class ApiConfig(BaseModel):
    base_url: str
    user: str
    password: Optional[str] = None  # None = don't update


class RulesConfig(BaseModel):
    days_unblock: int = 0
    days_warning: int = 1
    days_block: int = 2


class SchedulerConfig(BaseModel):
    interval_minutes: int = 15
    auto_block: bool = True
    auto_unblock: bool = True
    auto_warn: bool = True


class SettingsUpdate(BaseModel):
    sadmin: Optional[ApiConfig] = None
    nuovo: Optional[ApiConfig] = None
    knox: Optional[ApiConfig] = None
    rules: Optional[RulesConfig] = None
    scheduler: Optional[SchedulerConfig] = None


# ─── Dashboard metrics ────────────────────────────────────────────────────────

class DashboardMetrics(BaseModel):
    total: int
    ok: int
    warning: int
    blocked: int
    mora_total_sum: float
    last_sync: Optional[datetime] = None