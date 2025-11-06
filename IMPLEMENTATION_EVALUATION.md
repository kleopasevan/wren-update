# DataAsk Implementation Evaluation
**Evaluation Date:** 2025-11-06
**Spec Version:** 1.0
**Implementation Branch:** claude/wren-code-work-011CUquCttBM3F1mNbsjxfSu

## Executive Summary

The current DataAsk implementation has made strong progress on **Phase 1 & Phase 2 features** (dashboards, queries, scheduling) but is **missing critical Phase 1 foundation features** from Section 4 of the spec: **Data Source Creation & Management**.

Your observation is correct - there's no "editable data source" capability. The current implementation treats connections as simple credential stores, not as prepared, reusable datasets with transformations.

---

## 1. Implementation Status by Spec Section

### ✅ **Fully Implemented**

#### 2.1 Unified Analytics Workspace (Partial)
- ✅ Centralized workspace concept
- ✅ Basic data catalog (connections, dashboards, queries)
- ✅ Version control via Git integration
- ❌ No unified search
- ❌ No context-aware recommendations
- ❌ No real-time collaboration

#### 2.3 Zero-Code Analytics (Partial)
- ✅ Visual query builder (columns, filters, joins, group by)
- ✅ Dashboard creation without code
- ✅ Drag-and-drop widget placement
- ❌ No visual data transformation builder
- ❌ No formula generation from NL

#### 3.1 Universal Data Connectors (Partial)
**Backend Support (via Ibis):**
- ✅ PostgreSQL, MySQL, BigQuery, Snowflake, DuckDB
- ✅ Connection testing and schema inspection
- ✅ Table/column metadata retrieval
- ✅ Preview data functionality
- ❌ File-based sources (CSV, Excel, JSON, Parquet) - not exposed in UI
- ❌ API integrations
- ❌ SaaS applications (Salesforce, HubSpot, etc.)

#### 6.1 Natural Language Query Processing (Partial)
- ✅ Text-to-SQL via Wren AI integration
- ✅ Conversation history support
- ✅ Context-aware queries
- ❌ Only basic implementation exposed
- ❌ Multi-turn conversations not fully integrated

#### 7. Visualization & Dashboard Capabilities (Strong)
- ✅ Multiple chart types (bar, line, pie, area, table)
- ✅ Interactive dashboard builder
- ✅ Grid-based responsive layouts
- ✅ Cross-filtering between visualizations
- ✅ Parameter controls (**NEW**)
- ✅ Real-time updates
- ❌ Limited to basic chart types (no Sankey, Treemap, etc.)
- ❌ No geospatial visualizations

#### 10.2 Workflow Automation (NEW - Strong)
- ✅ Scheduled query execution (cron + interval)
- ✅ Email reports with CSV/PDF attachments
- ✅ APScheduler integration
- ✅ Status tracking and error logging
- ✅ Enable/disable functionality

#### Query History & Audit (NEW)
- ✅ Complete query execution tracking
- ✅ Performance metrics (execution time, row count)
- ✅ Error logging
- ✅ Search and filter capabilities

---

### ⚠️ **Partially Implemented**

#### 8. Mixture-of-Agents (MoA) Architecture
**Status:** Foundation exists in `wren-ai-service` but not exposed/integrated in DataAsk UI

- ⚠️ Wren AI has agent architecture (retrieval, generation, correction)
- ⚠️ Text-to-SQL endpoint exists but basic UI integration
- ❌ No Source Agent for connection health monitoring
- ❌ No Preparation Agent for data transformation
- ❌ No Schema Agent for relationship discovery
- ❌ No Visualization Agent for chart selection
- ❌ No Explainer Agent for insight generation
- ❌ No Forecast Agent
- ❌ No Governance Agent for access control

**Gap:** MoA is mostly in AI service, not integrated into DataAsk platform

#### 9. Security & Governance Framework
- ✅ JWT authentication
- ✅ Workspace-based access control
- ✅ Encrypted connection credentials
- ⚠️ Basic audit logging (query history)
- ❌ No RBAC/ABAC
- ❌ No row-level security
- ❌ No column-level security
- ❌ No data masking
- ❌ No GDPR/compliance tools

---

### ❌ **Not Implemented (Critical Gaps)**

#### **4. Data Source Creation & Management - MISSING ENTIRELY**

This is the most critical gap identified. The spec describes a comprehensive data preparation system, but **none of it exists**.

