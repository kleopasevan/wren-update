# RantAI DataAsk - Python Backend Architecture
## FastAPI-based Backend Service

---

## Architecture Philosophy

**Why Python Backend:**
- ✅ Seamless integration with wren-ai-service (also Python)
- ✅ Faster development than TypeScript/Node.js
- ✅ Better AI/ML ecosystem (Ibis, DuckDB, Great Expectations)
- ✅ Modern async support (FastAPI + asyncio)
- ✅ Type safety with Pydantic v2
- ✅ Excellent testing tools (pytest)

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   CLIENT (Next.js 15)                         │
└────────────┬─────────────────────────────┬───────────────────┘
             │ REST API                    │ WebSocket
             │                             │
┌────────────▼─────────────────────────────▼───────────────────┐
│                  API GATEWAY (FastAPI)                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Authentication Middleware (JWT)                       │  │
│  │  CORS Middleware                                       │  │
│  │  Rate Limiting Middleware                              │  │
│  │  Request Logging Middleware                            │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────┬──────────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────┐
│                    ROUTER LAYER                               │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐    │
│  │ /workspaces  │ │ /dashboards  │ │ /conversations     │    │
│  │ /connections │ │ /datasets    │ │ /sharing           │    │
│  │ /users       │ │ /queries     │ │ /ws (WebSocket)    │    │
│  └──────────────┘ └──────────────┘ └────────────────────┘    │
└────────────┬──────────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────┐
│                    SERVICE LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  WorkspaceService                                        │ │
│  │  - create_workspace()                                    │ │
│  │  - list_workspaces()                                     │ │
│  │  - add_member()                                          │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  ConnectionService                                       │ │
│  │  - create_connection()                                   │ │
│  │  - test_connection()                                     │ │
│  │  - get_schema()                                          │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  DashboardService                                        │ │
│  │  - create_dashboard()                                    │ │
│  │  - add_widget()                                          │ │
│  │  - execute_widget_query()                                │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  DataPrepService                                         │ │
│  │  - create_preparation()                                  │ │
│  │  - preview_step()                                        │ │
│  │  - execute_preparation()                                 │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  ConversationalService                                   │ │
│  │  - ask_question()          (→ wren-ai-service)           │ │
│  │  - generate_dashboard()    (→ wren-ai-service)           │ │
│  │  - save_conversation()                                   │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  CollaborationService                                    │ │
│  │  - share_dashboard()                                     │ │
│  │  - add_comment()                                         │ │
│  │  - broadcast_change()      (→ WebSocket)                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────┬──────────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────┐
│                    REPOSITORY LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  WorkspaceRepository (PostgreSQL)                        │ │
│  │  ConnectionRepository (PostgreSQL + encrypted secrets)   │ │
│  │  DashboardRepository (PostgreSQL + JSONB widgets)        │ │
│  │  DatasetRepository (PostgreSQL + prep flows)             │ │
│  │  UserRepository (PostgreSQL + auth)                      │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────┬──────────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────┐
│                   INTEGRATION LAYER                           │
│  ┌─────────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│  │ WrenAIClient    │ │ IbisClient     │ │ DuckDBClient    │  │
│  │ (HTTP client)   │ │ (HTTP client)  │ │ (Local engine)  │  │
│  │                 │ │                │ │                 │  │
│  │ - ask()         │ │ - execute()    │ │ - join()        │  │
│  │ - index_mdl()   │ │ - get_schema() │ │ - cache_result()│  │
│  └─────────────────┘ └────────────────┘ └─────────────────┘  │
└───────────────────────────────────────────────────────────────┘
             │                    │                    │
    ┌────────▼────────┐  ┌───────▼─────────┐  ┌──────▼──────┐
    │ wren-ai-service │  │  ibis-server    │  │   Redis     │
    │ (Keep as-is)    │  │  (Keep as-is)   │  │   (Cache)   │
    └─────────────────┘  └─────────────────┘  └─────────────┘
