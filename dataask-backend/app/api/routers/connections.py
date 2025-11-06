"""Connection API endpoints."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.connection import Connection
from app.schemas.connection import (
    ConnectionCreate,
    ConnectionResponse,
    ConnectionUpdate,
    ConnectionTestResponse,
)
from app.services.connection_service import ConnectionService

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

    # Check if user owns workspace (will add member check later)
    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this workspace",
        )

    return workspace


@router.get("/workspaces/{workspace_id}/connections", response_model=list[ConnectionResponse])
async def list_connections(
    workspace_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Connection]:
    """List all connections for a workspace."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get connections
    connection_service = ConnectionService(db)
    connections = await connection_service.list_connections(workspace_id)

    # Mask sensitive fields in connection_info for each connection
    for connection in connections:
        connection.connection_info = connection_service.get_connection_info_for_response(connection)

    return connections


@router.post("/workspaces/{workspace_id}/connections", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_connection(
    workspace_id: uuid.UUID,
    connection_data: ConnectionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Connection:
    """Create a new database connection."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Validate workspace_id matches route parameter
    if connection_data.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace ID in request body does not match route parameter",
        )

    # Create connection
    connection_service = ConnectionService(db)
    connection = await connection_service.create_connection(
        workspace_id=workspace_id,
        name=connection_data.name,
        type=connection_data.type,
        connection_info=connection_data.connection_info,
        user_id=current_user.id,
        description=connection_data.description,
        settings=connection_data.settings,
    )

    # Mask sensitive fields
    connection.connection_info = connection_service.get_connection_info_for_response(connection)

    return connection


@router.get("/workspaces/{workspace_id}/connections/{connection_id}", response_model=ConnectionResponse)
async def get_connection(
    workspace_id: uuid.UUID,
    connection_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Connection:
    """Get a connection by ID."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get connection
    connection_service = ConnectionService(db)
    connection = await connection_service.get_connection(connection_id, workspace_id)

    # Mask sensitive fields
    connection.connection_info = connection_service.get_connection_info_for_response(connection)

    return connection


@router.patch("/workspaces/{workspace_id}/connections/{connection_id}", response_model=ConnectionResponse)
async def update_connection(
    workspace_id: uuid.UUID,
    connection_id: uuid.UUID,
    connection_data: ConnectionUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Connection:
    """Update a connection."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Update connection
    connection_service = ConnectionService(db)
    connection = await connection_service.update_connection(
        connection_id=connection_id,
        workspace_id=workspace_id,
        name=connection_data.name,
        description=connection_data.description,
        type=connection_data.type,
        connection_info=connection_data.connection_info,
        settings=connection_data.settings,
        status=connection_data.status,
    )

    # Mask sensitive fields
    connection.connection_info = connection_service.get_connection_info_for_response(connection)

    return connection


@router.delete("/workspaces/{workspace_id}/connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(
    workspace_id: uuid.UUID,
    connection_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a connection."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Delete connection
    connection_service = ConnectionService(db)
    await connection_service.delete_connection(connection_id, workspace_id)


@router.post("/workspaces/{workspace_id}/connections/{connection_id}/test", response_model=ConnectionTestResponse)
async def test_connection(
    workspace_id: uuid.UUID,
    connection_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Test a database connection."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Test connection
    connection_service = ConnectionService(db)
    result = await connection_service.test_connection(connection_id, workspace_id)

    return result


@router.get("/workspaces/{workspace_id}/connections/{connection_id}/tables")
async def get_tables(
    workspace_id: uuid.UUID,
    connection_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    """Get list of tables from a connection."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get tables
    connection_service = ConnectionService(db)
    tables = await connection_service.get_tables(connection_id, workspace_id)

    return tables


@router.get("/workspaces/{workspace_id}/connections/{connection_id}/constraints")
async def get_constraints(
    workspace_id: uuid.UUID,
    connection_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    """Get constraints from a connection."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get constraints
    connection_service = ConnectionService(db)
    constraints = await connection_service.get_constraints(connection_id, workspace_id)

    return constraints


@router.get("/workspaces/{workspace_id}/connections/{connection_id}/tables/{table_name}/preview")
async def preview_table(
    workspace_id: uuid.UUID,
    connection_id: uuid.UUID,
    table_name: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 10,
) -> dict:
    """Preview data from a table."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Preview table
    connection_service = ConnectionService(db)
    data = await connection_service.preview_table(
        connection_id, workspace_id, table_name, limit
    )

    return data