##### 4.1 Visual Data Preparation Studio ❌
**Spec Requirements:**
- Visual join builder
- Data shaping (pivot, unpivot, group by, window functions)
- Data cleansing (deduplication, missing values, outliers)
- Calculated fields with 500+ functions
- Natural language to formula conversion

**Current State:**
- ❌ No data preparation UI at all
- ❌ No saved dataset concept
- ❌ No transformation pipeline
- ❌ Connections are just credentials, not prepared data sources

**What Exists:**
- Basic query builder (select columns, filter, join) in dashboard widgets
- But these are **ephemeral** - not saved as reusable datasets
- No calculated field management
- No data cleansing tools

##### 4.2 AI-Powered Data Preparation Assistant ❌
**Spec Requirements:**
- Data type inference
- Automatic relationship detection
- Smart column mapping
- Anomaly detection
- Data quality scoring
- Automated profiling

**Current State:**
- ❌ None of this exists
- Schema metadata comes from database, no AI enhancement

##### 4.3 Governed Dataset Management ❌
**Spec Requirements:**
- Dataset certification and approval workflows
- Version control for datasets
- Data lineage tracking
- Business glossary integration
- Data quality rules
- SLA management

**Current State:**
- ❌ No dataset concept at all
- ❌ No governance workflows
- ❌ No data lineage visualization

---

#### **5. Schema Intelligence & Discovery - MISSING**

##### 5.1 Automated Schema Exploration ❌
**Spec Requirements:**
- Automatic primary/foreign key detection
- Relationship inference using statistics
- Interactive ERD visualization
- Impact analysis diagrams

**Current State:**
- ✅ Basic schema inspection (tables, columns via Ibis)
- ✅ Constraint retrieval endpoint exists
- ❌ No relationship inference
- ❌ No ERD visualization
- ❌ No impact analysis

##### 5.2 Data Profiling & Quality Assessment ❌
**Spec Requirements:**
- Column statistics (min, max, mean, median)
- Data distribution histograms
- Uniqueness and cardinality metrics
- Null value analysis
- Data quality scores

**Current State:**
- ❌ No data profiling UI
- ❌ No quality metrics
- Only basic preview (first N rows)

##### 5.3 Intelligent Join Path Recommendations ❌
**Spec Requirements:**
- Multi-hop join path discovery
- Performance-optimized path selection
- Cost-based optimization

**Current State:**
- ❌ No join recommendations
- User must manually specify joins in visual query builder

---

#### **6.2 Multi-Turn Conversation Support - LIMITED**

**Spec Requirements:**
- Context retention across sessions
- Reference resolution
- Follow-up question handling
- Conversation branching

**Current State:**
- ⚠️ Wren AI supports this via `histories` parameter
- ❌ No UI for conversational interface
- ❌ No "Ask AI" chat widget
- Only basic text-to-SQL endpoint

---

#### **10.1 Team Collaboration Tools - MISSING**

**Spec Requirements:**
- Real-time co-editing
- Inline commenting
- @mentions and notifications
- Shared workspaces
- In-app messaging

**Current State:**
- ❌ No collaboration features
- ❌ No sharing beyond workspace ownership
- ❌ No commenting

---

#### **11.3 Monitoring & Diagnostics - LIMITED**

**Spec Requirements:**
- Real-time performance metrics
- Query execution profiling
- Resource utilization tracking
- Bottleneck identification
- Anomaly detection

**Current State:**
- ✅ Query execution time tracking
- ❌ No performance dashboard
- ❌ No resource monitoring
- ❌ No diagnostics UI

---

#### **13.2 Embedding & White-labeling - NOT STARTED**

**Spec Requirements:**
- iFrame embedding
- JavaScript SDK
- React/Angular/Vue components
- Custom branding
- Domain customization

**Current State:**
- ❌ No embedding support
- ❌ No SDK
- ❌ No white-labeling

---

#### **14. Advanced Analytics - MISSING**

**Spec Requirements:**
- Statistical analysis
- Machine Learning (AutoML)
- Predictive analytics
- Prescriptive analytics
- Scenario analysis

**Current State:**
- ❌ No advanced analytics features
- ❌ No ML integration
- Only basic aggregations (sum, avg, count)

---

## 2. Architecture Gaps

### Current Architecture:
```
dataask-frontend (Next.js)
    ↓
dataask-backend (FastAPI)
    ↓
ibis-server (Query Execution) + wren-ai-service (Text-to-SQL)
    ↓
Databases (Postgres, MySQL, BigQuery, etc.)
```

