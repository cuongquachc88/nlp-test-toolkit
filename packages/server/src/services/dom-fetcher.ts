/**
 * DOM Fetcher Service
 * Fetches and analyzes webpage DOM structure to help LLM generate better selectors
 */

import { chromium, type Browser, type Page } from 'playwright';

interface DOMInfo {
    url: string;
    title: string;
    selectors: {
        testIds: string[];
        ids: string[];
        ariaLabels: string[];
        buttons: Array<{ text: string; selector: string }>;
        inputs: Array<{ type: string; name?: string; placeholder?: string; selector: string }>;
        links: Array<{ text: string; href: string; selector: string }>;
    };
    cachedAt: Date;
}

export class DOMFetcher {
    private cache: Map<string, DOMInfo> = new Map();
    private cacheDuration = 5 * 60 * 1000; // 5 minutes
    private browser: Browser | null = null;

    /**
     * Get or fetch DOM information for a URL
     */
    async getDOMInfo(url: string): Promise<DOMInfo | null> {
        try {
            // Check cache first
            const cached = this.cache.get(url);
            if (cached && Date.now() - cached.cachedAt.getTime() < this.cacheDuration) {
                console.log(`[DOM Fetcher] Using cached DOM info for ${url}`);
                return cached;
            }

            console.log(`[DOM Fetcher] Fetching DOM info for ${url}...`);
            const info = await this.fetchDOMInfo(url);

            if (info) {
                this.cache.set(url, info);
            }

            return info;
        } catch (error) {
            console.error(`[DOM Fetcher] Error fetching DOM for ${url}:`, error);
            return null;
        }
    }

    /**
     * Fetch DOM information using Playwright
     */
    private async fetchDOMInfo(url: string): Promise<DOMInfo | null> {
        let page: Page | null = null;

        try {
            // Launch browser if not already running
            if (!this.browser) {
                this.browser = await chromium.launch({ headless: true });
            }

            page = await this.browser.newPage();
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

            // Extract DOM information
            const domInfo = await page.evaluate(() => {
                const info: any = {
                    testIds: [],
                    ids: [],
                    ariaLabels: [],
                    buttons: [],
                    inputs: [],
                    links: [],
                };

                // Get all elements with data-testid
                document.querySelectorAll('[data-testid]').forEach(el => {
                    const testId = el.getAttribute('data-testid');
                    if (testId) info.testIds.push(testId);
                });

                // Get all elements with id
                document.querySelectorAll('[id]').forEach(el => {
                    const id = el.getAttribute('id');
                    if (id && !id.match(/^[0-9]+$/)) { // Skip numeric IDs (likely generated)
                        info.ids.push(id);
                    }
                });

                // Get all elements with aria-label
                document.querySelectorAll('[aria-label]').forEach(el => {
                    const label = el.getAttribute('aria-label');
                    if (label) info.ariaLabels.push(label);
                });

                // Get buttons
                document.querySelectorAll('button, [role="button"]').forEach((el, idx) => {
                    const text = el.textContent?.trim() || '';
                    const testId = el.getAttribute('data-testid');
                    const id = el.getAttribute('id');
                    const ariaLabel = el.getAttribute('aria-label');

                    let selector = 'button';
                    if (testId) selector = `[data-testid="${testId}"]`;
                    else if (id) selector = `#${id}`;
                    else if (ariaLabel) selector = `[aria-label="${ariaLabel}"]`;
                    else if (text) selector = `button:has-text("${text.substring(0, 50)}")`;

                    if (text.length > 0 && text.length < 100) {
                        info.buttons.push({ text, selector });
                    }
                });

                // Get inputs
                document.querySelectorAll('input, textarea').forEach(el => {
                    const input = el as HTMLInputElement;
                    const type = input.type || 'text';
                    const name = input.name;
                    const placeholder = input.placeholder;
                    const testId = input.getAttribute('data-testid');
                    const id = input.id;

                    let selector = 'input';
                    if (testId) selector = `[data-testid="${testId}"]`;
                    else if (id) selector = `#${id}`;
                    else if (name) selector = `input[name="${name}"]`;
                    else if (type) selector = `input[type="${type}"]`;

                    info.inputs.push({ type, name, placeholder, selector });
                });

                // Get links (limited to first 20)
                Array.from(document.querySelectorAll('a[href]')).slice(0, 20).forEach(el => {
                    const link = el as HTMLAnchorElement;
                    const text = link.textContent?.trim() || '';
                    const href = link.href;

                    if (text.length > 0 && text.length < 100) {
                        info.links.push({ text, href, selector: `a[href="${href}"]` });
                    }
                });

                return info;
            });

            const title = await page.title();

            await page.close();

            return {
                url,
                title,
                selectors: domInfo,
                cachedAt: new Date(),
            };
        } catch (error) {
            if (page) await page.close();
            throw error;
        }
    }

