'use client';

import React, { useState } from 'react'; // Import useState
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Paperclip, Send } from 'lucide-react';

// Define available models (can be passed as props or defined here)
// Consider moving this to a shared config or fetching dynamically if needed elsewhere
const defaultModels = [
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'anthropic/claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
];

// Interface for ChatInput Props - Simplified
export interface ChatInputProps {
    // Callback function when the form is submitted
    onSubmit: (input: string, selectedModel: string) => Promise<void> | void; // Allow async or sync
    // Optional prop to control available models
    availableModels?: { id: string; name: string }[];
    // Optional prop to set initial model
    initialModel?: string;
    // Optional prop to disable the input (e.g., during parent loading state)
    disabled?: boolean;
}

// Export the ChatInput component
export function ChatInput({
    onSubmit,
    availableModels = defaultModels,
    initialModel = availableModels[0]?.id, // Default to the first available model
    disabled = false, // Default to not disabled
}: ChatInputProps) {
    // Internal state for input text
    const [input, setInput] = useState('');
    // Internal state for selected model
    const [selectedModel, setSelectedModel] = useState<string>(initialModel ?? ''); // Use initialModel

    // Handler for input change
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    // Handler for model change
    const handleModelChange = (modelId: string) => {
        setSelectedModel(modelId);
    };

    // Handler for form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default form submission
        const trimmedInput = input.trim();
        if (!trimmedInput || disabled) return; // Don't submit if empty or disabled

        // Call the parent onSubmit handler
        await onSubmit(trimmedInput, selectedModel);

        // Optionally clear the input after successful submission
        setInput('');
    };

     // Handler for Enter key press
     const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const trimmedInput = input.trim();
            if (trimmedInput && !disabled) {
                // Create a synthetic form event to call handleSubmit
                 const syntheticFormEvent = {
                    preventDefault: () => {}, // No-op prevent default
                    // Add other properties if your handleSubmit expects them
                } as unknown as React.FormEvent<HTMLFormElement>;
                handleSubmit(syntheticFormEvent);
            }
        }
    };

    return (
        // Added shrink-0 to prevent input from growing in flex layouts
        <Card className="py-2 w-full max-w-3xl mx-auto bg-background rounded-xl overflow-hidden border border-border shrink-0">
             <form onSubmit={handleSubmit}> {/* Use internal handleSubmit */}
                <div className="p-4">
                    <Textarea
                        value={input} // Use internal state
                        onChange={handleInputChange} // Use internal handler
                        placeholder="Start a conversation..."
                        className="!border-none min-h-[60px] w-full !shadow-none rounded-none resize-none p-0 text-base focus-visible:ring-0 focus-visible:outline-none focus:ring-0 focus:outline-none placeholder-muted-foreground bg-transparent" // Adjusted styling
                        rows={1}
                        disabled={disabled} // Use disabled prop
                        onKeyDown={handleKeyDown} // Use internal keydown handler
                    />
                </div>
                <div className="flex items-center justify-between px-3 py-2 border-t border-border"> {/* Added border */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                            type="button"
                            disabled={disabled} // Use disabled prop
                            aria-label="Attach file"
                        >
                            <Paperclip className="w-5 h-5" />
                            <span className="sr-only">Attach file</span>
                        </Button>
                        {/* Model selection using internal state */}
                        <Select value={selectedModel} onValueChange={handleModelChange} disabled={disabled}>
                            <SelectTrigger
                                className="flex items-center gap-1 bg-muted border border-border px-2 py-1 rounded-md text-sm text-muted-foreground font-medium hover:bg-accent focus:ring-0 focus:outline-none h-auto"
                                aria-label="Select model"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border border-border shadow-md rounded-lg mt-1">
                                {availableModels.map((model) => (
                                    <SelectItem
                                        key={model.id}
                                        value={model.id}
                                        className="hover:bg-accent cursor-pointer text-sm px-2 py-1.5"
                                    >
                                        {model.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        type="submit"
                        disabled={disabled || !input.trim()} // Disable when explicitly disabled or input is empty
                        size="icon"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" // Adjusted styling
                        aria-label="Send message"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </form>
        </Card>
    );
}