### Missing Layers:

1. **No Data Preparation Layer**
   - Spec expects a transformation engine
   - Should persist prepared datasets
   - Should track lineage

2. **No Semantic Layer Integration**
   - Wren Engine (MDL) exists but not used
   - No model deployment workflow
   - No business logic encoding

3. **No MoA Orchestration Layer**
   - Agents exist in AI service but not exposed
   - No agent collaboration in DataAsk
   - No multi-agent orchestration

4. **No Caching Layer**
   - Spec requires query result caching
   - No Redis integration for results
   - No materialized views

5. **No Event Streaming**
   - Spec mentions Kafka
   - No real-time updates (WebSocket exists but not used)
   - No event-driven workflows

---

## 3. Data Model Gaps

### Current Models:
```
User
Workspace
Connection (just credentials)
Dashboard
SavedQuery
QueryHistory
ScheduledQuery
```

### Missing Models:

1. **Dataset/DataSource** ⚠️ **CRITICAL**
   - Prepared, reusable data sources
   - Transformation definitions
   - Calculated fields
   - Data quality rules
   - Certification status
   - Version history

2. **Transformation**
   - Join definitions
   - Filter rules
   - Aggregations
   - Calculated columns
   - Data cleansing steps

3. **DataLineage**
   - Source → Transformation → Dataset → Dashboard
   - Impact analysis
   - Dependency tracking

4. **DataQualityRule**
   - Validation rules
   - Quality scores
   - Alerts

5. **BusinessGlossary**
   - Terms and definitions
   - Data dictionary
   - Semantic metadata

6. **Conversation**
   - Chat sessions
   - Message history
   - Context retention

7. **Collaboration**
   - Comments
   - Annotations
   - Shares
   - Notifications

---

## 4. Feature Comparison Matrix

| Feature Category | Spec Priority | Implementation Status | Completeness |
|-----------------|---------------|----------------------|--------------|
| **Data Connectivity** | P0 | Partial | 40% |
| **Data Preparation** | P0 | ❌ Missing | 0% |
| **Schema Intelligence** | P1 | Minimal | 15% |
| **Conversational AI** | P0 | Basic | 25% |
| **Visualizations** | P0 | Good | 70% |
| **Dashboards** | P0 | Good | 75% |
| **Parameters** | P1 | ✅ Complete | 100% |
| **Scheduled Queries** | P2 | ✅ Complete | 100% |
| **Query History** | P2 | ✅ Complete | 100% |
| **MoA Architecture** | P0 | Not Integrated | 10% |
| **Security & Governance** | P0 | Basic | 30% |
| **Collaboration** | P1 | ❌ Missing | 0% |
| **Advanced Analytics** | P2 | ❌ Missing | 0% |
| **Monitoring** | P1 | Minimal | 20% |
| **APIs & Embedding** | P2 | Basic API | 30% |

**Overall Completeness: ~35%**

---

## 5. Critical Missing Features (Must-Have for MVP)

### Priority 0 - Foundation

1. **Data Source/Dataset Management** 🔴 **CRITICAL**
   - Create reusable datasets from connections
   - Visual transformation builder
   - Save and version datasets
   - Data lineage tracking
   - **Impact:** Without this, users can't prepare and reuse data

2. **Calculated Fields** 🔴 **CRITICAL**
   - Define custom columns with formulas
   - Support 100+ functions
   - Reference other calculated fields
   - **Impact:** Required for business logic

3. **Schema Relationship Visualization** 🟡 **HIGH**
   - ERD diagram viewer
   - Show foreign key relationships
   - Join path suggestions
   - **Impact:** Users need to understand data structure

4. **Data Profiling** 🟡 **HIGH**
   - Basic statistics (min, max, avg, count)
   - Null value percentages
   - Cardinality metrics
   - **Impact:** Data quality understanding

5. **Conversational AI Interface** 🟡 **HIGH**
   - Chat widget in workspace
   - Multi-turn conversations
   - "Ask a question" functionality
   - **Impact:** Core value proposition

6. **Semantic Layer Integration (MDL)** 🟡 **HIGH**
   - Deploy models to Wren Engine
   - Use MDL in text-to-SQL
   - Model versioning
   - **Impact:** Required for accurate AI queries

### Priority 1 - Enterprise

7. **Row-Level Security** 🟠 **MEDIUM**
   - Filter data by user attributes
   - Dynamic access control
   - **Impact:** Enterprise requirement

