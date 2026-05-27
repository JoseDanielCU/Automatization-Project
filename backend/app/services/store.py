from typing import Dict, List, Optional
from datetime import datetime
import threading

from app.models.schemas import DeviceRecord, DashboardMetrics, CreditStatus, GatewayStatus


class DeviceStore:
    """
    In-memory store for all device/credit records.
    Thread-safe for concurrent scheduler + API access.
    """

    def __init__(self):
        self._records: Dict[str, DeviceRecord] = {}  # keyed by num_cred
        self._lock = threading.RLock()
        self._last_sync: Optional[datetime] = None

    def update_all(self, records: List[DeviceRecord]):
        with self._lock:
            self._records = {r.num_cred: r for r in records}
            self._last_sync = datetime.utcnow()

    def get_all(self) -> List[DeviceRecord]:
        with self._lock:
            return list(self._records.values())

    def get_by_num_cred(self, num_cred: str) -> Optional[DeviceRecord]:
        with self._lock:
            return self._records.get(num_cred)

    def get_as_dict(self) -> Dict[str, DeviceRecord]:
        with self._lock:
            return dict(self._records)

    def update_record(self, record: DeviceRecord):
        with self._lock:
            self._records[record.num_cred] = record

    def metrics(self) -> DashboardMetrics:
        with self._lock:
            records = list(self._records.values())
            return DashboardMetrics(
                total=len(records),
                ok=sum(1 for r in records if r.credit_status == CreditStatus.OK),
                warning=sum(1 for r in records if r.credit_status == CreditStatus.WARNING),
                blocked=sum(1 for r in records if r.credit_status == CreditStatus.BLOCKED),
                mora_total_sum=sum(r.mora_total for r in records),
                last_sync=self._last_sync,
            )

    @property
    def last_sync(self) -> Optional[datetime]:
        return self._last_sync


# Singleton
device_store = DeviceStore()