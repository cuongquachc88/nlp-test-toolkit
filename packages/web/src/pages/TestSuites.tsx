import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import type { TestSuite, TestExecutionResult } from '@shared/types';

export default function TestSuites() {
    const navigate = useNavigate();
    const [suites, setSuites] = useState<TestSuite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [runningTest, setRunningTest] = useState<{ suiteId: string; executionId: string } | null>(null);
    const [executionStatus, setExecutionStatus] = useState<TestExecutionResult | null>(null);

    useEffect(() => {
        loadSuites();
    }, []);

    // Poll for execution status
    useEffect(() => {
        if (!runningTest) return;

        const pollInterval = setInterval(async () => {
            try {
                const execution = await apiClient.getExecutionResult(runningTest.executionId);
                setExecutionStatus(execution);

                // Stop polling if execution is complete
                if (execution.status === 'passed' || execution.status === 'failed') {
                    clearInterval(pollInterval);
                    setRunningTest(null);
                    // Navigate to reports
                    setTimeout(() => {
                        navigate(`/reports?executionId=${execution.id}`);
                    }, 1500);
                }
            } catch (err) {
                console.error('Failed to poll execution status:', err);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(pollInterval);
    }, [runningTest, navigate]);

    const loadSuites = async () => {
        try {
            setIsLoading(true);
            setError('');
            const data = await apiClient.getTestSuites();
            setSuites(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load test suites');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunTest = async (suite: TestSuite) => {
        try {
            const result = await apiClient.runTest(suite.id, {
                browser: 'chromium',
                headless: true,
            });

            setRunningTest({
                suiteId: suite.id,
                executionId: result.executionId,
            });
            setExecutionStatus(null);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to run test');
        }
    };

    const handleDeleteSuite = async (suiteId: string) => {
        if (!confirm('Are you sure you want to delete this test suite?')) return;

        try {
            await apiClient.deleteTestSuite(suiteId);
            loadSuites();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete test suite');
        }
    };

    const handleEditSuite = (suite: TestSuite) => {
        // Navigate to create page with suite data
        navigate('/create', { state: { editingSuite: suite } });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Test Suites</h1>
                <a
                    href="/create"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                    Create New Test
                </a>
            </div>

            {error && (
                <div className="p-4 bg-red-900 border border-red-700 rounded-lg">
                    <p className="text-sm text-red-200">{error}</p>
                </div>
            )}

            {isLoading ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="text-sm text-gray-400 mt-4">Loading test suites...</p>
                </div>
            ) : suites.length === 0 ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                    <p className="text-sm text-gray-400">No test suites yet. Create one to get started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suites.map((suite) => (
                        <div
                            key={suite.id}
                            className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-primary-600 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-white mb-1">{suite.name}</h3>
                                    <p className="text-sm text-gray-400">v{suite.version} • llmtestkit-{suite.version}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditSuite(suite)}
                                        className="text-gray-400 hover:text-primary-400 transition-colors"
                                        title="Edit suite"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSuite(suite.id)}
                                        className="text-gray-400 hover:text-red-400 transition-colors"
                                        title="Delete suite"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {suite.description && (
                                <p className="text-sm text-gray-300 mb-4">{suite.description}</p>
                            )}

                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                <span className="px-2 py-1 bg-gray-700 rounded">{suite.llmProvider}</span>
                                <span className="px-2 py-1 bg-gray-700 rounded">{suite.llmModel}</span>
                            </div>

                            <div className="text-xs text-gray-500 mb-4">
                                Created {new Date(suite.createdAt).toLocaleDateString()}
                            </div>

                            <button
                                onClick={() => handleRunTest(suite)}
                                disabled={runningTest?.suiteId === suite.id}
                                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {runningTest?.suiteId === suite.id ? 'Running...' : 'Run Test'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Running Test Modal */}
            {runningTest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-white mb-4">Test Execution</h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                <div>
                                    <p className="text-sm text-white font-medium">Running test...</p>
                                    <p className="text-sm text-gray-400">
                                        Status: {executionStatus?.status || 'starting'}
                                    </p>
                                </div>
                            </div>

                            {executionStatus && (
                                <div className="p-4 bg-gray-900 rounded-lg">
                                    <p className="text-sm text-gray-300">
                                        Execution ID: {executionStatus.id.substring(0, 8)}...
                                    </p>
                                </div>
                            )}

                            {executionStatus?.status === 'passed' && (
                                <div className="p-4 bg-green-900 border border-green-700 rounded-lg">
                                    <p className="text-green-200 font-medium">✓ Test Passed!</p>
                                    <p className="text-sm text-green-300 mt-1">
                                        Redirecting to results...
                                    </p>
                                </div>
                            )}

                            {executionStatus?.status === 'failed' && (
                                <div className="p-4 bg-red-900 border border-red-700 rounded-lg">
                                    <p className="text-sm text-red-200 font-medium">✗ Test Failed</p>
                                    <p className="text-sm text-red-300 mt-1">
                                        Redirecting to results...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
