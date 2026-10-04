from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import current_user
from app.db.session import get_db
from app.models.user import User
from app.models.user_profile import UserProfile
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
    db: AsyncSession = Depends(get_db),
):
    profile = (await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )).scalar_one_or_none()

    if profile is None:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar_url": profile.avatar_url,
        "bio": profile.bio,
        "linkedin_url": profile.linkedin_url,
        "github_url": profile.github_url,
        "portfolio_url": profile.portfolio_url,
        "twitter_url": profile.twitter_url,
    }


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

    profile = (await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )).scalar_one_or_none()

    if profile is None:
        profile = UserProfile(user_id=user.id)
        db.add(profile)

    profile_fields = (
        "avatar_url",
        "bio",
        "linkedin_url",
        "github_url",
        "portfolio_url",
        "twitter_url",
    )
    for field in profile_fields:
        value = getattr(data, field)
        if value is not None:
            setattr(profile, field, value.strip() or None)

    await db.commit()
    await db.refresh(profile)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar_url": profile.avatar_url,
        "bio": profile.bio,
        "linkedin_url": profile.linkedin_url,
        "github_url": profile.github_url,
        "portfolio_url": profile.portfolio_url,
        "twitter_url": profile.twitter_url,
    }