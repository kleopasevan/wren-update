# RantAI DataAsk - Architecture Proposal

## Strategic Decision: Hybrid Approach

**Keep Wren's AI Backend** + **Rebuild Modern Frontend**

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    NEW FRONTEND LAYER                         │
│                  (Next.js 15 + shadcn/ui)                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │  Multi-Dashboard│  │  Data Prep       │  │ Conversational│ │
│  │  Workspace      │  │  Studio          │  │ Interface    │ │
│  │                 │  │                  │  │              │ │
│  │  - Grid layout  │  │  - Visual joins  │  │  - NL queries│ │
│  │  - Drag/drop    │  │  - Transforms    │  │  - Chat UI   │ │
│  │  - Real-time    │  │  - Preview       │  │  - History   │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Connection Manager                          │ │
│  │  - Multi-source config  - Health monitoring              │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────┬──────────────────────────────────┘
                            │ GraphQL/REST
┌───────────────────────────▼──────────────────────────────────┐
│               EXTENDED BACKEND SERVICES                       │
│              (Wren UI Backend - Extended)                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌───────────────────┐                │
│  │ NEW Services     │  │ KEEP Services     │                │
│  │                  │  │                   │                │
│  │ - Workspace Svc  │  │ - Deploy Service  │                │
│  │ - Dashboard Svc  │  │ - Query Service   │                │
│  │ - Collab Svc     │  │ - Asking Service  │                │
│  └──────────────────┘  └───────────────────┘                │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              KEEP Adaptors                               │ │
│  │  - ibisAdaptor  - wrenAIAdaptor  - projectRepository    │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────┬───────────────────────────┬──────────────────┘
                │                           │
                │                           │
    ┌───────────▼──────────┐    ┌──────────▼────────────────┐
    │  KEEP AS-IS          │    │  KEEP AS-IS               │
    │  wren-engine         │    │  wren-ai-service          │
    │  (ibis-server)       │    │  (Python ML service)      │
    ├──────────────────────┤    ├───────────────────────────┤
    │                      │    │                           │
    │ - 15+ DB connectors  │    │ - Text-to-SQL pipeline    │
    │ - Query execution    │    │ - MoA agents              │
    │ - MDL validation     │    │ - Vector retrieval        │
    │ - Schema metadata    │    │ - Self-correction         │
    │                      │    │ - Qdrant integration      │
    └──────────┬───────────┘    └───────────────────────────┘
               │
               │
    ┌──────────▼────────────────────────────────────────────┐
    │              DATA SOURCES                             │
    │  PostgreSQL │ MySQL │ BigQuery │ Snowflake │ +11 more│
    └───────────────────────────────────────────────────────┘
