# RantAI DataAsk - Implementation Plan
## From Your 100-Page Spec to 9-Month MVP

---

## Executive Summary

**Strategy:** Hybrid approach - Keep Wren's AI backend + Build modern Python/FastAPI backend + New Next.js 15 frontend

**Timeline:** 9 months to MVP

**Budget:** $631K

**Team:** 6 people

**Features from Your Spec:** 10 core features (out of 100+)

---

## What We're Building

### **From Your Spec → MVP Features**

| Your Spec Feature | MVP Implementation | Status |
|-------------------|-------------------|--------|
| **Section 3.1:** Universal Data Connectors (100+) | 6 databases (PostgreSQL, MySQL, BigQuery, Snowflake, MongoDB, SQLite) | ✅ TIER 1 |
| **Section 7.2:** Interactive Dashboard Builder | Multi-dashboard workspace with drag-drop builder | ✅ TIER 1 |
| **Section 4.1:** Visual Data Preparation Studio | Tableau-like visual joins, transforms, calculated fields | ✅ TIER 1 |
| **Section 6:** Conversational Analytics Engine | Keep Wren's text-to-SQL, extend for multi-DB | ✅ TIER 1 |
| **Section 7.1:** AI-Assisted Dashboard Creation | Natural language → dashboard generation | ✅ TIER 1 |
| **Section 10.1:** Team Collaboration Tools | Sharing, comments, @mentions | ✅ TIER 1 |
| **Section 3.3:** Data Federation & Virtualization | Cross-database joins (up to 3 DBs) | ✅ TIER 1 |
| **Section 7.3:** Real-Time Dashboard Updates | Auto-refresh + WebSocket updates | ⚡ TIER 2 |
| **Section 5.2:** Data Profiling & Quality | Automatic profiling, quality scores | ⚡ TIER 2 |
| **Section 9:** Security & Governance | RBAC, audit logging, data lineage | ⚡ TIER 2 |
| **All others** (90+ features) | Deferred to Phase 2 (Months 10-18) | 🚀 FUTURE |

---

## Architecture Decision

```
┌─────────────────────────────────────────────────────────┐
│  WHAT WE KEEP FROM WREN (100% reuse)                    │
├─────────────────────────────────────────────────────────┤
│  ✅ wren-ai-service (Python)                            │
│     - Text-to-SQL pipeline (50+ rules)                  │
│     - MoA agents (Source/Schema/Query/Viz/Explainer)    │
│     - Vector retrieval (Qdrant)                         │
│     - Self-correction loops                             │
│     - Multi-LLM support                                 │
│                                                         │
│  ✅ ibis-server (Python/FastAPI)                        │
│     - 15+ database connectors                           │
│     - Query execution engine                            │
│     - MDL validation                                    │
│     - Schema metadata APIs                              │
│                                                         │
│  Savings: $800K + 12 months development time            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  WHAT WE BUILD NEW                                      │
├─────────────────────────────────────────────────────────┤
│  🔥 Backend API (FastAPI)                               │
│     - Workspace management                              │
│     - Multi-connection pooling                          │
│     - Dashboard CRUD                                    │
│     - Data preparation engine (Ibis-based)              │
│     - Collaboration (WebSocket)                         │
│     - RBAC & audit logging                              │
│     - PostgreSQL + Redis                                │
│                                                         │
│  🔥 Frontend (Next.js 15 + shadcn/ui)                   │
│     - Multi-dashboard workspace                         │
│     - Visual data prep studio                           │
│     - Conversational interface                          │
│     - Dashboard builder                                 │
│     - Real-time collaboration                           │
│                                                         │
│  Effort: 9 months, $631K                                │
└─────────────────────────────────────────────────────────┘
```

---

## Development Roadmap

### **Phase 1: Foundation** (Months 1-3)

**Goal:** Multi-database + Multi-dashboard core working

**Week 1-2: Project Setup**
- [ ] Set up FastAPI project structure
- [ ] PostgreSQL database setup + Alembic migrations
- [ ] Redis setup
- [ ] Docker Compose for local development
- [ ] Next.js 15 project with shadcn/ui
- [ ] GitHub repo + CI/CD pipeline

