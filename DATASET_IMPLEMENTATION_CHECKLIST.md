# Dataset/Data Source Management - Implementation Checklist

**Feature:** Editable, reusable data sources with transformations and calculated fields
**Priority:** P0 - Critical Gap
**Estimated Time:** 6 weeks (split into 3 phases)
**Status:** Not Started

---

## Overview

This checklist implements Section 4 of the product spec: **Data Source Creation & Management**. Users will be able to:
- Create reusable datasets from database connections
- Define transformations (joins, filters, aggregations)
- Add calculated fields with formulas
- Preview and validate data
- Share and version datasets
- Track data lineage

---

## Phase 1: Foundation - Dataset Model & Basic CRUD (Week 1-2)

### Backend - Database Model

- [ ] **1.1** Create `Dataset` model in `dataask-backend/app/models/dataset.py`
  - [ ] Fields: `id`, `workspace_id`, `name`, `description`, `connection_id`
  - [ ] Fields: `source_type` (enum: 'table', 'query', 'join')
  - [ ] Fields: `source_config` (JSONB - stores table name or query definition)
  - [ ] Fields: `transformation_config` (JSONB - stores joins, filters, aggregations)
  - [ ] Fields: `calculated_fields` (JSONB - array of field definitions)
  - [ ] Fields: `settings` (JSONB - limit, caching, etc.)
  - [ ] Fields: `status` (enum: 'draft', 'active', 'archived')
  - [ ] Fields: `certified` (boolean), `certified_by`, `certified_at`
  - [ ] Fields: `tags` (ARRAY of strings)
  - [ ] Fields: `created_at`, `updated_at`, `created_by`
  - [ ] Add foreign keys with cascade deletes
  - [ ] Add indexes: workspace_id, connection_id, status, created_by
  - [ ] Add `__repr__` method

- [ ] **1.2** Create migration `20250106_007_add_datasets.py`
  - [ ] Create datasets table with all columns
  - [ ] Create indexes
  - [ ] Add foreign key constraints
  - [ ] Test migration up/down

- [ ] **1.3** Run migration locally
  ```bash
  cd dataask-backend
  poetry shell
  alembic upgrade head
  ```

### Backend - Pydantic Schemas

- [ ] **1.4** Create `dataask-backend/app/schemas/dataset.py`
  - [ ] `SourceConfig` schema (table_name OR query OR join_config)
  - [ ] `JoinDefinition` schema (table, join_type, on_conditions)
  - [ ] `FilterDefinition` schema (column, operator, value)
  - [ ] `AggregationDefinition` schema (function, column, alias)
  - [ ] `TransformationConfig` schema (joins, filters, group_by, order_by)
  - [ ] `CalculatedField` schema (name, expression, data_type, description)
  - [ ] `DatasetSettings` schema (limit, cache_ttl, refresh_schedule)
  - [ ] `DatasetBase` schema (name, description, connection_id, source_type, source_config)
  - [ ] `DatasetCreate` schema (extends DatasetBase + workspace_id)
  - [ ] `DatasetUpdate` schema (all optional fields)
  - [ ] `DatasetResponse` schema (includes id, timestamps, created_by info)
  - [ ] Add validators for source_type-specific requirements

### Backend - Service Layer

- [ ] **1.5** Create `dataask-backend/app/services/dataset_service.py`
  - [ ] `DatasetService` class with `__init__(db: AsyncSession)`
  - [ ] `async def list_datasets(workspace_id, status=None, tags=None)`
  - [ ] `async def get_dataset(dataset_id, workspace_id)`
  - [ ] `async def create_dataset(dataset_data: DatasetCreate, user_id)`
  - [ ] `async def update_dataset(dataset_id, workspace_id, dataset_data: DatasetUpdate)`
  - [ ] `async def delete_dataset(dataset_id, workspace_id)`
  - [ ] `async def preview_dataset(dataset_id, workspace_id, limit=100)` - generates SQL and executes
  - [ ] `async def get_dataset_columns(dataset_id, workspace_id)` - returns schema
  - [ ] Add error handling (not found, permission denied)
  - [ ] Add validation (connection exists, valid transformations)

- [ ] **1.6** Create `dataask-backend/app/services/transformation_builder.py`
  - [ ] `class TransformationBuilder` - converts transformation_config to SQL
  - [ ] `def build_select_clause(columns, calculated_fields)` - generates SELECT
  - [ ] `def build_from_clause(source_config)` - generates FROM
  - [ ] `def build_join_clause(joins)` - generates JOINs
  - [ ] `def build_where_clause(filters)` - generates WHERE
  - [ ] `def build_group_by_clause(group_by)` - generates GROUP BY
  - [ ] `def build_order_by_clause(order_by)` - generates ORDER BY
  - [ ] `def build_sql(dataset: Dataset) -> str` - combines all parts
  - [ ] Add SQL injection prevention (parameterized queries)
  - [ ] Add validation for calculated field expressions
  - [ ] Support different SQL dialects (Postgres, MySQL, BigQuery)

