import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '@/services/api';
import type { TestExecutionResult } from '@shared/types';

export default function Reports() {
    const [searchParams] = useSearchParams();
    const executionId = searchParams.get('executionId');

    const [execution, setExecution] = useState<TestExecutionResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (executionId) {
            loadExecution(executionId);
        } else {
            setIsLoading(false);
        }
    }, [executionId]);

    const loadExecution = async (id: string) => {
        try {
            setIsLoading(true);
            setError('');
            const data = await apiClient.getExecutionResult(id);
            setExecution(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load execution');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'passed': return 'text-green-400 bg-green-900 border-green-700';
            case 'failed': return 'text-red-400 bg-red-900 border-red-700';
            case 'running': return 'text-blue-400 bg-blue-900 border-blue-700';
            default: return 'text-gray-400 bg-gray-900 border-gray-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'passed': return '✓';
            case 'failed': return '✗';
            case 'running': return '◷';
            default: return '○';
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Test Execution Reports</h1>

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
                    <p className="text-sm text-gray-400 mt-4">Loading execution results...</p>
                </div>
            ) : !execution ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                    <p className="text-sm text-gray-400">No execution selected. Run a test to see results here.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Execution Header */}
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-white mb-2">Execution Results</h2>
                                <p className="text-sm text-gray-400">ID: {execution.id}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-lg border font-bold ${getStatusColor(execution.status)}`}>
                                {getStatusIcon(execution.status)} {execution.status.toUpperCase()}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-gray-900 p-4 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Suite ID</p>
                                <p className="text-sm text-white font-medium">{execution.suiteId.substring(0, 8)}...</p>
                            </div>
                            <div className="bg-gray-900 p-4 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Duration</p>
                                <p className="text-sm text-white font-medium">
                                    {execution.duration ? `${(execution.duration / 1000).toFixed(2)}s` : 'N/A'}
                                </p>
                            </div>
                            <div className="bg-gray-900 p-4 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Screenshots</p>
                                <p className="text-white font-medium">{execution.screenshots.length}</p>
                            </div>
                            <div className="bg-gray-900 p-4 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Log Entries</p>
                                <p className="text-white font-medium">{execution.logs.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {execution.error && (
                        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                            <h3 className="text-base font-bold text-white mb-4">Error Details</h3>
                            <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                                <pre className="text-sm text-red-200 whitespace-pre-wrap font-mono">
                                    {execution.error}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Logs Section */}
                    {execution.logs.length > 0 && (
                        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                            <h3 className="text-base font-bold text-white mb-4">Console Logs</h3>
                            <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
                                {execution.logs.map((log, idx) => (
                                    <div key={idx} className="text-sm text-gray-300 font-mono py-1 border-b border-gray-800 last:border-0">
                                        <span className="text-gray-500 mr-2">[{idx + 1}]</span>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Screenshots Gallery */}
                    {execution.screenshots.length > 0 && (
                        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                            <h3 className="text-base font-bold text-white mb-4">Screenshots</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {execution.screenshots.map((screenshot, idx) => (
                                    <div key={idx} className="bg-gray-900 rounded-lg p-2">
                                        <div className="aspect-video bg-gray-700 rounded flex items-center justify-center mb-2">
                                            <img
                                                src={screenshot}
                                                alt={`Screenshot ${idx + 1}`}
                                                className="max-w-full max-h-full rounded"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                            <div className="text-gray-500 text-xs">
                                                Screenshot {idx + 1}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 text-center">
                                            Step {idx + 1}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
