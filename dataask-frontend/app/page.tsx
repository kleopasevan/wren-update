'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to workspaces
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/workspaces')
    }
  }, [user, isLoading, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo/Brand */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            DataAsk
          </h1>
          <p className="text-xl text-muted-foreground">
            Conversational Business Intelligence Platform
          </p>
        </div>

        {/* Value Proposition */}
        <div className="mb-12 space-y-4">
          <p className="text-lg text-muted-foreground">
            Transform your data into insights with AI-powered analytics.
            Connect multiple databases, create stunning dashboards, and ask questions
            in natural language.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="mb-3">
              <svg
                className="h-8 w-8 mx-auto text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Natural Language Queries</h3>
            <p className="text-sm text-muted-foreground">
              Ask questions in plain English and get instant SQL results
            </p>
          </div>

          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="mb-3">
              <svg
                className="h-8 w-8 mx-auto text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Multi-Database Support</h3>
            <p className="text-sm text-muted-foreground">
              Connect to PostgreSQL, MySQL, BigQuery, Snowflake, and more
            </p>
          </div>

          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="mb-3">
              <svg
                className="h-8 w-8 mx-auto text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Beautiful Dashboards</h3>
            <p className="text-sm text-muted-foreground">
              Create and share interactive dashboards with your team
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          © 2025 RantAI. All rights reserved.
        </p>
      </div>
    </div>
  )
}
