"""Simple authentication router for hackathon demo."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

# Hardcoded credentials for demo
DEMO_EMAIL = "admin@forge.com"
DEMO_PASSWORD = "password123"
DEMO_TOKEN = "forge_demo_token_secure_123"

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(body: LoginRequest):
    """Simple login with hardcoded credentials."""
    if body.email == DEMO_EMAIL and body.password == DEMO_PASSWORD:
        return {
            "success": True,
            "token": DEMO_TOKEN,
            "user": {
                "email": DEMO_EMAIL,
                "name": "Forge Admin"
            }
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password"
    )
