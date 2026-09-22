export interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error'
  category: string
  message: string
  details?: string
}

const MAX_LOGS = 200
const logBuffer: LogEntry[] = []

let isHooked = false

export function addDiagnosticLog(
  level: 'info' | 'warn' | 'error',
  category: string,
  message: string,
  details?: any,
) {
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    details: details ? (typeof details === 'string' ? details : JSON.stringify(details, null, 2)) : undefined,
  }

  logBuffer.push(entry)
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift()
  }

  // Force unbuffered stdout/stderr write so Docker / Coolify captures it instantly
  const formattedLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${category}] ${message}${entry.details ? `\n${entry.details}` : ''}\n`
  if (level === 'error') {
    process.stderr.write(formattedLine)
  } else {
    process.stdout.write(formattedLine)
  }
}

export function getDiagnosticLogs(): LogEntry[] {
  return [...logBuffer].reverse()
}

export function clearDiagnosticLogs(): void {
  logBuffer.length = 0
}

/**
 * Hooks standard console methods so all server logs are captured in memory & unbuffered to stdout
 */
export function initConsoleHooking(): void {
  if (isHooked || typeof window !== 'undefined') return
  isHooked = true

  const origLog = console.log
  const origWarn = console.warn
  const origError = console.error

  console.log = (...args: any[]) => {
    try {
      const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
      addDiagnosticLog('info', 'CONSOLE', msg)
    } catch {
      origLog(...args)
    }
  }

  console.warn = (...args: any[]) => {
    try {
      const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
      addDiagnosticLog('warn', 'CONSOLE', msg)
    } catch {
      origWarn(...args)
    }
  }

  console.error = (...args: any[]) => {
    try {
      const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
      addDiagnosticLog('error', 'CONSOLE', msg)
    } catch {
      origError(...args)
    }
  }

  addDiagnosticLog('info', 'SYSTEM', '🚀 Diagnostic console interception & unbuffered stdout initialized.')
}

// Auto-initialize on module load (server-side only)
if (typeof window === 'undefined') {
  initConsoleHooking()
}