### Backend - API Router

- [ ] **1.7** Create `dataask-backend/app/api/routers/datasets.py`
  - [ ] Import dependencies (FastAPI, SQLAlchemy, schemas, services)
  - [ ] Create router with prefix `/workspaces/{workspace_id}/datasets`
  - [ ] `GET /` - List datasets with filters (status, tags, search)
  - [ ] `GET /{dataset_id}` - Get dataset by ID
  - [ ] `POST /` - Create new dataset
  - [ ] `PUT /{dataset_id}` - Update dataset
  - [ ] `DELETE /{dataset_id}` - Delete dataset
  - [ ] `GET /{dataset_id}/preview` - Preview dataset data
  - [ ] `GET /{dataset_id}/columns` - Get dataset schema
  - [ ] `GET /{dataset_id}/sql` - Get generated SQL (for debugging)
  - [ ] Add workspace permission checks
  - [ ] Add request validation
  - [ ] Add response models

- [ ] **1.8** Register router in `dataask-backend/app/main.py`
  - [ ] Import datasets router
  - [ ] Add `app.include_router(datasets.router, prefix="/api/v1", tags=["datasets"])`
  - [ ] Test startup

### Backend - Testing

- [ ] **1.9** Manual API testing
  - [ ] Start backend: `poetry run uvicorn app.main:app --reload`
  - [ ] Open http://localhost:8000/docs
  - [ ] Test create dataset with table source
  - [ ] Test list datasets
  - [ ] Test get dataset
  - [ ] Test preview dataset
  - [ ] Test update dataset
  - [ ] Test delete dataset
  - [ ] Verify SQL generation in `/sql` endpoint

### Frontend - API Client

- [ ] **1.10** Create `dataask-frontend/lib/api/datasets.ts`
  - [ ] Import axios and types
  - [ ] Define `SourceConfig` type
  - [ ] Define `TransformationConfig` type
  - [ ] Define `CalculatedField` type
  - [ ] Define `Dataset` interface
  - [ ] Define `DatasetCreate` interface
  - [ ] Define `DatasetUpdate` interface
  - [ ] `export const datasetsApi = { ... }`
  - [ ] `async list(workspaceId, filters?)` - GET with query params
  - [ ] `async get(workspaceId, datasetId)` - GET by ID
  - [ ] `async create(workspaceId, data)` - POST
  - [ ] `async update(workspaceId, datasetId, data)` - PUT
  - [ ] `async delete(workspaceId, datasetId)` - DELETE
  - [ ] `async preview(workspaceId, datasetId, limit?)` - GET preview
  - [ ] `async getColumns(workspaceId, datasetId)` - GET columns
  - [ ] `async getSql(workspaceId, datasetId)` - GET SQL
  - [ ] Add error handling and TypeScript types

### Frontend - List Page

- [ ] **1.11** Create `dataask-frontend/app/workspaces/[id]/datasets/page.tsx`
  - [ ] Use client component (`'use client'`)
  - [ ] Import dependencies (React, Next, UI components, API client)
  - [ ] Fetch datasets on mount
  - [ ] Display loading state with skeleton
  - [ ] Display error state with message
  - [ ] Create grid layout with dataset cards
  - [ ] Show dataset info: name, description, connection name, status
  - [ ] Show tags as badges
  - [ ] Show certified badge if certified
  - [ ] Show created by and timestamp
  - [ ] Add "Create Dataset" button
  - [ ] Add dropdown menu per dataset: View, Edit, Duplicate, Delete
  - [ ] Add search input (filters by name/description)
  - [ ] Add filter by status dropdown
  - [ ] Add filter by tags multiselect
  - [ ] Implement client-side filtering
  - [ ] Add empty state: "No datasets yet. Create your first dataset!"
  - [ ] Add click handler to navigate to dataset detail page

- [ ] **1.12** Update workspace navigation to include Datasets tab
  - [ ] Edit `dataask-frontend/app/workspaces/[id]/page.tsx`
  - [ ] Add `'datasets'` to `Tab` type
  - [ ] Add Datasets tab button with Database icon
  - [ ] Add Datasets tab content section
  - [ ] Add "Manage Datasets" button that navigates to `/workspaces/{id}/datasets`
  - [ ] Add description: "Create reusable data sources with transformations"

### Frontend - Create Dataset Wizard (Basic)

