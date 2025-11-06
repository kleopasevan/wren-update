# RantAI DataAsk - POC

**Conversational Business Intelligence Platform**

This is a Proof of Concept (POC) for RantAI DataAsk, a modern BI platform that combines:
- **Multi-database analytics** (query across PostgreSQL, MySQL, BigQuery, Snowflake, etc.)
- **Conversational AI** (ask questions in natural language)
- **Visual data preparation** (Tableau-like data prep)
- **Multi-dashboard workspaces** (unlimited dashboards per workspace)

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│         Frontend (Next.js 15 + shadcn/ui)                │
│  - Modern React 18 with Server Components                │
│  - shadcn/ui components for beautiful UI                 │
│  - Tanstack Query for data fetching                      │
└────────────────────┬─────────────────────────────────────┘
                     │ REST API (http://localhost:8000)
┌────────────────────▼─────────────────────────────────────┐
│           Backend (FastAPI + PostgreSQL)                  │
│  - Workspace & Dashboard management                       │
│  - Multi-database connection pooling                      │
│  - Integration with Wren AI & Ibis services              │
└─────┬──────────────────────┬──────────────────────────────┘
      │                      │
┌─────▼──────────┐    ┌─────▼───────────────────────────┐
│ Wren AI Service│    │ Ibis Server (Query Engine)      │
│ (Port 5556)    │    │ (Port 8001)                     │
│                │    │                                 │
│ - Text-to-SQL  │    │ - 15+ database connectors       │
│ - MoA Agents   │    │ - Query execution               │
│ - Qdrant       │    │ - Schema metadata               │
└────────────────┘    └─────────────────────────────────┘
```

## What's Included

### Backend (`dataask-backend/`)
- ✅ FastAPI with async support
- ✅ PostgreSQL database with SQLAlchemy 2.0
- ✅ Alembic migrations
- ✅ Workspace CRUD endpoints
- ✅ Connection management (foundation)
- ✅ Dashboard management (foundation)
- ✅ JWT authentication setup
- ✅ Encryption for database credentials
- ✅ Redis for caching

### Frontend (`dataask-frontend/`)
- ✅ Next.js 15 with App Router
- ✅ shadcn/ui components
- ✅ Tailwind CSS
- ✅ TypeScript
- ✅ API integration example
- ✅ POC homepage with status dashboard

### Infrastructure
- ✅ Docker Compose for all services
- ✅ PostgreSQL 15
- ✅ Redis 7
- ✅ Qdrant (vector database for Wren AI)
- ✅ Wren AI Service (from original Wren)
- ✅ Ibis Server (from original Wren)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- (Optional) Node.js 18+ for local frontend development
- (Optional) Python 3.12+ & Poetry for local backend development

### 1. Clone & Setup

```bash
cd /home/user/wren-update

# Copy environment file
cp dataask-backend/.env.example dataask-backend/.env

# Edit environment variables (add your OPENAI_API_KEY)
nano dataask-backend/.env
```

### 2. Start All Services

```bash
# Start all services with Docker Compose
docker-compose -f docker-compose.poc.yml up -d

# Watch logs
docker-compose -f docker-compose.poc.yml logs -f
```

### 3. Access the Services

- **Frontend**: http://localhost:3000 (when uncommented in docker-compose)
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **Wren AI Service**: http://localhost:5556
- **Ibis Server**: http://localhost:8001

### 4. Test the API

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Create a workspace
curl -X POST http://localhost:8000/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Workspace",
    "description": "Testing DataAsk POC",
    "settings": {}
  }'

# List workspaces
curl http://localhost:8000/api/v1/workspaces
```

## Development Setup

### Backend Development (Local)

```bash
cd dataask-backend

# Install dependencies
poetry install

# Set up environment
cp .env.example .env
nano .env

# Run database migrations
poetry run alembic upgrade head

# Start development server
poetry run uvicorn app.main:app --reload --port 8000
```

### Frontend Development (Local)

```bash
cd dataask-frontend

# Install dependencies
npm install
# or
yarn install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
# or
yarn dev

# Open http://localhost:3000
```

## Project Structure

```
wren-update/
├── dataask-backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   ├── core/             # Core utilities
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data access
│   │   └── integrations/     # Wren AI, Ibis clients
│   ├── migrations/           # Alembic migrations
│   └── tests/                # Tests
│
├── dataask-frontend/          # Next.js frontend
│   ├── app/                  # Next.js App Router
│   ├── components/           # React components
│   ├── lib/                  # Utilities
│   └── public/               # Static assets
│
├── docker-compose.poc.yml     # Docker Compose config
└── POC_README.md             # This file
```

## Next Steps (Phase 1 - Months 1-3)

### Week 1-2: Project Setup ✅
- [x] FastAPI project structure
- [x] Next.js 15 project structure
- [x] Docker Compose setup
- [x] Database schema & migrations
- [x] Basic API endpoints (workspaces)

### Week 3-4: Authentication & Workspace
- [ ] User authentication (JWT)
- [ ] Login/signup pages
- [ ] Workspace selector UI
- [ ] Workspace CRUD UI

### Week 5-6: Multi-Database Connections
- [ ] Connection CRUD endpoints
- [ ] Integration with ibis-server
- [ ] Connection testing API
- [ ] Connection manager UI
- [ ] Credential encryption

### Week 7-9: Basic Dashboard
- [ ] Dashboard CRUD endpoints
- [ ] Widget management
- [ ] Query execution
- [ ] Dashboard builder UI
- [ ] Basic visualizations

### Week 10-12: Conversational Interface
- [ ] Integration with wren-ai-service
- [ ] Conversation endpoints
- [ ] MDL generation from connections
- [ ] Chat UI
- [ ] Query result visualization

## Database Schema

Current tables:
- `users` - User accounts
- `workspaces` - Workspaces (containers for dashboards)
- `workspace_members` - Workspace access control
- `connections` - Database connections (encrypted)
- `dashboards` - Dashboards
- `widgets` - Dashboard widgets

See `dataask-backend/migrations/versions/` for full schema.

## API Endpoints

### Workspaces
- `GET /api/v1/workspaces` - List workspaces
- `POST /api/v1/workspaces` - Create workspace
- `GET /api/v1/workspaces/{id}` - Get workspace
- `PATCH /api/v1/workspaces/{id}` - Update workspace
- `DELETE /api/v1/workspaces/{id}` - Delete workspace

### Connections (Coming Soon)
- `GET /api/v1/workspaces/{ws_id}/connections`
- `POST /api/v1/workspaces/{ws_id}/connections`
- `POST /api/v1/workspaces/{ws_id}/connections/{id}/test`

### Dashboards (Coming Soon)
- `GET /api/v1/workspaces/{ws_id}/dashboards`
- `POST /api/v1/workspaces/{ws_id}/dashboards`

## Environment Variables

### Backend (`dataask-backend/.env`)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://dataask:dataask_password@localhost:5432/dataask

# Redis
REDIS_URL=redis://localhost:6379/0

# External Services
WREN_AI_SERVICE_URL=http://localhost:5556
IBIS_SERVER_URL=http://localhost:8001

# Security
SECRET_KEY=your-secret-key-change-this
ENCRYPTION_KEY=your-encryption-key-32-characters-min

# LLM
OPENAI_API_KEY=your-openai-api-key-here
```

### Frontend (`dataask-frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15 | Modern React, Server Components, great DX |
| **UI Components** | shadcn/ui | Beautiful, accessible, customizable |
| **Styling** | Tailwind CSS | Utility-first, fast development |
| **Backend** | FastAPI | Fast, modern, async Python |
| **Database** | PostgreSQL 15 | Reliable, JSONB support, full-featured |
| **ORM** | SQLAlchemy 2.0 | Mature, async support, type-safe |
| **Cache** | Redis 7 | Fast, pub/sub, query caching |
| **AI Service** | Wren AI | Proven text-to-SQL, MoA agents |
| **Query Engine** | Ibis Server | 15+ database connectors |

## Troubleshooting

### Backend not starting

```bash
# Check logs
docker-compose -f docker-compose.poc.yml logs backend

# Rebuild
docker-compose -f docker-compose.poc.yml build backend
docker-compose -f docker-compose.poc.yml up -d backend
```

### Database migration issues

```bash
# Run migrations manually
docker-compose -f docker-compose.poc.yml exec backend poetry run alembic upgrade head

# Or downgrade and re-run
docker-compose -f docker-compose.poc.yml exec backend poetry run alembic downgrade base
docker-compose -f docker-compose.poc.yml exec backend poetry run alembic upgrade head
```

### Port already in use

```bash
# Stop conflicting services
docker ps
docker stop <container-id>

# Or change ports in docker-compose.poc.yml
```

## Contributing

This is a POC for internal development. See implementation plan in `/IMPLEMENTATION_PLAN.md`.

## License

Proprietary - RantAI

---

**Built with ❤️ by the RantAI team**

For questions or issues, refer to:
- Backend docs: `/dataask-backend/README.md`
- Frontend docs: `/dataask-frontend/README.md`
- Architecture: `/PYTHON_BACKEND_ARCHITECTURE.md`
- MVP Features: `/MVP_FEATURES.md`
- Implementation Plan: `/IMPLEMENTATION_PLAN.md`