**Week 3-4: Authentication & Workspace**
- [ ] User authentication (JWT)
- [ ] Workspace CRUD endpoints
- [ ] Workspace member management
- [ ] Frontend: Login/signup pages
- [ ] Frontend: Workspace selector

**Week 5-6: Multi-Database Connections**
- [ ] Connection CRUD endpoints
- [ ] Integration with ibis-server
- [ ] Connection testing API
- [ ] Schema metadata fetching
- [ ] Frontend: Connection manager UI
- [ ] Credential encryption

**Week 7-9: Basic Dashboard**
- [ ] Dashboard CRUD endpoints
- [ ] Widget management
- [ ] Basic query execution
- [ ] Frontend: Dashboard list/grid view
- [ ] Frontend: Simple dashboard builder
- [ ] Dashboard sharing (basic)

**Week 10-12: Conversational Interface**
- [ ] Integration with wren-ai-service
- [ ] Conversation CRUD endpoints
- [ ] MDL generation from multi-DB
- [ ] Frontend: Chat interface
- [ ] Frontend: Query result visualization

**Deliverables (Month 3):**
- ✅ Multi-database connection support (6 databases)
- ✅ Multi-dashboard workspace
- ✅ Basic dashboard builder
- ✅ Conversational analytics (reusing Wren AI)
- ✅ User authentication + workspaces
- ✅ Working MVP demo

---

### **Phase 2: Data Prep & AI** (Months 4-6)

**Goal:** Visual data prep + AI dashboard generation

**Week 13-16: Visual Data Preparation**
- [ ] Data prep service with Ibis
- [ ] Step-by-step transformation builder
- [ ] Live preview API (first 100 rows)
- [ ] Join builder (AI-suggested joins)
- [ ] Frontend: Visual canvas (React Flow)
- [ ] Frontend: Transformation property panels
- [ ] Save as reusable dataset

**Week 17-19: AI-Assisted Dashboard**
- [ ] New pipeline in wren-ai-service: dashboard_generation
- [ ] Prompt engineering for dashboard design
- [ ] Layout algorithm (importance-based)
- [ ] Frontend: "Generate dashboard" flow
- [ ] Frontend: Edit generated dashboard

**Week 20-22: Cross-Database Federation**
- [ ] DuckDB integration for in-memory joins
- [ ] Federated query planning
- [ ] Parallel execution for sub-queries
- [ ] Query result caching (Redis)
- [ ] Frontend: Multi-source query builder

**Week 23-24: Data Profiling**
- [ ] Great Expectations integration
- [ ] Automatic column statistics
- [ ] Data quality scoring
- [ ] Frontend: Data profiling sidebar

**Deliverables (Month 6):**
- ✅ Visual data preparation studio
- ✅ AI-generated dashboards
- ✅ Cross-database federation (3+ DBs)
- ✅ Data quality & profiling
- ✅ Enhanced conversational analytics

---

### **Phase 3: Collaboration & Polish** (Months 7-9)

**Goal:** Team features + production readiness

**Week 25-27: Collaboration**
- [ ] Sharing endpoints (users/teams/public links)
- [ ] Comments system
- [ ] @mentions + notifications
- [ ] Activity feed
- [ ] Frontend: Share modal
- [ ] Frontend: Comment threads
- [ ] Email notifications

**Week 28-29: Real-Time Features**
- [ ] WebSocket server
- [ ] Real-time dashboard updates
- [ ] Collaborative cursors
- [ ] Live query status
- [ ] Frontend: WebSocket integration

**Week 30-31: Advanced RBAC & Audit**
- [ ] Role-based access control
- [ ] Permission middleware
- [ ] Comprehensive audit logging
- [ ] Data lineage tracking (basic)
- [ ] Frontend: Permission management UI

**Week 32-34: Performance & Optimization**
- [ ] Query caching optimization
- [ ] Database indexing
- [ ] Frontend code splitting
- [ ] Image optimization
- [ ] Load testing (Locust)