```

---

## Project Structure

```
dataask-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Configuration management
│   │
│   ├── api/                       # API layer
│   │   ├── __init__.py
│   │   ├── deps.py               # Dependencies (auth, db session)
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── workspaces.py
│   │   │   ├── connections.py
│   │   │   ├── dashboards.py
│   │   │   ├── datasets.py
│   │   │   ├── conversations.py
│   │   │   ├── sharing.py
│   │   │   ├── websocket.py
│   │   │   └── health.py
│   │   │
│   │   └── middleware/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── logging.py
│   │       └── rate_limit.py
│   │
│   ├── services/                  # Business logic
│   │   ├── __init__.py
│   │   ├── workspace_service.py
│   │   ├── connection_service.py
│   │   ├── dashboard_service.py
│   │   ├── data_prep_service.py
│   │   ├── conversational_service.py
│   │   ├── collaboration_service.py
│   │   ├── query_service.py
│   │   └── auth_service.py
│   │
│   ├── repositories/              # Data access layer
│   │   ├── __init__.py
│   │   ├── workspace_repository.py
│   │   ├── connection_repository.py
│   │   ├── dashboard_repository.py
│   │   ├── dataset_repository.py
│   │   ├── user_repository.py
│   │   └── base_repository.py
│   │
│   ├── integrations/              # External service clients
│   │   ├── __init__.py
│   │   ├── wren_ai_client.py     # HTTP client for wren-ai-service
│   │   ├── ibis_client.py        # HTTP client for ibis-server
│   │   ├── duckdb_client.py      # Local DuckDB for federation
│   │   └── redis_client.py       # Redis cache client
│   │
│   ├── models/                    # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── workspace.py
│   │   ├── connection.py
│   │   ├── dashboard.py
│   │   ├── dataset.py
│   │   ├── user.py
│   │   ├── share.py
│   │   └── comment.py
│   │
│   ├── schemas/                   # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   ├── workspace.py
│   │   ├── connection.py
│   │   ├── dashboard.py
│   │   ├── dataset.py
│   │   ├── conversation.py
│   │   └── common.py
│   │
│   ├── core/                      # Core utilities
│   │   ├── __init__.py
│   │   ├── database.py           # Database session management
│   │   ├── security.py           # Password hashing, JWT
│   │   ├── encryption.py         # Connection credential encryption
│   │   ├── cache.py              # Redis cache utilities
│   │   └── websocket.py          # WebSocket connection manager
│   │
│   └── utils/                     # Utility functions
│       ├── __init__.py
│       ├── mdl_generator.py      # Generate MDL from connections
│       ├── query_builder.py      # Helper for query construction
│       └── validators.py         # Custom validators
│
├── migrations/                    # Alembic migrations
│   ├── versions/
│   └── env.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py               # Pytest fixtures
│   ├── api/
│   │   ├── test_workspaces.py
│   │   ├── test_dashboards.py
│   │   └── ...
│   ├── services/
│   │   ├── test_workspace_service.py
│   │   └── ...
│   └── integration/
│       ├── test_wren_ai_integration.py
│       └── test_ibis_integration.py
│
├── scripts/
│   ├── init_db.py                # Initialize database
│   ├── seed_data.py              # Seed sample data
│   └── migrate_from_wren.py      # Migrate existing Wren data
│
├── .env.example
├── pyproject.toml                # Poetry dependencies
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Technology Stack Details

### **Core Framework**
```toml
[tool.poetry.dependencies]
python = "^3.12"
fastapi = "^0.109.0"           # Web framework
uvicorn = {extras = ["standard"], version = "^0.27.0"}  # ASGI server
pydantic = "^2.5.0"            # Data validation
pydantic-settings = "^2.1.0"   # Settings management
```

### **Database**
```toml
sqlalchemy = {extras = ["asyncio"], version = "^2.0.25"}  # ORM
asyncpg = "^0.29.0"            # Async PostgreSQL driver
alembic = "^1.13.0"            # Database migrations
psycopg2-binary = "^2.9.9"     # Sync PostgreSQL (for migrations)
```

### **Authentication & Security**
```toml
python-jose = {extras = ["cryptography"], version = "^3.3.0"}  # JWT
passlib = {extras = ["bcrypt"], version = "^1.7.4"}  # Password hashing
python-multipart = "^0.0.6"    # Form data parsing
cryptography = "^42.0.0"       # Encryption for connection credentials
```

### **Caching & Queue**
```toml
redis = {extras = ["hiredis"], version = "^5.0.1"}  # Redis client
celery = "^5.3.6"              # Task queue (for async jobs)
```

