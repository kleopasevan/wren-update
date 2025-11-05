# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Wren AI is a GenBI (Generative Business Intelligence) Agent that converts natural language queries into accurate SQL, charts, and AI-generated insights. The project consists of multiple services working together:

- **wren-ui**: Next.js frontend and GraphQL backend (TypeScript/Node.js)
- **wren-ai-service**: LLM pipeline service for text-to-SQL and insights (Python)
- **wren-engine**: Semantic engine core, providing MCP server capabilities (Rust/Java)
- **wren-engine/ibis-server**: Query execution service using Ibis (Python/FastAPI)
- **wren-launcher**: CLI launcher utility (Go)
- **wren-mdl**: Modeling Definition Language schema

The architecture uses a semantic layer (MDL - Modeling Definition Language) that encodes business context, allowing LLMs to understand data relationships and generate accurate SQL queries.

## Development Setup

### Starting All Services (Docker Compose)

```bash
# In docker/ directory
cp .env.example .env.local
# Edit .env.local - set OPENAI_API_KEY and other required keys

# Copy AI service config
cp config.example.yaml config.yaml
# Edit config.yaml for LLM provider settings

# Start all services
docker-compose -f docker-compose-dev.yaml --env-file .env.local up -d

# Stop services
docker-compose -f docker-compose-dev.yaml --env-file .env.local down
```

### Wren UI Service (Next.js)

**Requirements**: Node.js 18

```bash
cd wren-ui

# Install dependencies
yarn install

# Database setup (SQLite by default, can use Postgres)
yarn migrate

# For Postgres instead of SQLite:
export DB_TYPE=pg
export PG_URL=postgres://user:password@localhost:5432/dbname

# Start dev server (with other services in Docker)
export OTHER_SERVICE_USING_DOCKER=true
export EXPERIMENTAL_ENGINE_RUST_VERSION=false
yarn dev

# Build
yarn build

# Lint and type check
yarn lint
yarn check-types

# Run tests
yarn test

# E2E tests
yarn test:e2e

# Generate GraphQL types
yarn generate-gql
```

**Key directories**:
- `src/apollo/server/`: GraphQL backend (adaptors, repositories, services)
- `src/components/`: React components
- `src/pages/`: Next.js pages
- `migrations/`: Database migrations (Knex)
- `e2e/`: Playwright end-to-end tests

**Database switching**: Wren UI supports SQLite (default) and Postgres. Use `DB_TYPE` and `SQLITE_FILE` or `PG_URL` env vars to switch. After switching databases, run deployment in the modeling page to deploy the semantic model.

### Wren AI Service (Python)

**Requirements**: Python 3.12.*, Poetry 1.8.3, Just command runner 1.36+

```bash
cd wren-ai-service

# Install dependencies
poetry install

# Generate config files
just init  # Creates .env.dev and config.yaml
# Or: just init --non-dev  # Only creates config.yaml

# Edit .env.dev and config.yaml with your settings
# See docs/configuration.md for details

# Install pre-commit hooks (optional)
poetry run pre-commit install
poetry run pre-commit run --all-files

# Run tests
just test

# Start required containers (Qdrant, etc.)
just up

# Start AI service
just start

# Stop containers
just down
```

**Common commands**:
- `just test`: Run pytest tests
- `just up`: Start dev containers
- `just down`: Stop dev containers
- `just start`: Start AI service locally
- `just load-test`: Run load tests with Locust

**Key directories**:
- `src/`: Main source code (pipelines, components, providers)
- `eval/`: Evaluation framework for pipelines
- `tests/`: Pytest tests
- `tools/config/`: Configuration templates

**Configuration**: AI model settings go in `config.yaml`, not `.env`. See `docs/config_examples/` for LLM provider examples (OpenAI, Azure, Anthropic, Ollama, etc.).

### Wren Engine - Ibis Server (Python/FastAPI)

**Requirements**: Python 3.12+, Poetry, Just