```

---

## Technology Stack

### **Frontend (NEW)**
```json
{
  "framework": "Next.js 15 (App Router)",
  "ui": "shadcn/ui + Radix UI",
  "styling": "Tailwind CSS",
  "state": "Zustand + Tanstack Query",
  "visualization": "Recharts + D3.js",
  "realtime": "Socket.io",
  "testing": "Vitest + Playwright"
}
```

### **Backend (EXTENDED)**
```json
{
  "keep": {
    "runtime": "Node.js 18",
    "framework": "Express + Apollo GraphQL",
    "orm": "Knex.js",
    "database": "PostgreSQL / SQLite"
  },
  "add": {
    "websocket": "Socket.io server",
    "caching": "Redis",
    "queue": "BullMQ"
  }
}
```

### **AI & Query Engine (KEEP AS-IS)**
```json
{
  "ai_service": "wren-ai-service (Python 3.12)",
  "query_engine": "ibis-server (FastAPI + Ibis)",
  "vector_db": "Qdrant",
  "ml_framework": "Hamilton + Haystack"
}
```

---

## Key Architectural Decisions

### **1. Why Keep Wren AI Service?**

✅ **Proven text-to-SQL accuracy**
- 50+ SQL generation rules
- Self-correction loops with engine validation
- Column pruning for token efficiency
- Few-shot learning from query history

✅ **Sophisticated RAG pipeline**
- Vector retrieval with Qdrant
- Metadata filtering
- Semantic chunking of MDL
- Multi-stage processing (intent → retrieval → planning → generation → correction)

✅ **MoA architecture already exists**
- Your spec describes what Wren already has
- Would take 6-12 months to rebuild
- Well-tested with comprehensive eval framework

✅ **Cost-effective**
- Works with multiple LLM providers
- Configurable model routing (cheap for classification, expensive for generation)
- Built-in cost tracking

**Estimated rebuild cost:** $500K - $1M (6 engineers × 6 months)

---

### **2. Why Keep Ibis Server?**

✅ **15+ database connectors already built**
- PostgreSQL, MySQL, MSSQL, Oracle
- BigQuery, Snowflake, Redshift, Athena
- ClickHouse, Trino, Spark
- MongoDB, DuckDB

✅ **Query federation capabilities**
- Cross-database joins
- Query pushdown optimization
- Consistent interface across sources

✅ **Actively maintained**
- Ibis is a mature project (10+ years)
- Regular updates and new connectors
- Strong community

**Estimated rebuild cost:** $300K - $500K (4 engineers × 4 months)

---

### **3. Why Rebuild Frontend?**

❌ **Current Wren UI limitations**
- Single dashboard paradigm
- No visual data preparation
- Limited collaboration features
- Dated component library
- No real-time updates

✅ **Modern stack advantages**
- Next.js 15 App Router (RSC, streaming)
- shadcn/ui (accessible, customizable)
- Better performance (code splitting, edge)
- Real-time capabilities (WebSocket)
- Mobile-responsive by default

✅ **Competitive differentiation**
- Tableau-like data prep UI
- Multi-workspace support
- Real-time collaboration
- Modern conversational interface

**Estimated rebuild cost:** $200K - $400K (3 engineers × 4 months)

---

## MVP Feature Comparison

### **Your Spec vs Realistic MVP**

| Feature Category | Your Spec | Realistic MVP (9 months) |
|-----------------|-----------|-------------------------|
| **Data Sources** | 100+ connectors | 8-10 key databases |
| **Data Prep** | Full visual ETL | Basic joins + transforms |
| **Dashboards** | Unlimited + templates | Multi-dashboard workspace |
| **Collaboration** | Full suite | Comments + sharing |
| **AI Agents** | 8 specialized agents | Keep existing 5 from Wren |
| **Governance** | Enterprise-grade | Basic RBAC + audit logs |
| **Visualization** | 50+ chart types | 15-20 chart types |
| **API** | Full REST + GraphQL | GraphQL (extend Wren's) |
| **Embedding** | White-label + SDKs | Defer to Phase 2 |

---

## Migration Strategy

### **Phase 1: Foundation (Months 1-3)**

**Backend:**
1. Keep entire `wren-ai-service` (no changes)
2. Keep entire `ibis-server` (no changes)
3. Extend Wren UI backend:
   - Add workspace management
   - Add multi-dashboard CRUD
   - Add WebSocket support for real-time

**Frontend:**
1. Create new Next.js 15 project
2. Build connection manager UI
3. Build conversational interface (chat)
4. Integrate with existing GraphQL API

**Database:**
- Support 4 databases: PostgreSQL, MySQL, BigQuery, Snowflake
- Reuse Ibis connectors

---

### **Phase 2: Data Preparation (Months 4-6)**

**Frontend:**
1. Visual data prep studio
   - Table selector
   - Visual join builder
   - Transformation UI (filter, aggregate, calculated fields)
   - Live preview

**Backend:**
1. Extend MDL to support user-defined views
2. Add data prep API endpoints
3. Schema relationship visualization

---

### **Phase 3: Dashboards (Months 7-9)**

**Frontend:**
1. Dashboard grid builder
   - Drag-and-drop layout
   - Chart configuration UI
   - Cross-filtering
   - Real-time updates

**Backend:**
1. Dashboard persistence
2. Real-time query execution
3. Caching layer (Redis)

---

## What to Defer to Phase 2 (Months 10-18)

**Advanced Features:**
- White-labeling and embedding
- Mobile apps
- Advanced governance (RLS, CLS, dynamic masking)
- Predictive analytics (AutoML)
- 20+ additional database connectors
- Custom agent development
- API marketplace

**Enterprise Features:**
- SSO integrations (SAML, OIDC)
- Advanced audit logging
- Compliance certifications (SOC 2, ISO 27001)
- High availability (multi-region)
- Disaster recovery

---

## Estimated Costs & Timeline

### **MVP (9 months)**

**Team:**
- 1 Technical Lead (full-stack, AI)
- 2 Frontend Engineers (Next.js/React)
- 1 Backend Engineer (Node.js/GraphQL)
- 1 AI/ML Engineer (Python, fine-tuning)
- 1 Product Designer (UI/UX)
- 1 QA Engineer (testing, automation)

**Budget:**
- Engineering: $700K - $900K
- Infrastructure: $20K - $40K (AWS/GCP)
- LLM costs: $10K - $30K (development)
- Design tools: $5K - $10K
- **Total: $735K - $980K**

### **Phase 2: Enterprise (Months 10-18)**

**Additional Team:**
- 1 DevOps Engineer
- 1 Security Engineer
- 2 Additional Full-stack Engineers

**Budget:**
- Engineering: $1.2M - $1.5M
- Infrastructure: $50K - $100K
- Compliance: $50K - $100K
- **Total: $1.3M - $1.7M**

---

## Risk Assessment

### **High Risk**
❌ **Building everything from scratch**
- 3-5 year timeline
- $5M - $15M budget
- Competing with established players
- High probability of failure

### **Medium Risk** ⚠️
⚠️ **Hybrid approach (recommended)**
- 9-18 month timeline
- $1M - $2.5M budget
- Leverage Wren's proven AI
- Differentiate with UX + multi-dashboard

### **Mitigation Strategies**
1. **Start with 1-2 killer features** (e.g., conversational multi-source analytics)
2. **Focus on a specific vertical** (e.g., e-commerce, SaaS analytics)
3. **Beta with 3-5 design partners** (validate PMF before scaling)
4. **Modular architecture** (can swap components if needed)

---

## Competitive Positioning

### **Target Positioning:**

```
"Conversational Tableau with AI-native architecture"

