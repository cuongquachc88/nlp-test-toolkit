import React, { useState } from 'react';
import type { PlaywrightCommand, CommandExecutionResult } from '@shared/types';

interface CommandCardProps {
    command: PlaywrightCommand;
    index: number;
    onEdit?: (index: number, command: PlaywrightCommand) => void;
    onDelete?: (index: number) => void;
    onExecute?: (index: number, command: PlaywrightCommand) => Promise<CommandExecutionResult>;
}

// Helper function to get command-specific configuration
const getCommandConfig = (type: PlaywrightCommand['type']) => {
    switch (type) {
        case 'navigate':
            return {
                icon: '🌐',
                title: 'Navigate to Website',
                bgColor: 'bg-blue-900',
                borderColor: 'border-blue-700',
                iconBg: 'bg-blue-700',
                textColor: 'text-blue-200',
            };
        case 'click':
            return {
                icon: '🖱️',
                title: 'Click Element',
                bgColor: 'bg-purple-900',
                borderColor: 'border-purple-700',
                iconBg: 'bg-purple-700',
                textColor: 'text-purple-200',
            };
        case 'type':
        case 'fill':
            return {
                icon: type === 'type' ? '⌨️' : '✏️',
                title: 'Type Text',
                bgColor: 'bg-green-900',
                borderColor: 'border-green-700',
                iconBg: 'bg-green-700',
                textColor: 'text-green-200',
            };
        case 'assert':
            return {
                icon: '✓',
                title: 'Verify',
                bgColor: 'bg-yellow-900',
                borderColor: 'border-yellow-700',
                iconBg: 'bg-yellow-700',
                textColor: 'text-yellow-200',
            };
        case 'wait':
            return {
                icon: '⏱️',
                title: 'Wait',
                bgColor: 'bg-gray-900',
                borderColor: 'border-gray-700',
                iconBg: 'bg-gray-700',
                textColor: 'text-gray-200',
            };
        case 'screenshot':
            return {
                icon: '📸',
                title: 'Take Screenshot',
                bgColor: 'bg-pink-900',
                borderColor: 'border-pink-700',
                iconBg: 'bg-pink-700',
                textColor: 'text-pink-200',
            };
        case 'select':
            return {
                icon: '📋',
                title: 'Select Option',
                bgColor: 'bg-indigo-900',
                borderColor: 'border-indigo-700',
                iconBg: 'bg-indigo-700',
                textColor: 'text-indigo-200',
            };
        case 'hover':
            return {
                icon: '👆',
                title: 'Hover Over',
                bgColor: 'bg-orange-900',
                borderColor: 'border-orange-700',
                iconBg: 'bg-orange-700',
                textColor: 'text-orange-200',
            };
        case 'press':
            return {
                icon: '⌨️',
                title: 'Press Key',
                bgColor: 'bg-teal-900',
                borderColor: 'border-teal-700',
                iconBg: 'bg-teal-700',
                textColor: 'text-teal-200',
            };
        default:
            return {
                icon: '📄',
                title: type,
                bgColor: 'bg-gray-900',
                borderColor: 'border-gray-700',
                iconBg: 'bg-gray-700',
                textColor: 'text-gray-200',
            };
    }
};

export function CommandCard({ command, index, onEdit, onDelete, onExecute }: CommandCardProps) {
    const config = getCommandConfig(command.type);
    const [executionState, setExecutionState] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [executionResult, setExecutionResult] = useState<CommandExecutionResult | null>(null);

    const handleExecute = async () => {
        if (!onExecute) return;

        setExecutionState('running');
        setExecutionResult(null);

        try {
            const result = await onExecute(index, command);
            setExecutionResult(result);
            setExecutionState(result.success ? 'success' : 'error');
        } catch (error) {
            setExecutionResult({
                success: false,
                error: error instanceof Error ? error.message : 'Execution failed',
            });
            setExecutionState('error');
        }
    };

    // Dynamic border color based on execution state
    const borderColor = executionState === 'success'
        ? 'border-green-500'
        : executionState === 'error'
            ? 'border-red-500'
            : executionState === 'running'
                ? 'border-yellow-500'
                : config.borderColor;

    return (
        <div className={`p-3 rounded-lg border-2 ${config.bgColor} ${borderColor} transition-colors`}>
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center text-lg`}>
                    {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-semibold ${config.textColor}`}>
                                {index + 1}. {config.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {command.description || 'No description'}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 flex-shrink-0">
                            {onExecute && (
                                <button
                                    onClick={handleExecute}
                                    disabled={executionState === 'running'}
                                    className={`p-1 rounded transition-colors ${executionState === 'running'
                                        ? 'text-yellow-400 bg-yellow-900'
                                        : executionState === 'success'
                                            ? 'text-green-400 bg-green-900 hover:bg-green-800'
                                            : executionState === 'error'
                                                ? 'text-red-400 bg-red-900 hover:bg-red-800'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                        }`}
                                    title="Try execute this command"
                                >
                                    {executionState === 'running' ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : executionState === 'success' ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : executionState === 'error' ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(index, command)}
                                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                    title="Edit command"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(index)}
                                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                                    title="Delete command"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    {(command.selector || command.value) && (
                        <div className="mt-2 space-y-1">
                            {command.selector && (
                                <div className="text-xs">
                                    <span className="text-gray-500">Selector:</span>{' '}
                                    <code className="text-gray-300 bg-gray-800 px-1 py-0.5 rounded">
                                        {command.selector}
                                    </code>
                                </div>
                            )}
                            {command.value && (
                                <div className="text-xs">
                                    <span className="text-gray-500">Value:</span>{' '}
                                    <code className="text-gray-300 bg-gray-800 px-1 py-0.5 rounded">
                                        {command.value}
                                    </code>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Execution Results */}
                    {executionResult && (
                        <div className={`mt-3 p-2 rounded text-xs ${executionResult.success
                                ? 'bg-green-900 border border-green-700'
                                : 'bg-red-900 border border-red-700'
                            }`}>
                            <div className="flex items-start gap-2">
                                <div className="flex-shrink-0">
                                    {executionResult.success ? (
                                        <span className="text-green-400">✓</span>
                                    ) : (
                                        <span className="text-red-400">✗</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold mb-1">
                                        {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                                    </div>
                                    {executionResult.output && (
                                        <div className="text-gray-300 mb-1">
                                            <span className="text-gray-400">Output:</span> {executionResult.output}
                                        </div>
                                    )}
                                    {executionResult.error && (
                                        <div className="text-red-300">
                                            <span className="text-red-400">Error:</span> {executionResult.error}
                                        </div>
                                    )}
                                    {executionResult.duration !== undefined && (
                                        <div className="text-gray-400 mt-1">
                                            Duration: {executionResult.duration}ms
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
