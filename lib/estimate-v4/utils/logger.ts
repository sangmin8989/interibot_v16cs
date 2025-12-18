/**
 * V4 전용 로거
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  context?: Record<string, unknown>
  duration?: number
}

/**
 * V4 전용 로거 클래스
 */
class V4Logger {
  private isDev = process.env.NODE_ENV === 'development'

  private formatEntry(entry: LogEntry): string {
    const { timestamp, level, module, message, context, duration } = entry
    const durationStr = duration ? ` (${duration}ms)` : ''
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''

    return `[V4:${module}] ${level.toUpperCase()} ${message}${durationStr}${contextStr}`
  }

  debug(module: string, message: string, context?: Record<string, unknown>) {
    if (this.isDev) {
      console.log(
        this.formatEntry({
          timestamp: new Date().toISOString(),
          level: 'debug',
          module,
          message,
          context,
        })
      )
    }
  }

  info(module: string, message: string, context?: Record<string, unknown>) {
    console.log(
      this.formatEntry({
        timestamp: new Date().toISOString(),
        level: 'info',
        module,
        message,
        context,
      })
    )
  }

  warn(module: string, message: string, context?: Record<string, unknown>) {
    console.warn(
      this.formatEntry({
        timestamp: new Date().toISOString(),
        level: 'warn',
        module,
        message,
        context,
      })
    )
  }

  error(module: string, message: string, error?: unknown, context?: Record<string, unknown>) {
    console.error(
      this.formatEntry({
        timestamp: new Date().toISOString(),
        level: 'error',
        module,
        message,
        context: {
          ...context,
          error: error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: this.isDev ? error.stack : undefined,
              }
            : error,
        },
      })
    )
  }

  /**
   * 함수 실행 시간 측정
   */
  async measure<T>(
    module: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = Math.round(performance.now() - start)
      this.debug(module, `${operation} 완료`, { duration })
      return result
    } catch (error) {
      const duration = Math.round(performance.now() - start)
      this.error(module, `${operation} 실패`, error, { duration })
      throw error
    }
  }
}

export const logger = new V4Logger()

/**
 * 에러 로깅 헬퍼
 */
export function logError(module: string, error: unknown) {
  logger.error(module, '에러 발생', error)
}

