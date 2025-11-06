"""Schemas for AI-powered queries (text-to-SQL, insights, etc.)."""
from typing import Literal

from pydantic import BaseModel, Field


class QueryHistory(BaseModel):
    """Previous question-SQL pair for context."""

    question: str = Field(..., description="Previous question")
    sql: str = Field(..., description="SQL query for that question")


class TextToSQLRequest(BaseModel):
    """Request to convert natural language to SQL."""

    question: str = Field(..., description="Natural language question", min_length=1)
    mdl_hash: str | None = Field(None, description="Hash of the semantic model (MDL)")
    histories: list[QueryHistory] | None = Field(
        None, description="Previous Q&A pairs for context"
    )
    custom_instruction: str | None = Field(
        None, description="Custom instructions for SQL generation"
    )
    enable_column_pruning: bool = Field(
        False, description="Enable intelligent column pruning to reduce token usage"
    )


class AIError(BaseModel):
    """Error from AI processing."""

    code: Literal["NO_RELEVANT_DATA", "NO_RELEVANT_SQL", "OTHERS"]
    message: str


class TextToSQLResponse(BaseModel):
    """Response from text-to-SQL conversion."""

    status: Literal["finished", "failed"]
    sql: str | None = Field(None, description="Generated SQL query")
    rephrased_question: str | None = Field(
        None, description="AI's rephrased version of the question"
    )
    type: Literal["GENERAL", "TEXT_TO_SQL"] | None = Field(
        None, description="Type of query"
    )
    retrieved_tables: list[str] | None = Field(
        None, description="Tables retrieved from semantic layer"
    )
    error: AIError | None = Field(None, description="Error details if failed")
    invalid_sql: str | None = Field(
        None, description="Invalid SQL that failed validation (for debugging)"
    )


class AskStatusResponse(BaseModel):
    """Current status of an ask query."""

    status: Literal[
        "understanding",
        "searching",
        "planning",
        "generating",
        "correcting",
        "finished",
        "failed",
        "stopped",
    ]
    rephrased_question: str | None = None
    sql: str | None = None
    error: AIError | None = None
