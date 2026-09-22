'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error'
  category: string
  message: string
  details?: string
}

interface DiagnosticsData {
  status: 'healthy' | 'warning' | 'error'
  timestamp: string
  latencyMs: number
  env: {
    DATABASE_URI: string
    PAYLOAD_SECRET: string
    NEXT_PUBLIC_SERVER_URL: string
    NODE_ENV: string
    NEXT_BUILD: string
    IS_BUILD: string
  }
  database: {
    status: 'connected' | 'error' | 'skipped'
    error: string | null
    collections: Record<string, number | string>
  }
  logsCount: number
  logs: LogEntry[]
}

export default function StatusPage() {
  const [data, setData] = useState<DiagnosticsData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true)
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all')
  const [copied, setCopied] = useState<boolean>(false)

  const fetchDiagnostics = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/diagnostics?t=' + Date.now(), { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }
      const json: DiagnosticsData = await res.json()
      setData(json)
      setError(null)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch diagnostics API.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDiagnostics()
  }, [fetchDiagnostics])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchDiagnostics()
    }, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchDiagnostics])

  const copyLogsToClipboard = () => {
    if (!data?.logs) return
    const text = data.logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.category}] ${l.message}${l.details ? `\n${l.details}` : ''}`)
      .join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredLogs = (data?.logs || []).filter((l) => {
    if (logFilter === 'all') return true
    return l.level === logFilter
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">System Diagnostics & Logs</h1>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide border ${
                  data?.status === 'healthy'
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                    : data?.status === 'warning'
                    ? 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                    : 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                }`}
              >
                {loading && !data ? 'Checking...' : data?.status || 'Unknown'}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Live Payload CMS & MongoDB status monitor for Coolify deployments
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                autoRefresh
                  ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {autoRefresh ? '🔄 Auto-Refresh ON (5s)' : '⏸️ Auto-Refresh OFF'}
            </button>
            <button
              onClick={fetchDiagnostics}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Testing...' : '⚡ Run Health Check'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-700 text-rose-200">
            <div className="font-bold flex items-center gap-2 text-lg">❌ Diagnostic Fetch Failed</div>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: MongoDB & Payload Status */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Database & Payload</h2>
                <div
                  className={`w-3 h-3 rounded-full animate-pulse ${
                    data?.database.status === 'connected'
                      ? 'bg-emerald-400'
                      : data?.database.status === 'skipped'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
              </div>

              <div className="text-2xl font-bold text-white mb-2">
                {data?.database.status === 'connected' ? (
                  <span className="text-emerald-400">Connected</span>
                ) : data?.database.status === 'skipped' ? (
                  <span className="text-amber-400">Skipped (Build Mode)</span>
                ) : (
                  <span className="text-rose-400">Connection Failed</span>
                )}
              </div>

              {data?.database.error && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-lg text-xs text-rose-300 font-mono mt-3 overflow-auto max-h-32">
                  {data.database.error}
                </div>
              )}

              <div className="space-y-2 mt-4 text-xs font-mono text-slate-300">
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Response Latency:</span>
                  <span className="font-bold text-indigo-400">{data?.latencyMs ?? 0} ms</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Last Checked:</span>
                  <span>{data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '-'}</span>
                </div>
              </div>
            </div>

            {/* Collection counts */}
            {data?.database.collections && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-400 mb-2">Collection Record Counts:</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {Object.entries(data.database.collections).map(([key, count]) => (
                    <div key={key} className="bg-slate-800/60 px-2.5 py-1.5 rounded-lg flex justify-between">
                      <span className="capitalize text-slate-400">{key}:</span>
                      <span className="font-bold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Environment Audit */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Environment Variables Audit</h2>
                <span className="text-xs text-slate-500 font-mono">Coolify Container ENV</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="text-slate-400 font-semibold mb-1">DATABASE_URI</div>
                  <div className="text-amber-300 break-all">{data?.env.DATABASE_URI || 'Loading...'}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div className="text-slate-400 font-semibold mb-1">PAYLOAD_SECRET</div>
                    <div className="text-emerald-400">{data?.env.PAYLOAD_SECRET || 'Loading...'}</div>
                  </div>
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div className="text-slate-400 font-semibold mb-1">NEXT_PUBLIC_SERVER_URL</div>
                    <div className="text-indigo-300">{data?.env.NEXT_PUBLIC_SERVER_URL || 'Loading...'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                    <div className="text-slate-500 text-[10px] uppercase">NODE_ENV</div>
                    <div className="text-slate-200 font-bold mt-0.5">{data?.env.NODE_ENV}</div>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                    <div className="text-slate-500 text-[10px] uppercase">NEXT_BUILD</div>
                    <div className="text-slate-200 font-bold mt-0.5">{data?.env.NEXT_BUILD}</div>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                    <div className="text-slate-500 text-[10px] uppercase">IS_BUILD</div>
                    <div className="text-slate-200 font-bold mt-0.5">{data?.env.IS_BUILD}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-[11px] text-slate-500">
              💡 Tip: If <span className="text-amber-400 font-mono">DATABASE_URI</span> is missing or points to localhost inside Docker, add your production MongoDB Atlas URI in Coolify Environment Variables.
            </div>
          </div>
        </div>

        {/* Console Log Terminal */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📋 Server Diagnostic Log Console</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {filteredLogs.length} entries
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time server logs buffered in Node.js server space
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Level Filter */}
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
                {(['all', 'error', 'warn', 'info'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setLogFilter(level)}
                    className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                      logFilter === level
                        ? 'bg-slate-800 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* Copy button */}
              <button
                onClick={copyLogsToClipboard}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all flex items-center gap-1.5"
              >
                {copied ? '✅ Copied!' : '📄 Copy Logs'}
              </button>
            </div>
          </div>

          {/* Terminal Window */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs max-h-[480px] overflow-y-auto space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-500 italic py-8 text-center">
                No logs matching filter level &quot;{logFilter}&quot;. Trigger actions or run health check.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-lg border leading-relaxed ${
                    log.level === 'error'
                      ? 'bg-rose-950/30 border-rose-900/60 text-rose-300'
                      : log.level === 'warn'
                      ? 'bg-amber-950/30 border-amber-900/60 text-amber-300'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px] mb-1 opacity-80">
                    <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                        log.level === 'error'
                          ? 'bg-rose-900/80 text-rose-200'
                          : log.level === 'warn'
                          ? 'bg-amber-900/80 text-amber-200'
                          : 'bg-indigo-900/80 text-indigo-200'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="text-indigo-400 font-semibold">[{log.category}]</span>
                  </div>
                  <div className="whitespace-pre-wrap break-words">{log.message}</div>
                  {log.details && (
                    <div className="mt-1.5 p-2 bg-black/40 rounded border border-white/5 text-[11px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
                      {log.details}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