- [ ] **1.13** Create `dataask-frontend/app/workspaces/[id]/datasets/create/page.tsx`
  - [ ] Create multi-step wizard with tabs: Source → Transform → Fields → Settings
  - [ ] **Step 1: Source Selection**
    - [ ] Dropdown to select connection
    - [ ] Radio buttons: Single Table / Custom Query / Join Tables
    - [ ] If "Single Table": dropdown to select table
    - [ ] If "Custom Query": SQL editor textarea
    - [ ] If "Join Tables": multiple table selectors (defer to Phase 2)
    - [ ] Preview button shows first 10 rows
  - [ ] **Step 2: Transform** (defer complex transforms to Phase 2)
    - [ ] For now: just show "Transformations will be added in next phase"
  - [ ] **Step 3: Calculated Fields** (defer to Phase 2)
    - [ ] For now: just show "Calculated fields will be added in next phase"
  - [ ] **Step 4: Settings**
    - [ ] Input: Name (required)
    - [ ] Textarea: Description
    - [ ] Input: Tags (comma-separated)
    - [ ] Checkbox: Mark as certified
    - [ ] Number input: Row limit for previews
  - [ ] Add "Back" and "Next" buttons between steps
  - [ ] Add "Save Dataset" button on final step
  - [ ] Show loading state during save
  - [ ] Navigate to dataset detail page on success
  - [ ] Show error message on failure

### Frontend - Dataset Detail/View Page

- [ ] **1.14** Create `dataask-frontend/app/workspaces/[id]/datasets/[datasetId]/page.tsx`
  - [ ] Fetch dataset and preview data on mount
  - [ ] Show loading skeleton
  - [ ] **Header Section:**
    - [ ] Display dataset name (large heading)
    - [ ] Show certified badge if applicable
    - [ ] Show status badge (draft/active/archived)
    - [ ] Show tags as chips
    - [ ] Show connection name
    - [ ] Show created by and timestamp
    - [ ] Action buttons: Edit, Duplicate, Archive, Delete
  - [ ] **Description Section:**
    - [ ] Show description text
  - [ ] **Schema Section:**
    - [ ] Fetch columns via `getColumns()` API
    - [ ] Display table with: Column Name, Data Type, Source (base/calculated)
    - [ ] Show calculated field expressions in expandable rows
  - [ ] **Preview Section:**
    - [ ] Show data table with first 100 rows
    - [ ] Add pagination controls
    - [ ] Add "Refresh" button
    - [ ] Show row count
  - [ ] **SQL Section:** (collapsible)
    - [ ] Fetch generated SQL via `getSql()` API
    - [ ] Display with syntax highlighting (use `react-syntax-highlighter`)
    - [ ] Add "Copy SQL" button
  - [ ] **Lineage Section:** (placeholder for Phase 3)
    - [ ] Show "Used by X dashboards, Y queries"
    - [ ] Show list of dependent items
  - [ ] Add breadcrumb navigation: Workspace > Datasets > [Name]

### Frontend - Edit Dataset Page

- [ ] **1.15** Create `dataask-frontend/app/workspaces/[id]/datasets/[datasetId]/edit/page.tsx`
  - [ ] Reuse wizard components from create page
  - [ ] Pre-populate form with existing dataset data
  - [ ] Fetch dataset on mount
  - [ ] Allow editing all fields
  - [ ] Show "Save Changes" button
  - [ ] Show "Cancel" button (navigates back)
  - [ ] Validate before saving
  - [ ] Update dataset via API
  - [ ] Navigate back to detail page on success

### Testing - End to End

- [ ] **1.16** Manual E2E testing
  - [ ] Create workspace
  - [ ] Create connection to test database
  - [ ] Navigate to Datasets tab
  - [ ] Click "Create Dataset"
  - [ ] Select connection
  - [ ] Select "Single Table"
  - [ ] Choose a table
  - [ ] Preview data
  - [ ] Add name, description, tags
  - [ ] Save dataset
  - [ ] Verify redirect to detail page
  - [ ] Verify data preview shows correct data
  - [ ] Verify SQL is generated correctly
  - [ ] Edit dataset (change name)
  - [ ] Verify changes saved
  - [ ] Delete dataset
  - [ ] Verify removed from list

---

## Phase 2: Transformations & Calculated Fields (Week 3-4)

### Backend - Enhanced Transformation Support

- [ ] **2.1** Enhance `TransformationBuilder` service
  - [ ] Add support for complex joins (multi-key, cross-database)
  - [ ] Add support for UNION/UNION ALL
  - [ ] Add support for window functions (RANK, ROW_NUMBER, LAG, LEAD)
  - [ ] Add support for CASE WHEN expressions
  - [ ] Add support for subqueries in filters
  - [ ] Add SQL validation before execution
  - [ ] Add query cost estimation

