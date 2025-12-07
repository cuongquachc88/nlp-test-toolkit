import React from 'react';
import { CommandCard } from './CommandCard';
import type { PlaywrightCommand, CommandExecutionResult } from '@shared/types';

interface CommandListProps {
    commands: PlaywrightCommand[];
    onEdit?: (index: number, command: PlaywrightCommand) => void;
    onDelete?: (index: number) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    onExecute?: (index: number, command: PlaywrightCommand) => Promise<CommandExecutionResult>;
    executionResults?: Map<number, CommandExecutionResult>;
}

export function CommandList({ commands, onEdit, onDelete, onReorder, onExecute, executionResults }: CommandListProps) {
    if (commands.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-400 text-sm">No commands yet</p>
                <p className="text-gray-500 text-xs mt-1">
                    Start chatting to generate test steps
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {commands.map((command, index) => (
                <CommandCard
                    key={index}
                    command={command}
                    index={index}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onExecute={onExecute}
                    externalExecutionResult={executionResults?.get(index) || null}
                />
            ))}
        </div>
    );
}