8. **Data Masking** 🟠 **MEDIUM**
   - Hide sensitive columns
   - PII protection
   - **Impact:** Compliance requirement

9. **Team Collaboration** 🟠 **MEDIUM**
   - Share dashboards/datasets
   - Comments and annotations
   - **Impact:** Team productivity

10. **Performance Monitoring** 🟠 **MEDIUM**
    - Query performance dashboard
    - Slow query alerts
    - **Impact:** Operational excellence

---

## 6. Recommendations

### Phase 1: Foundation (Next 4-6 weeks)

**Focus:** Implement missing P0 features

#### Week 1-2: Dataset Management
- [ ] Create `Dataset` model (name, description, connection_id, transformation_definition, created_by, certified)
- [ ] Create dataset CRUD API
- [ ] Build UI for creating datasets from connections
- [ ] Implement basic transformations: select columns, filters, joins
- [ ] Allow saving datasets for reuse

#### Week 3-4: Calculated Fields & Data Prep
- [ ] Add `calculated_fields` JSONB to Dataset model
- [ ] Create formula builder UI with function library
- [ ] Implement 50+ common functions (string, date, math, aggregate)
- [ ] Add data type validation
- [ ] Show calculated fields in schema explorer

#### Week 5-6: Schema Intelligence & Lineage
- [ ] Implement FK detection using constraint queries
- [ ] Build ERD visualization component (D3.js or React Flow)
- [ ] Create data lineage graph (Dataset → Dashboard → Query)
- [ ] Add basic data profiling (statistics, null %, cardinality)
- [ ] Impact analysis: "What uses this dataset?"

**Deliverable:** Users can create, transform, and reuse datasets with calculated fields and lineage tracking.

---

### Phase 2: AI Integration (Weeks 7-10)

#### Week 7-8: Conversational Interface
- [ ] Create chat widget component
- [ ] Implement conversation storage (Conversation, Message models)
- [ ] Connect to Wren AI text-to-SQL with history
- [ ] Add "Ask a question" to every dashboard
- [ ] Support follow-up questions with context

#### Week 9-10: Semantic Layer (MDL)
- [ ] Implement MDL generation from Dataset definitions
- [ ] Create deploy workflow (Dataset → MDL → Wren Engine)
- [ ] Store deployment metadata (mdl_hash, deployed_at)
- [ ] Use deployed MDL in text-to-SQL queries
- [ ] Show MDL diff on re-deploy

**Deliverable:** Full conversational analytics with context-aware AI.

---

### Phase 3: Enterprise Features (Weeks 11-16)

#### Week 11-12: Governance
- [ ] Implement RBAC (roles: Owner, Editor, Viewer)
- [ ] Add row-level security rules to datasets
- [ ] Implement data masking for sensitive columns
- [ ] Add dataset certification workflow
- [ ] Create audit log viewer

#### Week 13-14: Advanced Data Prep
- [ ] Add pivot/unpivot transformations
- [ ] Implement data cleansing (deduplication, fill nulls)
- [ ] Add window functions (rank, lag, lead)
- [ ] Create transformation templates
- [ ] AI-suggested joins and transformations

#### Week 15-16: Collaboration & Monitoring
- [ ] Add sharing with users/teams
- [ ] Implement comments on dashboards/datasets
- [ ] Create performance monitoring dashboard
- [ ] Add slow query alerts
- [ ] Implement query cost estimation

**Deliverable:** Enterprise-grade platform with governance and collaboration.

---

### Phase 4: Advanced Analytics (Weeks 17-24)

- [ ] Integrate statistical analysis library
- [ ] Add forecasting capabilities (time series)
- [ ] Implement AutoML for predictions
- [ ] Create scenario analysis tools
- [ ] Build recommendation engine

---

## 7. Technical Debt & Refactoring Needs

### Backend

1. **Service Layer Cleanup**
   - ConnectionService is doing too much
   - Need separate: DatasetService, TransformationService, ProfilingService

2. **Better Error Handling**
   - Standardize error responses
   - Add error codes
   - Better validation messages

3. **Caching**
   - Add Redis for query result caching
   - Implement schema metadata caching
   - Cache AI responses

4. **Testing**
   - Need unit tests for services
   - Integration tests for API endpoints
   - E2E tests for critical workflows

### Frontend

1. **State Management**
   - Consider Zustand or Redux for complex state
   - Current Context API approach getting messy
   - Too many useState hooks