- [ ] **2.2** Create `dataask-backend/app/services/calculated_field_validator.py`
  - [ ] `def validate_expression(expression: str, available_columns: list) -> dict`
  - [ ] Check syntax validity
  - [ ] Check column references exist
  - [ ] Check function names are valid
  - [ ] Prevent SQL injection patterns
  - [ ] Return: `{valid: bool, error: str, dependencies: list}`

- [ ] **2.3** Create `dataask-backend/app/services/function_library.py`
  - [ ] Define function categories: String, Date, Math, Aggregate, Logical
  - [ ] **String Functions:** UPPER, LOWER, TRIM, SUBSTRING, CONCAT, LENGTH, REPLACE
  - [ ] **Date Functions:** DATE, YEAR, MONTH, DAY, DATE_ADD, DATE_DIFF, NOW
  - [ ] **Math Functions:** ROUND, FLOOR, CEIL, ABS, SQRT, POWER, MOD
  - [ ] **Aggregate Functions:** SUM, AVG, COUNT, MIN, MAX, STDDEV
  - [ ] **Logical Functions:** IF, CASE, COALESCE, NULLIF
  - [ ] Each function has: name, description, syntax, examples, parameters
  - [ ] Export as JSON for frontend consumption

- [ ] **2.4** Add API endpoint for function library
  - [ ] `GET /api/v1/functions` - returns all functions
  - [ ] `GET /api/v1/functions?category=string` - filter by category
  - [ ] Response includes function metadata for autocomplete

### Backend - Dataset Version Control

- [ ] **2.5** Create `DatasetVersion` model
  - [ ] Fields: `id`, `dataset_id`, `version_number`, `snapshot_data` (JSONB)
  - [ ] Fields: `created_at`, `created_by`, `change_description`
  - [ ] Store complete dataset configuration in snapshot_data
  - [ ] Create migration

- [ ] **2.6** Add versioning to `DatasetService`
  - [ ] `async def create_version(dataset_id, user_id, change_description)`
  - [ ] `async def list_versions(dataset_id)`
  - [ ] `async def restore_version(dataset_id, version_id)`
  - [ ] Auto-create version on every update

- [ ] **2.7** Add version API endpoints
  - [ ] `GET /datasets/{id}/versions` - list versions
  - [ ] `POST /datasets/{id}/versions/{version_id}/restore` - restore version
  - [ ] `GET /datasets/{id}/versions/{version_id}/diff` - compare with current

### Frontend - Join Builder Component

- [ ] **2.8** Create `dataask-frontend/components/datasets/JoinBuilder.tsx`
  - [ ] Visual join builder with drag-and-drop
  - [ ] Show tables as cards with column lists
  - [ ] Drag lines between columns to create joins
  - [ ] Join type selector: INNER, LEFT, RIGHT, FULL
  - [ ] Support multi-key joins (multiple ON conditions)
  - [ ] Preview join result
  - [ ] Generate join configuration JSON
  - [ ] Props: `connections`, `onChange(joins)`

### Frontend - Filter Builder Component

- [ ] **2.9** Create `dataask-frontend/components/datasets/FilterBuilder.tsx`
  - [ ] Add/remove filter rows
  - [ ] Column selector dropdown
  - [ ] Operator selector: =, !=, >, <, >=, <=, IN, NOT IN, LIKE, IS NULL
  - [ ] Value input (changes based on operator)
  - [ ] AND/OR logic between filters
  - [ ] Nested filter groups
  - [ ] Preview filtered data
  - [ ] Props: `columns`, `onChange(filters)`

### Frontend - Calculated Field Builder

- [ ] **2.10** Create `dataask-frontend/components/datasets/CalculatedFieldBuilder.tsx`
  - [ ] **Field List:** Show existing calculated fields
  - [ ] **Add Field Form:**
    - [ ] Input: Field name
    - [ ] Textarea: Expression (with syntax highlighting)
    - [ ] Dropdown: Data type (string, number, date, boolean)
    - [ ] Textarea: Description
  - [ ] **Formula Editor Features:**
    - [ ] Autocomplete for column names
    - [ ] Autocomplete for function names (from function library)
    - [ ] Function help popover (shows syntax and examples)
    - [ ] Syntax highlighting
    - [ ] Real-time validation (show errors inline)
    - [ ] Insert column button (dropdown of available columns)
    - [ ] Insert function button (dropdown with search)
  - [ ] **Validation Display:**
    - [ ] Show green checkmark if valid
    - [ ] Show red error message if invalid
    - [ ] Show dependent columns
  - [ ] **Preview:**
    - [ ] "Test Expression" button
    - [ ] Shows sample output for first 10 rows
  - [ ] Props: `columns`, `functions`, `existingFields`, `onChange(fields)`

