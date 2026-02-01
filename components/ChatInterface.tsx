import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, ShoppingBag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, Role } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-t border-border md:border-t-0 md:border-l">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-primary" size={20} />
          <h2 className="font-semibold text-foreground">Design Assistant</h2>
        </div>
        <div className="text-xs text-muted-foreground">Powered by Gemini</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-background/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-60">
            <p className="text-center text-sm">
              Try asking:<br/>
              "Make the walls sage green"<br/>
              "Change the rug to a Persian carpet"<br/>
              "Find me a sofa like this one"
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === Role.USER
                  ? 'bg-primary text-primary-foreground rounded-br-none shadow-sm'
                  : 'bg-muted text-foreground rounded-bl-none shadow-sm'
              }`}
            >
              {msg.role === Role.MODEL ? (
                <div className="prose prose-invert prose-sm max-w-none text-foreground">
                  <ReactMarkdown 
                    components={{
                      a: ({node, ...props}) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 inline-flex bg-background/50 px-1 rounded">
                           <ShoppingBag size={12} /> {props.children}
                        </a>
                      ),
                      p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-0.5" {...props} />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <Loader2 className="animate-spin text-muted-foreground" size={20} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-card border-t border-border">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe changes or ask for links..."
            disabled={isLoading}
            className="w-full bg-input/20 text-foreground placeholder-muted-foreground rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-ring/50 border border-input transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;