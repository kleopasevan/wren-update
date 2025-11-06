# RantAI DataAsk - MVP Feature Specification
## Realistic 9-Month Implementation Plan

**Architecture:** Python Backend (FastAPI) + Next.js 15 Frontend + Wren AI (Keep)

---

## Feature Prioritization Matrix

### ✅ **TIER 1: MVP CORE** (Must Have - Months 1-6)
*These features define the product and differentiate from Wren*

#### 1. Multi-Database Connection Management ⭐⭐⭐
**From Spec:** Section 3.1 Universal Data Connectors

**What We'll Build:**
```python
# User can connect to MULTIPLE databases simultaneously
workspace = {
    "connections": [
        {"name": "postgres_prod", "type": "postgresql", "host": "...", "status": "active"},
        {"name": "mysql_analytics", "type": "mysql", "host": "...", "status": "active"},
        {"name": "bigquery_data", "type": "bigquery", "project": "...", "status": "active"},
    ]
}

# vs Wren: Only 1 active connection per project
```

**Features:**
- ✅ Multiple simultaneous database connections per workspace
- ✅ Connection health monitoring (ping, latency, error tracking)
- ✅ Credential management with encryption
- ✅ Connection testing before save
- ✅ Auto-reconnect with exponential backoff
- ✅ Connection usage analytics (query count, data transfer)

**Database Support (MVP):**
- PostgreSQL
- MySQL
- BigQuery
- Snowflake
- SQLite (for testing)
- MongoDB (basic support)

**Implementation:**
- Reuse ibis-server connectors (already done)
- Build connection pool manager
- Add connection switching in UI
- Store connection configs in PostgreSQL (encrypted)

**Effort:** 3-4 weeks

---

#### 2. Multi-Dashboard Workspace ⭐⭐⭐
**From Spec:** Section 7.2 Interactive Dashboard Builder

**What We'll Build:**
```python
workspace = {
    "id": "ws_123",
    "name": "Sales Analytics",
    "dashboards": [
        {"id": "dash_1", "name": "Executive Overview", "layout": "grid"},
        {"id": "dash_2", "name": "Regional Performance", "layout": "flex"},
        {"id": "dash_3", "name": "Product Analysis", "layout": "grid"},
    ],
    "shared_datasets": [...],  # Reusable across dashboards
}

# vs Wren: 1 dashboard per project, no workspace concept
```

**Features:**
- ✅ Unlimited dashboards per workspace
- ✅ Dashboard folders/organization
- ✅ Dashboard templates (blank, sales, marketing, ops)
- ✅ Dashboard cloning/duplication
- ✅ Shared color themes across workspace
- ✅ Dashboard-level permissions (view/edit/admin)
- ✅ Dashboard versioning (save points)
- ✅ Recently viewed dashboards
- ✅ Dashboard search and filtering

**UI Components:**
- Sidebar with dashboard list (tree view)
- Dashboard tabs (like browser tabs)
- Quick switcher (Cmd+K)
- Dashboard grid view (thumbnails)

**Implementation:**
- New PostgreSQL tables: `workspaces`, `dashboards`, `dashboard_widgets`
- FastAPI endpoints for CRUD
- Next.js workspace layout with sidebar
- Real-time sync via WebSocket

**Effort:** 4-5 weeks

---

#### 3. Visual Data Preparation Studio ⭐⭐⭐
**From Spec:** Section 4.1 Visual Data Preparation Studio

**What We'll Build:**
```python
# Tableau-like visual data prep
preparation_flow = {
    "steps": [
        {
            "type": "source",
            "connection": "postgres_prod",
            "table": "orders",
            "preview": [...],  # First 100 rows
        },
        {
            "type": "join",
            "left": "orders",
            "right": "customers",
            "condition": "orders.customer_id = customers.id",
            "join_type": "inner",
            "preview": [...],  # Updated preview
        },
        {
            "type": "filter",
            "column": "order_date",
            "operator": ">=",
            "value": "2024-01-01",
            "preview": [...],
        },
        {
            "type": "aggregate",
            "group_by": ["customer_name", "region"],
            "measures": [
                {"column": "revenue", "function": "sum"},
                {"column": "order_id", "function": "count"},
            ],
            "preview": [...],
        },
    ],
    "output_name": "customer_revenue_summary",
    "save_as": "dataset",  # or "view"
}

# vs Wren: No visual prep, users work directly with raw tables
```