For: Mid-market companies (50-500 employees)
Who: Need self-service analytics but lack technical teams
Unlike: Tableau (complex), Metabase (limited AI), Mode (code-first)
DataAsk: Combines Tableau's data prep with ChatGPT-like simplicity
```

### **Differentiation:**
1. **Conversational-first UX** (ask questions, get dashboards)
2. **Visual data preparation** (no SQL required)
3. **Multi-source federation** (query across databases easily)
4. **AI-assisted insights** (proactive anomaly detection)

---

## Recommendation

### **Go with Hybrid Approach**

**Keep:**
- ✅ wren-ai-service (100% reuse)
- ✅ ibis-server (100% reuse)
- ✅ Backend services (80% reuse, 20% extend)

**Rebuild:**
- 🔥 Frontend UI (shadcn + Next.js 15)
- 🔥 Data prep studio
- 🔥 Multi-dashboard workspace
- 🔥 Collaboration features

**Timeline:** 9-12 months to MVP

**Budget:** $800K - $1.2M

**Team:** 6-7 people

---

## Next Steps

1. **Validate product-market fit**
   - Interview 10-15 potential customers
   - Identify top 3 pain points
   - Prioritize features based on feedback

2. **Build proof-of-concept** (2-4 weeks)
   - Keep Wren AI backend as-is
   - Build minimal Next.js frontend
   - Integrate with 1-2 data sources
   - Demo conversational analytics

3. **Secure funding** (if needed)
   - $500K - $1M seed round
   - With POC + customer interviews

4. **Assemble team**
   - Technical lead (you?)
   - 2 frontend engineers
   - 1 backend engineer
   - 1 designer

5. **Start building** (Month 1)
   - Set up monorepo
   - Migrate Wren backend
   - Build new frontend shell
   - Deploy staging environment

---

## Conclusion

Your product spec is **visionary but unrealistic** for an initial launch.

The **hybrid approach** gives you:
- ✅ **Speed to market** (9 months vs 3 years)
- ✅ **Proven AI technology** (Wren's text-to-SQL)
- ✅ **Lower risk** ($1M vs $15M)
- ✅ **Competitive differentiation** (modern UX + AI)

**Focus on ONE thing you do 10x better than Tableau:**
- Conversational analytics across multiple databases
- Zero-code data preparation with AI assistance
- Real-time collaborative dashboards

Build that first. Nail it. Then expand.

---

**Document Version:** 0.1
**Created:** 2025-01-06
**Author:** Architecture Review
