'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>('checking...')
  const [workspaces, setWorkspaces] = useState<any[]>([])

  useEffect(() => {
    // Check API health
    fetch('http://localhost:8000/api/v1/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.status))
      .catch(() => setApiStatus('offline'))

    // Fetch workspaces
    fetch('http://localhost:8000/api/v1/workspaces')
      .then(res => res.json())
      .then(data => setWorkspaces(data))
      .catch(err => console.error('Failed to fetch workspaces:', err))
  }, [])

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">DataAsk POC</h1>
          <p className="text-muted-foreground">
            Conversational Business Intelligence Platform
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">API Status</h3>
            <p className={`text-2xl font-bold ${apiStatus === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
              {apiStatus}
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Workspaces</h3>
            <p className="text-2xl font-bold">{workspaces.length}</p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Stack</h3>
            <p className="text-sm text-muted-foreground">
              Next.js 15 + FastAPI + Wren AI
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">POC Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">✅ Multi-Database Connections</h3>
              <p className="text-sm text-muted-foreground">
                Connect to PostgreSQL, MySQL, BigQuery, Snowflake, and more
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">✅ Multi-Dashboard Workspace</h3>
              <p className="text-sm text-muted-foreground">
                Create unlimited dashboards per workspace
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">✅ Conversational Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Ask questions in natural language, powered by Wren AI
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🚧 Visual Data Prep</h3>
              <p className="text-sm text-muted-foreground">
                Tableau-like data preparation (coming soon)
              </p>
            </div>
          </div>
        </div>

        {/* Architecture Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Architecture</h2>
          <div className="p-6 border rounded-lg bg-muted/50">
            <pre className="text-sm overflow-x-auto">
{`┌─────────────────────────────────────────┐
│  Frontend (Next.js 15 + shadcn/ui)      │
└──────────────┬──────────────────────────┘
               │ REST API
┌──────────────▼──────────────────────────┐
│  Backend (FastAPI + PostgreSQL)         │
└─────┬──────────────────────┬────────────┘
      │                      │
┌─────▼──────┐    ┌─────────▼───────────┐
│ Wren AI    │    │ Ibis Server         │
│ Service    │    │ (Query Engine)      │
└────────────┘    └─────────────────────┘`}
            </pre>
          </div>
        </div>

        {/* Next Steps */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Set up authentication (JWT)</li>
            <li>Create workspace management UI</li>
            <li>Implement connection manager</li>
            <li>Build conversational interface</li>
            <li>Add dashboard builder</li>
            <li>Integrate with Wren AI service</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
