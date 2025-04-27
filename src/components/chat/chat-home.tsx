'use client';

import { useState } from 'react';
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

const models = [
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ];

interface ChatInputProps {
  onSubmit: (message: string, model: string) => void;
}

export function ChatInput({ onSubmit }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(models[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message, selectedModel);
      setMessage('');
    }
  };

  return (
    <Card className="py-2 w-full max-w-3xl mx-auto bg-white rounded-xl overflow-hidden border border-gray-200/50">
      <form onSubmit={handleSubmit}>
        <div className="p-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Start a conversation..."
            className="!border-none min-h-4 w-full !shadow-none rounded-none resize-none p-0 text-base  focus-visible:ring-0 focus-visible:outline-none focus:ring-0 focus:outline-none placeholder-gray-500"
            rows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (message.trim()) {
                  handleSubmit(e);
                }
              }
            }}
          />
        </div>
        
        <div className="flex items-center justify-between px-3 py-2"> 
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              type="button"
            >
              <Paperclip className="w-5 h-5" />
              <span className="sr-only">Attach file</span>
            </Button>

            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger 
                className="flex items-center gap-1 bg-gray-100 border border-gray-200/80 px-2 py-1 rounded-md text-sm text-gray-700 font-medium hover:bg-gray-200/70 focus:ring-0 focus:outline-none h-auto"
                aria-label="Select model"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-md rounded-lg mt-1">
                {models.map((model) => (
                  <SelectItem 
                    key={model.id} 
                    value={model.id}
                    className="hover:bg-gray-100 cursor-pointer text-sm px-2 py-1.5"
                  >
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            disabled={!message.trim()}
            size="icon" 
            className="bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </Card>
  );
}