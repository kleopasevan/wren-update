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

    async def execute_query(
        self,
        connection_type: str,
        connection_info: dict,
        sql: str,
        limit: int | None = None,
    ) -> dict[str, Any]:
        """
        Execute a custom SQL query.

        Args:
            connection_type: Type of database
            connection_info: Connection parameters
            sql: SQL query to execute
            limit: Optional limit on number of rows

        Returns:
            dict with columns and data
        """
        data_source = self._get_data_source_path(connection_type)
        url = f"{self.base_url}/v2/connector/{data_source}/query"

        payload = {
            "sql": sql,
            "manifestStr": '{"catalog": "test", "schema": "test", "models": []}',
            "connectionInfo": connection_info,
        }

        params = {}
        if limit is not None:
            params["limit"] = limit

        async with httpx.AsyncClient(timeout=120.0) as client:  # Longer timeout for queries
            response = await client.post(url, json=payload, params=params)
            response.raise_for_status()
            return response.json()

    def build_sql_query(
        self,
        table: str,
        columns: list[str] | None = None,
        joins: list[dict] | None = None,
        filters: list[dict] | None = None,
        group_by: list[str] | None = None,
        order_by: list[dict] | None = None,
        limit: int | None = None,
    ) -> str:
        """
        Build a SQL query from components.

        Args:
            table: Primary table name
            columns: List of column names (None = SELECT *)
            joins: List of join dicts with {table, join_type, conditions}
            filters: List of filter dicts with {column, operator, value}
            group_by: List of columns to group by
            order_by: List of order dicts with {column, direction}
            limit: Row limit

        Returns:
            SQL query string
        """
        # SELECT clause
        if columns:
            cols_str = ", ".join(columns)
        else:
            cols_str = "*"

        sql = f"SELECT {cols_str} FROM {table}"

        # JOIN clauses
        if joins:
            for join in joins:
                join_table = join["table"]
                join_type = join.get("join_type", "INNER")
                conditions = join.get("conditions", [])

                # Build JOIN ON conditions
                if conditions:
                    condition_strs = []
                    for cond in conditions:
                        left_col = cond["left_column"]
                        right_col = cond["right_column"]
                        operator = cond.get("operator", "=")
                        condition_strs.append(f"{left_col} {operator} {right_col}")

                    on_clause = " AND ".join(condition_strs)
                    sql += f" {join_type} JOIN {join_table} ON {on_clause}"

        # WHERE clause
        if filters:
            where_clauses = []
            for f in filters:
                col = f["column"]
                op = f["operator"]
                val = f["value"]

                # Handle different operators
                if op == "=":
                    where_clauses.append(f"{col} = '{val}'")
                elif op == "!=":
                    where_clauses.append(f"{col} != '{val}'")
                elif op == ">":
                    where_clauses.append(f"{col} > {val}")
                elif op == ">=":
                    where_clauses.append(f"{col} >= {val}")
                elif op == "<":
                    where_clauses.append(f"{col} < {val}")
                elif op == "<=":
                    where_clauses.append(f"{col} <= {val}")
                elif op == "LIKE":
                    where_clauses.append(f"{col} LIKE '{val}'")
                elif op == "IN":
                    # val should be a list
                    if isinstance(val, list):
                        vals_str = ", ".join([f"'{v}'" for v in val])
                        where_clauses.append(f"{col} IN ({vals_str})")
                elif op == "IS NULL":
                    where_clauses.append(f"{col} IS NULL")
                elif op == "IS NOT NULL":
                    where_clauses.append(f"{col} IS NOT NULL")

            if where_clauses:
                sql += " WHERE " + " AND ".join(where_clauses)

        # GROUP BY clause
        if group_by:
            sql += " GROUP BY " + ", ".join(group_by)

        # ORDER BY clause
        if order_by:
            order_clauses = []
            for o in order_by:
                col = o["column"]
                direction = o.get("direction", "ASC")
                order_clauses.append(f"{col} {direction}")
            sql += " ORDER BY " + ", ".join(order_clauses)

        # LIMIT clause
        if limit:
            sql += f" LIMIT {limit}"

        return sql


# Singleton instance
ibis_client = IbisClient()
