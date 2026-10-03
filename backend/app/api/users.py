from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import ProfileUpdateRequest, UserOut


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "/me",
    response_model=UserOut,
)
async def me(
    user: User = Depends(current_user),
):
    return user


@router.patch(
    "/me",
    response_model=UserOut,
)
async def update_me(
    data: ProfileUpdateRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.name is not None:
        user.name = data.name.strip()

    if data.email is not None:
        new_email = str(data.email).lower().strip()

        if new_email != user.email:
            existing_user = (
                await db.execute(
                    select(User).where(
                        User.email == new_email,
                        User.id != user.id,
                    )
                )
            ).scalar_one_or_none()

            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already exists",
                )

            user.email = new_email

    await db.commit()
    await db.refresh(user)

    return user