**Week 35-36: Production Readiness**
- [ ] Kubernetes deployment manifests
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Error tracking (Sentry)
- [ ] Documentation
- [ ] User onboarding flow
- [ ] Beta testing with 5-10 users

**Deliverables (Month 9):**
- ✅ Collaboration features (sharing, comments)
- ✅ Real-time updates (WebSocket)
- ✅ Advanced RBAC + audit logging
- ✅ Production-ready deployment
- ✅ Documentation + onboarding
- ✅ Beta program launched

---

## Technical Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15 (App Router) | Modern React framework, RSC, streaming |
| **UI Components** | shadcn/ui + Radix UI | Accessible, customizable, beautiful |
| **Styling** | Tailwind CSS | Utility-first, fast development |
| **State Management** | Zustand + Tanstack Query | Simple, powerful, great DX |
| **Visualization** | Recharts + D3.js | Declarative charts + custom viz |
| **Canvas** | React Flow | Visual data prep builder |
| **Backend API** | FastAPI (Python 3.12) | Fast, modern, async, great docs |
| **Database** | PostgreSQL 15 | Reliable, JSONB support, full-featured |
| **Cache** | Redis 7 | Fast, pub/sub, query caching |
| **ORM** | SQLAlchemy 2.0 (async) | Mature, async support, type-safe |
| **Data Engine** | Ibis + DuckDB | Multi-database abstraction + fast analytics |
| **AI Service** | wren-ai-service (keep) | Proven text-to-SQL, MoA agents |
| **Query Engine** | ibis-server (keep) | 15+ connectors, query execution |
| **Vector DB** | Qdrant (keep) | Semantic search for AI |
| **WebSocket** | FastAPI WebSocket | Built-in, reliable |
| **Queue** | Celery + Redis | Async jobs (data prep, profiling) |
| **Testing** | Pytest + Playwright | Backend + E2E testing |

---

## Team Structure

### **Months 1-3** (4 people)

| Role | Responsibilities | Allocation |
|------|-----------------|------------|
| **Tech Lead** (full-stack) | Architecture, backend API, integration with Wren | 100% |
| **Backend Engineer** | FastAPI services, database, authentication | 100% |
| **Frontend Engineer** | Next.js, shadcn/ui, workspace UI | 100% |
| **Product Designer** | UI/UX, design system, user flows | 100% |

### **Months 4-6** (6 people)

| Role | Responsibilities | Allocation |
|------|-----------------|------------|
| **Tech Lead** | Data prep service, federation, AI integration | 100% |
| **Backend Engineer #1** | Data prep API, Ibis integration | 100% |
| **Backend Engineer #2** | AI dashboard generation, profiling | 100% |
| **Frontend Engineer** | Visual data prep UI, AI dashboard UI | 100% |
| **AI/ML Engineer** | Extend wren-ai-service, prompt engineering | 100% |
| **Product Designer** | Data prep UX, dashboard generation flows | 100% |

### **Months 7-9** (6 people)

| Role | Responsibilities | Allocation |
|------|-----------------|------------|
| **Tech Lead** | Performance optimization, production prep | 100% |
| **Backend Engineer #1** | Collaboration features, WebSocket | 100% |
| **Backend Engineer #2** | RBAC, audit logging, security | 100% |
| **Frontend Engineer** | Real-time features, collaboration UI | 100% |
| **DevOps Engineer** | Kubernetes, monitoring, CI/CD | 100% |
| **QA Engineer** | Testing, automation, beta coordination | 100% |

---

## Budget Breakdown

### **Engineering** (9 months)

| Role | Rate/Month | Months | Total |
|------|-----------|--------|-------|
| Tech Lead | $15K | 9 | $135K |
| Backend Engineer #1 | $12K | 9 | $108K |
| Backend Engineer #2 | $12K | 6 | $72K |
| Frontend Engineer | $12K | 9 | $108K |
| AI/ML Engineer | $14K | 6 | $84K |
| Product Designer | $10K | 9 | $90K |
| DevOps Engineer | $12K | 3 | $36K |
| QA Engineer | $10K | 3 | $30K |
| **Subtotal** | | | **$663K** |

