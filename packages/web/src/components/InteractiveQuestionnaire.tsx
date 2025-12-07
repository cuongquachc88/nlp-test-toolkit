import { useState } from 'react';

interface InteractiveQuestionnaireProps {
    url?: string;
    onSubmit: (refinedPrompt: string) => void;
    onCancel?: () => void;
}

const SEO_OPTIONS = [
    { id: 'title', label: 'Page title is present and contains specific text' },
    { id: 'meta-desc', label: 'Meta description exists and is non-empty' },
    { id: 'canonical', label: 'Canonical link (<link rel="canonical">) is present' },
    { id: 'h1', label: 'H1 heading exists and is unique' },
    { id: 'html-lang', label: 'HTML lang attribute (<html lang="...">) is set' },
    { id: 'robots-meta', label: 'Meta robots tag allows indexing' },
    { id: 'og-tags', label: 'Open Graph meta tags (og:title, og:description, og:image)' },
    { id: 'twitter-card', label: 'Twitter Card meta tags' },
    { id: 'json-ld', label: 'JSON-LD structured data is present' },
    { id: 'favicon', label: 'Favicon is accessible' },
    { id: 'robots-txt', label: 'Robots.txt file is accessible' },
    { id: 'sitemap', label: 'Sitemap.xml file is accessible' },
];

const PAGE_CHECK_OPTIONS = [
    { id: 'h1-match', label: 'H1 heading equals the category name' },
    { id: 'title-match', label: 'Page title contains the category name' },
    { id: 'url-match', label: 'URL matches expected pattern (e.g., /category-name)' },
    { id: 'content-visible', label: 'Content list/grid is visible' },
    { id: 'breadcrumbs', label: 'Breadcrumbs are present' },
    { id: 'no-404', label: 'Page loads without 404 error' },
];

