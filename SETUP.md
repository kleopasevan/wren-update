# DataAsk Setup Guide

Complete setup guide for running DataAsk locally with all features including Dashboard Parameters and Scheduled Queries.

## Prerequisites

- **Python 3.12+** (for backend)
- **Node.js 18+** and npm (for frontend)
- **PostgreSQL 15+** (database)
- **Git** (for version control)

## Project Structure

```
wren-update/
├── dataask-backend/          # FastAPI backend (Python + Poetry)
│   ├── app/
│   │   ├── api/routers/      # API endpoints
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic (scheduler, email, etc.)
│   │   └── utils/            # Utilities (parameters, etc.)
│   ├── migrations/           # Alembic migrations
│   └── pyproject.toml        # Poetry dependencies & config
├── dataask-frontend/         # Next.js frontend
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # React components
│   ├── lib/api/             # API client
│   └── package.json         # Node dependencies
└── SETUP.md                 # This file
```

## Backend Setup

### 1. Install Poetry

The backend uses Poetry for dependency management. Install Poetry first:

```bash
# Install Poetry (if not already installed)
curl -sSL https://install.python-poetry.org | python3 -

# Or via pip
pip install poetry
```

### 2. Install Dependencies

```bash
cd dataask-backend

# Install dependencies (Poetry creates virtual environment automatically)
poetry install

# Activate the virtual environment
poetry shell
```

**Alternative - Export to requirements.txt (if you prefer pip):**
```bash
poetry export -f requirements.txt --output requirements.txt --without-hashes
pip install -r requirements.txt
```

**Key dependencies include:**
- `fastapi` - Web framework
- `sqlalchemy[asyncio]` - Database ORM
- `asyncpg` - PostgreSQL async driver
- `alembic` - Database migrations
- `pydantic` - Data validation
- `pydantic-settings` - Settings management
- `python-jose[cryptography]` - JWT tokens
- `passlib[bcrypt]` - Password hashing
- `apscheduler` - Background job scheduler (NEW)
- `reportlab` - PDF generation (NEW)
- `python-multipart` - File uploads
- `httpx` - HTTP client for ibis-server

### 3. Configure Environment Variables

Create `.env` file in `dataask-backend/`:

```bash
# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/dataask

# Security
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Backend Service URLs
IBIS_SERVER_URL=http://localhost:8001
WREN_AI_SERVICE_URL=http://localhost:8002
WREN_ENGINE_URL=http://localhost:8003

# CORS (for frontend)
CORS_ORIGINS=["http://localhost:3000"]

# SMTP Configuration (for Scheduled Queries Email Reports)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=DataAsk Reports

# Optional: Logging
LOG_LEVEL=INFO
```

**SMTP Setup Notes:**
- For Gmail: Use App Password, not regular password (enable 2FA first)
- For other providers: Check SMTP settings documentation
- Test SMTP settings before setting up scheduled queries

### 4. Setup Database

Create PostgreSQL database:

```bash
# Using psql
createdb dataask

# Or via SQL
psql -U postgres
CREATE DATABASE dataask;
\q
```

Run migrations:

```bash
cd dataask-backend
alembic upgrade head
```

**Migrations include:**
- `001` - Initial tables (users, workspaces, connections, dashboards, saved_queries)
- `002` - Dashboard widgets
- `003` - AI conversation history
- `004` - Query execution history (NEW)
- `005` - Dashboard parameters (NEW)
- `006` - Scheduled queries (NEW)

### 5. Run Backend Server

