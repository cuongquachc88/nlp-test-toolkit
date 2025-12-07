/**
 * Frontend Debug Utility
 * Browser-safe debug logging with localStorage override
 */

export type DebugCategory =
    | 'ui'
    | 'api'
    | 'chat'
    | 'command'
    | 'test';

export type DebugLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

const categoryStyles: Record<DebugCategory, string> = {
    ui: 'color: #10b981; font-weight: bold',
    api: 'color: #06b6d4; font-weight: bold',
    chat: 'color: #f59e0b; font-weight: bold',
    command: 'color: #8b5cf6; font-weight: bold',
    test: 'color: #ec4899; font-weight: bold',
};

const levelPriority: Record<DebugLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
};

class DebugLogger {
    private enabled: boolean;
    private level: DebugLevel;

    constructor() {
        // Check localStorage for override, fallback to env
        const localOverride = localStorage.getItem('DEBUG');
        const metaEnv = import.meta.env as Record<string, any>;
        this.enabled = localOverride === 'true' ||
            metaEnv.VITE_DEBUG === 'true' ||
            metaEnv.DEV === true;

        const localLevel = localStorage.getItem('DEBUG_LEVEL') as DebugLevel;
        this.level = localLevel || (metaEnv.VITE_DEBUG_LEVEL as DebugLevel) || 'verbose';
    }

    private shouldLog(level: DebugLevel): boolean {
        if (!this.enabled) return false;
        return levelPriority[level] <= levelPriority[this.level];
    }

    private formatMessage(category: DebugCategory, message: string): string {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        return `[${timestamp}] [${category.toUpperCase()}] ${message}`;
    }

    log(category: DebugCategory, message: string, level: DebugLevel = 'info'): void {
        if (!this.shouldLog(level)) return;

        const formatted = this.formatMessage(category, message);
        const style = categoryStyles[category];

        switch (level) {
            case 'error':
                console.error(`%c${formatted}`, style);
                break;
            case 'warn':
                console.warn(`%c${formatted}`, style);
                break;
            default:
                console.log(`%c${formatted}`, style);
        }
    }

    error(category: DebugCategory, message: string): void {
        this.log(category, message, 'error');
    }

    warn(category: DebugCategory, message: string): void {
        this.log(category, message, 'warn');
    }

    info(category: DebugCategory, message: string): void {
        this.log(category, message, 'info');
    }

    verbose(category: DebugCategory, message: string): void {
        this.log(category, message, 'verbose');
    }

    debug(category: DebugCategory, message: string): void {
        this.log(category, message, 'debug');
    }

    // Utility for logging objects
    logObject(category: DebugCategory, label: string, obj: any, level: DebugLevel = 'debug'): void {
        if (!this.shouldLog(level)) return;

        const style = categoryStyles[category];
        console.log(`%c${this.formatMessage(category, label)}`, style);
        console.log(obj);
    }
}

// Singleton instance
export const debug = new DebugLogger();
