from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from services.api.app.core.database import get_db
from services.api.app.integrations.tool_checker import check_all_tools

router = APIRouter()

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    tools = check_all_tools()
    all_available = all(t["available"] for t in tools if t["tool"] == "genome-studio")

    return {
        "status": "healthy" if db_ok and all_available else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "engine": "ready" if all_available else "missing",
        "tools_summary": {t["tool"]: t["available"] for t in tools}
    }