```bash
cd wren-engine/ibis-server

# Install dependencies (includes building wren-core-py)
just install

# Install pre-commit hooks
just pre-commit-install

# Run dev server
just dev

# Run production server
just run

# Run with Gunicorn
just run-gunicorn

# Run tests
just test <MARKER>
just test-verbose <MARKER>

# Lint and format
just lint
just format

# Docker build and run
just docker-build
just docker-run
```

**Note**: Ibis server depends on `wren-core-py` (Rust Python bindings). The `just install` command automatically builds the required wheel from `../wren-core-py`.

### Wren Engine - Core (Rust)

```bash
cd wren-engine/wren-core-py

# Install Python dependencies
poetry install --no-root

# Build Rust Python bindings
poetry run maturin build  # Dev build
ENV=prod poetry run maturin build --release  # Release build

# Develop mode (builds and installs locally)
poetry run maturin develop

# Run tests
cargo test --no-default-features  # Rust tests
poetry run pytest  # Python tests
just test  # Both

# Format code
just format
```

### Wren Launcher (Go)

```bash
cd wren-launcher

# Build for all platforms
make build

# Format code
make fmt

# Lint
make lint
make lint-fix

# Run tests
make test

# Clean build artifacts
make clean
```

## Common Development Workflows

### Working on Multiple Services

Comment out services in `docker/docker-compose-dev.yaml` that you're developing locally, then start them from source. Update env variables to point to your local services.

Example for developing UI + Engine together:
1. Comment out `wren-engine` and `wren-ui` in `docker/docker-compose-dev.yaml`
2. Start remaining services: `docker-compose -f docker-compose-dev.yaml up -d`
3. Start wren-engine from source
4. Start wren-ui from source with `OTHER_SERVICE_USING_DOCKER=true`
5. Update connection endpoints in `.env.local` as needed

### Adding a New Data Source Connector

This requires changes in both Wren Engine and Wren UI:

