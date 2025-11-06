"""Query history API endpoints."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.query_history import QueryHistory as QueryHistoryModel
from app.schemas.query_history import QueryHistory as QueryHistoryResponse

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


@router.get("/workspaces/{workspace_id}/query-history", response_model=list[QueryHistoryResponse])
async def list_query_history(
    workspace_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list[QueryHistoryModel]:
    """List query execution history for a workspace."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get query history
    result = await db.execute(
        select(QueryHistoryModel)
        .where(QueryHistoryModel.workspace_id == workspace_id)
        .order_by(desc(QueryHistoryModel.executed_at))
        .limit(limit)
        .offset(offset)
    )
    history = result.scalars().all()

    return list(history)


@router.get("/workspaces/{workspace_id}/query-history/{history_id}", response_model=QueryHistoryResponse)
async def get_query_history(
    workspace_id: uuid.UUID,
    history_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> QueryHistoryModel:
    """Get a specific query history entry."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get history entry
    result = await db.execute(
        select(QueryHistoryModel).where(
            QueryHistoryModel.id == history_id,
            QueryHistoryModel.workspace_id == workspace_id,
        )
    )
    history = result.scalar_one_or_none()

    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query history entry not found",
        )

    return history


@router.delete("/workspaces/{workspace_id}/query-history/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_query_history(
    workspace_id: uuid.UUID,
    history_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a query history entry."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get history entry
    result = await db.execute(
        select(QueryHistoryModel).where(
            QueryHistoryModel.id == history_id,
            QueryHistoryModel.workspace_id == workspace_id,
        )
    )
    history = result.scalar_one_or_none()

    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query history entry not found",
        )

    await db.delete(history)
    await db.commit()
