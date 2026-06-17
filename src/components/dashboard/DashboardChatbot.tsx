import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useSalesData } from '@/hooks/useSalesData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useDiscountAnalysis } from '@/hooks/useDiscountAnalysis';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const DashboardChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { filters } = useGlobalFilters();
  const { data: salesData } = useSalesData();
  const { data: sessionsData } = useSessionsData();
  const { data: clientData } = useNewClientData();
  const { data: payrollData } = usePayrollData();
  const { data: leadsData } = useLeadsData();
  const { data: discountData } = useDiscountAnalysis();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Build context from current data (hybrid model - local data + AI)
  const getContextData = () => {
    const dateRange = filters.dateRange ? `${filters.dateRange.start} to ${filters.dateRange.end}` : 'all time';
    const location = filters.location?.join(', ') || 'all locations';
    
    const totalRevenue = salesData?.reduce((sum, s) => sum + (s.paymentValue || 0), 0) || 0;
    const totalSessions = sessionsData?.length || 0;
    const totalAttendance = sessionsData?.reduce((sum, s) => sum + (s.checkedInCount || 0), 0) || 0;
    const totalClients = clientData?.length || 0;
    const totalLeads = leadsData?.length || 0;
    const totalDiscounts = discountData?.reduce((sum, d) => sum + (d.discountAmount || 0), 0) || 0;

    return {
      dateRange,
      location,
      totalRevenue: totalRevenue.toFixed(2),
      totalSessions,
      totalAttendance,
      totalClients,
      totalLeads,
      totalDiscounts: totalDiscounts.toFixed(2),
      avgTransactionValue: salesData && salesData.length > 0 ? (totalRevenue / salesData.length).toFixed(2) : '0',
      avgClassSize: totalSessions > 0 ? (totalAttendance / totalSessions).toFixed(1) : '0',
    };
  };

  const generateResponseWithOpenAI = async (userMessage: string): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        return 'OpenAI API key not configured. Please check your environment variables.';
      }

      const contextData = getContextData();
      const systemPrompt = `You are a smart business intelligence assistant for a fitness studio analytics dashboard. 
You have access to real-time data and should provide insightful, specific answers about business metrics.

Current Dashboard Context:
- Date Range: ${contextData.dateRange}
- Location: ${contextData.location}
- Total Revenue: $${contextData.totalRevenue}
- Total Sessions: ${contextData.totalSessions}
- Total Attendance: ${contextData.totalAttendance}
- Total Clients: ${contextData.totalClients}
- Total Leads: ${contextData.totalLeads}
- Total Discounts: $${contextData.totalDiscounts}
- Average Transaction: $${contextData.avgTransactionValue}
- Average Class Size: ${contextData.avgClassSize}

Always reference actual data in your responses. Provide actionable insights, trends, and recommendations based on the metrics.
Be conversational but professional. Use emojis sparingly for clarity.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI API Error:', error);
        return `I encountered an issue accessing the AI service. Please try again. (Error: ${error.error?.message || 'Unknown'})`;
      }

      const data = await response.json();
      return data.choices[0].message.content || 'Unable to generate response.';
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return 'I encountered an error processing your request. Please try again.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userInput = inputValue;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get AI-powered response using OpenAI
      const responseText = await generateResponseWithOpenAI(userInput);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 z-50"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'fixed bottom-6 right-6 w-96 max-h-96 shadow-2xl border-blue-200 bg-white transition-all duration-200 flex flex-col z-50',
        isMinimized ? 'max-h-14' : 'max-h-96'
      )}
    >
      <CardHeader className="border-b border-blue-100 flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <CardTitle className="text-sm">Dashboard Assistant</CardTitle>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 p-0"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 overflow-y-auto space-y-3 py-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-32 text-center">
                <div className="text-sm text-slate-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Ask me about your dashboard!</p>
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-2 animate-fadeIn', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'px-3 py-2 rounded-lg max-w-xs text-sm',
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="bg-slate-100 text-slate-800 px-3 py-2 rounded-lg rounded-bl-none border border-slate-200">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="border-t border-blue-100 p-3 flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default DashboardChatbot;
