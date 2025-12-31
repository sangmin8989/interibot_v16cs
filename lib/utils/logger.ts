/**
 * 인테리봇 통일된 로거
 * 
 * 작성일: 2025-12-31
 * 목적: console.error/warn을 통일된 logger로 전환
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

/**
 * 로거 클래스
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  /**
   * 로그 레벨에 따른 출력 여부 결정
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true // 개발 환경에서는 모든 로그 출력
    }
    
    if (this.isProduction) {
      // 프로덕션에서는 warn과 error만 출력
      return level === 'warn' || level === 'error'
    }
    
    return true
  }

  /**
   * 로그 포맷팅
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  /**
   * Debug 로그
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  /**
   * Info 로그
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  /**
   * Warning 로그
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  /**
   * Error 로그
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext: LogContext = {
        ...context,
        error: error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      }
      console.error(this.formatMessage('error', message, errorContext))
    }
  }

  /**
   * 에러 객체 로깅 (InteriBotError 지원)
   */
  logError(error: unknown, context?: LogContext): void {
    if (error instanceof Error) {
      // InteriBotError인 경우 구조화된 로깅
      if ('code' in error && 'context' in error) {
        this.error(
          error.message,
          error,
          {
            ...context,
            code: (error as { code: string }).code,
            errorContext: (error as { context?: LogContext }).context,
          }
        )
      } else {
        this.error(error.message, error, context)
      }
    } else {
      this.error('알 수 없는 오류', error, context)
    }
  }
}

/**
 * 싱글톤 로거 인스턴스
 */
export const logger = new Logger()

/**
 * 모듈별 로거 생성 (네임스페이스 지원)
 */
export function createLogger(namespace: string) {
  return {
    debug: (message: string, context?: LogContext) =>
      logger.debug(`[${namespace}] ${message}`, context),
    info: (message: string, context?: LogContext) =>
      logger.info(`[${namespace}] ${message}`, context),
    warn: (message: string, context?: LogContext) =>
      logger.warn(`[${namespace}] ${message}`, context),
    error: (message: string, error?: unknown, context?: LogContext) =>
      logger.error(`[${namespace}] ${message}`, error, context),
    logError: (error: unknown, context?: LogContext) =>
      logger.logError(error, { ...context, namespace }),
  }
}