    /**
     * Format DOM info for LLM context (condensed with intelligent filtering)
     */
    formatForLLM(domInfo: DOMInfo): string {
        const parts: string[] = [];

        parts.push(`PAGE: ${domInfo.title} | URL: ${domInfo.url}`);

        // Score and filter elements by importance
        const scoredElements = this.scoreAndFilterElements(domInfo);

        // Group by type and format
        const grouped: Record<string, string[]> = {
            testIds: [],
            buttons: [],
            inputs: [],
            links: []
        };

        scoredElements.forEach(el => {
            if (el.type === 'testid') {
                grouped.testIds.push(el.display);
            } else if (el.type === 'button') {
                grouped.buttons.push(el.display);
            } else if (el.type === 'input') {
                grouped.inputs.push(el.display);
            } else if (el.type === 'link') {
                grouped.links.push(el.display);
            }
        });

        // Add to context, max 3-5 per type
        if (grouped.testIds.length > 0) {
            parts.push(`TestIDs: ${grouped.testIds.slice(0, 5).join(', ')}`);
        }
        if (grouped.buttons.length > 0) {
            parts.push(`Buttons: ${grouped.buttons.slice(0, 5).join(', ')}`);
        }
        if (grouped.inputs.length > 0) {
            parts.push(`Inputs: ${grouped.inputs.slice(0, 5).join(', ')}`);
        }
        if (grouped.links.length > 0) {
            parts.push(`Links: ${grouped.links.slice(0, 3).join(', ')}`);
        }

        return parts.join(' | ');
    }

    /**
     * Score DOM elements by importance and return top N
     */
    private scoreAndFilterElements(domInfo: DOMInfo): Array<{
        type: string;
        display: string;
        score: number;
    }> {
        const elements: Array<{ type: string; display: string; score: number }> = [];

        // Score testIds (highest priority)
        domInfo.selectors.testIds.forEach(testId => {
            elements.push({
                type: 'testid',
                display: testId,
                score: this.scoreElement({
                    hasTestId: true,
                    text: testId,
                    elementType: 'testid'
                })
            });
        });

        // Score buttons
        domInfo.selectors.buttons.forEach(btn => {
            elements.push({
                type: 'button',
                display: `"${btn.text}"`,
                score: this.scoreElement({
                    hasTestId: btn.selector.includes('data-testid'),
                    hasId: btn.selector.includes('#'),
                    hasAriaLabel: btn.selector.includes('aria-label'),
                    text: btn.text,
                    elementType: 'button'
                })
            });
        });

        // Score inputs
        domInfo.selectors.inputs.forEach(input => {
            const display = input.placeholder
                ? `${input.type}[placeholder="${input.placeholder}"]`
                : input.name
                    ? `${input.type}[name="${input.name}"]`
                    : `${input.type}`;

            elements.push({
                type: 'input',
                display,
                score: this.scoreElement({
                    hasTestId: input.selector.includes('data-testid'),
                    hasId: input.selector.includes('#'),
                    hasName: !!input.name,
                    hasPlaceholder: !!input.placeholder,
                    text: input.placeholder || input.name || '',
                    elementType: 'input'
                })
            });
        });

        // Score links (lower priority, only nav-like links)
        domInfo.selectors.links
            .filter(link => this.isNavigationLink(link.text))
            .forEach(link => {
                elements.push({
                    type: 'link',
                    display: `"${link.text}"`,
                    score: this.scoreElement({
                        text: link.text,
                        elementType: 'link'
                    })
                });
            });

        // Sort by score descending and return top 15
        return elements
            .sort((a, b) => b.score - a.score)
            .slice(0, 15);
    }

    /**
     * Score an element based on importance factors
     */
    private scoreElement(factors: {
        hasTestId?: boolean;
        hasId?: boolean;
        hasAriaLabel?: boolean;
        hasName?: boolean;
        hasPlaceholder?: boolean;
        text?: string;
        elementType: string;
    }): number {
        let score = 0;

        // Testability markers (highest value)
        if (factors.hasTestId) score += 100;
        if (factors.hasId) score += 50;
        if (factors.hasAriaLabel) score += 40;
        if (factors.hasName) score += 30;
        if (factors.hasPlaceholder) score += 20;

        // Element type importance
        const typeScores: Record<string, number> = {
            'testid': 90,
            'button': 60,
            'input': 50,
            'link': 20
        };
        score += typeScores[factors.elementType] || 0;

        // Text quality
        if (factors.text) {
            const text = factors.text.toLowerCase();

            // Boost for action words
            const actionWords = ['login', 'submit', 'sign', 'register', 'search', 'add', 'delete', 'edit', 'save', 'cancel', 'confirm'];
            if (actionWords.some(word => text.includes(word))) {
                score += 30;
            }

            // Boost for navigation words
            const navWords = ['home', 'about', 'contact', 'blog', 'products', 'services'];
            if (navWords.some(word => text.includes(word))) {
                score += 15;
            }

            // Penalize generic/vague text
            const genericWords = ['click here', 'link', 'button', 'div', 'span'];
            if (genericWords.some(word => text === word)) {
                score -= 20;
            }

            // Penalize very long text (likely paragraph, not action)
            if (text.length > 50) {
                score -= 10;
            }
        }

        return score;
    }

    /**
     * Check if a link text suggests it's a navigation link
     */
    private isNavigationLink(text: string): boolean {
        const navKeywords = [
            'home', 'about', 'contact', 'blog', 'products', 'services',
            'login', 'sign', 'register', 'dashboard', 'profile', 'settings',
            'docs', 'documentation', 'help', 'support', 'faq',
            'pricing', 'features', 'team', 'careers'
        ];

        const lowerText = text.toLowerCase();

        // Must be short (navigation labels are concise)
        if (text.length > 30) return false;

        // Must contain a nav keyword
        return navKeywords.some(keyword => lowerText.includes(keyword));
    }


    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
        this.cache.clear();
    }
}

// Singleton instance
export const domFetcher = new DOMFetcher();