**Engine (ibis-server)**:
1. Implement the new data source in ibis-server
2. Implement metadata API for the UI
3. Reference PRs: MSSQL (#631), MySQL (#618), ClickHouse (#648)

**UI Backend**:
1. Define data source in `wren-ui/src/apollo/server/dataSource.ts` (add `toIbisConnectionInfo` and `sensitiveProps`)
2. Update `wren-ui/src/apollo/server/adaptors/ibisAdaptor.ts` (connection info type, URL map)
3. Update `wren-ui/src/apollo/server/repositories/projectRepository.ts` (connection info type)
4. Update GraphQL schema in `wren-ui/src/apollo/server/schema.ts` (add to `DataSource` enum)
5. Update `wren-ui/src/apollo/server/types/dataSource.ts` (add to `DataSourceName` enum)

**UI Frontend**:
1. Add data source logo (40x40px SVG) in `wren-ui/src/components/pages/setup/dataSources/`
2. Create form template: `${dataSource}Properties.tsx`
3. Update `wren-ui/src/utils/dataSourceType.ts` with image, name, properties
4. Update `wren-ui/src/utils/enum/dataSources.ts` DATA_SOURCES enum

### Running Tests

**Wren UI**:
```bash
cd wren-ui
yarn test          # Jest unit tests
yarn test:e2e      # Playwright E2E tests
yarn lint          # ESLint + type checking
```

**Wren AI Service**:
```bash
cd wren-ai-service
just test                    # All pytest tests
poetry run pytest -s <path>  # Specific test
just load-test              # Load testing with Locust
```

**Ibis Server**:
```bash
cd wren-engine/ibis-server
just test <MARKER>          # Run tests with marker
just test-verbose <MARKER>  # Verbose output
```

### Linting and Formatting

**Wren UI**:
```bash
yarn lint          # ESLint + TypeScript
yarn check-types   # TypeScript only
```

**Wren AI Service**:
```bash
poetry run pre-commit run --all-files  # Run all pre-commit hooks
poetry run ruff format .               # Format Python
poetry run ruff check .                # Lint Python
```

**Ibis Server**:
```bash
just lint      # Check formatting and linting
just format    # Auto-format code (ruff + taplo)
```

**Wren Launcher**:
```bash
make check     # fmt + vet + lint
make fix       # fmt + imports + lint-fix
```

## Git Workflow

**Commit Prefixes** (required for changelog):
- `feat(wren-ui)`: New features in UI
- `feat(wren-ai-service)`: New features in AI service
- `feat(wren-engine)`: New features in engine
- `chore(...)`: Maintenance work
- `fix(...)`: Bug fixes

**Pull Requests**:
- Link PR to issue if solving one
- Add appropriate `module/` label (e.g., `module/ai-service`)
- Use conventional commit format in PR title

## Architecture Notes

### Service Communication

- **wren-ui** ← GraphQL API ← User
- **wren-ui** → REST → **wren-engine** (semantic model operations)
- **wren-ui** → REST → **ibis-server** (query execution, data preview)
- **wren-ui** → REST → **wren-ai-service** (text-to-SQL, insights)
- **wren-ai-service** → REST → **wren-ui** (callbacks, status updates)
- **ibis-server** → **wren-engine** (semantic layer validation)
- Services use **qdrant** for vector storage (AI service only)

### Key Concepts

- **MDL (Modeling Definition Language)**: JSON schema defining semantic models (models, relationships, metrics, calculated fields)
- **Semantic Layer**: Translates business logic into SQL, ensuring LLMs generate accurate queries
- **Deployment**: Pushing semantic model from UI to AI service for query generation
- **MCP Server**: Model Context Protocol server for AI agent integration (in wren-engine/mcp-server)

### Testing Philosophy

- wren-ui: Jest unit tests for services/adaptors, Playwright E2E for user flows
- wren-ai-service: Pytest for pipeline testing, evaluation framework in `eval/` for accuracy metrics
- ibis-server: Pytest with markers for different test categories
- Test files are co-located with source code where possible

## AI Engine Workflow: What Makes Wren AI So Good?

The AI service (`wren-ai-service`) implements a sophisticated multi-stage RAG (Retrieval-Augmented Generation) pipeline that combines semantic understanding, intelligent retrieval, and iterative refinement. Here's what makes it effective:

### 1. Semantic Layer Indexing (MDL → Vector Store)

**Location**: `wren-ai-service/src/pipelines/indexing/db_schema.py`

When the semantic model is deployed:
1. **MDL Parsing**: Converts the MDL (models, relationships, metrics, views) into CREATE TABLE DDL statements
2. **Semantic Chunking**: Each table, view, and metric is chunked with rich metadata:
   - Table descriptions and aliases (business names)
   - Column descriptions with data types
   - Calculated fields with their expressions (e.g., `avg(reviews.Score)`)
   - Metrics with dimensions and measures (OLAP-like structures)
   - Foreign key relationships with join conditions
3. **Embedding & Storage**: Embeds table descriptions and stores in Qdrant vector DB with metadata filters
   - Documents tagged by type: `TABLE_DESCRIPTION`, `TABLE_SCHEMA`, `METRIC`, `VIEW`
   - Project-scoped for multi-tenancy

**Key Innovation**: The semantic layer encodes business logic (calculated fields, metrics) directly into the DDL comments, so the LLM understands not just raw schema but business context.

### 2. Multi-Stage Text-to-SQL Pipeline

**Location**: `wren-ai-service/src/web/v1/services/ask.py`

The query workflow has multiple intelligent stages:

#### Stage 1: Understanding (Intent Classification)
**Pipeline**: `intent_classification`

- Classifies query intent: `TEXT_TO_SQL`, `MISLEADING_QUERY`, `GENERAL`, or `USER_GUIDE`
- Rephrases the question for clarity
- Routes non-SQL queries to assistance pipelines
- Uses conversation history for context

#### Stage 2: Searching (Semantic Retrieval)
**Pipelines**: `db_schema_retrieval`, `sql_pairs_retrieval`, `instructions_retrieval`

**Vector Retrieval** ([db_schema_retrieval.py:125-200](wren-ai-service/src/pipelines/retrieval/db_schema_retrieval.py#L125-L200)):
1. **Embed user query** with conversation history as context
2. **Table Retrieval**: Find relevant tables via vector similarity
3. **Schema Retrieval**: Pull detailed DDL for selected tables
4. **Column Pruning** (optional): Uses LLM to select only relevant columns from tables, reducing token count

**Few-Shot Examples**:
- Retrieves similar question-SQL pairs from previous queries
- Retrieves user-defined instructions/guidelines

**SQL Functions Retrieval**:
- Retrieves database-specific functions (e.g., `TO_TIMESTAMP_MILLIS`, `DENSE_RANK`)

#### Stage 3: Planning (Optional Reasoning)
**Pipeline**: `sql_generation_reasoning`

- Generates step-by-step reasoning plan before writing SQL
- Explicitly states timeframe handling (absolute vs relative)
- Plans ranking strategy (use `DENSE_RANK()` for top-N queries)
- Considers calculated fields and metrics from MDL

#### Stage 4: Generating (SQL Generation)
**Pipeline**: `sql_generation`

**Prompt Engineering** ([sql.py:257-277](wren-ai-service/src/pipelines/generation/utils/sql.py#L257-L277)):

The system prompt includes:
- **TEXT_TO_SQL_RULES**: 50+ specific rules:
  - Must use JOINs when selecting from multiple tables
  - Use CTEs over subqueries
  - Case-insensitive comparisons with `lower()`
  - Timestamp casting rules (critical for date queries)
  - Prevent SQL injection patterns (no DELETE/UPDATE/INSERT)
  - Ranking with `DENSE_RANK()` + WHERE clause
  - Use views to simplify queries
  - Alias handling from MDL comments

- **Calculated Field Instructions**: Teaches LLM to use pre-defined calculated fields (e.g., `ReviewCount`, `Rating`)
- **Metric Instructions**: Explains OLAP-like metric structures with dimensions/measures
- **JSON Field Instructions**: Handles nested JSON columns

**User Prompt** ([sql_generation.py:29-80](wren-ai-service/src/pipelines/generation/sql_generation.py#L29-L80)):
```
DATABASE SCHEMA (retrieved DDLs with comments)
+ Calculated Field Instructions (if applicable)
+ Metric Instructions (if applicable)
+ JSON Field Instructions (if applicable)
+ SQL FUNCTIONS (database-specific)
+ SQL SAMPLES (few-shot examples)
+ USER INSTRUCTIONS (custom guidelines)
+ QUESTION (user query)
+ REASONING PLAN (if generated)
```

**Post-Processing** ([sql.py:22-173](wren-ai-service/src/pipelines/generation/utils/sql.py#L22-L173)):
1. Extract SQL from LLM response (handles JSON or plain text)
2. Add quotes to identifiers
3. **Validation via Wren Engine**:
   - `dry_run=True`: Validates syntax without executing
   - `use_dry_plan`: Uses query planner for faster validation
   - `allow_data_preview`: Actually executes (LIMIT 1) to verify it returns data

#### Stage 5: Correcting (Self-Correction Loop)
**Pipeline**: `sql_correction`

If validation fails:
1. Pass error message + invalid SQL + schema back to LLM
2. LLM analyzes root cause and fixes the SQL
3. Re-validate with engine
4. Retry up to `max_sql_correction_retries` times (default: 3)

**Correction Prompt** ([sql_correction.py:27-47](wren-ai-service/src/pipelines/generation/sql_correction.py#L27-L47)):
- "You are an ANSI SQL expert with exceptional debugging skills"
- Provides error message + database schema + SQL functions
- Asks LLM to figure out root cause first, then fix

### 3. Key Techniques That Make It Accurate

1. **Semantic Context**: MDL embeds business logic (calculated fields, metrics, relationships) directly into prompts, not just raw schema
2. **Column Pruning**: Reduces token usage by selecting only relevant columns via LLM reasoning
3. **Multi-Step Reasoning**: Optional reasoning step before SQL generation (chain-of-thought)
4. **Comprehensive Rules**: 50+ hand-crafted SQL rules prevent common errors (timestamp handling, ranking, case sensitivity)
5. **Self-Correction Loop**: Validates SQL with actual engine and iteratively fixes errors
6. **Few-Shot Learning**: Retrieves similar SQL pairs from history for in-context learning
7. **Validation Modes**:
   - Dry run (syntax only)
   - Dry plan (query planning)
   - Data preview (execute LIMIT 1)
8. **Historical Question Cache**: Returns cached SQL immediately if exact question was asked before
9. **Conversation History**: Includes previous Q&A pairs for context in follow-up questions

### 4. Pipeline Architecture Pattern

Each pipeline uses **Hamilton** (dataflow framework) + **Haystack** (LLM components):

**Standard Pipeline Structure**:
```python
# 1. Retrieval Step
async def embedding(query, embedder):
    return embedder.run(query)

async def retrieve(embedding, retriever):
    return retriever.run(embedding)

# 2. Prompt Building Step
def prompt(query, documents, prompt_builder):
    return prompt_builder.run(query=query, documents=documents)

# 3. Generation Step
async def generate(prompt, llm):
    return llm.run(prompt)

# 4. Post-Processing Step
async def post_process(generate, post_processor):
    return post_processor.run(generate)
```

**Benefits**:
- Observable steps with Langfuse tracing
- Cost tracking per pipeline
- Modular components (swap LLMs, embedders, retrievers)
- Async execution for parallelization

### 5. Multi-LLM Support

The `config.yaml` allows assigning different models to different pipelines:
- Expensive model (GPT-4) for SQL generation
- Cheaper model (GPT-3.5) for intent classification
- Supports: OpenAI, Azure, Anthropic, Gemini, Bedrock, Ollama, etc.

### Summary: Why It's So Good

1. **Semantic Understanding**: Business context embedded in prompts via MDL
2. **Intelligent Retrieval**: Vector search + metadata filtering + column pruning
3. **Prompt Engineering**: 50+ SQL rules + calculated field instructions + few-shot examples
4. **Self-Correction**: Validates with actual DB engine and iteratively fixes errors
5. **Multi-Stage Pipeline**: Separate intent classification, retrieval, planning, generation, correction
6. **Historical Learning**: Caches successful queries and uses them as few-shot examples
7. **Conversation Context**: Maintains history for follow-up questions

The combination of semantic layer, comprehensive prompt engineering, and iterative validation creates a robust text-to-SQL system that generates accurate queries even for complex business questions.

## Important Environment Variables

**Docker Compose** (in `docker/.env.local`):
- `OPENAI_API_KEY`: Required for AI service
- `WREN_ENGINE_VERSION`, `WREN_AI_SERVICE_VERSION`, `IBIS_SERVER_VERSION`, `WREN_UI_VERSION`: Version tags
- `EXPERIMENTAL_ENGINE_RUST_VERSION`: Use Rust engine (experimental)
- `TELEMETRY_ENABLED`: Enable/disable telemetry

**Wren UI**:
- `DB_TYPE`: `sqlite` or `pg`
- `SQLITE_FILE`: Path to SQLite database
- `PG_URL`: Postgres connection string
- `OTHER_SERVICE_USING_DOCKER`: Set to `true` when other services run in Docker

**AI Service** (in `.env.dev`):
- AI model configuration goes in `config.yaml`, not `.env`
- See `wren-ai-service/docs/config_examples/` for provider-specific configs

## Additional Resources

- Main docs: https://docs.getwren.ai
- API docs: https://docs.getwren.ai/oss/wren_engine_api
- Discord community: https://discord.gg/5DvshJqG8Z
- Architecture design: https://getwren.ai/post/how-we-design-our-semantic-engine-for-llms-the-backbone-of-the-semantic-layer-for-llm-architecture
