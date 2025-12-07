import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';

export default function Dashboard() {
    const [apiStatus, setApiStatus] = useState<{ status: string; adapters: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkStatus() {
            try {
                const status = await apiClient.getStatus();
                setApiStatus(status);
            } catch (error) {
                console.error('Failed to fetch API status:', error);
            } finally {
                setIsLoading(false);
            }
        }

        checkStatus();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400">Total Test Suites</h3>
                    <p className="text-3xl font-bold text-white mt-2">0</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400">Tests Passed</h3>
                    <p className="text-3xl font-bold text-green-500 mt-2">0</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400">Tests Failed</h3>
                    <p className="text-3xl font-bold text-red-500 mt-2">0</p>
                </div>
            </div>

            {/* API Status */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4">API Status</h2>
                {isLoading ? (
                    <p className="text-sm text-gray-400">Checking connection...</p>
                ) : apiStatus ? (
                    <div>
                        <p className="text-sm text-green-500 mb-2">✅ Connected to backend</p>
                        <p className="text-sm text-gray-400 mb-2">Available LLM Adapters:</p>
                        <div className="flex flex-wrap gap-2">
                            {apiStatus.adapters.map((adapter) => (
                                <span
                                    key={adapter}
                                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                                >
                                    {adapter}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-red-500">❌ Cannot connect to backend</p>
                )}
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Start</h2>
                <p className="text-sm text-gray-400 mb-4">
                    Get started by creating your first test using natural language!
                </p>
                <a
                    href="/create"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                    Create Your First Test
                </a>
            </div>
        </div>
    );
}