**Features:**
- ✅ **Visual table selector** (browse schemas, tables)
- ✅ **Join builder**
  - Drag-and-drop table relationships
  - Auto-detect join conditions (AI-suggested)
  - Support inner/left/right/full outer joins
  - Visual relationship diagram
- ✅ **Transformation builder**
  - Filter rows (visual condition builder)
  - Select/hide columns
  - Rename columns
  - Calculated fields (formula builder with autocomplete)
  - Aggregate (group by + measures)
  - Pivot/unpivot
  - Sort
- ✅ **Live preview** (first 100 rows at each step)
- ✅ **Data profiling** (column stats, null counts, distributions)
- ✅ **Save as dataset** (reusable across dashboards)
- ✅ **Undo/redo** steps
- ✅ **AI assistance**
  - "Suggest join conditions"
  - "Clean this column" (remove nulls, standardize)
  - "Detect outliers"

**UI Components:**
- Canvas with flowchart-like steps
- Property panel for each step
- Live preview table
- Data profiling sidebar

**Implementation:**
- Use Ibis for transformations (already supports all this!)
- Store preparation flows as JSON in PostgreSQL
- Generate SQL from flow (via Ibis)
- FastAPI endpoints for preview + execution
- React Flow for visual canvas

**Effort:** 6-8 weeks (biggest feature)

---

#### 4. Conversational Analytics (Keep Wren's AI) ⭐⭐⭐
**From Spec:** Section 6 Conversational Analytics Engine

**What We'll Enhance:**
```python
# Keep Wren's text-to-SQL pipeline
# Extend to support multi-database queries

user_question = "Compare sales from PostgreSQL with marketing spend from BigQuery"

# AI should:
# 1. Understand this requires 2 databases
# 2. Generate federated query
# 3. Return combined visualization

response = {
    "sql": {
        "postgres": "SELECT DATE_TRUNC('month', order_date) as month, SUM(revenue) FROM orders GROUP BY month",
        "bigquery": "SELECT month, SUM(spend) FROM marketing_campaigns GROUP BY month",
        "federation": "JOIN postgres_results ON bigquery_results WHERE postgres.month = bigquery.month",
    },
    "visualization": {
        "type": "line_chart",
        "x": "month",
        "y": ["revenue", "spend"],
        "dual_axis": True,
    },
    "insights": [
        "Marketing spend increased 45% in Q3 but revenue only grew 12%",
        "Best ROI was in January (3.2x)",
    ],
}

# vs Wren: Single database queries only
```

**Enhancements:**
- ✅ Keep entire wren-ai-service pipeline
- ✅ Add multi-database context awareness
- ✅ Generate federated queries
- ✅ Cross-database insights
- ✅ Conversation history per workspace (not global)
- ✅ Share conversations with team
- ✅ Export conversation as dashboard

**Implementation:**
- Extend wren-ai-service prompt to include all workspace connections
- Update MDL generation to include multi-DB context
- Add federation logic in query planning agent
- Store conversations in PostgreSQL (workspace-scoped)

**Effort:** 3-4 weeks

---

#### 5. AI-Assisted Dashboard Creation ⭐⭐⭐
**From Spec:** Section 7.1 Intelligent Visualization Selection

**What We'll Build:**
```python
# User asks: "Create a dashboard for sales performance"

ai_dashboard = {
    "name": "Sales Performance Dashboard",
    "layout": "grid",
    "widgets": [
        {
            "type": "metric_card",
            "position": {"x": 0, "y": 0, "w": 3, "h": 2},
            "query": "SELECT SUM(revenue) FROM orders WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE)",
            "title": "Monthly Revenue",
            "format": "currency",
        },
        {
            "type": "line_chart",
            "position": {"x": 3, "y": 0, "w": 9, "h": 4},
            "query": "SELECT DATE_TRUNC('day', order_date) as date, SUM(revenue) FROM orders WHERE order_date >= CURRENT_DATE - 30 GROUP BY date",
            "title": "30-Day Revenue Trend",
            "x_axis": "date",
            "y_axis": "sum",
        },
        {
            "type": "bar_chart",
            "position": {"x": 0, "y": 4, "w": 6, "h": 4},
            "query": "SELECT region, SUM(revenue) FROM orders JOIN customers ON orders.customer_id = customers.id GROUP BY region ORDER BY sum DESC LIMIT 10",
            "title": "Top 10 Regions by Revenue",
        },
    ],
}

# vs Wren: Manual dashboard creation only
```

