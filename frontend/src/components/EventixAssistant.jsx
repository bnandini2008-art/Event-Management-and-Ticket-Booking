import React, { useState, useEffect, useRef } from 'react';
import { Bot, Minus, X, Paperclip, Send, Ticket, ChevronRight, MessageSquare, Sparkles } from 'lucide-react';

export function EventixAssistant({ onBookEvent, events }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 9));
  
  // Seed initial conversation exactly matching screenshot!
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Hey there! 👋\nHow can I help you today?',
      showQuickActions: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'init-2',
      sender: 'user',
      text: "What's the ticket price for Neon Nights Concert?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'init-3',
      sender: 'assistant',
      text: 'The ticket price for Neon Nights Concert starts from ₹999. Would you like to book now?',
      action: {
        type: 'book',
        title: 'Book Tickets',
        eventTitle: 'Neon Nights Concert'
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const quickActions = [
    { label: 'Event Details', icon: 'ℹ️', query: 'Show me event details' },
    { label: 'Ticket Booking', icon: '🎟️', query: 'How does ticket booking work?' },
    { label: 'Refund & Cancellation', icon: '🔄', query: 'What is the refund and cancellation policy?' },
    { label: 'Event Timings', icon: '⏱️', query: 'What are the event timings?' },
    { label: 'Other Enquiries', icon: '👥', query: 'Other enquiries and customer support' },
  ];

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Network response error');
      }

      const data = await response.json();
      
      const botMsg = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: data.reply,
        action: data.action_type === 'book_event' ? {
          type: 'book',
          title: 'Book Tickets',
          eventTitle: data.action_payload?.event_title || 'Featured Event',
          eventId: data.action_payload?.event_id
        } : null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // Fallback response
      const botMsg = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: "I'm here to help with all event bookings and inquiries. How can I assist you further?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action) => {
    if (action.type === 'book') {
      const ev = events.find(
        (e) =>
          e.title.toLowerCase().includes(action.eventTitle.toLowerCase()) ||
          (action.eventId && e.id === action.eventId)
      ) || events[0];
      if (ev) {
        onBookEvent(ev);
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(147,51,234,0.6)] border border-purple-400/40 hover:scale-105 active:scale-95 transition-all group"
      >
        <div className="relative">
          <Bot className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#160b28]" />
        </div>
        <span className="text-xs font-bold pr-1">Eventix Assistant</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[360px] md:w-[380px] rounded-3xl overflow-hidden glass-panel border border-purple-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-300 ${
      isMinimized ? 'h-[62px]' : 'h-[520px] sm:h-[540px]'
    }`}>
      {/* Widget Header */}
      <div className="px-4 py-3 bg-[#1e1038]/95 border-b border-purple-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-purple-900/80 border-2 border-purple-400/70 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.7)]">
            <img
              src="/assets/bot_avatar_hd.jpg"
              alt="Bot Avatar"
              className="w-full h-full object-cover filter contrast-110 brightness-105"
              onError={(e) => {
                e.target.src = '/assets/bot_avatar.jpg';
              }}
            />
            <div className="absolute inset-0 bg-purple-400/10 pointer-events-none" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide">
                Eventix Assistant
              </h4>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-purple-200 font-semibold">Online</span>
            </div>
          </div>
        </div>

        {/* Header Controls: Minimize & Close */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-800/40 transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-800/40 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Scroll Area */}
          <div className="h-[390px] sm:h-[410px] overflow-y-auto p-4 space-y-4 no-scrollbar bg-gradient-to-b from-[#160b28]/80 to-[#0e071c]/90">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Bot Avatar Icon */}
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-purple-900/80 border border-purple-400/60 shrink-0 mt-1 flex items-center justify-center shadow-md">
                    <img
                      src="/assets/bot_avatar_hd.jpg"
                      alt="Bot"
                      className="w-full h-full object-cover filter contrast-110 brightness-105"
                      onError={(e) => {
                        e.target.src = '/assets/bot_avatar.jpg';
                      }}
                    />
                  </div>
                )}

                {/* Message Bubble */}
                <div className="max-w-[78%] space-y-2">
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                        : 'bg-[#241442]/80 border border-purple-500/20 text-purple-100 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Interactive Action Button inside bubble */}
                    {msg.action && (
                      <div className="mt-2.5 pt-2 border-t border-purple-500/30">
                        <button
                          onClick={() => handleActionClick(msg.action)}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-[0_0_12px_rgba(147,51,234,0.6)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>{msg.action.title}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Initial Quick Action List */}
                  {msg.showQuickActions && (
                    <div className="space-y-1.5 pt-1">
                      {quickActions.map((qa, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(qa.query)}
                          className="w-full flex items-center justify-between p-2 rounded-xl bg-[#241442]/60 hover:bg-purple-900/50 border border-purple-500/20 text-purple-200 hover:text-white text-[11px] font-medium transition-all group text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span>{qa.icon}</span>
                            <span>{qa.label}</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <img
                    src="/assets/user_avatar_hd.jpg"
                    alt="User"
                    className="w-7 h-7 rounded-full border border-purple-400/60 shrink-0 mt-1 object-cover shadow-md filter contrast-110 brightness-105"
                    onError={(e) => {
                      e.target.src = '/assets/user_avatar.jpg';
                    }}
                  />
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-purple-300 text-xs pl-8">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <div className="p-3 bg-[#160b28]/95 border-t border-purple-500/20 flex items-center gap-2">
            <button
              type="button"
              title="Attach File"
              className="p-1.5 text-purple-400 hover:text-white transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 bg-[#241442]/50 border border-purple-500/30 rounded-full px-4 py-2 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-[0_0_12px_rgba(147,51,234,0.5)] hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