### Frontend - Function Library Component

- [ ] **2.11** Create `dataask-frontend/components/datasets/FunctionLibrary.tsx`
  - [ ] Fetch functions from API
  - [ ] Display function categories as tabs
  - [ ] Show function list with search
  - [ ] Click function to see details
  - [ ] Show syntax, description, parameters, examples
  - [ ] "Insert Function" button copies syntax to clipboard or calls parent
  - [ ] Props: `onInsert(functionSyntax)`

### Frontend - Enhanced Create/Edit Dataset Wizard

- [ ] **2.12** Update Step 2: Transform in create/edit pages
  - [ ] Replace placeholder with real transformation UI
  - [ ] Add tabs: Joins, Filters, Aggregations
  - [ ] **Joins Tab:**
    - [ ] Show `<JoinBuilder />` component
    - [ ] Allow adding/removing joins
    - [ ] Preview join results
  - [ ] **Filters Tab:**
    - [ ] Show `<FilterBuilder />` component
    - [ ] Allow complex filter logic
    - [ ] Preview filtered data
  - [ ] **Aggregations Tab:**
    - [ ] Checkboxes for columns to group by
    - [ ] Add aggregation rows: function, column, alias
    - [ ] Preview aggregated data

- [ ] **2.13** Update Step 3: Calculated Fields in create/edit pages
  - [ ] Replace placeholder with `<CalculatedFieldBuilder />` component
  - [ ] Fetch function library on mount
  - [ ] Show existing fields (for edit mode)
  - [ ] Allow add/edit/delete calculated fields
  - [ ] Validate all fields before allowing next step
  - [ ] Show summary of fields

### Frontend - Dataset Preview Component

- [ ] **2.14** Create `dataask-frontend/components/datasets/DatasetPreview.tsx`
  - [ ] Reusable component for showing dataset data
  - [ ] Props: `workspaceId`, `datasetId` OR `previewData`
  - [ ] Fetch data if datasetId provided
  - [ ] Show loading skeleton
  - [ ] Display data table with virtualization (use `@tanstack/react-virtual`)
  - [ ] Column headers with sorting
  - [ ] Row selection checkbox (optional)
  - [ ] Show row count and data freshness
  - [ ] Pagination controls
  - [ ] Export to CSV button
  - [ ] Calculated field columns highlighted with badge

### Testing - Transformations & Calculated Fields

- [ ] **2.15** Manual testing
  - [ ] Create dataset with 2-table join
  - [ ] Add filter: `price > 100`
  - [ ] Add calculated field: `total = quantity * price`
  - [ ] Preview data, verify calculated column appears
  - [ ] Verify SQL includes calculated field
  - [ ] Save dataset
  - [ ] Edit dataset, modify calculated field
  - [ ] Verify version created
  - [ ] List versions, restore previous version
  - [ ] Verify restored correctly
  - [ ] Test complex join (3+ tables)
  - [ ] Test aggregation with GROUP BY
  - [ ] Test window functions (if supported)
  - [ ] Test invalid calculated field (shows error)

---

## Phase 3: Data Lineage, Sharing & Integration (Week 5-6)

### Backend - Data Lineage Tracking

- [ ] **3.1** Create `DataLineage` model
  - [ ] Fields: `id`, `workspace_id`, `source_type`, `source_id`
  - [ ] Fields: `target_type`, `target_id`, `relationship_type`
  - [ ] Relationship types: 'uses', 'derives_from', 'references'
  - [ ] Source/target types: 'connection', 'dataset', 'dashboard', 'query'
  - [ ] Fields: `created_at`, `created_by`
  - [ ] Create migration with indexes

- [ ] **3.2** Create `dataask-backend/app/services/lineage_service.py`
  - [ ] `async def record_lineage(source_type, source_id, target_type, target_id, relationship)`
  - [ ] `async def get_upstream_lineage(target_type, target_id)` - what it depends on
  - [ ] `async def get_downstream_lineage(source_type, source_id)` - what depends on it
  - [ ] `async def get_full_lineage_graph(entity_type, entity_id)` - complete graph
  - [ ] `async def analyze_impact(entity_type, entity_id)` - impact analysis
  - [ ] Return graph structure for visualization

- [ ] **3.3** Integrate lineage tracking
  - [ ] When dataset is created → record lineage to connection
  - [ ] When dataset references another dataset (in joins) → record lineage
  - [ ] When dashboard uses dataset → record lineage
  - [ ] When query uses dataset → record lineage
  - [ ] Auto-update lineage on changes