### **HTTP Clients**
```toml
httpx = "^0.26.0"              # Async HTTP client (for wren-ai-service, ibis-server)
websockets = "^12.0"           # WebSocket client/server
```

### **Data Processing**
```toml
ibis-framework = {extras = ["duckdb", "postgres", "mysql"], version = "^8.0.0"}
duckdb = "^0.10.0"             # In-memory analytics DB (for federation)
pandas = "^2.1.4"              # Data manipulation
pyarrow = "^15.0.0"            # Columnar data format
great-expectations = "^0.18.8" # Data quality validation
```

### **Testing**
```toml
pytest = "^7.4.4"
pytest-asyncio = "^0.23.3"
pytest-cov = "^4.1.0"
httpx = "^0.26.0"              # For testing async endpoints
faker = "^22.0.0"              # Generate fake data for tests
```

### **Development**
```toml
ruff = "^0.1.14"               # Linting + formatting
mypy = "^1.8.0"                # Type checking
pre-commit = "^3.6.0"          # Git hooks
```

---

## Database Schema

### **Core Tables**

```sql
-- Workspaces (multi-tenancy)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workspace Members
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,  -- 'admin', 'editor', 'viewer'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Database Connections (encrypted)
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 'postgresql', 'mysql', 'bigquery', etc.
    config JSONB NOT NULL,      -- Encrypted connection details
    status VARCHAR(50) DEFAULT 'active',
    last_tested_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Dashboards
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSONB DEFAULT '[]',   -- Widget positions and configs
    settings JSONB DEFAULT '{}', -- Theme, refresh interval, etc.
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Dashboard Widgets
CREATE TABLE widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,   -- 'chart', 'metric', 'table', 'text'
    title VARCHAR(255),
    config JSONB NOT NULL,       -- Chart config, query, etc.
    position JSONB NOT NULL,     -- {x, y, w, h}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Datasets (prepared data)
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    preparation_flow JSONB NOT NULL,  -- Array of transformation steps
    source_connections JSONB NOT NULL, -- [{connection_id, table_name}]
    generated_sql TEXT,                -- Final SQL (cached)
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations (chat history)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255),
    messages JSONB DEFAULT '[]',  -- [{role: 'user'|'assistant', content: '...'}]
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Shares (dashboard/dataset sharing)
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(50) NOT NULL,  -- 'dashboard', 'dataset'
    resource_id UUID NOT NULL,
    shared_with_user_id UUID REFERENCES users(id),
    shared_with_team_id UUID,  -- Future: team support
    permission VARCHAR(50) NOT NULL,  -- 'view', 'edit'
    public_link_id VARCHAR(255) UNIQUE,
    public_link_enabled BOOLEAN DEFAULT FALSE,
    public_link_password VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Comments (collaboration)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(50) NOT NULL,  -- 'dashboard', 'widget'
    resource_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,  -- 'create_dashboard', 'execute_query', etc.
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Query Cache (for performance)
CREATE TABLE query_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash VARCHAR(64) UNIQUE NOT NULL,  -- SHA256 of normalized query
    result JSONB NOT NULL,
    ttl_seconds INTEGER DEFAULT 3600,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_query_cache_expires ON query_cache(expires_at);

-- Indexes for performance
CREATE INDEX idx_dashboards_workspace ON dashboards(workspace_id);
CREATE INDEX idx_widgets_dashboard ON widgets(dashboard_id);
CREATE INDEX idx_connections_workspace ON connections(workspace_id);
CREATE INDEX idx_datasets_workspace ON datasets(workspace_id);
CREATE INDEX idx_conversations_workspace ON conversations(workspace_id);
CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_shares_resource ON shares(resource_type, resource_id);
```

---

## API Design

### **REST Endpoints**

#### **Workspaces**
```python
GET    /api/v1/workspaces
POST   /api/v1/workspaces
GET    /api/v1/workspaces/{id}
PATCH  /api/v1/workspaces/{id}
DELETE /api/v1/workspaces/{id}
POST   /api/v1/workspaces/{id}/members
DELETE /api/v1/workspaces/{id}/members/{user_id}
```

#### **Connections**
```python
GET    /api/v1/workspaces/{ws_id}/connections
POST   /api/v1/workspaces/{ws_id}/connections
POST   /api/v1/workspaces/{ws_id}/connections/{id}/test
GET    /api/v1/workspaces/{ws_id}/connections/{id}/schema
PATCH  /api/v1/workspaces/{ws_id}/connections/{id}
DELETE /api/v1/workspaces/{ws_id}/connections/{id}
```