2. **Component Library**
   - Need more reusable components
   - Better form handling
   - Standardize loading/error states

3. **Performance**
   - Virtualization for large tables
   - Lazy loading for charts
   - Debounce search inputs

4. **Accessibility**
   - WCAG 2.1 compliance audit
   - Keyboard navigation improvements
   - Screen reader testing

---

## 8. Alignment with Product Spec Roadmap

### Your Spec Phase 1 (Months 1-3): Foundation
**Status:** 40% Complete

- ✅ Basic connector framework
- ✅ Schema discovery engine
- ✅ Simple NL-to-SQL translation
- ✅ Basic visualization engine
- ✅ User authentication
- ❌ **Missing:** Data preparation studio
- ❌ **Missing:** MoA framework integration

### Your Spec Phase 2 (Months 4-7): Enhancement
**Status:** 30% Complete

- ✅ Extended connectors (via Ibis)
- ❌ **Missing:** Data preparation studio
- ❌ **Missing:** Advanced MoA agents
- ✅ Collaboration features (basic)
- ⚠️ Enhanced security (partial)
- ✅ Performance optimization (query history tracking)

### Your Spec Phase 3 (Months 8-12): Enterprise
**Status:** 15% Complete

- ❌ **Missing:** Full governance framework
- ❌ **Missing:** Advanced analytics
- ❌ **Missing:** Complete MoA implementation
- ❌ **Missing:** White-labeling support
- ✅ API framework (REST API exists)
- ❌ **Missing:** Compliance tools

### Your Spec Phase 4 (Months 13-18): Scale & Optimize
**Status:** Not Started (0%)

---

## 9. What's Working Well

### Strengths:

1. **Dashboard & Visualization** 🎯
   - Clean, modern UI
   - Good chart variety
   - Parameter controls are excellent
   - Responsive design

2. **Scheduled Queries** 🎯
   - Robust implementation
   - APScheduler integration solid
   - Email reports work well
   - Good error handling

3. **Query History & Audit** 🎯
   - Complete tracking
   - Good search/filter
   - Performance metrics captured

4. **Architecture Foundation** 🎯
   - Clean separation (UI → Backend → Ibis/AI)
   - FastAPI + SQLAlchemy solid
   - Next.js App Router modern
   - Poetry dependency management good

5. **Security Basics** 🎯
   - JWT auth works
   - Encrypted connection credentials
   - Workspace isolation

---

## 10. Answer to Your Question: "I don't see the editable data source"

### You're Absolutely Right ❌

**What the spec describes (Section 4):**
> "Visual Data Preparation Studio: A comprehensive, no-code environment for creating, transforming, and managing **reusable data sources** with AI assistance at every step."

**What currently exists:**
- `Connection` model = just database credentials
- No transformation pipeline
- No calculated fields
- No saved datasets
- Query builder in dashboards = ephemeral, not reusable

**What's missing:**

| Spec Feature | Current State |
|-------------|---------------|
| Visual join builder | ❌ No persistent joins |
| Calculated fields | ❌ No formula management |
| Data cleansing | ❌ No cleansing tools |
| Pivot/unpivot | ❌ Not available |
| Save as dataset | ❌ No dataset concept |
| AI-suggested transforms | ❌ No AI assistance |
| Data quality scoring | ❌ No profiling |
| Dataset certification | ❌ No governance |
| Version control for datasets | ❌ No versioning |

**Why this is critical:**

Without editable data sources, users must:
1. Write SQL for every query
2. Rebuild transformations in each dashboard
3. Cannot share prepared datasets
4. Cannot enforce data quality
5. Cannot track lineage

This is **the core missing piece** that makes the platform feel incomplete compared to the spec.

---

## 11. Immediate Action Plan

### This Week:
1. **Design Dataset Model**
   - Schema design (dataset table with transformations)
   - API endpoints design
   - UI mockups

2. **Prototype Data Preparation UI**
   - Simple dataset creation flow
   - Select tables → Join → Select columns → Save
   - Preview results

3. **Spike on Transformation Storage**
   - How to store transformation definitions (JSONB? Separate tables?)
   - How to execute transformations (Ibis? Custom engine?)
   - How to generate SQL from transformations

### Next 2 Weeks:
1. Implement Dataset CRUD
2. Build basic transformation UI
3. Add calculated fields support
4. Connect datasets to dashboards

---

## 12. Final Assessment

### Overall Grade: **C+ (35% Complete)**

