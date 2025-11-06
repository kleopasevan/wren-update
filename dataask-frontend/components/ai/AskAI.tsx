'use client'

import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { connectionsApi, TextToSQLResponse, QueryHistory } from '@/lib/api/connections'

interface AskAIProps {
  workspaceId: string
  connectionId: string
  onSQLGenerated?: (sql: string, question: string) => void
  histories?: QueryHistory[]
  placeholder?: string
  showPreview?: boolean
}

export function AskAI({
  workspaceId,
  connectionId,
  onSQLGenerated,
  histories = [],
  placeholder = "Ask a question about your data in plain English...",
  showPreview = true,
}: AskAIProps) {
  const [question, setQuestion] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<TextToSQLResponse | null>(null)
  const [error, setError] = useState('')

  async function handleAskAI() {
    if (!question.trim()) return

    setIsGenerating(true)
    setError('')
    setResult(null)

    try {
      const response = await connectionsApi.textToSql(workspaceId, connectionId, {
        question: question.trim(),
        histories,
        enable_column_pruning: true,
      })

      setResult(response)

      if (response.status === 'finished' && response.sql && onSQLGenerated) {
        onSQLGenerated(response.sql, question.trim())
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate SQL')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleAskAI()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[100px] resize-none"
            disabled={isGenerating}
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {question.length > 0 && `${question.length} chars`}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted">⌘</kbd> +{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-muted">Enter</kbd> to generate
          </div>
          <Button
            onClick={handleAskAI}
            disabled={!question.trim() || isGenerating}
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Ask AI
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-3">
          {result.status === 'finished' && result.sql && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                SQL generated successfully!
                {result.rephrased_question && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Interpreted as: "{result.rephrased_question}"
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {result.status === 'failed' && result.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">{result.error.message}</div>
                {result.error.code && (
                  <div className="text-xs mt-1 opacity-70">
                    Error code: {result.error.code}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {showPreview && result.sql && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Generated SQL</div>
                {result.retrieved_tables && result.retrieved_tables.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Tables: {result.retrieved_tables.join(', ')}
                  </div>
                )}
              </div>
              <div className="bg-muted/50 rounded-md p-3 font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words">{result.sql}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