#### **Dashboards**
```python
GET    /api/v1/workspaces/{ws_id}/dashboards
POST   /api/v1/workspaces/{ws_id}/dashboards
GET    /api/v1/workspaces/{ws_id}/dashboards/{id}
PATCH  /api/v1/workspaces/{ws_id}/dashboards/{id}
DELETE /api/v1/workspaces/{ws_id}/dashboards/{id}
POST   /api/v1/workspaces/{ws_id}/dashboards/{id}/widgets
PATCH  /api/v1/workspaces/{ws_id}/dashboards/{id}/widgets/{widget_id}
DELETE /api/v1/workspaces/{ws_id}/dashboards/{id}/widgets/{widget_id}
POST   /api/v1/workspaces/{ws_id}/dashboards/{id}/duplicate
```

#### **Datasets (Data Prep)**
```python
GET    /api/v1/workspaces/{ws_id}/datasets
POST   /api/v1/workspaces/{ws_id}/datasets
GET    /api/v1/workspaces/{ws_id}/datasets/{id}
PATCH  /api/v1/workspaces/{ws_id}/datasets/{id}
DELETE /api/v1/workspaces/{ws_id}/datasets/{id}
POST   /api/v1/workspaces/{ws_id}/datasets/{id}/preview  # Preview transformation
POST   /api/v1/workspaces/{ws_id}/datasets/{id}/execute  # Execute and save
```

#### **Conversational AI**
```python
POST   /api/v1/workspaces/{ws_id}/conversations
GET    /api/v1/workspaces/{ws_id}/conversations/{id}
POST   /api/v1/workspaces/{ws_id}/conversations/{id}/ask
POST   /api/v1/workspaces/{ws_id}/conversations/{id}/generate-dashboard
DELETE /api/v1/workspaces/{ws_id}/conversations/{id}
```

#### **Queries**
```python
POST   /api/v1/workspaces/{ws_id}/queries/execute
POST   /api/v1/workspaces/{ws_id}/queries/explain
```

#### **Sharing**
```python
POST   /api/v1/shares
GET    /api/v1/shares/{resource_type}/{resource_id}
DELETE /api/v1/shares/{id}
POST   /api/v1/shares/{id}/public-link
```

#### **Comments**
```python
GET    /api/v1/comments/{resource_type}/{resource_id}
POST   /api/v1/comments
PATCH  /api/v1/comments/{id}
DELETE /api/v1/comments/{id}
```

#### **WebSocket**
```python
WS     /api/v1/ws/{workspace_id}
# Events:
# - dashboard_updated
# - comment_added
# - query_completed
# - user_joined
# - user_left
```

---

## Core Services Implementation

### **1. Connection Service**

```python
# app/services/connection_service.py
from typing import List, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.connection_repository import ConnectionRepository
from app.integrations.ibis_client import IbisClient
from app.core.encryption import encrypt_credentials, decrypt_credentials

class ConnectionService:
    def __init__(
        self,
        db: AsyncSession,
        ibis_client: IbisClient,
    ):
        self.repo = ConnectionRepository(db)
        self.ibis_client = ibis_client

    async def create_connection(
        self,
        workspace_id: UUID,
        name: str,
        connection_type: str,
        config: Dict[str, Any],
        user_id: UUID,
    ):
        """Create a new database connection with encrypted credentials."""
        # Encrypt sensitive fields (passwords, API keys)
        encrypted_config = encrypt_credentials(config)

        # Create in database
        connection = await self.repo.create(
            workspace_id=workspace_id,
            name=name,
            type=connection_type,
            config=encrypted_config,
            created_by=user_id,
        )

        return connection

    async def test_connection(self, connection_id: UUID) -> Dict[str, Any]:
        """Test database connection and return status."""
        connection = await self.repo.get(connection_id)
        config = decrypt_credentials(connection.config)

        # Test via ibis-server
        result = await self.ibis_client.test_connection(
            connection_type=connection.type,
            config=config,
        )

        # Update last_tested_at
        await self.repo.update(
            connection_id,
            {"last_tested_at": datetime.utcnow()},
        )

        return result

    async def get_schema(self, connection_id: UUID) -> Dict[str, Any]:
        """Fetch schema metadata from database."""
        connection = await self.repo.get(connection_id)
        config = decrypt_credentials(connection.config)

        # Fetch via ibis-server
        schema = await self.ibis_client.get_schema(
            connection_type=connection.type,
            config=config,
        )

        return schema

    async def list_connections(
        self,
        workspace_id: UUID,
    ) -> List[Dict[str, Any]]:
        """List all connections in workspace."""
        connections = await self.repo.list_by_workspace(workspace_id)

        # Don't return sensitive config
        return [
            {
                **conn.dict(),
                "config": {k: "***" for k in conn.config.keys()},
            }
            for conn in connections
        ]
```