- [ ] **3.4** Add lineage API endpoints
  - [ ] `GET /datasets/{id}/lineage` - get dataset lineage
  - [ ] `GET /datasets/{id}/impact` - get impact analysis
  - [ ] `GET /datasets/{id}/dependencies` - get upstream dependencies
  - [ ] `GET /datasets/{id}/dependents` - get downstream dependents

### Backend - Data Profiling

- [ ] **3.5** Create `dataask-backend/app/services/profiling_service.py`
  - [ ] `async def profile_dataset(dataset_id, workspace_id) -> dict`
  - [ ] Calculate for each column:
    - [ ] Data type
    - [ ] Non-null count and null percentage
    - [ ] Unique count and cardinality
    - [ ] Min, max values
    - [ ] Mean, median (for numeric)
    - [ ] Most common values (top 5)
    - [ ] Distribution histogram (10 buckets)
  - [ ] Calculate overall metrics:
    - [ ] Total row count
    - [ ] Total column count
    - [ ] Data freshness (last updated)
    - [ ] Estimated size
  - [ ] Return profiling results as JSON

- [ ] **3.6** Add profiling API endpoints
  - [ ] `POST /datasets/{id}/profile` - trigger profiling (async job)
  - [ ] `GET /datasets/{id}/profile` - get cached profiling results
  - [ ] `GET /datasets/{id}/profile/column/{column_name}` - detailed column stats

### Backend - Dataset Sharing & Permissions

- [ ] **3.7** Create `DatasetShare` model
  - [ ] Fields: `id`, `dataset_id`, `shared_with_type` (user/team/workspace)
  - [ ] Fields: `shared_with_id`, `permission` (view/edit)
  - [ ] Fields: `shared_by`, `created_at`, `expires_at`
  - [ ] Create migration

- [ ] **3.8** Add sharing methods to `DatasetService`
  - [ ] `async def share_dataset(dataset_id, share_data)`
  - [ ] `async def unshare_dataset(dataset_id, share_id)`
  - [ ] `async def list_shares(dataset_id)`
  - [ ] `async def check_permission(dataset_id, user_id) -> str` - returns 'owner', 'edit', 'view', 'none'
  - [ ] Update all dataset endpoints to check permissions

- [ ] **3.9** Add sharing API endpoints
  - [ ] `POST /datasets/{id}/shares` - create share
  - [ ] `GET /datasets/{id}/shares` - list shares
  - [ ] `DELETE /datasets/{id}/shares/{share_id}` - remove share

### Frontend - Lineage Visualization

- [ ] **3.10** Create `dataask-frontend/components/datasets/LineageGraph.tsx`
  - [ ] Use React Flow or D3.js for graph visualization
  - [ ] Fetch lineage data from API
  - [ ] Show nodes for: connections, datasets, dashboards, queries
  - [ ] Different node colors/icons for different types
  - [ ] Show edges with relationship type labels
  - [ ] Support zoom and pan
  - [ ] Highlight path on hover
  - [ ] Click node to navigate to that entity
  - [ ] Layout algorithm: hierarchical top-to-bottom
  - [ ] Props: `entityType`, `entityId`

- [ ] **3.11** Add lineage tab to dataset detail page
  - [ ] Add "Lineage" tab
  - [ ] Show `<LineageGraph />` component
  - [ ] Add toggle: "Show Upstream" / "Show Downstream" / "Show All"
  - [ ] Add "Impact Analysis" section
    - [ ] "This dataset is used by:"
    - [ ] List of dashboards with links
    - [ ] List of queries with links
    - [ ] Warning if trying to delete dataset with dependencies

### Frontend - Data Profiling UI

- [ ] **3.12** Create `dataask-frontend/components/datasets/DataProfile.tsx`
  - [ ] Fetch profiling data from API
  - [ ] Show overall metrics: row count, column count, size, freshness
  - [ ] **Column Profiles:**
    - [ ] Table with one row per column
    - [ ] Show: name, type, null %, unique count, min, max
    - [ ] Expandable rows show detailed stats
    - [ ] Show distribution histogram (mini chart)
    - [ ] Show top 5 most common values
  - [ ] **Data Quality Score:**
    - [ ] Calculate score: 100 - (null_penalty + cardinality_penalty)
    - [ ] Show as progress bar with color (green/yellow/red)
    - [ ] Show recommendations: "Fix 5 columns with >50% nulls"
  - [ ] "Refresh Profile" button (triggers profiling job)
  - [ ] Props: `workspaceId`, `datasetId`

- [ ] **3.13** Add profiling tab to dataset detail page
  - [ ] Add "Data Profile" tab
  - [ ] Show `<DataProfile />` component
  - [ ] Show last profiled timestamp
  - [ ] Add loading state for profiling job

