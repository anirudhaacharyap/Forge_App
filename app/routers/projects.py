"""Projects router — saving and retrieving material analysis results."""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime

from app.db.mongo import get_db
from app.routers.auth import DEMO_TOKEN

router = APIRouter()

async def get_current_user(authorization: str = Header(None)):
    """Simple dependency to verify the hardcoded demo token."""
    if not authorization or authorization != f"Bearer {DEMO_TOKEN}":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication token"
        )
    return {"email": "admin@forge.com", "name": "Forge Admin"}

@router.post("/save")
async def save_project(
    data: dict, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Save a material analysis result to the database."""
    project_doc = {
        "user_email": user["email"],
        "created_at": datetime.utcnow(),
        "analysis_data": data
    }
    
    result = await db["projects"].insert_one(project_doc)
    
    return {
        "success": True,
        "project_id": str(result.inserted_id),
        "message": "Project saved successfully"
    }

@router.get("/list")
async def list_projects(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Retrieve all saved projects for the current user."""
    cursor = db["projects"].find({"user_email": user["email"]}).sort("created_at", -1)
    projects = await cursor.to_list(length=100)
    
    for p in projects:
        p["_id"] = str(p["_id"])
        
    return {
        "success": True,
        "projects": projects
    }