### **2. Data Prep Service**

```python
# app/services/data_prep_service.py
import ibis
from typing import List, Dict, Any
from uuid import UUID
from app.integrations.ibis_client import IbisClient
from app.repositories.dataset_repository import DatasetRepository

class DataPrepService:
    def __init__(
        self,
        db: AsyncSession,
        ibis_client: IbisClient,
    ):
        self.repo = DatasetRepository(db)
        self.ibis_client = ibis_client

    async def preview_step(
        self,
        connection_id: UUID,
        steps: List[Dict[str, Any]],
        limit: int = 100,
    ) -> Dict[str, Any]:
        """Preview result after applying transformation steps."""
        # Build Ibis expression from steps
        expr = await self._build_ibis_expression(connection_id, steps)

        # Execute preview (limit 100 rows)
        result = await self.ibis_client.execute_expression(
            expr.limit(limit),
            connection_id=connection_id,
        )

        # Get column stats
        stats = await self._compute_column_stats(expr, connection_id)

        return {
            "preview": result,
            "row_count": len(result),
            "column_stats": stats,
        }

    async def _build_ibis_expression(
        self,
        connection_id: UUID,
        steps: List[Dict[str, Any]],
    ):
        """Convert transformation steps to Ibis expression."""
        # Get connection
        connection = await self.connection_service.get(connection_id)

        # Connect to database via Ibis
        backend = self.ibis_client.get_backend(connection)

        # Start with source table
        first_step = steps[0]
        expr = backend.table(first_step["table"])

        # Apply transformations
        for step in steps[1:]:
            step_type = step["type"]

            if step_type == "filter":
                expr = self._apply_filter(expr, step)
            elif step_type == "select":
                expr = expr.select(step["columns"])
            elif step_type == "join":
                expr = self._apply_join(expr, backend, step)
            elif step_type == "aggregate":
                expr = self._apply_aggregate(expr, step)
            elif step_type == "calculated_field":
                expr = self._apply_calculated_field(expr, step)
            # ... more transformation types

        return expr

    def _apply_filter(self, expr, step):
        """Apply filter to expression."""
        column = step["column"]
        operator = step["operator"]
        value = step["value"]

        if operator == "=":
            return expr.filter(expr[column] == value)
        elif operator == ">":
            return expr.filter(expr[column] > value)
        elif operator == ">=":
            return expr.filter(expr[column] >= value)
        elif operator == "in":
            return expr.filter(expr[column].isin(value))
        # ... more operators

        return expr

    def _apply_join(self, expr, backend, step):
        """Apply join to expression."""
        right_table = backend.table(step["right_table"])
        join_type = step["join_type"]  # inner, left, right, outer

        # Parse join condition (e.g., "orders.customer_id = customers.id")
        condition = step["condition"]
        # ... parse and build condition

        return expr.join(right_table, condition, how=join_type)

    def _apply_aggregate(self, expr, step):
        """Apply aggregation to expression."""
        group_by = step.get("group_by", [])
        measures = step["measures"]  # [{"column": "revenue", "function": "sum"}]

        # Build aggregation
        aggs = {}
        for measure in measures:
            col = measure["column"]
            func = measure["function"]

            if func == "sum":
                aggs[f"{col}_sum"] = expr[col].sum()
            elif func == "count":
                aggs[f"{col}_count"] = expr[col].count()
            elif func == "avg":
                aggs[f"{col}_avg"] = expr[col].mean()
            # ... more functions

        if group_by:
            return expr.group_by(group_by).aggregate(**aggs)
        else:
            return expr.aggregate(**aggs)

    async def save_dataset(
        self,
        workspace_id: UUID,
        name: str,
        preparation_flow: Dict[str, Any],
        user_id: UUID,
    ):
        """Save dataset with preparation flow."""
        # Generate SQL from flow
        expr = await self._build_ibis_expression(
            preparation_flow["connection_id"],
            preparation_flow["steps"],
        )
        sql = ibis.to_sql(expr)

        # Save to database
        dataset = await self.repo.create(
            workspace_id=workspace_id,
            name=name,
            preparation_flow=preparation_flow,
            generated_sql=sql,
            created_by=user_id,
        )

        return dataset
```

