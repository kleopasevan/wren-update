# DataAsk Backend

FastAPI backend for RantAI DataAsk platform.

## Features

- **FastAPI** - Modern, fast async Python web framework
- **SQLAlchemy 2.0** - Async ORM with PostgreSQL
- **Alembic** - Database migrations
- **Pydantic v2** - Data validation
- **JWT Authentication** - Secure user authentication
- **Redis** - Caching and real-time features
- **Integration** - Wren AI service & Ibis server

## Setup

### Prerequisites

- Python 3.12+
- Poetry 1.8+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Install dependencies
poetry install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations
poetry run alembic upgrade head

# Start development server
poetry run uvicorn app.main:app --reload
```

### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec backend poetry run alembic upgrade head
```

## Development

### Create a new migration

```bash
poetry run alembic revision --autogenerate -m "description"
poetry run alembic upgrade head
```

### Run tests

```bash
poetry run pytest
poetry run pytest --cov=app tests/
```

### Code formatting

```bash
poetry run ruff format .
poetry run ruff check .
```

### Type checking

```bash
poetry run mypy app
```

## API Documentation

Once the server is running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
dataask-backend/
├── app/
│   ├── api/              # API endpoints
│   ├── core/             # Core utilities
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   ├── repositories/     # Data access
│   ├── integrations/     # External services
│   └── utils/            # Utilities
├── migrations/           # Alembic migrations
├── tests/                # Tests
└── scripts/              # Utility scripts
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SECRET_KEY` - JWT secret key
- `WREN_AI_SERVICE_URL` - Wren AI service URL
- `IBIS_SERVER_URL` - Ibis server URL
