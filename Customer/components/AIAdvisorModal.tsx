
import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, SendIcon, SparklesIcon } from './Icon';
import { getAIStyleAdvice } from '../services/geminiService';

interface AIAdvisorModalProps {
  onClose: () => void;
}

const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ type: 'user' | 'ai'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { type: 'user' as const, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getAIStyleAdvice(input);
      const aiMessage = { type: 'ai' as const, text: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { type: 'ai' as const, text: "My apologies, I'm unable to provide advice right now. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg shadow-2xl w-full max-w-lg flex flex-col h-[70vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-xl font-semibold text-gray-800">AI Style Advisor</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-3 bg-[#FDFBF6] rounded-lg text-gray-700 text-sm">
            Welcome! I am your personal jewellery stylist. Describe the occasion, a style you love, or who you're shopping for, and I shall offer a recommendation. For example, "I need a gift for my mother's anniversary."
          </div>
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.type === 'user' ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-800'}`}>
                {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className="bg-gray-100 text-gray-800 p-3 rounded-lg flex items-center space-x-2">
                    <span className="animate-spin h-2 w-2 bg-gray-600 rounded-full"></span>
                    <span className="animate-spin h-2 w-2 bg-gray-600 rounded-full delay-150"></span>
                    <span className="animate-spin h-2 w-2 bg-gray-600 rounded-full delay-300"></span>
                    <span>Thinking...</span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you're looking for..."
              className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#D4AF37] text-white p-3 rounded-full disabled:bg-gray-300 hover:bg-opacity-90 transition-colors"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisorModal;
