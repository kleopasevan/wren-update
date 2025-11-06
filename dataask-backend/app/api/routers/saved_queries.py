"""Saved query API endpoints."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.saved_query import SavedQuery
from app.schemas.saved_query import (
    SavedQueryCreate,
    SavedQuery as SavedQueryResponse,
    SavedQueryUpdate,
)

router = APIRouter()


async def get_workspace_and_check_permission(
    workspace_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Workspace:
    """Get workspace and check if user has permission to access it."""
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    # Check if user owns workspace
    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this workspace",
        )

    return workspace


@router.get("/workspaces/{workspace_id}/saved-queries", response_model=list[SavedQueryResponse])
async def list_saved_queries(
    workspace_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[SavedQuery]:
    """List all saved queries for a workspace."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get saved queries
    result = await db.execute(
        select(SavedQuery)
        .where(SavedQuery.workspace_id == workspace_id)
        .order_by(SavedQuery.created_at.desc())
    )
    saved_queries = result.scalars().all()

    return list(saved_queries)


@router.post(
    "/workspaces/{workspace_id}/saved-queries",
    response_model=SavedQueryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_saved_query(
    workspace_id: uuid.UUID,
    saved_query_data: SavedQueryCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SavedQuery:
    """Create a new saved query."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Create saved query
    saved_query = SavedQuery(
        workspace_id=workspace_id,
        name=saved_query_data.name,
        description=saved_query_data.description,
        connection_id=saved_query_data.connection_id,
        query=saved_query_data.query,
        tags=saved_query_data.tags or [],
        created_by=current_user.id,
    )

    db.add(saved_query)
    await db.commit()
    await db.refresh(saved_query)

    return saved_query


@router.get("/workspaces/{workspace_id}/saved-queries/{query_id}", response_model=SavedQueryResponse)
async def get_saved_query(
    workspace_id: uuid.UUID,
    query_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SavedQuery:
    """Get a specific saved query."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get saved query
    result = await db.execute(
        select(SavedQuery).where(
            SavedQuery.id == query_id,
            SavedQuery.workspace_id == workspace_id,
        )
    )
    saved_query = result.scalar_one_or_none()

    if not saved_query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved query not found",
        )

    return saved_query


@router.patch("/workspaces/{workspace_id}/saved-queries/{query_id}", response_model=SavedQueryResponse)
async def update_saved_query(
    workspace_id: uuid.UUID,
    query_id: uuid.UUID,
    update_data: SavedQueryUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SavedQuery:
    """Update a saved query."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get saved query
    result = await db.execute(
        select(SavedQuery).where(
            SavedQuery.id == query_id,
            SavedQuery.workspace_id == workspace_id,
        )
    )
    saved_query = result.scalar_one_or_none()

    if not saved_query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved query not found",
        )

    # Update fields
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(saved_query, field, value)

    await db.commit()
    await db.refresh(saved_query)

    return saved_query


@router.delete("/workspaces/{workspace_id}/saved-queries/{query_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_query(
    workspace_id: uuid.UUID,
    query_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a saved query."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get saved query
    result = await db.execute(
        select(SavedQuery).where(
            SavedQuery.id == query_id,
            SavedQuery.workspace_id == workspace_id,
        )
    )
    saved_query = result.scalar_one_or_none()

    if not saved_query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved query not found",
        )

    await db.delete(saved_query)
    await db.commit()