### **3. Conversational Service**

```python
# app/services/conversational_service.py
from app.integrations.wren_ai_client import WrenAIClient
from app.repositories.conversation_repository import ConversationRepository

class ConversationalService:
    def __init__(
        self,
        db: AsyncSession,
        wren_ai_client: WrenAIClient,
        connection_service: ConnectionService,
    ):
        self.repo = ConversationRepository(db)
        self.wren_ai = wren_ai_client
        self.connection_service = connection_service

    async def ask_question(
        self,
        workspace_id: UUID,
        conversation_id: UUID,
        question: str,
        user_id: UUID,
    ):
        """Ask a question using Wren AI."""
        # Get conversation history
        conversation = await self.repo.get(conversation_id)

        # Get all workspace connections (for multi-DB context)
        connections = await self.connection_service.list_connections(workspace_id)

        # Generate MDL from all connections
        mdl = await self._generate_mdl(connections)

        # Deploy MDL to Wren AI (if changed)
        await self.wren_ai.deploy_mdl(
            project_id=str(workspace_id),
            mdl=mdl,
        )

        # Ask question
        response = await self.wren_ai.ask(
            project_id=str(workspace_id),
            question=question,
            history=conversation.messages,
        )

        # Save to conversation
        await self.repo.add_messages(
            conversation_id,
            [
                {"role": "user", "content": question},
                {"role": "assistant", "content": response},
            ],
        )

        return response

    async def generate_dashboard(
        self,
        workspace_id: UUID,
        prompt: str,
        user_id: UUID,
    ):
        """Generate dashboard using Wren AI."""
        # Get workspace connections
        connections = await self.connection_service.list_connections(workspace_id)

        # Generate MDL
        mdl = await self._generate_mdl(connections)

        # Call Wren AI dashboard generation endpoint
        response = await self.wren_ai.generate_dashboard(
            project_id=str(workspace_id),
            prompt=prompt,
            mdl=mdl,
        )

        # Response contains: dashboard layout, widget configs, queries
        return response

    async def _generate_mdl(self, connections: List[Dict]) -> Dict:
        """Generate MDL from workspace connections."""
        models = []
        relationships = []

        for conn in connections:
            # Get schema for connection
            schema = await self.connection_service.get_schema(conn["id"])

            # Convert to MDL models
            for table in schema["tables"]:
                models.append({
                    "name": f"{conn['name']}_{table['name']}",
                    "tableReference": {
                        "schema": table["schema"],
                        "table": table["name"],
                    },
                    "columns": table["columns"],
                    # ... more MDL fields
                })

        return {
            "catalog": "dataask",
            "schema": "public",
            "models": models,
            "relationships": relationships,
        }
```

---

## Integration with Wren Services

### **Wren AI Client**

```python
# app/integrations/wren_ai_client.py
import httpx
from typing import Dict, Any, List

class WrenAIClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60.0)

    async def deploy_mdl(self, project_id: str, mdl: Dict[str, Any]):
        """Deploy MDL to Wren AI service."""
        response = await self.client.post(
            f"{self.base_url}/v1/semantics-preparations",
            json={"mdl": mdl},
            headers={"project-id": project_id},
        )
        response.raise_for_status()
        return response.json()

    async def ask(
        self,
        project_id: str,
        question: str,
        history: List[Dict] = None,
    ):
        """Ask a question."""
        response = await self.client.post(
            f"{self.base_url}/v1/asks",
            json={
                "query": question,
                "history": history or [],
            },
            headers={"project-id": project_id},
        )
        response.raise_for_status()
        return response.json()

    async def generate_dashboard(
        self,
        project_id: str,
        prompt: str,
        mdl: Dict[str, Any],
    ):
        """Generate dashboard (custom endpoint we'll add to wren-ai-service)."""
        # This would be a new pipeline we add
        response = await self.client.post(
            f"{self.base_url}/v1/dashboard-generation",
            json={
                "prompt": prompt,
                "mdl": mdl,
            },
            headers={"project-id": project_id},
        )
        response.raise_for_status()
        return response.json()
```

