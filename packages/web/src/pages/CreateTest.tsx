import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';
import type { PlaywrightCommand } from '@shared/types';
import { CommandList } from '@/components/CommandList';
import { apiClient } from '@/services/api';
import ReactMarkdown from 'react-markdown';


type ViewMode = 'visual' | 'code';

// Helper function to extract URL from user messages


function generateCodePreview(commands: PlaywrightCommand[]): string {
    if (!commands || commands.length === 0) {
        return `import { test, expect } from '@playwright/test';

test('Generated Test', async ({ page }) => {
    // No commands yet
}); `;
    }

    const commandsCode = commands.map(cmd => {
        switch (cmd.type) {
            case 'navigate':
                return `    await page.goto('${cmd.value}'); `;
            case 'click':
                return `    await page.locator('${cmd.selector}').click(); `;
            case 'fill':
            case 'type':
                return `    await page.locator('${cmd.selector}').fill('${cmd.value}'); `;
            case 'assert':
                return `    await expect(page.locator('${cmd.selector}')).toContainText('${cmd.value}'); `;
            case 'wait':
                if (cmd.selector) {
                    return `    await page.waitForSelector('${cmd.selector}'); `;
                }
                return `    await page.waitForTimeout(${cmd.value || 1000}); `;
            case 'screenshot':
                return `    await page.screenshot({ path: 'screenshot.png' }); `;
            default:
                return `    // ${cmd.type}: ${cmd.description || 'Unknown command'}`;
        }
    }).join('\n');

    return `import { test, expect } from '@playwright/test';

test('Generated Test', async ({ page }) => {
${commandsCode}
});`;
}