### **Infrastructure** (9 months)

| Service | Cost/Month | Months | Total |
|---------|-----------|--------|-------|
| AWS/GCP (compute + storage) | $2,500 | 9 | $22.5K |
| LLM costs (dev/testing) | $1,500 | 9 | $13.5K |
| Tools (GitHub, Figma, Linear) | $500 | 9 | $4.5K |
| **Subtotal** | | | **$40.5K** |

### **Other**

| Item | Cost |
|------|------|
| Legal (incorporation, contracts) | $10K |
| Accounting | $5K |
| Marketing (domain, branding) | $5K |
| Contingency (10%) | $70K |
| **Subtotal** | **$90K** |

### **GRAND TOTAL: $793.5K** (9 months)

**Adjusted to your original estimate:** ~$800K - $1M ✅

---

## Risk Mitigation

### **Technical Risks**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Wren AI integration issues | High | Low | Wren is stable, well-documented, we control the codebase |
| Cross-database performance | Medium | Medium | Use DuckDB for fast in-memory joins, aggressive caching |
| Scaling issues | Medium | Low | Start with proven stack (FastAPI, PostgreSQL, Redis) |
| LLM costs too high | Medium | Medium | Support multiple providers, optimize prompts, cache aggressively |

### **Business Risks**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Market too competitive | High | Medium | Focus on niche (conversational + multi-DB), launch fast |
| Customer adoption slow | High | Medium | Beta with 5-10 design partners before launch |
| Funding runs out | Critical | Low | $800K gives 9 months + buffer, raise seed early |
| Feature creep | Medium | High | Stick to TIER 1 features only, defer everything else |

### **Execution Risks**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Key engineer leaves | High | Medium | Document everything, pair programming, cross-training |
| Timeline slips | Medium | Medium | Bi-weekly sprints, cut TIER 2 features if needed |
| Quality issues | Medium | Medium | Automated testing, CI/CD, beta program |

---

## Success Metrics

### **Technical Metrics (Month 9)**

- ✅ Support 5+ database types
- ✅ 90%+ text-to-SQL accuracy (inherit from Wren)
- ✅ Dashboard load time: <2 seconds
- ✅ Query execution: <5s (simple), <30s (complex)
- ✅ 100+ concurrent users per instance
- ✅ 99.9% uptime
- ✅ Test coverage: >80%

### **Product Metrics (Month 12)**

- ✅ 50+ beta users actively using the platform
- ✅ 500+ dashboards created
- ✅ 10,000+ queries executed
- ✅ 90%+ user satisfaction (NPS 50+)
- ✅ 5+ design partners willing to pay

### **Business Metrics (Month 18)**

- ✅ $10K MRR (10 paying customers @ $1K/month)
- ✅ <5% churn
- ✅ 20% month-over-month growth
- ✅ Seed funding raised ($500K - $1M)

---

## Go-to-Market Strategy

### **Phase 1: Beta (Months 7-9)**

**Target:** 10-15 design partners

**Profile:**
- Mid-market companies (50-500 employees)
- Multiple data sources (2-5 databases)
- Non-technical teams (marketing, sales, ops)
- Currently using Tableau/Metabase/Mode

**Outreach:**
- Personal network
- LinkedIn outreach
- Product Hunt "coming soon"
- Reddit (r/datascience, r/businessintelligence)

**Offer:**
- Free during beta
- White-glove onboarding
- Direct access to founders
- Shape the product roadmap

### **Phase 2: Launch (Months 10-12)**

**Pricing:**
- **Starter:** $99/month (5 users, 2 data sources)
- **Pro:** $499/month (25 users, unlimited sources)
- **Enterprise:** Custom (SSO, SLA, support)

**Channels:**
- Product Hunt launch
- HackerNews "Show HN"
- LinkedIn/Twitter content
- SEO content (comparison pages)
- Integration marketplace (if budget allows)

