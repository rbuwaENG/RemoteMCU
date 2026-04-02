"""
logger.py — File-based logger for the host-agent / tray app.

Writes logs to host-agent/logs/agent.log (auto-rotating at 5MB).
Also prints to stdout so docker / terminal runs still work.

Usage:
    from logger import get_logger
    log = get_logger(__name__)
    log.info("Agent started")
    log.error("Connection failed", exc_info=True)
"""

import logging
import logging.handlers
import sys
from pathlib import Path

LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_FILE = LOG_DIR / "agent.log"
MAX_BYTES = 5 * 1024 * 1024   # 5MB per file
BACKUP_COUNT = 3               # Keep 3 rotated files


def _setup_root_logger():
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    root = logging.getLogger()
    root.setLevel(logging.DEBUG)

    fmt = logging.Formatter(
        fmt="%(asctime)s [%(levelname)-8s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # ── File handler (rotating) ────────────────────────────────────────────
    file_handler = logging.handlers.RotatingFileHandler(
        LOG_FILE,
        maxBytes=MAX_BYTES,
        backupCount=BACKUP_COUNT,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(fmt)
    root.addHandler(file_handler)

    # ── Console handler ────────────────────────────────────────────────────
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(fmt)
    root.addHandler(console_handler)


_setup_root_logger()


def get_logger(name: str) -> logging.Logger:
    """Return a named logger that writes to both file and stdout."""
    return logging.getLogger(name)
