# Wren AI Engine Architecture

**A comprehensive deep-dive into the AI workflow that powers Wren AI's text-to-SQL capabilities**

## Table of Contents

1. [Overview](#overview)
2. [Core Architecture](#core-architecture)
3. [Semantic Layer Indexing](#semantic-layer-indexing)
4. [Text-to-SQL Pipeline Workflow](#text-to-sql-pipeline-workflow)
5. [Prompt Engineering Details](#prompt-engineering-details)
6. [Self-Correction Mechanism](#self-correction-mechanism)
7. [Pipeline Components](#pipeline-components)
8. [Code References Index](#code-references-index)

---

## Overview

Wren AI implements a **multi-stage RAG (Retrieval-Augmented Generation) pipeline** that transforms natural language questions into accurate SQL queries. The system combines:

- **Semantic Layer** (MDL) encoding business logic
- **Vector Retrieval** for context-aware schema selection
- **Multi-step LLM Pipeline** with reasoning and validation
- **Self-correction Loop** with actual database validation

**Key Files:**
- Service orchestration: `wren-ai-service/src/web/v1/services/ask.py`
- Pipeline definitions: `wren-ai-service/src/pipelines/`
- Prompt templates: `wren-ai-service/src/pipelines/generation/utils/sql.py`

---

## Core Architecture

### Service Container Pattern

**File:** `wren-ai-service/src/globals.py`

The service container manages all AI pipelines and their lifecycle:

```python
# Lines 92-98: Service Container Creation
def create_service_container(
    pipe_components: dict,
    column_indexing_batch_size: int = 50,
    table_retrieval_size: int = 10,
    table_column_retrieval_size: int = 1000,
    query_cache: dict = {"maxsize": 1_000_000, "ttl": 120},
) -> dict
```

**Services Registered:**
1. **SemanticsPreparationService** - Indexes MDL to vector store
2. **AskService** - Main text-to-SQL service
3. **AskDetailsService** - SQL breakdown and explanation

**File:** `wren-ai-service/src/__main__.py` (Lines 44-81)

The FastAPI lifespan manages startup/shutdown:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize pipeline components
    pipe_components = generate_components()
    app.state.service_container = create_service_container(pipe_components, ...)
    app.state.service_metadata = create_service_metadata(pipe_components)
    init_langfuse()  # Observability

    yield

    # Shutdown: Flush telemetry
    langfuse_context.flush()
```

### Pipeline Component Registry

**File:** `wren-ai-service/src/core/pipeline.py` (Lines 1-30)

All pipelines inherit from `BasicPipeline`:

```python
class BasicPipeline(ABC):
    def __init__(
        self,
        llm_provider: LLMProvider,
        embedder_provider: EmbedderProvider = None,
        document_store_provider: DocumentStoreProvider = None,
        engine: Engine = None,
    ):
        self._llm_provider = llm_provider
        self._embedder_provider = embedder_provider
        self._document_store_provider = document_store_provider
        self._engine = engine

    @abstractmethod
    async def run(self, *args, **kwargs):
        ...
```

**Pipeline Types:**
- **Indexing:** `wren-ai-service/src/pipelines/indexing/` - MDL → Vector DB
- **Retrieval:** `wren-ai-service/src/pipelines/retrieval/` - Schema/SQL retrieval
- **Generation:** `wren-ai-service/src/pipelines/generation/` - SQL/Chart generation

---

## Semantic Layer Indexing

### MDL → DDL Conversion

**File:** `wren-ai-service/src/pipelines/indexing/db_schema.py`

#### Step 1: DDL Chunking

**Class:** `DDLChunker` (Lines 29-64)

```python
@component
class DDLChunker:
    @component.output_types(documents=List[Document])
    async def run(
        self,
        mdl: Dict[str, Any],
        column_batch_size: int,
        project_id: Optional[str] = None,
    ):
        # Convert MDL to DDL chunks with metadata
        chunks = [
            {
                "id": str(uuid.uuid4()),
                "meta": {
                    "type": "TABLE_SCHEMA",
                    "name": chunk["name"],
                    **_additional_meta(),
                },
                "content": chunk["payload"],
            }
            for chunk in await self._get_ddl_commands(
                **mdl, column_batch_size=column_batch_size
            )
        ]

        return {"documents": [Document(**chunk) for chunk in chunks]}
```

#### Step 2: Model Preprocessing

**Function:** `_model_preprocessor` (Lines 66-105)

Processes each model (table) from the MDL:

```python
async def _model_preprocessor(
    self, models: List[Dict[str, Any]], **kwargs
) -> List[Dict[str, Any]]:

    def _column_preprocessor(column: Dict[str, Any], addition: Dict[str, Any]):
        # Add calculated field expressions, references, etc.
        addition = {
            key: helper(column, **addition)
            for key, helper in helper.COLUMN_PREPROCESSORS.items()
            if helper.condition(column, **addition)
        }

        return {
            "name": column.get("name", ""),
            "type": column.get("type", ""),
            **addition,  # Adds: expression, reference, etc.
        }

    # Process all models concurrently
    tasks = [_preprocessor(model, **kwargs) for model in models]
    return await asyncio.gather(*tasks)
```

#### Step 3: DDL Command Generation

**Function:** `_convert_models_and_relationships` (Lines 126-269)

Generates CREATE TABLE statements with rich comments:

```python
def _model_command(model: Dict[str, Any]) -> dict:
    properties = model.get("properties", {})

    model_properties = {
        "alias": clean_display_name(properties.get("displayName", "")),
        "description": properties.get("description", ""),
    }
    # Embeds business context in DDL comment
    comment = f"\n/* {str(model_properties)} */\n"

    table_name = model["name"]
    payload = {
        "type": "TABLE",
        "comment": comment,
        "name": table_name,
    }
    return {"name": table_name, "payload": str(payload)}
```

**Column Comments** (Lines 149-165):

```python
def _column_command(column: Dict[str, Any], model: Dict[str, Any]) -> dict:
    # Generate comments with metadata
    comments = [
        helper(column, model=model)
        for helper in helper.COLUMN_COMMENT_HELPERS.values()
        if helper.condition(column)
    ]

    return {
        "type": "COLUMN",
        "comment": "".join(comments),  # Includes: description, alias, calculated field expression
        "name": column["name"],
        "data_type": column["type"],
        "is_primary_key": column["name"] == model["primaryKey"],
    }
```

**Example Generated DDL:**

```sql
/* {"alias":"_orders","description":"A model representing the orders data."} */
CREATE TABLE orders (
  -- {"description":"Order ID","alias":"_order_id"}
  OrderId VARCHAR PRIMARY KEY,

  -- {"description":"Customer ID","alias":"_customer_id"}
  CustomerId VARCHAR,

  -- This column is a Calculated Field
  -- column expression: avg(reviews.Score)
  -- {"description":"Average rating","alias":"_rating"}
  Rating DOUBLE,

  FOREIGN KEY (CustomerId) REFERENCES customers(Id)
);
```

#### Step 4: Document Embedding & Indexing

**File:** `wren-ai-service/src/pipelines/indexing/db_schema.py` (Lines 338-385)

**Hamilton Pipeline Functions:**

```python
@observe(capture_input=False, capture_output=False)
async def embedding(
    documents: List[Document],
    embedder: Any,
    id: str,
) -> dict:
    # Embed DDL chunks for vector search
    logger.info(f"TableDescription#{id}: Embedding documents...")
    return await embedder.run(documents=documents)


@observe(capture_input=False)
async def indexing(
    ddl_commands: dict,
    embedding: dict,
    id: str,
    document_store: Any,
) -> dict:
    # Store in Qdrant with metadata filters
    documents_with_embeddings = _build_documents(ddl_commands, embedding)

    logger.info(f"TableDescription#{id}: Writing {len(documents_with_embeddings)} documents to the document store...")

    return await document_store.run(
        documents=documents_with_embeddings,
        policy=DuplicatePolicy.OVERWRITE,  # Replace existing
    )
```

**Document Metadata Structure:**

```python
{
    "id": "uuid-here",
    "content": "CREATE TABLE ...",  # DDL statement
    "meta": {
        "type": "TABLE_DESCRIPTION" | "TABLE_SCHEMA" | "METRIC" | "VIEW",
        "name": "table_name",
        "project_id": "project-uuid",
    },
    "embedding": [0.123, -0.456, ...]  # Vector
}
```

---

## Text-to-SQL Pipeline Workflow

### Entry Point: AskService

**File:** `wren-ai-service/src/web/v1/services/ask.py`

**Class:** `AskService` (Lines 97-122)

```python
class AskService:
    def __init__(
        self,
        pipelines: Dict[str, BasicPipeline],
        allow_intent_classification: bool = True,
        allow_sql_generation_reasoning: bool = True,
        allow_sql_functions_retrieval: bool = True,
        allow_sql_diagnosis: bool = True,
        enable_column_pruning: bool = False,
        max_sql_correction_retries: int = 3,
        max_histories: int = 5,
        maxsize: int = 1_000_000,
        ttl: int = 120,
    ):
        self._pipelines = pipelines
        self._ask_results: Dict[str, AskResultResponse] = TTLCache(
            maxsize=maxsize, ttl=ttl
        )
        # ... configuration flags
```

### Stage 0: Historical Question Lookup

**Function:** `ask()` (Lines 188-209)

Before any LLM calls, check if this exact question was asked before:

```python
# First check: Has this question been asked before?
historical_question = await self._pipelines["historical_question"].run(
    query=user_query,
    project_id=ask_request.project_id,
)

# Return top 1 result if found
historical_question_result = historical_question.get(
    "formatted_output", {}
).get("documents", [])[:1]

if historical_question_result:
    # Cache hit! Return immediately
    api_results = [
        AskResult(
            **{
                "sql": result.get("statement"),
                "type": "view" if result.get("viewId") else "llm",
                "viewId": result.get("viewId"),
            }
        )
        for result in historical_question_result
    ]
    sql_generation_reasoning = ""
    # Skip to Stage 5 (return result)
```

**Pipeline:** `wren-ai-service/src/pipelines/retrieval/historical_question_retrieval.py`

Uses vector search on previous questions stored in Qdrant.

### Stage 1: Understanding (Intent Classification)

**Function:** `ask()` (Lines 232-322)

**Pipeline:** `intent_classification`

```python
if self._allow_intent_classification:
    intent_classification_result = (
        await self._pipelines["intent_classification"].run(
            query=user_query,
            histories=histories,
            sql_samples=sql_samples,
            instructions=instructions,
            project_id=ask_request.project_id,
            configuration=ask_request.configurations,
        )
    ).get("post_process", {})

    intent = intent_classification_result.get("intent")
    rephrased_question = intent_classification_result.get("rephrased_question")
    intent_reasoning = intent_classification_result.get("reasoning")
```

**File:** `wren-ai-service/src/pipelines/generation/intent_classification.py` (Lines 1-350)

**System Prompt** (Lines 28-120):

```python
intent_classification_system_prompt = """
### TASK ###
You are a highly skilled intent classifier. Your job is to analyze a user's natural language question and determine the appropriate response type.

### INTENT CLASSIFICATION RULES ###

1. TEXT_TO_SQL Intent
   - The question asks for data retrieval, analysis, or insights
   - Requires querying database tables
   - Examples: "Show me sales last month", "What's the average order value?"

2. MISLEADING_QUERY Intent
   - The question contains obviously incorrect assumptions
   - Asks about tables/columns that don't exist
   - Examples: "Show me the unicorn table", "What's the frobnicate column?"

3. GENERAL Intent
   - Asks about data definitions or explanations
   - Wants to understand the database schema
   - Examples: "What is a customer?", "Explain the order status field"

4. USER_GUIDE Intent
   - Questions about how to use Wren AI
   - Meta-questions about the system itself
   - Examples: "How do I ask a question?", "What can you do?"

### OUTPUT FORMAT ###
{
    "intent": "TEXT_TO_SQL" | "MISLEADING_QUERY" | "GENERAL" | "USER_GUIDE",
    "rephrased_question": "<clearer version of the question>",
    "reasoning": "<why you classified this way>"
}
"""
```

**Routing Logic** (Lines 252-322):

```python
if intent == "MISLEADING_QUERY":
    # Route to misleading assistance pipeline
    asyncio.create_task(
        self._pipelines["misleading_assistance"].run(...)
    )
    self._ask_results[query_id] = AskResultResponse(
        status="finished",
        type="GENERAL",
        general_type="MISLEADING_QUERY",
    )
    return results

elif intent == "GENERAL":
    # Route to data assistance pipeline
    asyncio.create_task(
        self._pipelines["data_assistance"].run(...)
    )
    return results

elif intent == "USER_GUIDE":
    # Route to user guide assistance
    asyncio.create_task(
        self._pipelines["user_guide_assistance"].run(...)
    )
    return results

else:
    # Continue to TEXT_TO_SQL pipeline
    self._ask_results[query_id] = AskResultResponse(
        status="understanding",
        type="TEXT_TO_SQL",
        rephrased_question=rephrased_question,
        intent_reasoning=intent_reasoning,
    )
```

### Stage 2: Searching (Semantic Retrieval)

**Function:** `ask()` (Lines 332-430)

Updates status and runs parallel retrievals:

```python
self._ask_results[query_id] = AskResultResponse(
    status="searching",
    type="TEXT_TO_SQL",
    rephrased_question=rephrased_question,
    intent_reasoning=intent_reasoning,
)

# Run retrieval
retrieval_result = await self._pipelines["db_schema_retrieval"].run(
    query=user_query,
    histories=histories,
    project_id=ask_request.project_id,
    enable_column_pruning=enable_column_pruning,
)

_retrieval_result = retrieval_result.get("construct_retrieval_results", {})
documents = _retrieval_result.get("documents", [])
table_names = _retrieval_result.get("table_names", [])
```

#### Sub-Stage 2A: Table Vector Retrieval

**File:** `wren-ai-service/src/pipelines/retrieval/db_schema_retrieval.py` (Lines 139-168)

```python
@observe(capture_input=False)
async def table_retrieval(
    embedding: dict,
    project_id: str,
    tables: list[str],
    table_retriever: Any
) -> dict:
    # Build filter for Qdrant
    filters = {
        "operator": "AND",
        "conditions": [
            {"field": "type", "operator": "==", "value": "TABLE_DESCRIPTION"},
        ],
    }

    if project_id:
        filters["conditions"].append(
            {"field": "project_id", "operator": "==", "value": project_id}
        )

    if embedding:
        # Vector similarity search
        return await table_retriever.run(
            query_embedding=embedding.get("embedding"),
            filters=filters,
        )
    else:
        # Exact match on table names (used when tables are pre-specified)
        filters["conditions"].append(
            {"field": "name", "operator": "in", "value": tables}
        )
        return await table_retriever.run(
            query_embedding=[],
            filters=filters,
        )
```

#### Sub-Stage 2B: Schema Retrieval

**Function:** `dbschema_retrieval` (Lines 171-211)

After finding relevant tables, fetch their full schemas:

```python
@observe(capture_input=False)
async def dbschema_retrieval(
    table_retrieval: dict,
    project_id: str,
    dbschema_retriever: Any
) -> list[Document]:
    # Extract table names from retrieval
    tables = table_retrieval.get("documents", [])
    table_names = []
    for table in tables:
        content = ast.literal_eval(table.content)
        table_names.append(content["name"])

    # Build OR conditions for each table
    table_name_conditions = [
        {"field": "name", "operator": "==", "value": table_name}
        for table_name in table_names
    ]

    if table_name_conditions:
        filters = {
            "operator": "AND",
            "conditions": [
                {"field": "type", "operator": "==", "value": "TABLE_SCHEMA"},
                {"operator": "OR", "conditions": table_name_conditions},
            ],
        }

        # Retrieve full DDL schemas
        results = await dbschema_retriever.run(
            query_embedding=[],
            filters=filters
        )
        return results.get("documents", [])
```

#### Sub-Stage 2C: Column Pruning (Optional)

**Function:** `column_selection` (Lines 282-360)

If `enable_column_pruning=True`, uses LLM to select only relevant columns:

```python
@observe(capture_input=False, capture_output=False)
async def column_selection(
    question: str,
    db_schemas: list[dict],
    column_selector: Any,
    column_selector_name: str,
    enable_column_pruning: bool = False,
) -> dict:
    if not enable_column_pruning:
        return {"results": []}

    # Build prompt with full schema
    prompt = prompt_builder.run(
        question=question,
        db_schemas=[
            _build_table_ddl(db_schema)
            for db_schema in db_schemas
        ],
    )

    # Ask LLM to select relevant columns
    return await column_selector(prompt=prompt.get("prompt"))
```

**System Prompt** (Lines 28-87):

```python
table_columns_selection_system_prompt = """
### TASK ###
You are a highly skilled data analyst. Your goal is to examine the provided database schema, interpret the posed question, and identify the specific columns from the relevant tables required to construct an accurate SQL query.

### INSTRUCTIONS ###
1. Carefully analyze the schema and identify the essential tables and columns needed to answer the question.
2. For each table, provide a clear and concise reasoning for why specific columns are selected.
3. List each reason as part of a step-by-step chain of thought, justifying the inclusion of each column.
4. If a "." is included in columns, put the name before the first dot into chosen columns.
5. The number of columns chosen must match the number of reasoning.
6. Final chosen columns must be only column names, don't prefix it with table names.
7. If the chosen column is a child column of a STRUCT type column, choose the parent column instead of the child column.

### FINAL ANSWER FORMAT ###
{
    "results": [
        {
            "table_selection_reason": "Reason for selecting tablename1",
            "table_contents": {
              "chain_of_thought_reasoning": [
                  "Reason 1 for selecting column1",
                  "Reason 2 for selecting column2",
              ],
              "columns": ["column1", "column2"]
            },
            "table_name":"tablename1",
        },
        ...
    ]
}
"""
```

**Pruning Logic** (Lines 373-443):

```python
def _prune_db_schemas(column_selection: dict, db_schemas: list[dict]):
    results = column_selection.get("results", [])

    for result in results:
        table_name = result.get("table_name")
        selected_columns = result["table_contents"].get("columns", [])

        # Find matching schema
        for db_schema in db_schemas:
            if db_schema["name"] == table_name:
                # Filter to only selected columns
                db_schema["columns"] = [
                    col for col in db_schema["columns"]
                    if col["name"] in selected_columns
                ]

    return {"db_schemas": db_schemas}
```

#### Sub-Stage 2D: Few-Shot Example Retrieval

**Function:** `ask()` (Lines 212-230)

Runs in parallel with schema retrieval:

```python
# Run both pipeline operations concurrently
sql_samples_task, instructions_task = await asyncio.gather(
    self._pipelines["sql_pairs_retrieval"].run(
        query=user_query,
        project_id=ask_request.project_id,
    ),
    self._pipelines["instructions_retrieval"].run(
        query=user_query,
        project_id=ask_request.project_id,
        scope="sql",
    ),
)

# Extract results from completed tasks
sql_samples = sql_samples_task["formatted_output"].get("documents", [])
instructions = instructions_task["formatted_output"].get("documents", [])
```

**Pipeline:** `wren-ai-service/src/pipelines/retrieval/sql_pairs_retrieval.py` (Lines 1-150)

Retrieves similar question-SQL pairs from Qdrant:

```python
async def retrieval(
    embedding: dict,
    id: str,
    retriever: Any,
    project_id: str,
) -> dict:
    filters = {
        "operator": "AND",
        "conditions": [
            {"field": "type", "operator": "==", "value": "SQL_PAIRS"},
            {"field": "project_id", "operator": "==", "value": project_id},
        ],
    }

    return await retriever.run(
        query_embedding=embedding.get("embedding"),
        filters=filters,
        top_k=3,  # Top 3 similar questions
    )
```

### Stage 3: Planning (Optional Reasoning)

**Function:** `ask()` (Lines 432-476)

If `allow_sql_generation_reasoning=True`:

```python
self._ask_results[query_id] = AskResultResponse(
    status="planning",
    type="TEXT_TO_SQL",
    retrieved_tables=table_names,
)

# Generate reasoning plan
sql_generation_reasoning_result = await self._pipelines[
    "sql_generation_reasoning"
].run(
    query=user_query,
    documents=documents,
    sql_samples=sql_samples,
    instructions=instructions,
    has_calculated_field=has_calculated_field,
    has_metric=has_metric,
    has_json_field=has_json_field,
    sql_functions=sql_functions,
)

sql_generation_reasoning = sql_generation_reasoning_result.get(
    "post_process", {}
).get("sql_generation_reasoning")
```

**File:** `wren-ai-service/src/pipelines/generation/sql_generation_reasoning.py` (Lines 1-200)

**System Prompt** (Lines 176-200 in `sql.py`):

```python
sql_generation_reasoning_system_prompt = """
### TASK ###
You are a helpful data analyst who is great at thinking deeply and reasoning about the user's question and the database schema, and you provide a step-by-step reasoning plan in order to answer the user's question.

### INSTRUCTIONS ###
1. Think deeply and reason about the user's question, the database schema, and the user's query history if provided.
2. Explicitly state the following information in the reasoning plan:
   if the user puts any specific timeframe(e.g. YYYY-MM-DD) in the user's question(excluding the value of the current time), you will put the absolute time frame in the SQL query;
   otherwise, you will put the relative timeframe in the SQL query.
3. For the ranking problem(e.g. "top x", "bottom x", "first x", "last x"), you must use the ranking function, `DENSE_RANK()` to rank the results and then use `WHERE` clause to filter the results.
4. For the ranking problem(e.g. "top x", "bottom x", "first x", "last x"), you must add the ranking column to the final SELECT clause.
5. If USER INSTRUCTIONS section is provided, make sure to consider them in the reasoning plan.
6. If SQL SAMPLES section is provided, make sure to consider them in the reasoning plan.
7. Give a step by step reasoning plan in order to answer user's question.
8. The reasoning plan should be in the language same as the language user provided in the input.
9. Don't include SQL in the reasoning plan.
10. Each step in the reasoning plan must start with a number, a title(in bold format in markdown), and a reasoning for the step.
11. Do not include ```markdown or ``` in the answer.
12. A table name in the reasoning plan must be in this format: `table: <table_name>`.
13. A column name in the reasoning plan must be in this format: `column: <table_name>.<column_name>`.
14. ONLY SHOWING the reasoning plan in bullet points.

### FINAL ANSWER FORMAT ###
The final answer must be a reasoning plan in plain Markdown string format
"""
```

**Example Reasoning Output:**

```markdown
1. **Identify Time Range** - The user asks for "last month", which is a relative timeframe. We'll use DATE_TRUNC and INTERVAL to calculate the date range.

2. **Select Base Table** - We need `table: orders` to get order data.

3. **Filter by Date** - Use `column: orders.order_date` with CAST to TIMESTAMP WITH TIME ZONE, then filter WHERE order_date >= start of last month AND < start of this month.

4. **Aggregate Revenue** - SUM the `column: orders.total_amount` to get total revenue.

5. **Group by Customer** - GROUP BY `column: orders.customer_id` to calculate per-customer revenue.

6. **Rank Results** - Use DENSE_RANK() OVER (ORDER BY SUM(total_amount) DESC) to rank customers by revenue.

7. **Filter Top 10** - Use WHERE rank <= 10 to get top 10 customers.

8. **Include Rank Column** - Add the rank column to the SELECT clause for clarity.
```

### Stage 4: Generating (SQL Generation)

**Function:** `ask()` (Lines 478-527)

```python
self._ask_results[query_id] = AskResultResponse(
    status="generating",
    type="TEXT_TO_SQL",
    retrieved_tables=table_names,
)

# Generate SQL
sql_generation_result = await self._pipelines["sql_generation"].run(
    query=user_query,
    documents=documents,
    sql_generation_reasoning=sql_generation_reasoning,
    sql_samples=sql_samples,
    instructions=instructions,
    project_id=ask_request.project_id,
    data_source=data_source,
    use_dry_plan=use_dry_plan,
    allow_dry_plan_fallback=allow_dry_plan_fallback,
    has_calculated_field=has_calculated_field,
    has_metric=has_metric,
    has_json_field=has_json_field,
    sql_functions=sql_functions,
)

valid_generation_result = sql_generation_result.get(
    "post_process", {}
).get("valid_generation_result", {})

invalid_generation_result = sql_generation_result.get(
    "post_process", {}
).get("invalid_generation_result", {})
```

**File:** `wren-ai-service/src/pipelines/generation/sql_generation.py`

#### SQL Generation Pipeline

**Hamilton DAG Functions** (Lines 84-145):

```python
## Step 1: Build Prompt
@observe(capture_input=False)
def prompt(
    query: str,
    documents: list[str],
    prompt_builder: PromptBuilder,
    sql_generation_reasoning: str | None = None,
    sql_samples: list[dict] | None = None,
    instructions: list[dict] | None = None,
    has_calculated_field: bool = False,
    has_metric: bool = False,
    has_json_field: bool = False,
    sql_functions: list[SqlFunction] | None = None,
) -> dict:
    _prompt = prompt_builder.run(
        query=query,
        documents=documents,
        sql_generation_reasoning=sql_generation_reasoning,
        instructions=construct_instructions(instructions=instructions),
        calculated_field_instructions=(
            calculated_field_instructions if has_calculated_field else ""
        ),
        metric_instructions=(metric_instructions if has_metric else ""),
        json_field_instructions=(json_field_instructions if has_json_field else ""),
        sql_samples=sql_samples,
        sql_functions=sql_functions,
    )
    return {"prompt": clean_up_new_lines(_prompt.get("prompt"))}


## Step 2: Generate SQL
@observe(as_type="generation", capture_input=False)
@trace_cost
async def generate_sql(
    prompt: dict,
    generator: Any,
    generator_name: str,
) -> dict:
    return await generator(prompt=prompt.get("prompt")), generator_name


## Step 3: Post-Process & Validate
@observe(capture_input=False)
async def post_process(
    generate_sql: dict,
    post_processor: SQLGenPostProcessor,
    data_source: str,
    project_id: str | None = None,
    use_dry_plan: bool = False,
    allow_dry_plan_fallback: bool = True,
    allow_data_preview: bool = False,
) -> dict:
    return await post_processor.run(
        generate_sql.get("replies"),
        project_id=project_id,
        use_dry_plan=use_dry_plan,
        data_source=data_source,
        allow_dry_plan_fallback=allow_dry_plan_fallback,
        allow_data_preview=allow_data_preview,
    )
```

**User Prompt Template** (Lines 29-80):

```jinja2
### DATABASE SCHEMA ###
{% for document in documents %}
    {{ document }}
{% endfor %}

{% if calculated_field_instructions %}
{{ calculated_field_instructions }}
{% endif %}

{% if metric_instructions %}
{{ metric_instructions }}
{% endif %}

{% if json_field_instructions %}
{{ json_field_instructions }}
{% endif %}

{% if sql_functions %}
### SQL FUNCTIONS ###
{% for function in sql_functions %}
{{ function }}
{% endfor %}
{% endif %}

{% if sql_samples %}
### SQL SAMPLES ###
{% for sample in sql_samples %}
Question:
{{sample.question}}
SQL:
{{sample.sql}}
{% endfor %}
{% endif %}

{% if instructions %}
### USER INSTRUCTIONS ###
{% for instruction in instructions %}
{{ loop.index }}. {{ instruction }}
{% endfor %}
{% endif %}

### QUESTION ###
User's Question: {{ query }}

{% if sql_generation_reasoning %}
### REASONING PLAN ###
{{ sql_generation_reasoning }}
{% endif %}

Let's think step by step.
```

#### Post-Processing & Validation

**File:** `wren-ai-service/src/pipelines/generation/utils/sql.py` (Lines 21-173)

**Class:** `SQLGenPostProcessor`

```python
@component
class SQLGenPostProcessor:
    def __init__(self, engine: Engine):
        self._engine = engine

    @component.output_types(
        valid_generation_result=Dict[str, Any],
        invalid_generation_result=Dict[str, Any],
    )
    async def run(
        self,
        replies: List[str] | List[List[str]],
        project_id: str | None = None,
        use_dry_plan: bool = False,
        allow_dry_plan_fallback: bool = True,
        data_source: str = "",
        allow_data_preview: bool = False,
    ) -> dict:
        try:
            # Step 1: Extract SQL from LLM response
            cleaned_generation_result = clean_generation_result(replies[0])

            # Handle JSON format: {"sql": "SELECT ..."}
            if cleaned_generation_result.startswith("{"):
                cleaned_generation_result = orjson.loads(cleaned_generation_result)["sql"]

            # Step 2: Validate SQL
            (
                valid_generation_result,
                invalid_generation_result,
            ) = await self._classify_generation_result(
                cleaned_generation_result,
                project_id=project_id,
                use_dry_plan=use_dry_plan,
                allow_dry_plan_fallback=allow_dry_plan_fallback,
                data_source=data_source,
                allow_data_preview=allow_data_preview,
            )

            return {
                "valid_generation_result": valid_generation_result,
                "invalid_generation_result": invalid_generation_result,
            }
        except Exception as e:
            logger.exception(f"Error in SQLGenPostProcessor: {e}")
            return {
                "valid_generation_result": {},
                "invalid_generation_result": {},
            }
```

**Validation Logic** (Lines 71-173):

```python
async def _classify_generation_result(
    self,
    generation_result: str,
    project_id: str | None = None,
    use_dry_plan: bool = False,
    allow_dry_plan_fallback: bool = True,
    data_source: str = "",
    allow_data_preview: bool = False,
) -> Dict[str, str]:
    valid_generation_result = {}
    invalid_generation_result = {}

    # Step 1: Add quotes to identifiers
    quoted_sql, error_message = add_quotes(generation_result)
    use_dry_run = not allow_data_preview

    async with aiohttp.ClientSession() as session:
        if not error_message:
            # Validation Mode 1: Dry Plan (Query Planning)
            if use_dry_plan:
                dry_plan_result, error_message = await self._engine.dry_plan(
                    session,
                    quoted_sql,
                    data_source,
                    allow_fallback=allow_dry_plan_fallback,
                )

                if dry_plan_result:
                    valid_generation_result = {
                        "sql": quoted_sql,
                        "correlation_id": "",
                    }
                else:
                    invalid_generation_result = {
                        "sql": quoted_sql,
                        "type": "DRY_PLAN",
                        "error": error_message,
                    }

            # Validation Mode 2: Dry Run (Syntax Check)
            elif use_dry_run:
                success, _, addition = await self._engine.execute_sql(
                    quoted_sql,
                    session,
                    project_id=project_id,
                    limit=1,
                    dry_run=True,
                )

                if success:
                    valid_generation_result = {
                        "sql": quoted_sql,
                        "correlation_id": addition.get("correlation_id", ""),
                    }
                else:
                    error_message = addition.get("error_message", "")
                    invalid_generation_result = {
                        "sql": addition.get("error_sql", quoted_sql),
                        "original_sql": quoted_sql,
                        "type": "DRY_RUN",
                        "error": error_message,
                        "correlation_id": addition.get("correlation_id", ""),
                    }

            # Validation Mode 3: Data Preview (Execute LIMIT 1)
            else:
                has_data, _, addition = await self._engine.execute_sql(
                    quoted_sql,
                    session,
                    project_id=project_id,
                    limit=1,
                    dry_run=False,
                )

                if has_data:
                    valid_generation_result = {
                        "sql": quoted_sql,
                        "correlation_id": addition.get("correlation_id", ""),
                    }
                else:
                    error_message = addition.get("error_message", "")
                    invalid_generation_result = {
                        "sql": addition.get("error_sql", quoted_sql),
                        "original_sql": quoted_sql,
                        "type": "PREVIEW_EMPTY_DATA" if error_message == "" else "PREVIEW_FAILED",
                        "error": error_message,
                        "correlation_id": addition.get("correlation_id", ""),
                    }
        else:
            # Quote addition failed
            invalid_generation_result = {
                "sql": generation_result,
                "original_sql": generation_result,
                "type": "ADD_QUOTES",
                "error": error_message,
            }

    return valid_generation_result, invalid_generation_result
```

### Stage 5: Correcting (Self-Correction Loop)

**Function:** `ask()` (Lines 529-614)

If validation fails, enter correction loop:

```python
# If invalid SQL, enter correction loop
if invalid_generation_result:
    self._ask_results[query_id] = AskResultResponse(
        status="correcting",
        type="TEXT_TO_SQL",
        retrieved_tables=table_names,
        invalid_sql=invalid_generation_result.get("sql"),
    )

    # Correction loop (up to 3 retries)
    while (
        invalid_generation_result
        and current_sql_correction_retries < max_sql_correction_retries
        and not self._is_stopped(query_id, self._ask_results)
    ):
        # Optional: Diagnose error first
        if allow_sql_diagnosis:
            sql_diagnosis_result = await self._pipelines["sql_diagnosis"].run(
                invalid_generation_result=invalid_generation_result,
                documents=documents,
                project_id=ask_request.project_id,
            )
            # Use diagnosed error message
            invalid_generation_result = sql_diagnosis_result.get(
                "post_process", {}
            ).get("invalid_generation_result", {})

        # Correct the SQL
        sql_correction_result = await self._pipelines["sql_correction"].run(
            invalid_generation_result=invalid_generation_result,
            documents=documents,
            instructions=instructions,
            sql_functions=sql_functions,
            project_id=ask_request.project_id,
            data_source=data_source,
            use_dry_plan=use_dry_plan,
            allow_dry_plan_fallback=allow_dry_plan_fallback,
        )

        # Check if correction succeeded
        valid_generation_result = sql_correction_result.get(
            "post_process", {}
        ).get("valid_generation_result", {})

        invalid_generation_result = sql_correction_result.get(
            "post_process", {}
        ).get("invalid_generation_result", {})

        current_sql_correction_retries += 1

        # Update status with retry count
        self._ask_results[query_id] = AskResultResponse(
            status="correcting",
            type="TEXT_TO_SQL",
            retrieved_tables=table_names,
            invalid_sql=invalid_generation_result.get("sql"),
        )
```

**File:** `wren-ai-service/src/pipelines/generation/sql_correction.py`

**System Prompt** (Lines 27-47):

```python
sql_correction_system_prompt = f"""
### TASK ###
You are an ANSI SQL expert with exceptional logical thinking skills and debugging skills, you need to fix the syntactically incorrect ANSI SQL query.

### SQL CORRECTION INSTRUCTIONS ###

1. First, think hard about the error message, and figure out the root cause first(please use the DATABASE SCHEMA, SQL FUNCTIONS and USER INSTRUCTIONS to help you figure out the root cause).
2. Then, generate the syntactically correct ANSI SQL query to correct the error.

### SQL RULES ###
Make sure you follow the SQL Rules strictly.

{TEXT_TO_SQL_RULES}

### FINAL ANSWER FORMAT ###
The final answer must be in JSON format:

{{
    "sql": <CORRECTED_SQL_QUERY_STRING>
}}
"""
```

**User Prompt** (Lines 49-76):

```jinja2
{% if documents %}
### DATABASE SCHEMA ###
{% for document in documents %}
    {{ document }}
{% endfor %}
{% endif %}

{% if sql_functions %}
### SQL FUNCTIONS ###
{% for function in sql_functions %}
{{ function }}
{% endfor %}
{% endif %}

{% if instructions %}
### USER INSTRUCTIONS ###
{% for instruction in instructions %}
{{ loop.index }}. {{ instruction }}
{% endfor %}
{% endif %}

### QUESTION ###
SQL: {{ invalid_generation_result.sql }}
Error Message: {{ invalid_generation_result.error }}

Let's think step by step.
```

**Pipeline Flow:**

```python
# 1. Build correction prompt
def prompt(
    documents: List[Document],
    invalid_generation_result: Dict,
    prompt_builder: PromptBuilder,
    instructions: list[dict] | None = None,
    sql_functions: list[SqlFunction] | None = None,
) -> dict:
    return prompt_builder.run(...)

# 2. Generate corrected SQL
async def generate_sql(prompt: dict, generator: Any) -> dict:
    return await generator(prompt=prompt.get("prompt"))

# 3. Validate again
async def post_process(
    generate_sql: dict,
    post_processor: SQLGenPostProcessor,
    ...
) -> dict:
    return await post_processor.run(...)
```

---

## Prompt Engineering Details

### TEXT_TO_SQL_RULES

**File:** `wren-ai-service/src/pipelines/generation/utils/sql.py` (Lines 203-255)

The comprehensive rule set that prevents common errors:

```python
TEXT_TO_SQL_RULES = """
### SQL RULES ###
- ONLY USE SELECT statements, NO DELETE, UPDATE OR INSERT etc. statements that might change the data in the database.
- ONLY USE the tables and columns mentioned in the database schema.
- ONLY USE "*" if the user query asks for all the columns of a table.
- ONLY CHOOSE columns belong to the tables mentioned in the database schema.
- DON'T INCLUDE comments in the generated SQL query.
- YOU MUST USE "JOIN" if you choose columns from multiple tables!
- PREFER USING CTEs over subqueries.
- YOU MUST USE "lower(<table_name>.<column_name>) like lower(<value>)" function or "lower(<table_name>.<column_name>) = lower(<value>)" function for case-insensitive comparison!
    - Use "lower(<table_name>.<column_name>) LIKE lower(<value>)" when:
        - The user requests a pattern or partial match.
        - The value is not specific enough to be a single, exact value.
        - Wildcards (%) are needed to capture the pattern.
    - Use "lower(<table_name>.<column_name>) = lower(<value>)" when:
        - The user requests an exact, specific value.
        - There is no ambiguity or pattern in the value.
- If the column is date/time related field, and it is a INT/BIGINT/DOUBLE/FLOAT type, please use the appropriate function mentioned in the SQL FUNCTIONS section to cast the column to "TIMESTAMP" type first before using it in the query
    - example: TO_TIMESTAMP_MILLIS("<timestamp_column>")  # if the timestamp_column is in milliseconds
    - example: TO_TIMESTAMP_SECONDS("<timestamp_column>")  # if the timestamp_column is in seconds
    - example: TO_TIMESTAMP_MICROS("<timestamp_column>")  # if the timestamp_column is in microseconds
- ALWAYS CAST the date/time related field to "TIMESTAMP WITH TIME ZONE" type when using them in the query
    - example 1: CAST(properties_closedate AS TIMESTAMP WITH TIME ZONE)
    - example 2: CAST('2024-11-09 00:00:00' AS TIMESTAMP WITH TIME ZONE)
    - example 3: CAST(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AS TIMESTAMP WITH TIME ZONE)
- If the user asks for a specific date, please give the date range in SQL query
    - example: "What is the total revenue for the month of 2024-11-01?"
    - answer: "SELECT SUM(r.PriceSum) FROM Revenue r WHERE CAST(r.PurchaseTimestamp AS TIMESTAMP WITH TIME ZONE) >= CAST('2024-11-01 00:00:00' AS TIMESTAMP WITH TIME ZONE) AND CAST(r.PurchaseTimestamp AS TIMESTAMP WITH TIME ZONE) < CAST('2024-11-02 00:00:00' AS TIMESTAMP WITH TIME ZONE)"
- USE THE VIEW TO SIMPLIFY THE QUERY.
- DON'T MISUSE THE VIEW NAME. THE ACTUAL NAME IS FOLLOWING THE CREATE VIEW STATEMENT.
- ONLY USE table/column alias in the final SELECT clause; don't use table/column alias in the other clauses.
- Refer to the value of alias from the comment section of the corresponding table or column in the DATABASE SCHEMA section for reference when using alias in the final SELECT clause.
  - EXAMPLE
    DATABASE SCHEMA
    /* {"alias":"_orders","description":"A model representing the orders data."} */
    CREATE TABLE orders (
      -- {"description":"A column that represents the timestamp when the order was approved.","alias":"_timestamp"}
      ApprovedTimestamp TIMESTAMP
    }

    SQL
    SELECT _orders.ApprovedTimestamp AS _timestamp FROM orders AS _orders;
- DON'T USE '.' in column/table alias, replace '.' with '_' in column/table alias.
- DON'T USE "FILTER(WHERE <expression>)" clause in the generated SQL query.
- DON'T USE "EXTRACT(EPOCH FROM <expression>)" clause in the generated SQL query.
- DON'T USE "EXTRACT()" function with INTERVAL data types as arguments
- DON'T USE INTERVAL or generate INTERVAL-like expression in the generated SQL query.
- DON'T USE "TO_CHAR" function in the generated SQL query.
- Aggregate functions are not allowed in the WHERE clause. Instead, they belong in the HAVING clause, which is used to filter after aggregation.
- You can only add "ORDER BY" and "LIMIT" to the final "UNION" result.
- For the ranking problem, you must use the ranking function, `DENSE_RANK()` to rank the results and then use `WHERE` clause to filter the results.
- For the ranking problem, you must add the ranking column to the final SELECT clause.
"""
```

### Calculated Field Instructions

**File:** `wren-ai-service/src/pipelines/generation/utils/sql.py` (Lines 279-324)

Teaches LLM to use pre-computed calculated fields:

```python
calculated_field_instructions = """
#### Instructions for Calculated Field ####

The first structure is the special column marked as "Calculated Field". You need to interpret the purpose and calculation basis for these columns, then utilize them in the following text-to-sql generation tasks.
First, provide a brief explanation of what each field represents in the context of the schema, including how each field is computed using the relationships between models.
Then, during the following tasks, if the user queries pertain to any calculated fields defined in the database schema, ensure to utilize those calculated fields appropriately in the output SQL queries.
The goal is to accurately reflect the intent of the question in the SQL syntax, leveraging the pre-computed logic embedded within the calculated fields.

EXAMPLES:
The given schema is created by the SQL command:

CREATE TABLE orders (
  OrderId VARCHAR PRIMARY KEY,
  CustomerId VARCHAR,
  -- This column is a Calculated Field
  -- column expression: avg(reviews.Score)
  Rating DOUBLE,
  -- This column is a Calculated Field
  -- column expression: count(reviews.Id)
  ReviewCount BIGINT,
  -- This column is a Calculated Field
  -- column expression: count(order_items.ItemNumber)
  Size BIGINT,
  -- This column is a Calculated Field
  -- column expression: count(order_items.ItemNumber) > 1
  Large BOOLEAN,
  FOREIGN KEY (CustomerId) REFERENCES customers(Id)
);

Interpret the columns that are marked as Calculated Fields in the schema:
Rating (DOUBLE) - Calculated as the average score (avg) of the Score field from the reviews table where the reviews are associated with the order. This field represents the overall customer satisfaction rating for the order based on review scores.
ReviewCount (BIGINT) - Calculated by counting (count) the number of entries in the reviews table associated with this order. It measures the volume of customer feedback received for the order.
Size (BIGINT) - Represents the total number of items in the order, calculated by counting the number of item entries (ItemNumber) in the order_items table linked to this order. This field is useful for understanding the scale or size of an order.
Large (BOOLEAN) - A boolean value calculated to check if the number of items in the order exceeds one (count(order_items.ItemNumber) > 1). It indicates whether the order is considered large in terms of item quantity.

And if the user input queries like these:
1. "How many large orders have been placed by customer with ID 'C1234'?"
2. "What is the average customer rating for orders that were rated by more than 10 reviewers?"

For the first query:
First try to interpret the user query, the user wants to know the average rating for orders which have attracted significant review activity, specifically those with more than 10 reviews.
Then, according to the above interpretation about the given schema, the term 'Rating' is predefined in the Calculated Field of the 'orders' model. And, the number of reviews is also predefined in the 'ReviewCount' Calculated Field.
So utilize those Calculated Fields in the SQL generation process to give an answer like this:

SQL Query: SELECT AVG(Rating) FROM orders WHERE ReviewCount > 10
"""
```

### Metric Instructions

**File:** `wren-ai-service/src/pipelines/generation/utils/sql.py` (Lines 326-450)

Explains OLAP-like metric structures:

```python
metric_instructions = """
#### Instructions for Metric ####

Second, you will learn how to effectively utilize the special "metric" structure in text-to-SQL generation tasks.
Metrics in a data model simplify complex data analysis by structuring data through predefined dimensions and measures.
This structuring closely mirrors the concept of OLAP (Online Analytical Processing) cubes but is implemented in a more flexible and SQL-friendly manner.

The metric typically constructed of the following components:
1. Base Object
The "base object" of a metric indicates the primary data source or table that provides the raw data.
Metrics are constructed by selecting specific data points (dimensions and measures) from this base object, effectively creating a summarized or aggregated view of the data that can be queried like a normal table.
Base object is the attribute of the metric, showing the origin of this metric and is typically not used in the query.

2. Dimensions
Dimensions in a metric represent the various axes along which data can be segmented for analysis.
These are fields that provide a categorical breakdown of data.
Each dimension provides a unique perspective on the data, allowing users to "slice and dice" the data cube to view different facets of the information contained within the base dataset.
Dimensions are used as table columns in the querying process. Querying a dimension means to get the statistic from the certain perspective.

3. Measures
Measures are numerical or quantitative statistics calculated from the data. Measures are key results or outputs derived from data aggregation functions like SUM, COUNT, or AVG.
Measures are used as table columns in the querying process, and are the main querying items in the metric structure.
The expression of a measure represents the definition of the metric that users are interested in. Make sure to understand the meaning of measures from their expressions.

4. Time Grain
Time Grain specifies the granularity of time-based data aggregation, such as daily, monthly, or yearly, facilitating trend analysis over specified periods.

EXAMPLES:
...
[Detailed examples of metric usage]
"""
```

### System Prompt

**File:** `wren-ai-service/src/pipelines/generation/utils/sql.py` (Lines 257-277)

The main SQL generation system prompt:

```python
sql_generation_system_prompt = f"""
You are a helpful assistant that converts natural language queries into ANSI SQL queries.

Given user's question, database schema, etc., you should think deeply and carefully and generate the SQL query based on the given reasoning plan step by step.

### GENERAL RULES ###

1. YOU MUST FOLLOW the instructions strictly to generate the SQL query if the section of USER INSTRUCTIONS is available in user's input.
2. YOU MUST ONLY CHOOSE the appropriate functions from the sql functions list and use them in the SQL query if the section of SQL FUNCTIONS is available in user's input.
3. YOU MUST REFER to the sql samples and learn the usage of the schema structures and how SQL is written based on them if the section of SQL SAMPLES is available in user's input.
4. YOU MUST FOLLOW the reasoning plan step by step strictly to generate the SQL query if the section of REASONING PLAN is available in user's input.

{TEXT_TO_SQL_RULES}

### FINAL ANSWER FORMAT ###
The final answer must be a ANSI SQL query in JSON format:

{{
    "sql": <SQL_QUERY_STRING>
}}
"""
```

---

## Self-Correction Mechanism

### Error Flow

**File:** `wren-ai-service/src/web/v1/services/ask.py` (Lines 529-614)

The correction loop handles three types of errors:

1. **Syntax Errors** - Invalid SQL syntax
2. **Semantic Errors** - Valid syntax but references non-existent tables/columns
3. **Execution Errors** - Valid SQL but returns no data or times out

**Correction Strategy:**

```python
# Step 1: Optional SQL Diagnosis
if allow_sql_diagnosis:
    # Use specialized diagnosis pipeline to analyze error
    sql_diagnosis_result = await self._pipelines["sql_diagnosis"].run(
        invalid_generation_result=invalid_generation_result,
        documents=documents,
        project_id=ask_request.project_id,
    )
    # Get enhanced error message
    invalid_generation_result = sql_diagnosis_result.get(
        "post_process", {}
    ).get("invalid_generation_result", {})

# Step 2: Correct the SQL
sql_correction_result = await self._pipelines["sql_correction"].run(
    invalid_generation_result=invalid_generation_result,
    documents=documents,
    instructions=instructions,
    sql_functions=sql_functions,
    project_id=ask_request.project_id,
    data_source=data_source,
    use_dry_plan=use_dry_plan,
    allow_dry_plan_fallback=allow_dry_plan_fallback,
)

# Step 3: Validate corrected SQL
valid_generation_result = sql_correction_result.get("post_process", {}).get("valid_generation_result", {})
invalid_generation_result = sql_correction_result.get("post_process", {}).get("invalid_generation_result", {})

# Step 4: Increment retry counter
current_sql_correction_retries += 1

# Step 5: Repeat if still invalid (up to max retries)
```

### SQL Diagnosis Pipeline

**File:** `wren-ai-service/src/pipelines/generation/sql_diagnosis.py` (Lines 1-120)

**Purpose:** Analyzes error messages and provides clearer explanations

**System Prompt** (Lines 24-50):

```python
sql_diagnosis_system_prompt = """
### TASK ###
You are an ANSI SQL expert with exceptional logical thinking skills and debugging skills.
Your task is to analyze the syntactically incorrect ANSI SQL query and its error message, then provide a clear diagnosis of what went wrong.

### DIAGNOSIS INSTRUCTIONS ###

1. Carefully read the error message and the SQL query.
2. Identify the specific part of the SQL that caused the error.
3. Explain in simple terms what the error means and why it occurred.
4. Suggest what needs to be changed to fix the error.

### OUTPUT FORMAT ###

{
    "diagnosis": "<clear explanation of the error>",
    "suggested_fix": "<what needs to be changed>"
}
"""
```

**Usage:**

```python
# Input
{
    "sql": "SELECT * FROM orders WHERE order_date > '2024-01-01'",
    "error": "Column 'order_date' does not exist",
}

# Diagnosis Output
{
    "diagnosis": "The error indicates that the column 'order_date' is not found in the 'orders' table. Looking at the schema, the actual column name is 'OrderDate' (with capital letters).",
    "suggested_fix": "Change 'order_date' to 'OrderDate' in the WHERE clause, or use proper quoting if the column name differs."
}

# Then passes to correction pipeline with enhanced error message
```

---

## Pipeline Components

### Provider Architecture

**File:** `wren-ai-service/src/core/provider.py`

All external service integrations use provider abstraction:

#### LLM Provider

```python
class LLMProvider(ABC):
    def __init__(self, model_name: str = "", model_kwargs: dict = {}):
        self._model = model_name
        self._model_kwargs = model_kwargs

    @abstractmethod
    def get_generator(self, system_prompt: str = "") -> Any:
        """Returns a Haystack generator component"""
        ...
```

**Implementations:**
- `OpenAILLMProvider` - OpenAI API
- `AzureOpenAILLMProvider` - Azure OpenAI
- `OllamaLLMProvider` - Ollama
- Custom providers via config

**File:** `wren-ai-service/src/providers/llm/`

#### Embedder Provider

```python
class EmbedderProvider(ABC):
    def __init__(self, model_name: str = ""):
        self._model = model_name

    @abstractmethod
    def get_text_embedder(self) -> Any:
        """Returns a Haystack text embedder"""
        ...

    @abstractmethod
    def get_document_embedder(self) -> Any:
        """Returns a Haystack document embedder"""
        ...
```

**File:** `wren-ai-service/src/providers/embedder/`

#### Document Store Provider

```python
class DocumentStoreProvider(ABC):
    @abstractmethod
    def get_store(self, **kwargs) -> Any:
        """Returns a Haystack document store (Qdrant)"""
        ...

    @abstractmethod
    def get_retriever(self, **kwargs) -> Any:
        """Returns a Haystack retriever"""
        ...

    @abstractmethod
    def get_writer(self, **kwargs) -> Any:
        """Returns a Haystack document writer"""
        ...
```

**Implementation:** `QdrantProvider`

**File:** `wren-ai-service/src/providers/document_store/qdrant.py`

#### Engine Provider

```python
class Engine(ABC):
    @abstractmethod
    async def execute_sql(
        self,
        sql: str,
        session: aiohttp.ClientSession,
        project_id: str | None = None,
        dry_run: bool = True,
        limit: int = 1,
    ) -> tuple[bool, tuple, dict]:
        """Execute SQL via Wren Engine / Ibis Server"""
        ...

    @abstractmethod
    async def dry_plan(
        self,
        session: aiohttp.ClientSession,
        sql: str,
        data_source: str = "",
        allow_fallback: bool = True,
    ) -> tuple[bool, str]:
        """Validate SQL using query planner"""
        ...
```

**Implementation:** `WrenEngine`

**File:** `wren-ai-service/src/providers/engine/wren_engine.py`

### Hamilton DAG Pattern

**Library:** `sf-hamilton` - Dataflow framework

**Why Hamilton?**
- Declarative DAG definitions
- Automatic dependency resolution
- Built-in observability hooks
- Type-safe function composition

**Example Pipeline:**

```python
# File: wren-ai-service/src/pipelines/generation/sql_generation.py

# Each function is a DAG node
# Function parameters = dependencies
# Return value = node output

@observe(capture_input=False)
def prompt(
    query: str,  # Provided as input
    documents: list[str],  # Depends on retrieval
    prompt_builder: PromptBuilder,  # Injected component
    ...
) -> dict:
    # Build prompt from dependencies
    return {"prompt": "..."}

@observe(as_type="generation")
async def generate_sql(
    prompt: dict,  # Depends on prompt() output
    generator: Any,
) -> dict:
    # Generate SQL using LLM
    return await generator(prompt=prompt.get("prompt"))

@observe(capture_input=False)
async def post_process(
    generate_sql: dict,  # Depends on generate_sql() output
    post_processor: SQLGenPostProcessor,
) -> dict:
    # Validate and post-process
    return await post_processor.run(...)

# Hamilton automatically builds DAG:
# query → prompt → generate_sql → post_process
```

**Pipeline Execution:**

```python
# File: wren-ai-service/src/core/pipeline.py

class BasicPipeline(ABC):
    def __init__(self, ...):
        # Build Hamilton driver
        self._driver = AsyncDriver(
            {},  # Initial state
            self._pipeline_modules,  # Python modules with DAG functions
            adapter=base.DefaultAdapter(),
        )

    async def run(self, **kwargs):
        # Execute DAG
        return await self._driver.execute(
            final_vars=["post_process"],  # Terminal nodes
            inputs=kwargs,  # Input values
        )
```

### Observability with Langfuse

**File:** `wren-ai-service/src/utils.py`

Every pipeline step is traced:

```python
from langfuse.decorators import observe

@observe(name="Step Name", as_type="generation")
async def pipeline_step(...):
    # Automatically logged to Langfuse:
    # - Input parameters
    # - Output values
    # - Execution time
    # - LLM tokens/cost (if generation)
    ...
```

**Trace Hierarchy:**

```
Ask Question (Trace)
├── Historical Question Retrieval (Span)
├── Intent Classification (Span)
│   └── LLM Call (Generation)
├── DB Schema Retrieval (Span)
│   ├── Embedding (Span)
│   ├── Table Retrieval (Span)
│   └── Column Pruning (Span)
│       └── LLM Call (Generation)
├── SQL Generation (Span)
│   ├── Prompt Building (Span)
│   ├── LLM Call (Generation)
│   └── Validation (Span)
└── SQL Correction (Span)
    ├── LLM Call (Generation)
    └── Re-validation (Span)
```

**Cost Tracking:**

```python
@trace_cost
async def generate_sql(prompt: dict, generator: Any):
    # Automatically captures:
    # - Model name
    # - Prompt tokens
    # - Completion tokens
    # - Total cost
    return await generator(...)
```

---

## Code References Index

### Core Service Files

| File | Purpose | Key Classes/Functions |
|------|---------|----------------------|
| `wren-ai-service/src/__main__.py` | Application entrypoint | `lifespan()`, FastAPI setup |
| `wren-ai-service/src/globals.py` | Service container registry | `create_service_container()`, `create_service_metadata()` |
| `wren-ai-service/src/config.py` | Configuration loading | `Config`, component generation |
| `wren-ai-service/src/core/pipeline.py` | Pipeline base class | `BasicPipeline` |
| `wren-ai-service/src/core/provider.py` | Provider interfaces | `LLMProvider`, `EmbedderProvider`, `DocumentStoreProvider` |
| `wren-ai-service/src/core/engine.py` | Engine interface | `Engine` |

### Pipeline Files

#### Indexing Pipelines

| File | Purpose | Key Functions |
|------|---------|---------------|
| `wren-ai-service/src/pipelines/indexing/db_schema.py` | MDL → DDL conversion & indexing | `DDLChunker`, `_convert_models_and_relationships()` |
| `wren-ai-service/src/pipelines/indexing/historical_question.py` | Index question-SQL pairs | `HistoricalQuestionIndexing` |
| `wren-ai-service/src/pipelines/indexing/sql_pairs.py` | Index SQL samples | `SQLPairsIndexing` |
| `wren-ai-service/src/pipelines/indexing/instructions.py` | Index user instructions | `InstructionsIndexing` |
| `wren-ai-service/src/pipelines/indexing/table_description.py` | Index table descriptions | `TableDescriptionIndexing` |

#### Retrieval Pipelines

| File | Purpose | Key Functions |
|------|---------|---------------|
| `wren-ai-service/src/pipelines/retrieval/db_schema_retrieval.py` | Retrieve relevant schema | `table_retrieval()`, `dbschema_retrieval()`, `column_selection()` |
| `wren-ai-service/src/pipelines/retrieval/historical_question_retrieval.py` | Retrieve cached questions | `HistoricalQuestionRetrieval` |
| `wren-ai-service/src/pipelines/retrieval/sql_pairs_retrieval.py` | Retrieve SQL examples | `SQLPairsRetrieval` |
| `wren-ai-service/src/pipelines/retrieval/instructions.py` | Retrieve instructions | `InstructionsRetrieval` |
| `wren-ai-service/src/pipelines/retrieval/sql_functions.py` | Retrieve SQL functions | `SqlFunction`, function definitions |

#### Generation Pipelines

| File | Purpose | Key Functions |
|------|---------|---------------|
| `wren-ai-service/src/pipelines/generation/intent_classification.py` | Classify query intent | `IntentClassification`, prompt template |
| `wren-ai-service/src/pipelines/generation/sql_generation_reasoning.py` | Generate reasoning plan | `SQLGenerationReasoning` |
| `wren-ai-service/src/pipelines/generation/sql_generation.py` | Generate SQL | `prompt()`, `generate_sql()`, `post_process()` |
| `wren-ai-service/src/pipelines/generation/sql_correction.py` | Correct invalid SQL | `SQLCorrection` |
| `wren-ai-service/src/pipelines/generation/sql_diagnosis.py` | Diagnose SQL errors | `SQLDiagnosis` |
| `wren-ai-service/src/pipelines/generation/utils/sql.py` | SQL prompts & rules | `TEXT_TO_SQL_RULES`, `SQLGenPostProcessor` |

### Service Files

| File | Purpose | Key Classes |
|------|---------|------------|
| `wren-ai-service/src/web/v1/services/ask.py` | Main text-to-SQL service | `AskService.ask()` (Lines 133-620) |
| `wren-ai-service/src/web/v1/services/ask_details.py` | SQL explanation service | `AskDetailsService` |
| `wren-ai-service/src/web/v1/services/semantics_preparation.py` | MDL deployment service | `SemanticsPreparationService` |

### Provider Implementations

| File | Purpose |
|------|---------|
| `wren-ai-service/src/providers/llm/openai.py` | OpenAI LLM provider |
| `wren-ai-service/src/providers/llm/azure_openai.py` | Azure OpenAI provider |
| `wren-ai-service/src/providers/llm/ollama.py` | Ollama provider |
| `wren-ai-service/src/providers/embedder/openai_embedder.py` | OpenAI embedder |
| `wren-ai-service/src/providers/document_store/qdrant.py` | Qdrant vector store |
| `wren-ai-service/src/providers/engine/wren_engine.py` | Wren Engine integration |

### Configuration

| File | Purpose |
|------|---------|
| `wren-ai-service/config.yaml` | Pipeline & model configuration |
| `wren-ai-service/.env.dev` | Environment variables |
| `wren-ai-service/docs/config_examples/` | LLM provider config examples |

---

## Summary: The Complete Workflow

### Request Flow

```
User Question
    ↓
1. Historical Cache Check (Qdrant)
    ├─ Cache Hit → Return cached SQL ✓
    └─ Cache Miss → Continue ↓

2. Intent Classification (LLM)
    ├─ TEXT_TO_SQL → Continue ↓
    ├─ MISLEADING_QUERY → Assistance Pipeline
    ├─ GENERAL → Data Explanation Pipeline
    └─ USER_GUIDE → Help Pipeline

3. Parallel Retrieval (Qdrant + LLM)
    ├─ Table Retrieval (Vector Search)
    ├─ Schema Retrieval (Metadata Filter)
    ├─ Column Pruning (Optional LLM)
    ├─ SQL Pairs (Vector Search)
    ├─ Instructions (Vector Search)
    └─ SQL Functions (Lookup)

4. Optional Reasoning (LLM)
    └─ Generate step-by-step plan

5. SQL Generation (LLM)
    ├─ Build comprehensive prompt
    ├─ Generate SQL
    └─ Validate with Wren Engine
        ├─ Valid → Return SQL ✓
        └─ Invalid → Continue ↓

6. Self-Correction Loop (LLM + Validation)
    ├─ Diagnose error (Optional LLM)
    ├─ Correct SQL (LLM)
    ├─ Re-validate (Engine)
    ├─ Retry (up to 3 times)
    └─ Final Result (Valid or Error)
```

### What Makes It Exceptional

1. **Semantic Layer First**
   - Business logic embedded in DDL comments
   - Calculated fields, metrics, relationships all encoded
   - LLM understands business context, not just schema

2. **Multi-Stage RAG**
   - Separate retrieval for schema, examples, instructions
   - Column pruning for token efficiency
   - Intent classification for routing

3. **Comprehensive Prompt Engineering**
   - 50+ hand-crafted SQL rules
   - Calculated field instructions
   - Metric (OLAP) instructions
   - Database-specific functions
   - Few-shot examples from history

4. **Validation-Driven Self-Correction**
   - Validates with actual database engine
   - Three validation modes (dry plan, dry run, execute)
   - Iterative correction with error analysis
   - Up to 3 retry attempts

5. **Observability & Tracing**
   - Every step tracked in Langfuse
   - Cost tracking per pipeline
   - Error tracking and debugging
   - Performance monitoring

6. **Modular Architecture**
   - Provider abstraction (swap LLMs easily)
   - Hamilton DAG (declarative pipelines)
   - Haystack components (LLM framework)
   - Multi-LLM support (different models per pipeline)

The combination of **semantic understanding**, **intelligent retrieval**, **comprehensive prompting**, and **iterative validation** creates a production-grade text-to-SQL system that handles complex business questions with high accuracy.