### **Phase 3: Growth (Months 13-18)**

**Focus:**
- Add 20-30 customers per quarter
- Build case studies
- Referral program
- Enterprise sales motion
- Series A fundraising

---

## Competitive Positioning

### **Messaging**

**Tagline:** "Conversational Business Intelligence for Modern Teams"

**Value Props:**
1. **10x faster insights:** Ask questions, get dashboards—no SQL required
2. **Multi-source analytics:** Query across databases like they're one
3. **Visual data prep:** Tableau's power, ChatGPT's simplicity
4. **Modern collaboration:** Real-time, multiplayer analytics

### **Comparison Table**

| Feature | DataAsk | Tableau | Wren | Metabase | Mode |
|---------|---------|---------|------|----------|------|
| Conversational AI | ✅ Best-in-class | ❌ | ✅ Good | ❌ | ❌ |
| Multi-DB Federation | ✅ Native | ⚠️ Complex | ❌ | ⚠️ Limited | ⚠️ Limited |
| Visual Data Prep | ✅ AI-assisted | ✅ Full | ❌ | ❌ | ⚠️ Limited |
| Multi-Dashboard | ✅ Unlimited | ✅ | ❌ Single | ✅ | ✅ |
| Collaboration | ✅ Real-time | ⚠️ Basic | ❌ | ⚠️ Basic | ✅ Good |
| Pricing | $$ Affordable | $$$$ Expensive | $ Open source | $ Affordable | $$ Mid-range |
| Ease of Use | ✅ Zero-code | ❌ Steep curve | ⚠️ Some SQL | ✅ Easy | ❌ Code-first |

---

## Next Steps

### **Immediate (This Week)**

1. **Validate with 5 potential customers**
   - Schedule 30-min interviews
   - Ask about current BI pain points
   - Show mockups of conversational + data prep UI
   - Gauge willingness to pay

2. **Decide: Build POC or raise first?**
   - **Option A:** Build 2-week POC, then raise $500K seed
   - **Option B:** Raise $500K on vision/mockups, then build

3. **If building POC:**
   - Set up FastAPI + Next.js project structure
   - Connect to wren-ai-service
   - Demo: Multi-DB conversational query → dashboard
   - Timeline: 2-3 weeks

### **Month 1**

1. **Finalize tech stack & architecture**
2. **Set up development environment**
3. **Start Phase 1 development**
4. **Weekly progress updates**

### **Month 3**

1. **Internal demo of MVP**
2. **Recruit 5 beta users**
3. **Begin Phase 2 development**

### **Month 6**

1. **Private beta launch (10-15 users)**
2. **Gather feedback, iterate**
3. **Begin Phase 3 development**

### **Month 9**

1. **Public beta launch**
2. **Product Hunt launch**
3. **Start fundraising (if needed)**

### **Month 12**

1. **First paying customers**
2. **Begin Phase 2 roadmap (enterprise features)**

---

## Conclusion

Your 100-page spec is **visionary and comprehensive**, but trying to build it all at once is **high-risk and expensive** ($15M, 3-5 years).

This implementation plan takes the **best 10 features** from your spec and delivers them in **9 months for $800K**.

**Key decisions:**
- ✅ **Keep Wren's AI** (proven, saves $800K)
- ✅ **Python backend** (fast development, great ecosystem)
- ✅ **Modern frontend** (competitive UX)
- ✅ **Focus on differentiation** (multi-DB + visual prep + conversational)

**This is:**
- ✅ **Realistic:** 9 months, not 3 years
- ✅ **Fundable:** $500K - $1M seed round
- ✅ **Competitive:** Beats legacy tools on AI + UX
- ✅ **Scalable:** Can add Phase 2 features after PMF

---

**Ready to build the POC?**

I can create:
1. FastAPI project structure
2. Next.js 15 + shadcn/ui starter
3. Docker Compose setup
4. Database migrations
5. Integration with wren-ai-service

**Timeline:** 2-3 days to set up, 2-3 weeks to working demo

**Let's ship it! 🚀**