export function InteractiveQuestionnaire({ url, onSubmit, onCancel }: InteractiveQuestionnaireProps) {
    const [seoChecks, setSeoChecks] = useState<Set<string>>(new Set());
    const [navLinks, setNavLinks] = useState('');
    const [pageChecks, setPageChecks] = useState<Set<string>>(new Set());
    const [customSeoCheck, setCustomSeoCheck] = useState('');
    const [customPageCheck, setCustomPageCheck] = useState('');

    const toggleSeoCheck = (id: string) => {
        const newSet = new Set(seoChecks);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSeoChecks(newSet);
    };

    const togglePageCheck = (id: string) => {
        const newSet = new Set(pageChecks);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setPageChecks(newSet);
    };

    const handleQuickStart = () => {
        // Set reasonable defaults
        setSeoChecks(new Set(['title', 'h1', 'meta-desc']));
        setPageChecks(new Set(['h1-match', 'no-404']));
        setNavLinks('Blog\nAbout\nContact');
    };

    const generateRefinedPrompt = (): string => {
        const parts: string[] = [];
        const baseUrl = url || 'the website';

        // Navigation
        parts.push(`Navigate to ${baseUrl}`);

        // SEO checks on homepage
        const seoChecksList: string[] = [];
        if (seoChecks.has('title')) seoChecksList.push('verify page title is present and non-empty');
        if (seoChecks.has('meta-desc')) seoChecksList.push('verify meta description exists');
        if (seoChecks.has('canonical')) seoChecksList.push('verify canonical link is present');
        if (seoChecks.has('h1')) seoChecksList.push('verify H1 heading exists and is unique');
        if (seoChecks.has('html-lang')) seoChecksList.push('verify HTML lang attribute is set');
        if (seoChecks.has('robots-meta')) seoChecksList.push('verify meta robots tag allows indexing');
        if (seoChecks.has('og-tags')) seoChecksList.push('verify Open Graph meta tags are present');
        if (seoChecks.has('twitter-card')) seoChecksList.push('verify Twitter Card meta tags are present');
        if (seoChecks.has('json-ld')) seoChecksList.push('verify JSON-LD structured data exists');
        if (seoChecks.has('favicon')) seoChecksList.push('verify favicon is accessible');
        if (seoChecks.has('robots-txt')) seoChecksList.push('check robots.txt is accessible');
        if (seoChecks.has('sitemap')) seoChecksList.push('check sitemap.xml is accessible');
        if (customSeoCheck.trim()) seoChecksList.push(customSeoCheck.trim());

        if (seoChecksList.length > 0) {
            parts.push(...seoChecksList.map(check => check.charAt(0).toUpperCase() + check.slice(1)));
        }

        // Navigation links testing
        const links = navLinks.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (links.length > 0) {
            links.forEach(link => {
                parts.push(`Click the "${link}" link in navigation`);
                parts.push('Wait for page to load');

                // Page checks
                const pageChecksList: string[] = [];
                if (pageChecks.has('h1-match')) pageChecksList.push(`verify H1 heading contains "${link}"`);
                if (pageChecks.has('title-match')) pageChecksList.push(`verify page title contains "${link}"`);
                if (pageChecks.has('url-match')) pageChecksList.push('verify URL changed correctly');
                if (pageChecks.has('content-visible')) pageChecksList.push('verify content is visible');
                if (pageChecks.has('breadcrumbs')) pageChecksList.push('verify breadcrumbs are present');
                if (pageChecks.has('no-404')) pageChecksList.push('verify page loaded successfully');
                if (customPageCheck.trim()) pageChecksList.push(customPageCheck.trim());

                if (pageChecksList.length > 0) {
                    parts.push(...pageChecksList.map(check => check.charAt(0).toUpperCase() + check.slice(1)));
                }
            });
        }

        return parts.join('\n');
    };

    const handleSubmit = () => {
        const prompt = generateRefinedPrompt();
        if (prompt.trim()) {
            onSubmit(prompt);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-4 border border-yellow-600">
            <div className="flex items-start gap-2 mb-4">
                <span className="text-2xl">⚠️</span>
                <div>
                    <h3 className="text-base font-bold text-white">Your request needs more details</h3>
                    <p className="text-xs text-gray-300 mt-1">
                        Fill out this questionnaire to generate specific test commands:
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Question 1: SEO Checkpoints */}
                <div className="bg-gray-900 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        📝 Question 1: What SEO checkpoints do you want to verify?
                    </h4>
                    <p className="text-xs text-gray-400 mb-3">Select all that apply:</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {SEO_OPTIONS.map(option => (
                            <label key={option.id} className="flex items-start gap-2 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
                                <input
                                    type="checkbox"
                                    checked={seoChecks.has(option.id)}
                                    onChange={() => toggleSeoCheck(option.id)}
                                    className="mt-0.5 flex-shrink-0 cursor-pointer"
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                        <div className="mt-2 pt-2 border-t border-gray-700">
                            <label className="text-xs text-gray-400 block mb-1">Other (custom check):</label>
                            <input
                                type="text"
                                value={customSeoCheck}
                                onChange={(e) => setCustomSeoCheck(e.target.value)}
                                placeholder="e.g., verify author meta tag is present"
                                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Question 2: Navigation Links */}
                <div className="bg-gray-900 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        🔗 Question 2: What navigation links do you want to test?
                    </h4>
                    <p className="text-xs text-gray-400 mb-2">Enter each link text on a new line:</p>
                    <textarea
                        value={navLinks}
                        onChange={(e) => setNavLinks(e.target.value)}
                        placeholder="Blog&#10;About&#10;Contact&#10;Products"
                        rows={4}
                        className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">💡 Tip: Use exact link text as it appears on your site</p>
                </div>

                {/* Question 3: Page Verification */}
                <div className="bg-gray-900 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        ✅ Question 3: What should I verify on each category page?
                    </h4>
                    <p className="text-xs text-gray-400 mb-3">Select verification checks:</p>
                    <div className="space-y-2">
                        {PAGE_CHECK_OPTIONS.map(option => (
                            <label key={option.id} className="flex items-start gap-2 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
                                <input
                                    type="checkbox"
                                    checked={pageChecks.has(option.id)}
                                    onChange={() => togglePageCheck(option.id)}
                                    className="mt-0.5 flex-shrink-0 cursor-pointer"
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                        <div className="mt-2 pt-2 border-t border-gray-700">
                            <label className="text-xs text-gray-400 block mb-1">Other (custom check):</label>
                            <input
                                type="text"
                                value={customPageCheck}
                                onChange={(e) => setCustomPageCheck(e.target.value)}
                                placeholder="e.g., verify social share buttons are visible"
                                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleQuickStart}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        💡 Quick Start
                    </button>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={seoChecks.size === 0 && navLinks.trim() === ''}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        🚀 Generate Test Commands
                    </button>
                </div>
            </div>
        </div>
    );
}
