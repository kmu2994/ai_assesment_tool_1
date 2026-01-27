"""
Authentication API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from typing import List

from app.db.database import get_db
from app.db.models import User
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token, oauth2_scheme
from app.core.config import settings
from .schemas import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check existing username
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check existing email
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role.value,
        accessibility_mode=user_data.accessibility_mode
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Login and get access token. Accepts username or email."""
    # Try to find user by username first, then by email
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    
    # If not found by username, try email
    if not user:
        result = await db.execute(select(User).where(User.email == form_data.username))
        user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(access_token=access_token, user=UserResponse.model_validate(user))

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """Get current authenticated user."""
    payload = decode_token(token)
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return current_user

def require_role(allowed_roles: list):
    """Dependency to check user role."""
    async def role_checker(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ============== ADMIN ONLY ROUTES ==============

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(require_role(["admin", "teacher"]))
):
    """List all users (Admin/Teacher only)."""
    result = await db.execute(select(User))
    return result.scalars().all()

@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int, 
    new_role: str,
    db: AsyncSession = Depends(get_db), 
    admin: User = Depends(require_role(["admin", "teacher"]))
):
    """Update a user's role (Admin/Teacher only)."""
    if new_role not in ["student", "teacher", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Teachers can only manage students
    if admin.role == "teacher" and (user.role != "student" or new_role != "student"):
        if user.role != "student":
             raise HTTPException(status_code=403, detail="Teachers can only manage student roles")
        if new_role not in ["student"]:
             raise HTTPException(status_code=403, detail="Teachers can only assign student roles")
        
    user.role = new_role
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int, 
    db: AsyncSession = Depends(get_db), 
    admin: User = Depends(require_role(["admin"]))
):
    """Delete a user (Admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent self-deletion
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Admins cannot delete themselves")
        
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully"}
