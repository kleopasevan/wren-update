"""Connection API endpoints."""
import uuid
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.connection import Connection
from app.models.query_history import QueryHistory
from app.schemas.connection import (
    ConnectionCreate,
    ConnectionResponse,
    ConnectionUpdate,
    ConnectionTestResponse,
)
from app.schemas.query import (
    QueryExecuteRequest,
    QueryExecuteResponse,
)
from app.schemas.ai_query import (
    TextToSQLRequest,
    TextToSQLResponse,
)
from app.services.connection_service import ConnectionService
from app.clients.wren_ai_client import wren_ai_client
from app.utils.parameters import substitute_parameters, substitute_sql

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


@router.post("/workspaces/{workspace_id}/connections/{connection_id}/query", response_model=QueryExecuteResponse)
async def execute_query(
    workspace_id: uuid.UUID,
    connection_id: uuid.UUID,
    request: QueryExecuteRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Execute a query (visual builder or raw SQL)."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    connection_service = ConnectionService(db)

    # Track execution time
    start_time = time.time()
    sql = None
    data = None
    error_message = None
    status_str = "success"

    try:
        # Execute either visual query or raw SQL
        if request.query:
            # Apply parameter substitution if provided
            query_def = request.query.model_dump()
            if request.parameter_values:
                query_def = substitute_parameters(query_def, request.parameter_values)

            # Build SQL from visual query definition
            sql, data = await connection_service.build_and_execute_query(
                connection_id=connection_id,
                workspace_id=workspace_id,
                table=query_def["table"],
                columns=query_def.get("columns"),
                joins=query_def.get("joins"),
                filters=query_def.get("filters"),
                group_by=query_def.get("group_by"),
                order_by=query_def.get("order_by"),
                limit=query_def.get("limit") or request.limit,
            )
        elif request.sql:
            # Apply parameter substitution to raw SQL if provided
            sql = request.sql
            if request.parameter_values:
                sql = substitute_sql(sql, request.parameter_values)

            # Execute raw SQL
            data = await connection_service.execute_query(
                connection_id=connection_id,
                workspace_id=workspace_id,
                sql=sql,
                limit=request.limit,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'query' or 'sql' must be provided",
            )

        # Count rows if data has them
        row_count = None
        if isinstance(data, dict) and "data" in data:
            row_count = len(data["data"])
        elif isinstance(data, list):
            row_count = len(data)

    except Exception as e:
        status_str = "error"
        error_message = str(e)
        row_count = None
        raise

    finally:
        # Calculate execution time
        end_time = time.time()
        execution_time_ms = (end_time - start_time) * 1000

        # Create query history entry
        query_type = "visual" if request.query else "sql"
        query_definition = request.query.model_dump() if request.query else None

        history_entry = QueryHistory(
            workspace_id=workspace_id,
            connection_id=connection_id,
            user_id=current_user.id,
            query_type=query_type,
            query_definition=query_definition,
            sql=sql or "",
            status=status_str,
            error_message=error_message,
            row_count=row_count,
            execution_time_ms=execution_time_ms,
        )
        db.add(history_entry)
        await db.commit()

    return {
        "sql": sql,
        "data": data,
        "row_count": row_count,
    }


@router.post("/workspaces/{workspace_id}/connections/{connection_id}/text-to-sql", response_model=TextToSQLResponse)
async def text_to_sql(
    workspace_id: uuid.UUID,
    connection_id: uuid.UUID,
    request: TextToSQLRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Convert natural language question to SQL using Wren AI.

    This endpoint uses Wren AI service to convert natural language questions
    into SQL queries, leveraging the semantic layer (MDL) for context.

    Args:
        workspace_id: Workspace ID
        connection_id: Connection ID to query against
        request: Text-to-SQL request with question and optional context

    Returns:
        Generated SQL query and metadata

    Note:
        - The connection must have an associated MDL deployment for best results
        - Without MDL, the AI will use basic schema information
        - Histories can improve context for follow-up questions
    """
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Verify connection exists and belongs to workspace
    connection_service = ConnectionService(db)
    connection = await connection_service.get_connection(connection_id, workspace_id)

    # TODO: Get MDL hash from connection's deployed semantic model
    # For now, we'll pass None and let Wren AI use basic schema
    mdl_hash = None

    # Convert histories to dict format expected by Wren AI
    histories = None
    if request.histories:
        histories = [
            {"question": h.question, "sql": h.sql}
            for h in request.histories
        ]

    # Call Wren AI service
    result = await wren_ai_client.text_to_sql(
        question=request.question,
        mdl_hash=mdl_hash,
        histories=histories,
        custom_instruction=request.custom_instruction,
        enable_column_pruning=request.enable_column_pruning,
    )

    return result