**Features:**
- ✅ Natural language dashboard generation
  - "Create a sales dashboard"
  - "Build an executive summary for Q4"
  - "Show me customer analytics"
- ✅ AI selects optimal chart types
- ✅ AI suggests layout (importance-based positioning)
- ✅ AI generates queries for each widget
- ✅ AI creates drill-down paths
- ✅ User can edit/refine generated dashboard
- ✅ Save as template for reuse

**Implementation:**
- New agent in wren-ai-service: `dashboard_generation` pipeline
- Prompt engineering for dashboard design
- Use Wren's existing visualization agent
- Generate layout using grid algorithm
- FastAPI endpoint for generation
- Interactive refinement in UI

**Effort:** 4-5 weeks

---

#### 6. Basic Collaboration & Sharing ⭐⭐
**From Spec:** Section 10.1 Team Collaboration Tools

**What We'll Build:**
```python
# Share dashboards and datasets with team
sharing = {
    "dashboard_id": "dash_123",
    "shared_with": [
        {"user_id": "user_456", "permission": "view"},
        {"user_id": "user_789", "permission": "edit"},
        {"team_id": "team_101", "permission": "view"},
    ],
    "public_link": "https://dataask.com/share/abc123",
    "public_link_enabled": True,
    "public_link_password": "optional_password",
}

# Comments on dashboards
comment = {
    "dashboard_id": "dash_123",
    "widget_id": "widget_456",  # Optional: comment on specific widget
    "user_id": "user_789",
    "text": "This metric looks off, can we verify the data source?",
    "timestamp": "2025-01-06T10:30:00Z",
    "resolved": False,
}

# vs Wren: Limited sharing, no collaboration features
```

**Features:**
- ✅ Share dashboards with users/teams
- ✅ Permission levels (view/edit/admin)
- ✅ Public links with optional password
- ✅ Comments on dashboards and widgets
- ✅ @mentions in comments (with notifications)
- ✅ Activity feed (who viewed, edited, commented)
- ✅ Share datasets (prepared data)
- ✅ Email notifications for shares/comments

**Implementation:**
- PostgreSQL tables: `shares`, `comments`, `notifications`, `activity_log`
- FastAPI endpoints for sharing + comments
- WebSocket for real-time comment updates
- Email service integration (SendGrid/Resend)

**Effort:** 3-4 weeks

---

#### 7. Cross-Database Federation ⭐⭐
**From Spec:** Section 3.3 Data Federation & Virtualization

**What We'll Build:**
```python
# Query across databases without moving data
federated_query = """
SELECT
    pg.customer_name,
    pg.total_orders,
    bq.lifetime_value,
    mongo.support_tickets
FROM postgres.customers pg
JOIN bigquery.customer_analytics bq ON pg.customer_id = bq.customer_id
JOIN mongodb.support_data mongo ON pg.customer_id = mongo.customer_id
WHERE pg.total_orders > 10
"""

# Execution plan:
# 1. Push filters to each DB
# 2. Execute sub-queries in parallel
# 3. Join results in DataAsk
# 4. Cache results

# vs Wren: Single database queries only
```

**Features:**
- ✅ Cross-database joins (up to 3 databases in MVP)
- ✅ Query pushdown optimization
- ✅ Parallel execution
- ✅ Result caching (Redis)
- ✅ Performance monitoring
- ✅ Automatic temp table creation if needed

**Implementation:**
- Use DuckDB for in-memory joins (fast!)
- Ibis for query pushdown
- Redis for caching
- FastAPI async execution
- Query planner to optimize execution

**Effort:** 4-5 weeks

---

### ⚡ **TIER 2: HIGH VALUE** (Should Have - Months 7-9)
*Nice to have for MVP, can defer if timeline slips*

#### 8. Real-Time Dashboard Updates ⭐⭐
**From Spec:** Section 7.3 Real-Time Dashboard Updates

