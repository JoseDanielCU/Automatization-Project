from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.routers import devices, automation, logs, settings as settings_router
from app.services.scheduler import start_scheduler
from app.services.logger import logger_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger_service.add("sys", "Gateway Automation API iniciada · FastAPI + APScheduler", "ok")
    start_scheduler()
    yield
    # Shutdown
    logger_service.add("sys", "Gateway Automation API detenida", "warn")


app = FastAPI(
    title="Gateway Automation API",
    description="Automatización de bloqueo y desbloqueo de pasarelas de pago · Sadmin + Nuovo + Knox",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
cfg = get_settings()
origins = [o.strip() for o in cfg.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(devices.router, prefix="/api/v1")
app.include_router(automation.router, prefix="/api/v1")
app.include_router(logs.router, prefix="/api/v1")
app.include_router(settings_router.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": "Gateway Automation API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}