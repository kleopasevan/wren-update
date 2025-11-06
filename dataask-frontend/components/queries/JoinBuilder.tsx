'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Link2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table } from '@/lib/api/connections'
import { QueryJoin, QueryJoinCondition } from '@/lib/api/queries'

interface JoinBuilderProps {
  primaryTable: Table | null
  availableTables: Table[]
  joins: QueryJoin[]
  onChange: (joins: QueryJoin[]) => void
}

export function JoinBuilder({
  primaryTable,
  availableTables,
  joins,
  onChange,
}: JoinBuilderProps) {
  function addJoin() {
    const availableToJoin = availableTables.filter(
      (t) => t.name !== primaryTable?.name && !joins.some((j) => j.table === t.name)
    )

    if (availableToJoin.length === 0) return

    const newJoin: QueryJoin = {
      table: availableToJoin[0].name,
      join_type: 'INNER',
      conditions: [
        {
          left_column: primaryTable?.name ? `${primaryTable.name}.id` : '',
          right_column: `${availableToJoin[0].name}.id`,
          operator: '=',
        },
      ],
    }

    onChange([...joins, newJoin])
  }

  function removeJoin(index: number) {
    onChange(joins.filter((_, i) => i !== index))
  }

  function updateJoin(index: number, updates: Partial<QueryJoin>) {
    const newJoins = [...joins]
    newJoins[index] = { ...newJoins[index], ...updates }
    onChange(newJoins)
  }

  function addCondition(joinIndex: number) {
    const join = joins[joinIndex]
    const newCondition: QueryJoinCondition = {
      left_column: primaryTable?.name ? `${primaryTable.name}.id` : '',
      right_column: `${join.table}.id`,
      operator: '=',
    }

    updateJoin(joinIndex, {
      conditions: [...join.conditions, newCondition],
    })
  }

  function removeCondition(joinIndex: number, conditionIndex: number) {
    const join = joins[joinIndex]
    updateJoin(joinIndex, {
      conditions: join.conditions.filter((_, i) => i !== conditionIndex),
    })
  }

  function updateCondition(
    joinIndex: number,
    conditionIndex: number,
    updates: Partial<QueryJoinCondition>
  ) {
    const join = joins[joinIndex]
    const newConditions = [...join.conditions]
    newConditions[conditionIndex] = { ...newConditions[conditionIndex], ...updates }
    updateJoin(joinIndex, { conditions: newConditions })
  }

  // Get all columns from a table for dropdown
  function getTableColumns(tableName: string): string[] {
    const table = availableTables.find((t) => t.name === tableName)
    return table ? table.columns.map((c) => `${tableName}.${c.name}`) : []
  }

  // Get columns from primary table and joined tables
  function getAllAvailableColumns(): string[] {
    const columns: string[] = []

    if (primaryTable) {
      columns.push(...getTableColumns(primaryTable.name))
    }

    joins.forEach((join) => {
      columns.push(...getTableColumns(join.table))
    })

    return columns
  }

  const availableToJoin = availableTables.filter(
    (t) => t.name !== primaryTable?.name && !joins.some((j) => j.table === t.name)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Table Joins</Label>
        <Button
          onClick={addJoin}
          size="sm"
          variant="outline"
          disabled={!primaryTable || availableToJoin.length === 0}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Join
        </Button>
      </div>

      {joins.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Link2 className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              No joins yet. Add joins to query across multiple tables.
            </p>
          </CardContent>
        </Card>
      )}

      {joins.map((join, joinIndex) => {
        const joinedTable = availableTables.find((t) => t.name === join.table)

        return (
          <Card key={joinIndex}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Join {joinIndex + 1}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {primaryTable?.name} → {join.table}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => removeJoin(joinIndex)}
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Join Type and Table */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Join Type</Label>
                  <Select
                    value={join.join_type}
                    onValueChange={(value: any) => updateJoin(joinIndex, { join_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INNER">INNER JOIN</SelectItem>
                      <SelectItem value="LEFT">LEFT JOIN</SelectItem>
                      <SelectItem value="RIGHT">RIGHT JOIN</SelectItem>
                      <SelectItem value="FULL">FULL OUTER JOIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Table</Label>
                  <Select
                    value={join.table}
                    onValueChange={(value) => updateJoin(joinIndex, { table: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTables
                        .filter(
                          (t) =>
                            t.name !== primaryTable?.name &&
                            (t.name === join.table || !joins.some((j) => j.table === t.name))
                        )
                        .map((table) => (
                          <SelectItem key={table.name} value={table.name}>
                            {table.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Join Conditions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Join Conditions (ON)</Label>
                  <Button
                    onClick={() => addCondition(joinIndex)}
                    size="sm"
                    variant="ghost"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Condition
                  </Button>
                </div>

                {join.conditions.map((condition, condIndex) => (
                  <div key={condIndex} className="flex items-center space-x-2">
                    <Select
                      value={condition.left_column}
                      onValueChange={(value) =>
                        updateCondition(joinIndex, condIndex, { left_column: value })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAllAvailableColumns().map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator || '='}
                      onValueChange={(value: any) =>
                        updateCondition(joinIndex, condIndex, { operator: value })
                      }
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="=">=</SelectItem>
                        <SelectItem value="!=">!=</SelectItem>
                        <SelectItem value=">">{'>'}</SelectItem>
                        <SelectItem value=">=">{'>='}</SelectItem>
                        <SelectItem value="<">{'<'}</SelectItem>
                        <SelectItem value="<=">{'<='}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.right_column}
                      onValueChange={(value) =>
                        updateCondition(joinIndex, condIndex, { right_column: value })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getTableColumns(join.table).map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => removeCondition(joinIndex, condIndex)}
                      size="sm"
                      variant="ghost"
                      disabled={join.conditions.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