### Frontend - Sharing UI

- [ ] **3.14** Create `dataask-frontend/components/datasets/DatasetShareDialog.tsx`
  - [ ] Dialog with share form
  - [ ] **Add Share Section:**
    - [ ] Dropdown: Share with User / Team / Everyone in Workspace
    - [ ] User/team selector (autocomplete)
    - [ ] Radio buttons: View access / Edit access
    - [ ] Optional: Expiration date picker
    - [ ] "Add" button
  - [ ] **Existing Shares Section:**
    - [ ] List of current shares
    - [ ] Show: user/team name, permission, shared by, expires at
    - [ ] Remove button per share
  - [ ] Props: `datasetId`, `open`, `onOpenChange`

- [ ] **3.15** Add share button to dataset detail page
  - [ ] Add "Share" button to header actions
  - [ ] Opens `<DatasetShareDialog />`
  - [ ] Show share icon if dataset is already shared
  - [ ] Show "Shared with X people" tooltip

### Integration - Use Datasets in Dashboards

- [ ] **3.16** Update dashboard widget query builder
  - [ ] Add source selector: "Connection Table" OR "Dataset"
  - [ ] If "Dataset" selected:
    - [ ] Dropdown to select dataset (from datasetsApi.list)
    - [ ] Show dataset columns (from datasetsApi.getColumns)
    - [ ] Allow selecting columns, adding filters
    - [ ] Filters are applied ON TOP of dataset's base filters
  - [ ] Save widget with dataset reference in configuration
  - [ ] When executing widget query, resolve dataset to SQL

- [ ] **3.17** Update backend to support dataset references
  - [ ] Modify `ConnectionService.build_and_execute_query`
  - [ ] If table name starts with `dataset:`, resolve to dataset
  - [ ] Fetch dataset by ID, generate base SQL
  - [ ] Wrap dataset SQL as subquery
  - [ ] Apply widget-level filters, aggregations on top
  - [ ] Execute combined query

- [ ] **3.18** Record lineage when widget uses dataset
  - [ ] In dashboard service, after creating widget
  - [ ] If widget references dataset, call `lineage_service.record_lineage`
  - [ ] Source: dataset, Target: dashboard, Relationship: 'uses'

### Integration - Use Datasets in Saved Queries

- [ ] **3.19** Update saved query builder
  - [ ] Add option to query from dataset instead of table
  - [ ] Dataset selector dropdown
  - [ ] Save dataset_id in saved_query config
  - [ ] Execute query using dataset as base

- [ ] **3.20** Record lineage for saved queries using datasets
  - [ ] Call lineage_service when saved query is created/updated

### Testing - Lineage, Profiling, Sharing

- [ ] **3.21** Manual testing
  - [ ] Create dataset A from connection
  - [ ] Create dashboard widget using dataset A
  - [ ] View dataset A detail page → Lineage tab
  - [ ] Verify shows: Connection → Dataset A → Dashboard
  - [ ] Verify downstream shows dashboard widget
  - [ ] Click dashboard node, verify navigates to dashboard
  - [ ] Profile dataset A
  - [ ] Verify profiling results show stats for all columns
  - [ ] Verify data quality score calculated
  - [ ] Share dataset A with another user (view permission)
  - [ ] Log in as other user
  - [ ] Verify can see dataset A in list
  - [ ] Verify cannot edit dataset A
  - [ ] Try to delete dataset A (as owner)
  - [ ] Verify warning about dashboard dependency
  - [ ] Test impact analysis shows correct dependents

---

## Phase 4: Polish & Advanced Features (Optional - Week 7-8)

### Optional Enhancements

- [ ] **4.1** Dataset templates
  - [ ] Common dataset patterns (sales analysis, customer 360, etc.)
  - [ ] One-click create from template
  - [ ] Template library

- [ ] **4.2** Dataset refresh scheduling
  - [ ] Similar to scheduled queries
  - [ ] Automatically refresh dataset cache
  - [ ] Incremental refresh support

- [ ] **4.3** Dataset alerts
  - [ ] Alert when data quality drops below threshold
  - [ ] Alert when dataset fails to refresh
  - [ ] Alert when null % increases significantly

- [ ] **4.4** AI-suggested calculated fields
  - [ ] Analyze dataset columns
  - [ ] Suggest useful calculated fields
  - [ ] "Did you mean to create a 'total' field?"

- [ ] **4.5** Natural language to dataset
  - [ ] "Create a dataset showing sales by region for last 30 days"
  - [ ] AI generates dataset configuration
  - [ ] User reviews and saves

- [ ] **4.6** Dataset comparison
  - [ ] Compare two datasets side-by-side
  - [ ] Show schema differences
  - [ ] Show data differences
  - [ ] Useful for testing transformations

