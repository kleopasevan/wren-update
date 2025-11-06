"""Scheduled queries API endpoints."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.scheduled_query import ScheduledQuery
from app.schemas.scheduled_query import (
    ScheduledQueryCreate,
    ScheduledQueryUpdate,
    ScheduledQuery as ScheduledQueryResponse,
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


@router.get("/workspaces/{workspace_id}/scheduled-queries", response_model=list[ScheduledQueryResponse])
async def list_scheduled_queries(
    workspace_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ScheduledQuery]:
    """List all scheduled queries for a workspace."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get scheduled queries
    result = await db.execute(
        select(ScheduledQuery)
        .where(ScheduledQuery.workspace_id == workspace_id)
        .order_by(ScheduledQuery.created_at.desc())
    )
    queries = result.scalars().all()

    return list(queries)


@router.post("/workspaces/{workspace_id}/scheduled-queries", response_model=ScheduledQueryResponse, status_code=status.HTTP_201_CREATED)
async def create_scheduled_query(
    workspace_id: uuid.UUID,
    query_data: ScheduledQueryCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ScheduledQuery:
    """Create a new scheduled query."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Validate query data
    if query_data.schedule_type == "cron" and not query_data.cron_expression:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cron expression is required for cron schedule type",
        )
    if query_data.schedule_type == "interval" and not query_data.interval_minutes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interval minutes is required for interval schedule type",
        )
    if query_data.query_type == "visual" and not query_data.query_definition:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query definition is required for visual query type",
        )
    if query_data.query_type == "sql" and not query_data.sql:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SQL is required for sql query type",
        )

    # Create scheduled query
    scheduled_query = ScheduledQuery(
        workspace_id=workspace_id,
        connection_id=uuid.UUID(query_data.connection_id),
        name=query_data.name,
        description=query_data.description,
        query_type=query_data.query_type,
        query_definition=query_data.query_definition,
        sql=query_data.sql,
        schedule_type=query_data.schedule_type,
        cron_expression=query_data.cron_expression,
        interval_minutes=query_data.interval_minutes,
        recipients=query_data.recipients,
        subject=query_data.subject,
        format=query_data.format,
        enabled=query_data.enabled,
        created_by=current_user.id,
    )

    db.add(scheduled_query)
    await db.commit()
    await db.refresh(scheduled_query)

    return scheduled_query


@router.get("/workspaces/{workspace_id}/scheduled-queries/{query_id}", response_model=ScheduledQueryResponse)
async def get_scheduled_query(
    workspace_id: uuid.UUID,
    query_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ScheduledQuery:
    """Get a scheduled query by ID."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get scheduled query
    result = await db.execute(
        select(ScheduledQuery).where(
            ScheduledQuery.id == query_id,
            ScheduledQuery.workspace_id == workspace_id
        )
    )
    scheduled_query = result.scalar_one_or_none()

    if not scheduled_query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled query not found",
        )

    return scheduled_query


@router.patch("/workspaces/{workspace_id}/scheduled-queries/{query_id}", response_model=ScheduledQueryResponse)
async def update_scheduled_query(
    workspace_id: uuid.UUID,
    query_id: uuid.UUID,
    query_data: ScheduledQueryUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ScheduledQuery:
    """Update a scheduled query."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get scheduled query
    result = await db.execute(
        select(ScheduledQuery).where(
            ScheduledQuery.id == query_id,
            ScheduledQuery.workspace_id == workspace_id
        )
    )
    scheduled_query = result.scalar_one_or_none()

    if not scheduled_query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled query not found",
        )

    # Update fields
    update_data = query_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "connection_id" and value:
            setattr(scheduled_query, field, uuid.UUID(value))
        else:
            setattr(scheduled_query, field, value)

    await db.commit()
    await db.refresh(scheduled_query)

    return scheduled_query


@router.delete("/workspaces/{workspace_id}/scheduled-queries/{query_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scheduled_query(
    workspace_id: uuid.UUID,
    query_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a scheduled query."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get scheduled query
    result = await db.execute(
        select(ScheduledQuery).where(
            ScheduledQuery.id == query_id,
            ScheduledQuery.workspace_id == workspace_id
        )
    )
    scheduled_query = result.scalar_one_or_none()

    if not scheduled_query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled query not found",
        )

    await db.delete(scheduled_query)
    await db.commit()
