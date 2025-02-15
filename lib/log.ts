import { Logger, filterUnwrapper, unwrapper } from '@/lib/frp'

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'

type LogEntry = {
    log: string
    level: LogLevel
    timestamp: number
}

function getLogKey(key: string): LogEntry[] {
    const current = localStorage.getItem(key)

    return current ? JSON.parse(current) : []
}

// TODO: restrict to JSON-serializable types
export function persistLog(level: LogLevel, key: string, log: any) {
    const current = getLogKey(key)

    current.push({
        log,
        level,
        timestamp: (new Date()).getTime()
    })

    localStorage.setItem(key, JSON.stringify(current))
}

export function persistInfo(key: string, log: any) {
    console.info(log)
    persistLog('INFO', key, log)
}

export function persistWarning(key: string, log: any) {
    console.warn(log)
    persistLog('WARNING', key, log)
}

export function persistError(key: string, log: any) {
    console.error(log)
    persistLog('ERROR', key, log)
}

export function persistPanic(key: string, log: any): never {
    persistError(key, log)
    throw log
}

// README: I don't like the Logger abstraction, it's finnicky as of now
// I feel like tests would help a lot, because currently I think this
// type of logging has a lot of indirection. maybe registering which
// operation logged what and have hierarchical tracing?
export const logger: Logger = {
    info: persistInfo,
    warn: persistWarning,
    error: persistError,
    panic: persistPanic
}

// TODO: refactor whatever depends on ResultLike to try to use Result (ts-results-es)
// TODO: consider renaming as to avoid conflict with the unwrap function
export const unwrap = unwrapper(logger)

export const filterUnwrap = filterUnwrapper(logger)
