from typing import List
from fastapi import APIRouter
from services.api.app.schemas.dto import ToolStatus
from services.api.app.integrations.tool_checker import check_all_tools

router = APIRouter()

@router.get("", response_model=List[ToolStatus])
def get_tools_status():
    raw = check_all_tools()
    return [ToolStatus(**t) for t in raw]
