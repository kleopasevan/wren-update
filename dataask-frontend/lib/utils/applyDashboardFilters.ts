import { QueryDefinition, QueryFilter } from '../api/queries'
import { DashboardFilter } from '@/contexts/DashboardFiltersContext'

/**
 * Apply dashboard filters to a query definition.
 * Adds filters from filter widgets to the query's WHERE clause.
 */
export function applyDashboardFilters(
  query: QueryDefinition | undefined,
  dashboardFilters: DashboardFilter[]
): QueryDefinition | undefined {
  if (!query) return query

  // Convert dashboard filters to query filters
  const additionalFilters: QueryFilter[] = []

  dashboardFilters.forEach((filter) => {
    if (filter.value === null || filter.value === undefined) return

    if (filter.type === 'dropdown') {
      // Simple equality filter
      additionalFilters.push({
        column: filter.column,
        operator: '=',
        value: filter.value,
      })
    } else if (filter.type === 'date_range' && filter.value.start && filter.value.end) {
      // Add two filters: >= start AND <= end
      additionalFilters.push({
        column: filter.column,
        operator: '>=',
        value: filter.value.start,
      })
      additionalFilters.push({
        column: filter.column,
        operator: '<=',
        value: filter.value.end,
      })
    } else if (filter.type === 'multi_select' && Array.isArray(filter.value) && filter.value.length > 0) {
      // IN operator for multi-select
      additionalFilters.push({
        column: filter.column,
        operator: 'IN',
        value: filter.value,
      })
    }
  })

  // Merge with existing query filters
  const existingFilters = query.filters || []
  const allFilters = [...existingFilters, ...additionalFilters]

  return {
    ...query,
    filters: allFilters.length > 0 ? allFilters : undefined,
  }
}

/**
 * Apply dashboard filters to raw SQL.
 * Adds WHERE clauses to the SQL string.
 * Note: This is a simple implementation and may not work for complex SQL.
 */
export function applyDashboardFiltersToSQL(
  sql: string,
  dashboardFilters: DashboardFilter[]
): string {
  if (!sql || dashboardFilters.length === 0) return sql

  const whereClauses: string[] = []

  dashboardFilters.forEach((filter) => {
    if (filter.value === null || filter.value === undefined) return

    if (filter.type === 'dropdown') {
      whereClauses.push(`${filter.column} = '${filter.value}'`)
    } else if (filter.type === 'date_range' && filter.value.start && filter.value.end) {
      whereClauses.push(`${filter.column} >= '${filter.value.start}'`)
      whereClauses.push(`${filter.column} <= '${filter.value.end}'`)
    } else if (filter.type === 'multi_select' && Array.isArray(filter.value)) {
      const values = filter.value.map((v) => `'${v}'`).join(', ')
      whereClauses.push(`${filter.column} IN (${values})`)
    }
  })

  if (whereClauses.length === 0) return sql

  // Simple SQL modification - add WHERE clause or append to existing WHERE
  const whereClause = whereClauses.join(' AND ')

  if (sql.toLowerCase().includes(' where ')) {
    // Append to existing WHERE clause
    return sql.replace(/(\s+where\s+)/i, `$1(${whereClause}) AND `)
  } else {
    // Add new WHERE clause before ORDER BY, LIMIT, or at end
    const orderByMatch = sql.match(/\s+(order\s+by|limit)\s+/i)
    if (orderByMatch && orderByMatch.index !== undefined) {
      return sql.slice(0, orderByMatch.index) + ` WHERE ${whereClause} ` + sql.slice(orderByMatch.index)
    } else {
      return sql + ` WHERE ${whereClause}`
    }
  }
}
