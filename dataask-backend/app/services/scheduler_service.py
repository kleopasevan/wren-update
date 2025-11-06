"""Background scheduler service for scheduled queries."""
import logging
from datetime import datetime, timedelta
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.scheduled_query import ScheduledQuery

logger = logging.getLogger(__name__)


class SchedulerService:
    """Service for managing scheduled query execution."""

    def __init__(self):
        """Initialize scheduler service."""
        self.scheduler: Optional[AsyncIOScheduler] = None

    def start(self):
        """Start the scheduler."""
        if self.scheduler is None:
            self.scheduler = AsyncIOScheduler()
            self.scheduler.start()
            logger.info("Scheduler started")

    def shutdown(self):
        """Shutdown the scheduler."""
        if self.scheduler:
            self.scheduler.shutdown()
            logger.info("Scheduler shutdown")

    async def schedule_query(self, scheduled_query: ScheduledQuery):
        """
        Add or update a scheduled query job.

        Args:
            scheduled_query: ScheduledQuery instance to schedule
        """
        if not self.scheduler:
            logger.error("Scheduler not started")
            return

        job_id = f"scheduled_query_{scheduled_query.id}"

        # Remove existing job if present
        existing_job = self.scheduler.get_job(job_id)
        if existing_job:
            self.scheduler.remove_job(job_id)

        # Don't schedule if disabled
        if not scheduled_query.enabled:
            logger.info(f"Scheduled query {scheduled_query.id} is disabled, not scheduling")
            return

        # Create trigger based on schedule type
        if scheduled_query.schedule_type == "cron":
            trigger = CronTrigger.from_crontab(scheduled_query.cron_expression)
        elif scheduled_query.schedule_type == "interval":
            trigger = IntervalTrigger(minutes=scheduled_query.interval_minutes)
        else:
            logger.error(f"Unknown schedule type: {scheduled_query.schedule_type}")
            return

        # Schedule the job
        self.scheduler.add_job(
            self._execute_scheduled_query,
            trigger=trigger,
            id=job_id,
            args=[str(scheduled_query.id)],
            name=f"Query: {scheduled_query.name}",
            replace_existing=True,
        )

        # Calculate next run time
        next_run = self.scheduler.get_job(job_id).next_run_time
        logger.info(f"Scheduled query {scheduled_query.id} next run: {next_run}")

        # Update next_run_at in database
        async for db in get_db():
            try:
                result = await db.execute(
                    select(ScheduledQuery).where(ScheduledQuery.id == scheduled_query.id)
                )
                query = result.scalar_one_or_none()
                if query:
                    query.next_run_at = next_run
                    await db.commit()
            finally:
                await db.close()

    async def unschedule_query(self, query_id: str):
        """
        Remove a scheduled query job.

        Args:
            query_id: ID of the scheduled query to remove
        """
        if not self.scheduler:
            return

        job_id = f"scheduled_query_{query_id}"
        existing_job = self.scheduler.get_job(job_id)
        if existing_job:
            self.scheduler.remove_job(job_id)
            logger.info(f"Unscheduled query {query_id}")

    async def _execute_scheduled_query(self, query_id: str):
        """
        Execute a scheduled query and send email report.

        This is called by the scheduler when a job is triggered.

        Args:
            query_id: ID of the scheduled query to execute
        """
        logger.info(f"Executing scheduled query: {query_id}")

        async for db in get_db():
            try:
                # Import here to avoid circular imports
                from app.services.scheduled_query_executor import execute_and_email_query

                await execute_and_email_query(db, query_id)
            except Exception as e:
                logger.error(f"Error executing scheduled query {query_id}: {e}")
            finally:
                await db.close()

    async def load_all_scheduled_queries(self):
        """Load and schedule all enabled queries from database."""
        logger.info("Loading all scheduled queries from database")

        async for db in get_db():
            try:
                result = await db.execute(
                    select(ScheduledQuery).where(ScheduledQuery.enabled == True)
                )
                queries = result.scalars().all()

                for query in queries:
                    await self.schedule_query(query)

                logger.info(f"Loaded {len(queries)} scheduled queries")
            finally:
                await db.close()


# Global scheduler instance
scheduler_service = SchedulerService()