**Strengths:**
- Dashboard and visualization capabilities are strong (B+)
- Scheduled queries well implemented (A)
- Query history complete (A)
- Architecture foundation solid (B+)

**Critical Gaps:**
- **Data Preparation (F)** - Not implemented at all
- **Schema Intelligence (D)** - Minimal
- **Conversational AI (D+)** - Backend exists, no UI
- **Governance (D)** - Basic only
- **Collaboration (F)** - Not implemented

**Biggest Risk:**
Without data source/dataset management (Section 4 of spec), the platform is **not MVP-ready**. Users cannot prepare and reuse data, which is foundational to the product vision.

**Recommendation:**
**Pause feature development** and focus next 6 weeks on:
1. Dataset management (create, edit, version, share)
2. Calculated fields and transformations
3. Data lineage tracking
4. Conversational AI UI integration
5. Schema relationship visualization

These are the missing foundation pieces that make DataAsk feel like a "BI tool" vs. the "AI-native analytics platform" described in your spec.

---

## Appendix: Feature Checklist

### Section 2: Core Platform
- ✅ Unified workspace concept
- ✅ Dashboard builder
- ⚠️ AI-native architecture (AI exists, not integrated)
- ✅ Zero-code visualizations
- ❌ Zero-code transformations

### Section 3: Data Connectivity
- ✅ 10+ connectors (via Ibis)
- ✅ Schema inspection
- ❌ File sources (CSV, Excel, JSON)
- ❌ API integrations
- ❌ SaaS connectors

### Section 4: Data Source Management ⚠️ **CRITICAL GAP**
- ❌ Visual data preparation
- ❌ Join operations UI
- ❌ Data cleansing
- ❌ Calculated fields
- ❌ AI preparation assistant
- ❌ Dataset governance

### Section 5: Schema Intelligence
- ✅ Basic schema discovery
- ❌ Relationship inference
- ❌ ERD visualization
- ❌ Data profiling
- ❌ Join path recommendations

### Section 6: Conversational Analytics
- ✅ Text-to-SQL endpoint
- ❌ Multi-turn UI
- ❌ Chat widget
- ❌ Insight explanations

### Section 7: Visualizations
- ✅ 8 chart types
- ✅ Interactive dashboards
- ✅ Cross-filtering
- ✅ Parameter controls
- ❌ Advanced charts (Sankey, Treemap)
- ❌ Geospatial

### Section 8: MoA Architecture
- ⚠️ Wren AI has agents
- ❌ Not integrated into DataAsk
- ❌ No agent orchestration UI

### Section 9: Security & Governance
- ✅ JWT authentication
- ✅ Workspace isolation
- ❌ RBAC
- ❌ Row-level security
- ❌ Data masking
- ❌ Compliance tools

### Section 10: Collaboration
- ❌ Real-time co-editing
- ❌ Comments
- ❌ Sharing
- ✅ Scheduled reports

### Section 11: Performance
- ✅ Query tracking
- ❌ Query optimization
- ❌ Caching
- ❌ Monitoring dashboard

### Section 12: User Experience
- ✅ Modern UI
- ✅ Responsive design
- ⚠️ Limited accessibility
- ❌ Voice input

### Section 13: APIs
- ✅ REST API
- ❌ GraphQL
- ❌ Embedding SDK
- ❌ White-labeling

### Section 14: Advanced Analytics
- ❌ Statistical analysis
- ❌ ML/AutoML
- ❌ Forecasting
- ❌ Prescriptive analytics

---

## Conclusion

Your product spec is ambitious and comprehensive. The current implementation has done excellent work on **dashboards, scheduling, and query management**, but is **missing the foundational data preparation layer** (Section 4) that makes the platform truly differentiate from competitors.

**Key Next Steps:**
1. Implement Dataset/DataSource model and management
2. Build visual transformation UI
3. Add calculated fields
4. Integrate conversational AI with chat UI
5. Add schema intelligence (ERD, profiling)

With these 5 features, you'll have a solid MVP that aligns with your vision of an "AI-native analytics platform" rather than "another BI tool."

**Timeline Estimate:**
- Foundation features (Dataset + Calc Fields + Lineage): 6 weeks
- AI Integration (Chat UI + MDL): 4 weeks
- Enterprise features (Governance + Collaboration): 6 weeks
- **Total to MVP:** ~4 months from current state

This aligns with your original Phase 1-2 roadmap (months 1-7), assuming you focus on the critical gaps first.
