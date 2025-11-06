"""Script to create a superuser."""
import asyncio
import sys
from getpass import getpass

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.repositories.user_repository import UserRepository


async def create_superuser() -> None:
    """Create a superuser interactively."""
    print("=== Create Superuser ===\n")

    # Get user input
    email = input("Email: ").strip()
    if not email:
        print("Error: Email is required")
        sys.exit(1)

    full_name = input("Full name (optional): ").strip() or None

    password = getpass("Password: ")
    password_confirm = getpass("Confirm password: ")

    if password != password_confirm:
        print("Error: Passwords do not match")
        sys.exit(1)

    if len(password) < 8:
        print("Error: Password must be at least 8 characters")
        sys.exit(1)

    # Create database session
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        user_repo = UserRepository(session)

        # Check if user already exists
        existing_user = await user_repo.get_by_email(email)
        if existing_user:
            print(f"Error: User with email {email} already exists")
            await engine.dispose()
            sys.exit(1)

        # Create superuser
        hashed_password = get_password_hash(password)
        user = await user_repo.create(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            is_superuser=True,
        )

        print(f"\n✅ Superuser created successfully!")
        print(f"Email: {user.email}")
        print(f"Full name: {user.full_name}")
        print(f"ID: {user.id}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_superuser())
