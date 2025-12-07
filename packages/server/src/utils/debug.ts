/**
 * Centralized Debug Utility
 * Provides consistent, categorized, color-coded debug logging with environment control
 */

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};

export type DebugCategory =
    | 'server'
    | 'api'
    | 'nlp'
    | 'llm'
    | 'chat'
    | 'db'
    | 'cost'
    | 'dom'
    | 'test';

export type DebugLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

const categoryColors: Record<DebugCategory, string> = {
    server: colors.green,
    api: colors.cyan,
    nlp: colors.blue,
    llm: colors.magenta,
    chat: colors.yellow,
    db: colors.blue,
    cost: colors.green,
    dom: colors.cyan,
    test: colors.magenta,
};

const levelPriority: Record<DebugLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
};

class DebugLogger {
    private level: DebugLevel;

    constructor() {
        // Always enabled, controlled by level only
        // Set DEBUG_LEVEL to control verbosity: error|warn|info|verbose|debug
        this.level = (process.env.DEBUG_LEVEL as DebugLevel) || 'info';
    }

    private shouldLog(level: DebugLevel): boolean {
        return levelPriority[level] <= levelPriority[this.level];
    }

    private formatMessage(category: DebugCategory, message: string, level: DebugLevel = 'info'): string {
        const color = categoryColors[category] || colors.gray;
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = `${colors.gray}[${timestamp}]${colors.reset} ${color}[${category.toUpperCase()}]${colors.reset}`;

        return `${prefix} ${message}`;
    }

    log(category: DebugCategory, message: string, level: DebugLevel = 'info'): void {
        if (!this.shouldLog(level)) return;

        const formatted = this.formatMessage(category, message, level);

        switch (level) {
            case 'error':
                console.error(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            default:
                console.log(formatted);
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

        this.log(category, `${label}:`, level);
        console.log(JSON.stringify(obj, null, 2));
    }

    // Utility for section headers
    section(category: DebugCategory, title: string): void {
        if (!this.shouldLog('verbose')) return;

        const color = categoryColors[category] || colors.gray;
        console.log(`\n${color}=== ${title} ===${colors.reset}`);
    }
}

// Singleton instance
export const debug = new DebugLogger();