```bash
cd dataask-backend
poetry shell  # Activate virtual environment
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or if already in poetry shell:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000

API docs: http://localhost:8000/docs

## Frontend Setup

### 1. Install Dependencies

```bash
cd dataask-frontend
npm install
```

**Key dependencies include:**
- `next` 15 - React framework
- `react` 18 - UI library
- `typescript` - Type safety
- `tailwindcss` - CSS framework
- `@radix-ui/*` - Headless UI primitives (via shadcn/ui)
- `axios` - HTTP client
- `recharts` - Charting library
- `lucide-react` - Icon library

### 2. Configure Environment Variables

Create `.env.local` in `dataask-frontend/`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Optional: Analytics, etc.
```

### 3. Run Frontend Server

```bash
cd dataask-frontend
npm run dev
```

Frontend will be available at: http://localhost:3000

## Running Supporting Services

DataAsk requires additional services for full functionality:

### Ibis Server (Query Execution)

```bash
cd wren-engine/ibis-server
poetry install
poetry run uvicorn src.main:app --host 0.0.0.0 --port 8001
```

### Wren AI Service (Optional - for AI features)

```bash
cd wren-ai-service
poetry install
just up  # Start Qdrant vector DB
just start  # Start AI service on port 8002
```

### Wren Engine (Optional - for semantic layer)

```bash
cd wren-engine
# Follow wren-engine setup instructions
```

## Testing New Features

### 1. Dashboard Parameters

**Setup:**
1. Create a workspace and connection
2. Create a dashboard
3. Add a chart widget with a filter (e.g., `country = 'USA'`)
4. Click dashboard menu → "Configure Parameters"
5. Add parameter:
   - Name: `country`
   - Label: `Country`
   - Type: `Dropdown`
   - Options: `USA,Canada,Mexico`
   - Default: `USA`

**Usage:**
1. Dashboard will show parameter controls at the top
2. Change dropdown value
3. All widgets with `{{country}}` in filters will update

**Parameter Syntax:**
- In filter values, use: `{{parameter_name}}`
- Supported types: text, number, date, date_range, dropdown
- Works in both visual query filters and raw SQL

**Example SQL with parameters:**
```sql
SELECT * FROM customers
WHERE country = '{{country}}'
  AND signup_date >= '{{start_date}}'
  AND lifetime_value > {{min_value}}
```

### 2. Scheduled Queries & Email Reports

**Setup:**
1. Navigate to Workspace → Scheduled Queries tab
2. Click "Create Schedule"
3. Fill in form:
   - **Basic Info:**
     - Name: "Daily Sales Report"
     - Description: "Morning sales summary"
     - Connection: Select your connection
   - **Query Config:**
     - Query Type: Raw SQL
     - SQL: `SELECT * FROM sales WHERE date = CURRENT_DATE`
   - **Schedule Config:**
     - Type: Cron Expression
     - Expression: `0 9 * * *` (9 AM daily)
     - Or: Fixed Interval → 60 minutes
   - **Email Config:**
     - Recipients: `team@example.com, manager@example.com`
     - Subject: "Daily Sales Report"
     - Format: CSV, PDF (check both)
   - **Status:** Enable this schedule ✓

4. Click "Create Schedule"

**Testing:**
1. Query will be scheduled with APScheduler
2. Check "Next run" timestamp on list page
3. Wait for scheduled time OR manually trigger via backend
4. Check email inbox for CSV and PDF attachments

**Manual Testing (via Python):**
```bash
# In dataask-backend/
poetry shell
python

# Then in Python interpreter:
>>> from app.services.scheduled_query_executor import execute_and_email_query
>>> from app.database import get_db
>>> import asyncio
>>>
>>> async def test():
...     async for db in get_db():
...         await execute_and_email_query(db, "query-id-here")
...         break
>>>
>>> asyncio.run(test())
```

**Monitoring:**
- List page shows: Last run, Status (success/error), Error message
- Click dropdown menu → Enable/Disable/Edit/Delete
- Errors are logged to console and database

### 3. Query Execution History

**Usage:**
1. Navigate to Workspace → Query History tab
2. View all executed queries with:
   - SQL text
   - Execution time (ms)
   - Row count
   - Status (success/error)
   - Error messages
3. Filter by:
   - Search text (searches SQL)
   - Query type (Visual/AI/SQL)
   - Status (Success/Error)
   - Date range

**Automatic Tracking:**
- All query executions are logged automatically
- Includes queries from:
  - Dashboard widgets
  - Query Builder
  - AI Ask
  - Scheduled queries

## Troubleshooting

### Backend Issues

**1. Database Connection Error**
```
sqlalchemy.exc.OperationalError: could not connect to server
```
**Solution:**
- Check PostgreSQL is running: `systemctl status postgresql` (Linux) or `brew services list` (macOS)
- Verify DATABASE_URL in `.env`
- Check PostgreSQL logs: `/var/log/postgresql/postgresql-15-main.log`

**2. Migration Errors**
```
alembic.util.exc.CommandError: Target database is not up to date
```
**Solution:**
```bash
# Check current migration
alembic current

# Show pending migrations
alembic history

# Upgrade to latest
alembic upgrade head

# If stuck, check alembic_version table
psql dataask -c "SELECT * FROM alembic_version;"
```

**3. APScheduler Not Starting**
```
RuntimeError: Scheduler is not running
```
**Solution:**
- Check FastAPI startup events are running
- Verify no port conflicts
- Check logs for scheduler errors
- Ensure `scheduler_service.start()` is called in `main.py`

**4. Email Not Sending**
```
SMTPAuthenticationError: Username and Password not accepted
```
**Solution:**
- For Gmail: Use App Password (Google Account → Security → 2FA → App Passwords)
- For Outlook: Enable "Allow less secure apps"
- Check SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD in `.env`
- Test SMTP settings with:
```python
import smtplib
smtp = smtplib.SMTP('smtp.gmail.com', 587)
smtp.starttls()
smtp.login('your-email@gmail.com', 'app-password')
smtp.quit()
```

**5. Ibis Server Connection Error**
```
httpx.ConnectError: All connection attempts failed
```
**Solution:**
- Ensure ibis-server is running on port 8001
- Check IBIS_SERVER_URL in `.env`
- Test connection: `curl http://localhost:8001/health`

### Frontend Issues

**1. API Connection Error**
```
AxiosError: Network Error
```
**Solution:**
- Check backend is running on port 8000
- Verify NEXT_PUBLIC_API_URL in `.env.local`
- Check CORS settings in backend `.env`
- Test API: `curl http://localhost:8000/api/v1/health`

**2. Build Errors**
```
Type error: Property 'X' does not exist on type 'Y'
```
**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

**3. Environment Variables Not Loading**
**Solution:**
- Restart dev server after changing `.env.local`
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Check `console.log(process.env.NEXT_PUBLIC_API_URL)` in browser

### Scheduled Queries Issues

**1. Queries Not Running**
**Checklist:**
- [ ] Scheduled query is enabled (check list page)
- [ ] Backend server is running (scheduler runs in-process)
- [ ] Cron expression is valid (test at crontab.guru)
- [ ] No errors in backend logs
- [ ] `next_run_at` is in the future

**2. Email Not Received**
**Checklist:**
- [ ] Check spam/junk folder
- [ ] Verify recipient email addresses
- [ ] Check backend logs for SMTP errors
- [ ] Test SMTP settings (see above)
- [ ] Check query execution succeeded (not just scheduled)

**3. PDF Generation Errors**
```
ImportError: cannot import name 'getSampleStyleSheet'
```
**Solution:**
```bash
pip install --upgrade reportlab
```

### Database Issues

**1. Switching Databases**
If you need to reset or switch databases:
```bash
# Backup existing database
pg_dump dataask > backup.sql

# Drop and recreate
dropdb dataask
createdb dataask

# Run migrations
cd dataask-backend
alembic upgrade head

# Restore data (optional)
psql dataask < backup.sql
```

**2. Checking Scheduled Queries**
```sql
-- View all scheduled queries
SELECT id, name, enabled, schedule_type, last_run_at, last_run_status
FROM scheduled_queries
ORDER BY created_at DESC;

-- View queries with errors
SELECT id, name, last_run_error
FROM scheduled_queries
WHERE last_run_status = 'error';

-- Manually update next run time
UPDATE scheduled_queries
SET next_run_at = NOW() + INTERVAL '1 minute'
WHERE id = 'query-id-here';
```

## Production Deployment

### Backend

1. **Install Production Dependencies:**
```bash
cd dataask-backend
poetry install --only main  # Skip dev dependencies
```

2. **Use Production ASGI Server:**
```bash
# Install gunicorn via Poetry
poetry add gunicorn --group prod

# Run with gunicorn
poetry run gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

3. **Set Production Environment Variables:**
```bash
export DATABASE_URL=postgresql+asyncpg://user:pass@prod-db:5432/dataask
export SECRET_KEY=$(openssl rand -hex 32)
export LOG_LEVEL=WARNING
export CORS_ORIGINS='["https://yourdomain.com"]'
```

4. **Use Process Manager (systemd example):**
```ini
# /etc/systemd/system/dataask-backend.service
[Unit]
Description=DataAsk Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/dataask-backend
EnvironmentFile=/var/www/dataask-backend/.env
ExecStart=/usr/local/bin/poetry run gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

**Alternative using Poetry's virtual environment path:**
```bash
# Find Poetry's venv path
cd /var/www/dataask-backend
poetry env info --path
# Example output: /home/www-data/.cache/pypoetry/virtualenvs/dataask-backend-xyz-py3.12

# Then use that path in systemd:
ExecStart=/home/www-data/.cache/pypoetry/virtualenvs/dataask-backend-xyz-py3.12/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend

1. **Build for Production:**
```bash
cd dataask-frontend
npm run build
npm start  # Or use PM2, Docker, etc.
```

2. **Use Reverse Proxy (Nginx example):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Database

- Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
- Enable SSL connections
- Regular backups with `pg_dump`
- Monitor connection pool usage

### Scheduler Considerations

- Scheduler runs in-process with backend
- For high availability, use distributed scheduler (Celery, RQ)
- Monitor scheduled jobs with APScheduler dashboard
- Use persistent job stores for crash recovery

## Development Workflow

### Adding New Features

1. **Backend:**
   - Create model in `app/models/`
   - Create migration: `alembic revision --autogenerate -m "description"`
   - Create schemas in `app/schemas/`
   - Create router in `app/api/routers/`
   - Register router in `app/main.py`
   - Run tests

2. **Frontend:**
   - Create API client in `lib/api/`
   - Create page in `app/`
   - Create components in `components/`
   - Update navigation

### Running Tests

**Backend:**
```bash
cd dataask-backend
poetry run pytest
poetry run pytest -v  # Verbose
poetry run pytest tests/test_specific.py  # Specific test
```

**Frontend:**
```bash
cd dataask-frontend
npm test
npm run test:watch
```

### Code Quality

**Backend:**
```bash
cd dataask-backend

# Format with ruff
poetry run ruff format app/

# Lint with ruff
poetry run ruff check app/

# Type check with mypy
poetry run mypy app/
```

**Frontend:**
```bash
# Lint
npm run lint

# Type check
npm run type-check
```

## Additional Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Next.js Docs:** https://nextjs.org/docs
- **SQLAlchemy Docs:** https://docs.sqlalchemy.org/
- **APScheduler Docs:** https://apscheduler.readthedocs.io/
- **ReportLab Docs:** https://www.reportlab.com/docs/reportlab-userguide.pdf
- **shadcn/ui Components:** https://ui.shadcn.com/

## Support

For issues, questions, or contributions:
- Check existing GitHub issues
- Create new issue with reproduction steps
- Include logs and environment details

## License

See LICENSE file in repository root.