**Features:**
- ✅ Auto-refresh dashboards (configurable intervals)
- ✅ Real-time data streaming (for supported sources)
- ✅ Change highlights (flash on update)
- ✅ Collaborative cursors (see who's viewing)

**Implementation:**
- WebSocket for real-time updates
- Server-sent events for streaming
- Redis pub/sub for coordination

**Effort:** 2-3 weeks

---

#### 9. Data Quality & Profiling ⭐⭐
**From Spec:** Section 5.2 Data Profiling & Quality Assessment

**Features:**
- ✅ Automatic data profiling (stats, distributions)
- ✅ Data quality scores
- ✅ Anomaly detection
- ✅ Missing value analysis
- ✅ Data freshness tracking

**Implementation:**
- Use Great Expectations (Python library)
- Run profiling jobs asynchronously
- Store results in PostgreSQL
- Display in data prep UI

**Effort:** 3-4 weeks

---

#### 10. Advanced RBAC & Audit Logging ⭐
**From Spec:** Section 9 Security & Governance Framework

**Features:**
- ✅ Role-based access control
  - Admin, Editor, Viewer roles
  - Custom role creation
- ✅ Comprehensive audit logging
  - All queries executed
  - Data access tracking
  - Configuration changes
- ✅ Data lineage (basic)
  - Where is this data used?
  - What's the source?

**Implementation:**
- PostgreSQL tables: `roles`, `permissions`, `audit_logs`
- Middleware for access control
- Background job for lineage tracking

**Effort:** 2-3 weeks

---

### 🚀 **TIER 3: FUTURE** (Defer to Phase 2 - Months 10-18)
*Important but not critical for MVP*

#### Deferred Features:
- ❌ White-labeling & embedding (Section 13.2)
- ❌ Row-level security & column masking (Section 9.2)
- ❌ Predictive analytics & AutoML (Section 14.2)
- ❌ Mobile apps (Section 12)
- ❌ Advanced governance (GDPR tools, compliance) (Section 9.3)
- ❌ Workflow automation (Section 10.2)
- ❌ Custom agent development (Section 8.3)
- ❌ 20+ additional database connectors (Section 3.1)
- ❌ Advanced caching strategies (Section 11.1)
- ❌ Multi-region deployment (Section 15.3)

---

## MVP Feature Summary

### **What We're Building:**

| # | Feature | Spec Section | Effort | Priority |
|---|---------|--------------|--------|----------|
| 1 | Multi-Database Connections | 3.1 | 3-4 weeks | TIER 1 |
| 2 | Multi-Dashboard Workspace | 7.2 | 4-5 weeks | TIER 1 |
| 3 | Visual Data Preparation | 4.1 | 6-8 weeks | TIER 1 |
| 4 | Conversational Analytics (Enhanced) | 6.0 | 3-4 weeks | TIER 1 |
| 5 | AI-Assisted Dashboard Creation | 7.1 | 4-5 weeks | TIER 1 |
| 6 | Collaboration & Sharing | 10.1 | 3-4 weeks | TIER 1 |
| 7 | Cross-Database Federation | 3.3 | 4-5 weeks | TIER 1 |
| 8 | Real-Time Updates | 7.3 | 2-3 weeks | TIER 2 |
| 9 | Data Quality & Profiling | 5.2 | 3-4 weeks | TIER 2 |
| 10 | RBAC & Audit Logging | 9.0 | 2-3 weeks | TIER 2 |

**Total Effort (TIER 1):** 28-35 weeks = **7-9 months** ✅

---

## What We Keep from Wren

### **100% Reuse (No Changes):**
- ✅ `wren-ai-service` (entire Python service)
  - Text-to-SQL pipeline
  - MoA agents (Source, Schema, Query, Viz, Explainer)
  - Vector retrieval (Qdrant)
  - Self-correction loops
  - LLM provider abstraction

### **80% Reuse (Minor Extensions):**
- ✅ `wren-engine/ibis-server`
  - Database connectors (15+)
  - Query execution
  - MDL validation
  - **Add:** Connection pooling
  - **Add:** Federation logic

### **50% Reuse (Moderate Changes):**
- ⚠️ Database schema
  - Keep: Core tables (projects, models)
  - **Add:** `workspaces`, `dashboards`, `connections`, `shares`, `comments`
  - **Migrate:** Data from Wren's single-connection model

### **0% Reuse (Build New):**
- 🔥 Frontend (Next.js 15 + shadcn/ui)
- 🔥 Backend API (FastAPI - new service)
- 🔥 Data prep engine (Ibis-based, but new)
- 🔥 Collaboration features (WebSocket)

---

## Technology Stack

### **Backend (New - Python)**
```python
{
    "framework": "FastAPI 0.109+",
    "async": "asyncio + uvloop",
    "orm": "SQLAlchemy 2.0 (async)",
    "database": "PostgreSQL 15+",
    "cache": "Redis 7+",
    "queue": "Celery + Redis",
    "websocket": "FastAPI WebSocket",
    "validation": "Pydantic v2",
    "auth": "FastAPI Security + JWT",
    "testing": "pytest + httpx",
}
```

### **AI Layer (Keep - Python)**
```python
{
    "service": "wren-ai-service (no changes)",
    "framework": "Hamilton + Haystack",
    "vector_db": "Qdrant",
    "llm": "OpenAI / Anthropic / Gemini (configurable)",
}
```

### **Query Engine (Extend - Python)**
```python
{
    "service": "wren-engine/ibis-server",
    "framework": "FastAPI + Ibis",
    "federation": "DuckDB (in-memory joins)",
    "connectors": "Ibis (15+ databases)",
}
```

### **Frontend (New - TypeScript)**
```python
{
    "framework": "Next.js 15 (App Router)",
    "ui": "shadcn/ui + Radix UI",
    "styling": "Tailwind CSS",
    "state": "Zustand + Tanstack Query",
    "visualization": "Recharts + D3.js",
    "canvas": "React Flow (data prep)",
    "websocket": "Socket.io-client",
    "testing": "Vitest + Playwright",
}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                     │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │ Multi-Dash   │ │ Data Prep    │ │ Conversational UI  │  │
│  │ Workspace    │ │ Studio       │ │                    │  │
│  └──────────────┘ └──────────────┘ └────────────────────┘  │
└───────────────┬───────────────────────┬─────────────────────┘
                │ REST/GraphQL          │ WebSocket
┌───────────────▼───────────────────────▼─────────────────────┐
│              NEW BACKEND (FastAPI)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Workspace Service  │  Dashboard Service             │   │
│  │  Connection Manager │  Collaboration Service         │   │
│  │  Data Prep Service  │  Auth & RBAC Service           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Database: PostgreSQL  │  Cache: Redis  │  Queue: Celery   │
└───────┬────────────────┴────────┬─────────────────────┬─────┘
        │                         │                     │
┌───────▼────────┐    ┌──────────▼──────────┐  ┌──────▼──────┐
│  KEEP AS-IS    │    │  KEEP AS-IS         │  │ EXTEND      │
│  wren-ai-      │    │  ibis-server        │  │ DuckDB      │
│  service       │    │  (Query Engine)     │  │ (Federation)│
│                │    │                     │  │             │
│ - Text-to-SQL  │    │ - 15+ Connectors    │  │ - Joins     │
│ - MoA Agents   │    │ - Query Exec        │  │ - Caching   │
│ - Qdrant       │    │ - MDL Validation    │  │             │
└────────────────┘    └─────────────────────┘  └─────────────┘
```

---

## Development Phases

### **Phase 1: Foundation** (Months 1-3)
**Goal:** Multi-database + Multi-dashboard core

**Deliverables:**
- ✅ FastAPI backend with workspace/dashboard CRUD
- ✅ Next.js frontend with workspace UI
- ✅ Multi-database connection manager
- ✅ Basic dashboard builder (manual)
- ✅ Conversational interface (using Wren AI as-is)
- ✅ PostgreSQL schema + migrations
- ✅ Auth & basic RBAC

**Team:**
- 1 Backend Engineer (FastAPI)
- 1 Frontend Engineer (Next.js)
- 1 Full-stack (integration)

---

### **Phase 2: Data Prep & AI** (Months 4-6)
**Goal:** Visual data prep + AI dashboard generation

**Deliverables:**
- ✅ Visual data preparation studio
- ✅ AI-assisted dashboard creation
- ✅ Cross-database federation (basic)
- ✅ Data profiling & quality
- ✅ Enhanced conversational analytics (multi-DB)

**Team:**
- 2 Backend Engineers
- 1 Frontend Engineer
- 1 AI/ML Engineer (extend wren-ai-service)

---

### **Phase 3: Collaboration & Polish** (Months 7-9)
**Goal:** Team features + production readiness

**Deliverables:**
- ✅ Collaboration (sharing, comments)
- ✅ Real-time updates (WebSocket)
- ✅ Advanced RBAC
- ✅ Audit logging
- ✅ Performance optimization
- ✅ Documentation & onboarding

**Team:**
- 2 Full-stack Engineers
- 1 DevOps Engineer
- 1 QA Engineer

---

## Success Metrics

### **MVP Success Criteria:**

**Functionality:**
- ✅ Support 5+ database types
- ✅ Create unlimited dashboards per workspace
- ✅ Visual data prep with 10+ transformation types
- ✅ 90%+ text-to-SQL accuracy (inherit from Wren)
- ✅ AI dashboard generation in <30 seconds

**Performance:**
- ✅ Dashboard load time: <2 seconds
- ✅ Query execution: <5 seconds (simple), <30 seconds (complex)
- ✅ Data prep preview: <1 second per step
- ✅ Concurrent users: 100+ per instance

**UX:**
- ✅ Zero-code analytics for 80% of use cases
- ✅ Onboarding flow: <10 minutes to first dashboard
- ✅ Mobile responsive (tablet + phone)

---

## Competitive Differentiation

### **vs Tableau:**
- ✅ Conversational interface (no need to learn BI tool)
- ✅ AI-generated dashboards (vs manual creation)
- ✅ Multi-database federation (easier than Tableau's)
- ✅ 10x faster time to insight

### **vs Wren:**
- ✅ Multi-dashboard workspace
- ✅ Visual data preparation
- ✅ Collaboration features
- ✅ Cross-database analytics

### **vs Power BI:**
- ✅ Modern, intuitive UI
- ✅ AI-native (not bolted on)
- ✅ Faster deployment (cloud-first)
- ✅ Better collaboration

---

## Next Steps

1. **Validate with customers** (Week 1-2)
   - Interview 5-10 potential users
   - Prioritize features based on feedback

2. **Build POC** (Week 3-4)
   - FastAPI backend skeleton
   - Next.js frontend shell
   - Connect to Wren AI
   - Demo: Multi-DB + conversational query

3. **Fundraise** (Week 5-8)
   - Pitch deck with POC
   - $500K - $1M seed round
   - 12-18 month runway

4. **Hire team** (Week 9-12)
   - 2 backend engineers
   - 1 frontend engineer
   - 1 AI/ML engineer
   - 1 designer

5. **Sprint 1** (Month 4)
   - Begin Phase 1 development
   - Bi-weekly releases
   - Design partner beta program

---

## Budget Estimate (9 Months)

**Engineering:**
- 4 Engineers × $120K/year × 0.75 years = $360K
- 1 AI/ML Engineer × $150K/year × 0.75 years = $112K
- 1 Designer × $100K/year × 0.75 years = $75K
- **Total: $547K**

**Infrastructure:**
- AWS/GCP: $3K/month × 9 = $27K
- LLM costs: $2K/month × 9 = $18K
- Tools (GitHub, Figma, etc.): $1K/month × 9 = $9K
- **Total: $54K**

**Other:**
- Legal, accounting: $20K
- Marketing, domain, branding: $10K
- **Total: $30K**

**GRAND TOTAL: $631K** (9 months to MVP)

---

## Conclusion

This MVP spec takes the **best ideas** from your 100-page document and makes them **achievable in 9 months** with a **small team**.

**Core Philosophy:**
- Keep Wren's proven AI (don't rebuild what works)
- Build modern UX that delights users
- Focus on multi-database + multi-dashboard differentiators
- Ship fast, iterate based on feedback

**Key Differentiators:**
1. Conversational analytics across multiple databases
2. Visual data preparation (Tableau-like)
3. AI-generated dashboards
4. Modern, collaborative workspace

**This is realistic, fundable, and competitive.**

Ready to build the POC?
