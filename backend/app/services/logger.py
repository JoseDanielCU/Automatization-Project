from datetime import datetime
from typing import List, Optional
from app.models.schemas import LogEntry
import threading


class LoggerService:
    def __init__(self, max_entries: int = 500):
        self._entries: List[LogEntry] = []
        self._counter = 0
        self._lock = threading.Lock()
        self._max = max_entries

    def add(
        self,
        source: str,
        message: str,
        level: str = "info",
        num_cred: Optional[str] = None,
        identif: Optional[str] = None,
    ) -> LogEntry:
        with self._lock:
            self._counter += 1
            entry = LogEntry(
                id=self._counter,
                timestamp=datetime.utcnow(),
                source=source,
                message=message,
                level=level,
                num_cred=num_cred,
                identif=identif,
            )
            self._entries.insert(0, entry)
            if len(self._entries) > self._max:
                self._entries = self._entries[: self._max]
            return entry

    def get_all(
        self,
        source: Optional[str] = None,
        level: Optional[str] = None,
        limit: int = 200,
    ) -> List[LogEntry]:
        with self._lock:
            entries = self._entries
            if source and source != "all":
                entries = [e for e in entries if e.source == source]
            if level and level != "all":
                entries = [e for e in entries if e.level == level]
            return entries[:limit]

    def clear(self):
        with self._lock:
            self._entries = []
            self._counter = 0


# Singleton
logger_service = LoggerService()