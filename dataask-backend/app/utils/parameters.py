"""Parameter substitution utilities."""
import re
from typing import Any


def substitute_parameters(query_definition: dict, parameter_values: dict[str, Any]) -> dict:
    """
    Substitute parameter placeholders in a query definition with actual values.

    Supports {{parameter_name}} syntax in:
    - Filter values
    - SQL strings (if provided)

    Args:
        query_definition: Query definition dict (table, columns, filters, etc.)
        parameter_values: Dict mapping parameter names to their values

    Returns:
        Query definition with substituted values
    """
    if not parameter_values:
        return query_definition

    # Deep copy to avoid modifying original
    import copy
    result = copy.deepcopy(query_definition)

    # Substitute in filters
    if "filters" in result and result["filters"]:
        for filter_item in result["filters"]:
            if "value" in filter_item and isinstance(filter_item["value"], str):
                filter_item["value"] = _substitute_string(filter_item["value"], parameter_values)

    return result


def substitute_sql(sql: str, parameter_values: dict[str, Any]) -> str:
    """
    Substitute parameter placeholders in SQL string.

    Args:
        sql: SQL string with {{parameter_name}} placeholders
        parameter_values: Dict mapping parameter names to their values

    Returns:
        SQL string with substituted values
    """
    if not parameter_values:
        return sql

    return _substitute_string(sql, parameter_values)


def _substitute_string(text: str, parameter_values: dict[str, Any]) -> str:
    """
    Replace {{parameter_name}} placeholders with values.

    Args:
        text: String with {{parameter_name}} placeholders
        parameter_values: Dict mapping parameter names to their values

    Returns:
        String with substituted values
    """
    def replace_placeholder(match):
        param_name = match.group(1).strip()
        if param_name in parameter_values:
            value = parameter_values[param_name]

            # Format value based on type
            if isinstance(value, str):
                # For SQL, wrap strings in single quotes
                return f"'{value}'"
            elif isinstance(value, (int, float)):
                return str(value)
            elif isinstance(value, bool):
                return str(value).upper()
            elif value is None:
                return "NULL"
            else:
                # For complex types, convert to string
                return f"'{str(value)}'"
        else:
            # Keep placeholder if value not provided
            return match.group(0)

    # Pattern to match {{parameter_name}}
    pattern = r'\{\{([^}]+)\}\}'
    return re.sub(pattern, replace_placeholder, text)


def validate_parameter_values(parameters: list[dict], values: dict[str, Any]) -> dict[str, Any]:
    """
    Validate and apply default values for parameters.

    Args:
        parameters: List of parameter definitions with name, type, defaultValue
        values: Dict of provided values

    Returns:
        Complete dict with defaults applied for missing values

    Raises:
        ValueError: If required parameter is missing
    """
    result = {}

    for param in parameters:
        name = param.get("name")
        param_type = param.get("type")
        required = param.get("required", False)
        default_value = param.get("defaultValue")

        if name in values:
            # Use provided value
            result[name] = values[name]
        elif default_value is not None:
            # Use default value
            result[name] = default_value
        elif required:
            # Required but not provided
            raise ValueError(f"Required parameter '{name}' is missing")

    return result