- [ ] **4.7** Dataset documentation
  - [ ] Rich text editor for dataset description
  - [ ] Add field-level descriptions
  - [ ] Add usage examples
  - [ ] Add changelog

- [ ] **4.8** Dataset search
  - [ ] Global search across all datasets
  - [ ] Search by: name, description, column names, tags
  - [ ] Fuzzy search with ranking
  - [ ] Suggest datasets based on current context

- [ ] **4.9** Dataset metrics
  - [ ] Track usage: query count, dashboard count
  - [ ] Track performance: avg execution time
  - [ ] Most popular datasets
  - [ ] Unused datasets (candidates for archiving)

- [ ] **4.10** Export/import datasets
  - [ ] Export dataset configuration as JSON
  - [ ] Import from JSON
  - [ ] Share dataset configs across workspaces
  - [ ] Version control via Git

---

## Acceptance Criteria (Definition of Done)

### Phase 1 Complete When:
- [x] User can create a dataset from a single database table
- [x] User can name, describe, and tag datasets
- [x] User can preview dataset data (first 100 rows)
- [x] User can view generated SQL
- [x] User can edit dataset name/description
- [x] User can delete datasets
- [x] User can see list of all datasets in workspace
- [x] User can filter datasets by status and tags
- [x] Datasets are properly isolated by workspace
- [x] All API endpoints have proper error handling
- [x] Frontend shows loading and error states

### Phase 2 Complete When:
- [x] User can create datasets with joins (2+ tables)
- [x] User can add filters to datasets
- [x] User can add calculated fields with formulas
- [x] Formula editor has autocomplete and validation
- [x] User can see function library with examples
- [x] User can preview data with calculated fields
- [x] Dataset versions are created on every update
- [x] User can view version history
- [x] User can restore previous versions
- [x] All transformations generate correct SQL
- [x] Calculated fields are validated before saving

### Phase 3 Complete When:
- [x] Lineage is automatically tracked for all datasets
- [x] User can view lineage graph for any dataset
- [x] User can see impact analysis (what depends on dataset)
- [x] User can profile a dataset (statistics, distribution)
- [x] User can see data quality scores
- [x] User can share datasets with other users
- [x] Permissions are enforced (view vs. edit)
- [x] Dashboard widgets can use datasets as sources
- [x] Saved queries can use datasets as sources
- [x] Lineage is tracked for widgets and queries using datasets
- [x] User cannot delete dataset if it has dependencies (with warning)

---

## Progress Tracking

**Phase 1 (Foundation):** 0 / 16 tasks complete (0%)
**Phase 2 (Transformations):** 0 / 15 tasks complete (0%)
**Phase 3 (Lineage & Integration):** 0 / 21 tasks complete (0%)
**Phase 4 (Optional):** 0 / 10 tasks complete (0%)

**Overall:** 0 / 62 tasks complete (0%)

---

## Notes & Decisions

### Technical Decisions:
- **Transformation Storage:** Store as JSONB in PostgreSQL (flexible, queryable)
- **SQL Generation:** Server-side in Python (security, validation)
- **Lineage Tracking:** Separate `data_lineage` table (flexible relationships)
- **Version Control:** Snapshot full dataset config on each change (simple, complete)
- **Permissions:** Extend workspace permissions + dataset-level shares (granular)

### Out of Scope (for now):
- Cross-database joins (requires federation layer)
- Real-time dataset refresh (requires streaming infrastructure)
- Machine learning on datasets (Phase 4 feature)
- Dataset marketplace (enterprise feature)
- Git integration for version control (advanced feature)

### Dependencies:
- Ibis server must support all SQL features we generate
- Wren AI integration for calculated field suggestions (Phase 4)
- Connection service must support executing generated SQL
- Frontend needs React Flow library for lineage visualization

### Risks:
- Complex SQL generation may be buggy → mitigate with extensive testing
- Performance issues with large datasets → implement caching, pagination
- User confusion with transformations → provide templates, examples, AI help
- Breaking changes to datasets → version control helps, but need migration strategy

---

## How to Use This Checklist

1. **Start with Phase 1** - Don't skip ahead
2. **Check off items as you complete them** - Update progress tracking
3. **Test each item before moving on** - Don't let bugs accumulate
4. **Commit after each major task** - Small, atomic commits
5. **Update this file** when you complete each phase - Keep it current
6. **Refer back to the product spec** (Section 4) if unclear

When you return to work on this feature, simply:
1. Read the checklist
2. Find the first unchecked item
3. Implement it
4. Test it
5. Check it off
6. Commit and push
7. Move to next item

Good luck! 🚀
