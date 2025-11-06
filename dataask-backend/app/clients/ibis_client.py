"""Client for communicating with Wren ibis-server."""
import httpx
from typing import Any
from app.config import settings


class IbisClient:
    """Client for ibis-server HTTP API."""

    def __init__(self, base_url: str = None):
        """Initialize ibis client with base URL."""
        self.base_url = base_url or settings.IBIS_SERVER_URL
        self.timeout = 30.0

    def _get_data_source_path(self, connection_type: str) -> str:
        """Map connection type to ibis data source path."""
        type_mapping = {
            "postgres": "postgres",
            "postgresql": "postgres",
            "mysql": "mysql",
            "bigquery": "bigquery",
            "snowflake": "snowflake",
            "redshift": "postgres",  # Redshift uses postgres protocol
            "clickhouse": "clickhouse",
            "mssql": "mssql",
            "trino": "trino",
        }
        return type_mapping.get(connection_type.lower(), connection_type.lower())

    async def test_connection(
        self, connection_type: str, connection_info: dict
    ) -> dict[str, Any]:
        """
        Test a database connection by executing a simple query.

        Args:
            connection_type: Type of database (postgres, mysql, etc.)
            connection_info: Connection parameters

        Returns:
            dict with status, message, and optional error details
        """
        data_source = self._get_data_source_path(connection_type)
        url = f"{self.base_url}/v2/connector/{data_source}/query"

        # Simple test query
        payload = {
            "sql": "SELECT 1 as test",
            "manifestStr": '{"catalog": "test", "schema": "test", "models": []}',
            "connectionInfo": connection_info,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    json=payload,
                    params={"dryRun": "true"},  # Only validate, don't execute
                )
                response.raise_for_status()

                return {
                    "status": "success",
                    "message": "Connection successful",
                }
        except httpx.HTTPStatusError as e:
            error_detail = "Unknown error"
            try:
                error_data = e.response.json()
                error_detail = error_data.get("detail", str(error_data))
            except Exception:
                error_detail = e.response.text or str(e)

            return {
                "status": "error",
                "message": f"Connection failed: {error_detail}",
                "error": str(e),
            }
        except httpx.TimeoutException:
            return {
                "status": "error",
                "message": "Connection test timed out",
                "error": "timeout",
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Connection test failed: {str(e)}",
                "error": str(e),
            }

    async def get_tables(
        self, connection_type: str, connection_info: dict
    ) -> list[dict[str, Any]]:
        """
        Get list of tables from the data source.

        Args:
            connection_type: Type of database
            connection_info: Connection parameters

        Returns:
            list of table objects with name, columns, etc.
        """
        data_source = self._get_data_source_path(connection_type)
        url = f"{self.base_url}/v2/connector/{data_source}/metadata/tables"

        payload = {"connectionInfo": connection_info}

        async with httpx.AsyncClient(timeout=60.0) as client:  # Longer timeout for metadata
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()

    async def get_constraints(
        self, connection_type: str, connection_info: dict
    ) -> list[dict[str, Any]]:
        """
        Get constraints (foreign keys, primary keys) from the data source.

        Args:
            connection_type: Type of database
            connection_info: Connection parameters

        Returns:
            list of constraint objects
        """
        data_source = self._get_data_source_path(connection_type)
        url = f"{self.base_url}/v2/connector/{data_source}/metadata/constraints"

        payload = {"connectionInfo": connection_info}

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()

    async def preview_table(
        self,
        connection_type: str,
        connection_info: dict,
        table_name: str,
        limit: int = 10,
    ) -> dict[str, Any]:
        """
        Preview data from a table.

        Args:
            connection_type: Type of database
            connection_info: Connection parameters
            table_name: Name of the table to preview
            limit: Number of rows to return

        Returns:
            dict with columns and data
        """
        data_source = self._get_data_source_path(connection_type)
        url = f"{self.base_url}/v2/connector/{data_source}/query"

        # Simple SELECT query with limit
        payload = {
            "sql": f"SELECT * FROM {table_name}",
            "manifestStr": '{"catalog": "test", "schema": "test", "models": []}',
            "connectionInfo": connection_info,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, params={"limit": limit})
            response.raise_for_status()
            return response.json()


# Singleton instance
ibis_client = IbisClient()