export default function CreateTest() {
    const navigate = useNavigate();
    // const location = useLocation();  // Reserved for future edit functionality
    const { messages, isLoading, sendMessage } = useChat();

    const [input, setInput] = useState('');
    const [generatedCommands, setGeneratedCommands] = useState<PlaywrightCommand[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('visual');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [testName, setTestName] = useState('');
    const [testDescription, setTestDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Execution state
    const [isExecuting, setIsExecuting] = useState(false);

    // Command manipulation handlers
    const handleEditCommand = (index: number, command: PlaywrightCommand) => {
        // TODO: Open edit dialog
        console.log('Edit command:', index, command);
    };

    const handleDeleteCommand = (index: number) => {
        setGeneratedCommands(prev => prev.filter((_, i) => i !== index));
    };

    const handleExecuteCommand = async (_index: number, command: PlaywrightCommand) => {
        try {
            const result = await apiClient.executeCommand(command);
            return result;
        } catch (error) {
            console.error('Command execution error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Execution failed',
            };
        }
    };

    const handleRunAndSaveTest = () => {
        if (generatedCommands.length === 0) {
            alert('No commands to run');
            return;
        }
        setShowSaveDialog(true);
    };

    const handleExecuteFullTest = async () => {
        if (generatedCommands.length === 0) {
            alert('No commands to execute');
            return;
        }

        setIsExecuting(true);

        // Execute commands sequentially - this will trigger individual CommandCard executions
        for (let i = 0; i < generatedCommands.length; i++) {
            const command = generatedCommands[i];
            try {
                // Call the command execute handler which updates the card's internal state
                await handleExecuteCommand(i, command);
                // Small delay between executions for visual feedback
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                console.error(`Command ${i + 1} failed:`, error);
                // Continue to next command even if this one fails
            }
        }

        setIsExecuting(false);
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        await sendMessage(input);
        setInput('');
    };

    const handleSaveTest = async () => {
        if (!testName.trim()) {
            setSaveError('Please enter a test name');
            return;
        }

        setIsSaving(true);
        setSaveError('');

        try {
            const generatedCode = generateCodePreview(generatedCommands);
            await apiClient.createTestSuite({
                name: testName,
                description: testDescription,
                nlpInput: messages.map(m => m.role === 'user' ? m.content : '').filter(Boolean).join('\n'),
                generatedCode,
                llmProvider: 'openrouter',
                llmModel: 'claude-3-opus',
            });

            navigate('/suites');
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save test');
        } finally {
            setIsSaving(false);
        }
    };

    // Update commands when a new message with commands arrives
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.commands && lastMessage.commands.length > 0) {
            setGeneratedCommands(prev => [...prev, ...(lastMessage.commands || [])]);
        }
    }, [messages]);

    const generatedCode = generateCodePreview(generatedCommands);

    return (
        <div className="space-y-4 h-full">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Create Test</h1>
                {generatedCommands.length > 0 && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleExecuteFullTest}
                            disabled={isExecuting}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExecuting ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Executing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Execute Full Test
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleRunAndSaveTest}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Run & Save Test
                        </button>
                    </div>
                )}
            </div>

            <div className="flex gap-4 h-[calc(100vh-160px)]">
                {/* Chat Panel - 60% */}
                <div className="w-[60%] bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col">
                    <h2 className="text-base font-semibold text-gray-300 mb-3">
                        💬 Chat with AI
                    </h2>

                    {/* Messages */}
                    <div className="flex-1 bg-gray-900 rounded-lg p-3 mb-3 overflow-y-auto custom-scrollbar space-y-2">
                        {messages.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                <p className="mb-2">👋 Hi! Tell me what you want to test.</p>
                                <p className="text-xs">Example: "Go to google.com and search for playwright"</p>
                            </div>
                        )}
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`p-2 rounded-lg text-sm ${message.role === 'user'
                                    ? 'bg-primary-600 text-white ml-8'
                                    : 'bg-gray-700 text-gray-100 mr-8'
                                    }`}
                            >
                                {message.role === 'assistant' ? (
                                    <div>
                                        {message.commands && message.commands.length > 0 ? (
                                            <div>
                                                <p className="font-medium mb-1">
                                                    ✨ Got it! I've added {message.commands.length} test step{message.commands.length !== 1 ? 's' : ''}:
                                                </p>
                                                <ul className="text-xs space-y-0.5 ml-4">
                                                    {message.commands.map((cmd, i) => (
                                                        <li key={i}>• {cmd.description || cmd.type}</li>
                                                    ))}
                                                </ul>
                                                <p className="text-xs mt-2 text-gray-400">
                                                    Check the preview on the right →
                                                </p>
                                            </div>
                                        ) : message.questionnaire || message.content.includes('Your request needs more details') ? (
                                            // Show questionnaire message
                                            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                                                <p className="text-sm text-yellow-200">{message.content}</p>
                                            </div>
                                        ) : (
                                            // Priority 3: Show markdown for normal messages
                                            <ReactMarkdown
                                                className="prose prose-sm prose-invert max-w-none"
                                                components={{
                                                    h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-3 mb-2 text-white" {...props} />,
                                                    h4: ({ node, ...props }) => <h4 className="text-xs font-semibold mt-2 mb-1 text-gray-200" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="mb-2 space-y-1" {...props} />,
                                                    li: ({ node, children, ...props }) => {
                                                        const content = String(children);
                                                        // Check if it's a checkbox item
                                                        if (content.trim().match(/^\[ \]|^\[x\]/)) {
                                                            const isChecked = content.trim().startsWith('[x]');
                                                            const text = content.replace(/^\[[ x]\]\s*/, '');
                                                            return (
                                                                <li className="flex items-start gap-2" {...props}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        disabled
                                                                        className="mt-0.5 flex-shrink-0"
                                                                    />
                                                                    <span className="flex-1">{text}</span>
                                                                </li>
                                                            );
                                                        }
                                                        return <li className="ml-4" {...props}>{children}</li>;
                                                    },
                                                    code: ({ node, className, children, ...props }: any) => {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        const inline = !match;
                                                        return inline ? (
                                                            <code className="bg-gray-800 px-1 py-0.5 rounded text-xs font-mono text-blue-300" {...props}>{children}</code>
                                                        ) : (
                                                            <code className="block bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto" {...props}>{children}</code>
                                                        );
                                                    },
                                                    hr: ({ node, ...props }) => <hr className="my-3 border-gray-600" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                                                    em: ({ node, ...props }) => <em className="italic text-gray-300" {...props} />,
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                ) : (
                                    <p>{message.content}</p>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm p-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Describe what you want to test..."
                            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                            Send
                        </button>
                    </div>
                </div>

                {/* Preview Panel - 40% */}
                <div className="w-[40%] bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-gray-300">
                            📋 Test Preview
                        </h2>
                        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('visual')}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'visual'
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Visual
                            </button>
                            <button
                                onClick={() => setViewMode('code')}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'code'
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Code
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {viewMode === 'visual' ? (
                            <CommandList
                                commands={generatedCommands}
                                onEdit={handleEditCommand}
                                onDelete={handleDeleteCommand}
                                onExecute={handleExecuteCommand}
                            />
                        ) : (
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                                <code>{generatedCode}</code>
                            </pre>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
                        <h3 className="text-lg font-bold text-white mb-4">Save Test Suite</h3>

                        {saveError && (
                            <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg text-red-200 text-sm">
                                {saveError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Test Name *
                                </label>
                                <input
                                    type="text"
                                    value={testName}
                                    onChange={(e) => setTestName(e.target.value)}
                                    placeholder="e.g., Google Search Test"
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={testDescription}
                                    onChange={(e) => setTestDescription(e.target.value)}
                                    placeholder="What does this test do?"
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowSaveDialog(false);
                                        setTestName('');
                                        setTestDescription('');
                                        setSaveError('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveTest}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
