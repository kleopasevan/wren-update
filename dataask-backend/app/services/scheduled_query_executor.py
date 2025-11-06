"""Scheduled query executor service."""
import logging
from datetime import datetime
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scheduled_query import ScheduledQuery
from app.models.connection import Connection
from app.services.connection_service import ConnectionService
from app.services.email_service import email_service

logger = logging.getLogger(__name__)


async def execute_and_email_query(db: AsyncSession, query_id: str):
    """
    Execute a scheduled query and send results via email.

    Args:
        db: Database session
        query_id: ID of the scheduled query to execute
    """
    try:
        # Get scheduled query
        result = await db.execute(
            select(ScheduledQuery).where(ScheduledQuery.id == uuid.UUID(query_id))
        )
        scheduled_query = result.scalar_one_or_none()

        if not scheduled_query:
            logger.error(f"Scheduled query {query_id} not found")
            return

        if not scheduled_query.enabled:
            logger.info(f"Scheduled query {query_id} is disabled, skipping")
            return

        logger.info(f"Executing scheduled query: {scheduled_query.name}")

        # Get connection
        connection_result = await db.execute(
            select(Connection).where(Connection.id == scheduled_query.connection_id)
        )
        connection = connection_result.scalar_one_or_none()

        if not connection:
            await _update_query_status(
                db, scheduled_query, "error", "Connection not found"
            )
            return

        # Execute query
        connection_service = ConnectionService(db)

        try:
            if scheduled_query.query_type == "visual":
                # Execute visual query
                query_def = scheduled_query.query_definition
                sql, data = await connection_service.build_and_execute_query(
                    connection_id=scheduled_query.connection_id,
                    workspace_id=scheduled_query.workspace_id,
                    table=query_def.get("table"),
                    columns=query_def.get("columns"),
                    joins=query_def.get("joins"),
                    filters=query_def.get("filters"),
                    group_by=query_def.get("group_by"),
                    order_by=query_def.get("order_by"),
                    limit=query_def.get("limit", 10000),
                )
            elif scheduled_query.query_type == "sql":
                # Execute raw SQL
                sql = scheduled_query.sql
                data = await connection_service.execute_query(
                    connection_id=scheduled_query.connection_id,
                    workspace_id=scheduled_query.workspace_id,
                    sql=sql,
                    limit=10000,
                )
            else:
                await _update_query_status(
                    db, scheduled_query, "error", f"Unknown query type: {scheduled_query.query_type}"
                )
                return

            # Extract data
            if isinstance(data, dict) and "data" in data:
                results = data["data"]
            elif isinstance(data, list):
                results = data
            else:
                results = []

            logger.info(f"Query executed successfully, {len(results)} rows returned")

            # Generate attachments
            attachments = []

            if "csv" in scheduled_query.format:
                csv_data = email_service.generate_csv(results)
                attachments.append({
                    "filename": f"{scheduled_query.name.replace(' ', '_')}.csv",
                    "data": csv_data
                })

            if "pdf" in scheduled_query.format:
                pdf_data = email_service.generate_pdf(
                    results,
                    title=scheduled_query.name
                )
                attachments.append({
                    "filename": f"{scheduled_query.name.replace(' ', '_')}.pdf",
                    "data": pdf_data
                })

            # Prepare email
            subject = scheduled_query.subject or f"Scheduled Query Results: {scheduled_query.name}"
            body = f"""
            <html>
            <body>
                <h2>{scheduled_query.name}</h2>
                {f'<p>{scheduled_query.description}</p>' if scheduled_query.description else ''}
                <p><strong>Executed:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                <p><strong>Rows returned:</strong> {len(results)}</p>
                <p><strong>SQL:</strong></p>
                <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px;">{sql}</pre>
                <p>Please find the results attached.</p>
            </body>
            </html>
            """

            # Send email
            success = await email_service.send_email(
                to=scheduled_query.recipients,
                subject=subject,
                body=body,
                attachments=attachments if attachments else None
            )

            if success:
                await _update_query_status(db, scheduled_query, "success", None)
                logger.info(f"Email sent successfully for query {query_id}")
            else:
                await _update_query_status(
                    db, scheduled_query, "error", "Failed to send email"
                )

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error executing query {query_id}: {error_msg}")
            await _update_query_status(db, scheduled_query, "error", error_msg)

    except Exception as e:
        logger.error(f"Unexpected error in execute_and_email_query: {e}")


async def _update_query_status(
    db: AsyncSession,
    scheduled_query: ScheduledQuery,
    status: str,
    error: str | None
):
    """
    Update the last run status of a scheduled query.

    Args:
        db: Database session
        scheduled_query: ScheduledQuery instance
        status: Status string ("success" or "error")
        error: Error message if status is "error"
    """
    scheduled_query.last_run_at = datetime.utcnow()
    scheduled_query.last_run_status = status
    scheduled_query.last_run_error = error
    await db.commit()
