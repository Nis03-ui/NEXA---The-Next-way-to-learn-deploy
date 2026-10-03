import asyncio

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.user import User, Role


EMAIL = "admin07@email.com"


async def main():
    async with SessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == EMAIL)
        )

        user = result.scalar_one_or_none()

        if not user:
            print(f"User not found: {EMAIL}")
            return

        user.role = Role.ADMIN

        await db.commit()
        await db.refresh(user)

        print("Admin created successfully")
        print(f"ID: {user.id}")
        print(f"Name: {user.name}")
        print(f"Email: {user.email}")
        print(f"Role: {user.role.value}")


asyncio.run(main())