### **Ibis Client**

```python
# app/integrations/ibis_client.py
import httpx
from typing import Dict, Any

class IbisClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def test_connection(
        self,
        connection_type: str,
        config: Dict[str, Any],
    ):
        """Test database connection."""
        response = await self.client.post(
            f"{self.base_url}/v2/connector/{connection_type}/validate",
            json=config,
        )
        response.raise_for_status()
        return response.json()

    async def get_schema(
        self,
        connection_type: str,
        config: Dict[str, Any],
    ):
        """Get database schema metadata."""
        response = await self.client.post(
            f"{self.base_url}/v2/connector/{connection_type}/metadata",
            json=config,
        )
        response.raise_for_status()
        return response.json()

    async def execute_query(
        self,
        connection_type: str,
        config: Dict[str, Any],
        sql: str,
    ):
        """Execute SQL query."""
        response = await self.client.post(
            f"{self.base_url}/v2/connector/{connection_type}/query",
            json={
                "connectionInfo": config,
                "sql": sql,
            },
        )
        response.raise_for_status()
        return response.json()
```

---

## Configuration

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    APP_NAME: str = "DataAsk Backend"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # External Services
    WREN_AI_SERVICE_URL: str = "http://localhost:5556"
    IBIS_SERVER_URL: str = "http://localhost:8000"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ENCRYPTION_KEY: str  # For encrypting connection credentials

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## Main Application

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import (
    workspaces,
    connections,
    dashboards,
    datasets,
    conversations,
    sharing,
    websocket,
    health,
)
from app.core.database import engine
from app.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(workspaces.router, prefix="/api/v1", tags=["workspaces"])
app.include_router(connections.router, prefix="/api/v1", tags=["connections"])
app.include_router(dashboards.router, prefix="/api/v1", tags=["dashboards"])
app.include_router(datasets.router, prefix="/api/v1", tags=["datasets"])
app.include_router(conversations.router, prefix="/api/v1", tags=["conversations"])
app.include_router(sharing.router, prefix="/api/v1", tags=["sharing"])
app.include_router(websocket.router, prefix="/api/v1", tags=["websocket"])

@app.on_event("startup")
async def startup():
    # Initialize database connections
    # Warm up caches
    # Connect to Redis
    pass

@app.on_event("shutdown")
async def shutdown():
    # Close database connections
    # Close Redis connections
    await engine.dispose()
```

---

## Deployment

### **Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  # New FastAPI Backend
  dataask-backend:
    build: .
    ports:
      - "8001:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/dataask
      - REDIS_URL=redis://redis:6379/0
      - WREN_AI_SERVICE_URL=http://wren-ai-service:5556
      - IBIS_SERVER_URL=http://ibis-server:8000
    depends_on:
      - postgres
      - redis
      - wren-ai-service
      - ibis-server

  # Keep Wren AI Service
  wren-ai-service:
    image: ghcr.io/canner/wren-ai-service:latest
    ports:
      - "5556:5556"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - qdrant

  # Keep Ibis Server
  ibis-server:
    image: ghcr.io/canner/wren-engine-ibis:latest
    ports:
      - "8000:8000"

  # PostgreSQL
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=dataask
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  # Qdrant (for Wren AI)
  qdrant:
    image: qdrant/qdrant:latest
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
```

---

## Next Steps

1. **POC Implementation** (2-3 weeks)
   - Set up FastAPI project structure
   - Implement workspace + connection CRUD
   - Connect to wren-ai-service
   - Simple Next.js frontend

2. **Phase 1 Development** (Months 1-3)
   - Full backend implementation
   - Multi-dashboard support
   - Authentication & RBAC
   - Integration tests

3. **Phase 2 Development** (Months 4-6)
   - Data prep service
   - AI dashboard generation
   - Cross-database federation

4. **Phase 3 Development** (Months 7-9)
   - Collaboration features
   - Real-time updates
   - Performance optimization

Ready to start building? 🚀
