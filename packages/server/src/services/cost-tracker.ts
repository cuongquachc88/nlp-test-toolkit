/**
 * Cost Tracker Service
 * Tracks cumulative LLM usage costs
 */

import * as fs from 'fs';
import * as path from 'path';

interface CostEntry {
    timestamp: Date;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
}

class CostTracker {
    private entries: CostEntry[] = [];
    private logPath: string;

    constructor() {
        this.logPath = path.join(process.cwd(), 'cost-tracker.json');
        this.loadFromFile();
    }

    /**
     * Add a new cost entry
     */
    addEntry(entry: Omit<CostEntry, 'timestamp'>) {
        const fullEntry: CostEntry = {
            ...entry,
            timestamp: new Date(),
        };

        this.entries.push(fullEntry);
        this.saveToFile();

        console.log(`\n💰 Cost Added: $${entry.cost.toFixed(6)} | Total Session: $${this.getSessionTotal().toFixed(6)}`);
    }

    /**
     * Get total cost for current session
     */
    getSessionTotal(): number {
        return this.entries.reduce((sum, entry) => sum + entry.cost, 0);
    }

    /**
     * Get total tokens used
     */
    getTotalTokens(): number {
        return this.entries.reduce((sum, entry) => sum + entry.totalTokens, 0);
    }

    /**
     * Get statistics
     */
    getStats() {
        const total = this.getSessionTotal();
        const totalTokens = this.getTotalTokens();
        const requestCount = this.entries.length;
        const avgCostPerRequest = requestCount > 0 ? total / requestCount : 0;

        return {
            totalCost: total,
            totalTokens,
            requestCount,
            avgCostPerRequest,
            entries: this.entries,
        };
    }

    /**
     * Save to file
     */
    private saveToFile() {
        try {
            fs.writeFileSync(this.logPath, JSON.stringify(this.entries, null, 2));
        } catch (error) {
            console.error('Failed to save cost tracker:', error);
        }
    }

    /**
     * Load from file
     */
    private loadFromFile() {
        try {
            if (fs.existsSync(this.logPath)) {
                const data = fs.readFileSync(this.logPath, 'utf-8');
                this.entries = JSON.parse(data);
                console.log(`📊 Loaded ${this.entries.length} cost entries. Total: $${this.getSessionTotal().toFixed(6)}`);
            }
        } catch (error) {
            console.error('Failed to load cost tracker:', error);
            this.entries = [];
        }
    }

    /**
     * Reset tracking
     */
    reset() {
        this.entries = [];
        this.saveToFile();
        console.log('💰 Cost tracker reset');
    }
}

// Singleton instance
export const costTracker = new CostTracker();
