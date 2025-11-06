"""Wren AI Service client for text-to-SQL and AI features."""
import asyncio
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class WrenAIClient:
    """Client for communicating with Wren AI Service."""

    def __init__(self, base_url: str = None):
        """Initialize the Wren AI client.

        Args:
            base_url: Base URL for Wren AI service. Defaults to settings.WREN_AI_SERVICE_URL
        """
        self.base_url = base_url or settings.WREN_AI_SERVICE_URL
        self.timeout = 120.0  # AI operations can take longer
        self.poll_interval = 1.0  # Poll every 1 second
        self.max_poll_attempts = 120  # Max 2 minutes

    async def text_to_sql(
        self,
        question: str,
        mdl_hash: str | None = None,
        histories: list[dict] | None = None,
        custom_instruction: str | None = None,
        enable_column_pruning: bool = False,
    ) -> dict[str, Any]:
        """Convert natural language question to SQL using Wren AI.

        Args:
            question: Natural language question
            mdl_hash: Hash of the MDL (semantic model)
            histories: Previous Q&A pairs for context
            custom_instruction: Custom instructions for SQL generation
            enable_column_pruning: Whether to enable column pruning

        Returns:
            dict with:
                - status: "finished" | "failed"
                - sql: Generated SQL query (if successful)
                - rephrased_question: Rephrased version of the question
                - error: Error details (if failed)

        Raises:
            httpx.HTTPError: If communication with Wren AI fails
        """
        url = f"{self.base_url}/v1/asks"

        # Prepare request payload
        payload = {
            "query": question,
            "ignore_sql_generation_reasoning": True,  # Faster generation
            "enable_column_pruning": enable_column_pruning,
            "use_dry_plan": True,  # Use query planner for validation
            "allow_dry_plan_fallback": True,
        }

        if mdl_hash:
            payload["mdl_hash"] = mdl_hash

        if histories:
            payload["histories"] = histories

        if custom_instruction:
            payload["custom_instruction"] = custom_instruction

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Step 1: Submit the ask request
                response = await client.post(url, json=payload)
                response.raise_for_status()

                ask_response = response.json()
                query_id = ask_response.get("query_id")

                if not query_id:
                    return {
                        "status": "failed",
                        "error": {
                            "code": "OTHERS",
                            "message": "No query_id returned from Wren AI",
                        },
                    }

                # Step 2: Poll for results
                result = await self._poll_ask_result(client, query_id)
                return result

        except httpx.HTTPStatusError as e:
            error_detail = "Unknown error"
            try:
                error_data = e.response.json()
                error_detail = error_data.get("detail", str(error_data))
            except Exception:
                error_detail = e.response.text or str(e)

            logger.error(f"Wren AI text_to_sql failed: {error_detail}")
            return {
                "status": "failed",
                "error": {
                    "code": "OTHERS",
                    "message": f"Wren AI request failed: {error_detail}",
                },
            }
        except Exception as e:
            logger.error(f"Unexpected error in text_to_sql: {str(e)}")
            return {
                "status": "failed",
                "error": {
                    "code": "OTHERS",
                    "message": f"Unexpected error: {str(e)}",
                },
            }

    async def _poll_ask_result(
        self, client: httpx.AsyncClient, query_id: str
    ) -> dict[str, Any]:
        """Poll for ask result until finished or failed.

        Args:
            client: HTTP client instance
            query_id: Query ID to poll

        Returns:
            Final result dict
        """
        url = f"{self.base_url}/v1/asks/{query_id}/result"

        for attempt in range(self.max_poll_attempts):
            try:
                response = await client.get(url)
                response.raise_for_status()

                result = response.json()
                status = result.get("status")

                logger.debug(f"Ask {query_id} status: {status} (attempt {attempt + 1})")

                # Terminal states
                if status == "finished":
                    # Extract SQL from response array
                    responses = result.get("response", [])
                    if responses and len(responses) > 0:
                        sql = responses[0].get("sql", "")
                        return {
                            "status": "finished",
                            "sql": sql,
                            "rephrased_question": result.get("rephrased_question"),
                            "type": result.get("type"),
                            "retrieved_tables": result.get("retrieved_tables", []),
                        }
                    else:
                        return {
                            "status": "failed",
                            "error": {
                                "code": "NO_RELEVANT_SQL",
                                "message": "No SQL generated",
                            },
                        }

                elif status == "failed":
                    error = result.get("error", {})
                    return {
                        "status": "failed",
                        "error": error,
                        "invalid_sql": result.get("invalid_sql"),
                    }

                elif status == "stopped":
                    return {
                        "status": "failed",
                        "error": {
                            "code": "OTHERS",
                            "message": "Query was stopped",
                        },
                    }

                # Still processing, wait and retry
                await asyncio.sleep(self.poll_interval)

            except httpx.HTTPError as e:
                logger.error(f"Error polling ask result: {str(e)}")
                # Continue polling on transient errors
                await asyncio.sleep(self.poll_interval)

        # Max attempts reached
        return {
            "status": "failed",
            "error": {
                "code": "OTHERS",
                "message": f"Timeout: AI processing exceeded {self.max_poll_attempts} seconds",
            },
        }

    async def get_ask_result(self, query_id: str) -> dict[str, Any]:
        """Get the current result of an ask query.

        Args:
            query_id: Query ID to check

        Returns:
            Current status and result
        """
        url = f"{self.base_url}/v1/asks/{query_id}/result"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Error getting ask result: {str(e)}")
            raise


# Singleton instance
wren_ai_client = WrenAIClient()
