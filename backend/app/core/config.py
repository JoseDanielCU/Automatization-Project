from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):

    # ─── Sadmin ─────────────────────────────
    sadmin_login_url: str = "https://security.sadmin.net/security/login"
    sadmin_reports_url: str = "https://reports.sadmin.net/api/generate_report"

    sadmin_user: str = ""
    sadmin_password: str = ""

    sadmin_credit_report_id: str = "LOAN_LIST"
    sadmin_mora_report_id: str = "TOTAL_DEFAULT_BY_DEBTOR"
    sadmin_balance_type: str = "-1"
    sadmin_credit_type: str = "ALL"
    sadmin_branch: str = "ALL"
    sadmin_client_group: str = "ALL"
    sadmin_advisor_id: str = "ALL"
    sadmin_investor_id: str = "ALL"

    # ─── Nuovo ──────────────────────────────
    nuovo_base_url: str = "https://api.nuovo.net/v2"
    nuovo_user: str = ""
    nuovo_password: str = ""
    nuovo_ep_block: str = "/device/block"
    nuovo_ep_unblock: str = "/device/unblock"

    # ─── Knox ───────────────────────────────
    knox_base_url: str = "https://api.knox.net/v1"
    knox_user: str = ""
    knox_password: str = ""
    knox_ep_block: str = "/mdm/restrict"
    knox_ep_unblock: str = "/mdm/allow"

    # ─── Rules ──────────────────────────────
    rule_days_unblock: int = 0
    rule_days_warning: int = 1
    rule_days_block: int = 2

    # ─── Scheduler ──────────────────────────
    scheduler_interval_minutes: int = 15
    scheduler_auto_block: bool = True
    scheduler_auto_unblock: bool = True
    scheduler_auto_warn: bool = True

    # ─── App ────────────────────────────────
    app_secret_key: str = "change_this_in_production"
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings():
    return Settings()