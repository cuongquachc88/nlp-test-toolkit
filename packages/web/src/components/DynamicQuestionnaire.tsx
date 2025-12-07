import { useState } from 'react';
import type { Questionnaire, Question } from '@shared/types';

interface DynamicQuestionnaireProps {
    questionnaire: Questionnaire;
    url?: string;
    onSubmit: (refinedPrompt: string) => void;
}

export function DynamicQuestionnaire({ questionnaire, url, onSubmit }: DynamicQuestionnaireProps) {
    const [answers, setAnswers] = useState<Record<string, any>>({});

    const handleSingleChoice = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleMultiChoice = (questionId: string, optionValue: string, checked: boolean) => {
        setAnswers(prev => {
            const current = (prev[questionId] as string[]) || [];
            const updated = checked
                ? [...current, optionValue]
                : current.filter(v => v !== optionValue);
            return { ...prev, [questionId]: updated };
        });
    };

    const handleTextInput = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const generatePrompt = (): string => {
        const parts: string[] = [];

        // Start with URL if provided
        if (url) {
            parts.push(`Navigate to ${url}`);
        }

        // Process each question's answer
        questionnaire.questions.forEach(question => {
            const answer = answers[question.id];
            if (!answer) return;

            switch (question.type) {
                case 'single-choice':
                    // Find the selected option's label
                    const selectedOption = question.options?.find(opt => opt.value === answer);
                    if (selectedOption) {
                        parts.push(selectedOption.label);
                    }
                    break;

                case 'multi-choice':
                    // Map selected values to labels
                    if (Array.isArray(answer) && answer.length > 0) {
                        answer.forEach(value => {
                            const option = question.options?.find(opt => opt.value === value);
                            if (option) {
                                parts.push(option.label);
                            }
                        });
                    }
                    break;

                case 'text-input':
                    // Add text as-is
                    if (typeof answer === 'string' && answer.trim()) {
                        parts.push(answer.trim());
                    }
                    break;
            }
        });

        return parts.join('\n');
    };

    const handleSubmit = () => {
        // Validate required fields
        const missingRequired = questionnaire.questions.filter(q => {
            if (!q.required) return false;
            const answer = answers[q.id];
            if (!answer) return true;
            if (Array.isArray(answer)) return answer.length === 0;
            if (typeof answer === 'string') return answer.trim() === '';
            return false;
        });

        if (missingRequired.length > 0) {
            alert(`Please answer all required questions: ${missingRequired.map(q => q.text).join(', ')}`);
            return;
        }

        const prompt = generatePrompt();
        if (prompt.trim()) {
            onSubmit(prompt);
        }
    };

    const renderQuestion = (question: Question) => {
        switch (question.type) {
            case 'single-choice':
                return (
                    <div className="space-y-2">
                        {question.options?.map(option => (
                            <label
                                key={option.value}
                                className="flex items-start gap-2 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors"
                            >
                                <input
                                    type="radio"
                                    name={question.id}
                                    value={option.value}
                                    checked={answers[question.id] === option.value}
                                    onChange={(e) => handleSingleChoice(question.id, e.target.value)}
                                    className="mt-0.5 flex-shrink-0 cursor-pointer"
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'multi-choice':
                return (
                    <div className="space-y-2">
                        {question.options?.map(option => {
                            const isChecked = ((answers[question.id] as string[]) || []).includes(option.value);
                            return (
                                <label
                                    key={option.value}
                                    className="flex items-start gap-2 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => handleMultiChoice(question.id, option.value, e.target.checked)}
                                        className="mt-0.5 flex-shrink-0 cursor-pointer"
                                    />
                                    <span>{option.label}</span>
                                </label>
                            );
                        })}
                    </div>
                );

            case 'text-input':
                return question.multiline ? (
                    <textarea
                        value={(answers[question.id] as string) || ''}
                        onChange={(e) => handleTextInput(question.id, e.target.value)}
                        placeholder={question.placeholder}
                        rows={4}
                        className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none font-mono"
                    />
                ) : (
                    <input
                        type="text"
                        value={(answers[question.id] as string) || ''}
                        onChange={(e) => handleTextInput(question.id, e.target.value)}
                        placeholder={question.placeholder}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    />
                );
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-4 border border-yellow-600">
            <div className="flex items-start gap-2 mb-4">
                <span className="text-2xl">⚠️</span>
                <div>
                    <h3 className="text-base font-bold text-white">{questionnaire.message}</h3>
                    <p className="text-xs text-gray-300 mt-1">
                        Please fill out this questionnaire to generate specific test commands:
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {questionnaire.questions.map((question, index) => (
                    <div key={question.id} className="bg-gray-900 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-white mb-2">
                            {index + 1}. {question.text}
                            {question.required && <span className="text-red-400 ml-1">*</span>}
                        </h4>
                        {renderQuestion(question)}
                    </div>
                ))}

                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                        🚀 Generate Test Commands
                    </button>
                </div>
            </div>
        </div>
    );
}
