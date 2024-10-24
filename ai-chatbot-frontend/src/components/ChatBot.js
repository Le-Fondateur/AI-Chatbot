import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Moon, Sun } from 'lucide-react';
import { ChatbotWebSocket } from '../chatbot-websocket'; // Adjust path accordingly

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Hello! I'm your AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [websocket, setWebsocket] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Create a new instance of ChatbotWebSocket with the server URL
    const ws = new ChatbotWebSocket('ws://localhost:3001'); // Adjust the WebSocket URL if needed

    // Handle incoming messages from the WebSocket
    const messageHandler = (message) => {
      if (message.type === 'message') {
        setMessages((prev) => [...prev, message.data]);
        setIsLoading(false);
      } else if (message.type === 'error') {
        console.error('Server error:', message.message);
        setIsLoading(false);
      }
    };

    // Subscribe to messages
    const unsubscribe = ws.onMessage(messageHandler);
    setWebsocket(ws);

    // Cleanup: Unsubscribe and disconnect when component unmounts
    return () => {
      unsubscribe();
      ws.disconnect();
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !websocket) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    // Add the user's message to the message list
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    // Send the user's message to the WebSocket server
    websocket.sendMessage(userMessage);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto h-[600px] rounded-xl shadow-2xl transition-all duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Glassmorphism Header */}
      <div className={`backdrop-blur-md bg-opacity-90 p-6 rounded-t-xl border-b transition-all duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <Sparkles className={`h-4 w-4 absolute -top-1 -right-1 animate-pulse ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-500'
              }`} />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                AI Assistant
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Always here to help
              </p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-all duration-300 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-6 h-[424px] transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 animate-slideIn ${
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user'
                ? isDarkMode ? 'bg-blue-500' : 'bg-blue-600'
                : isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'
            }`}>
              {message.role === 'user' ? (
                <User className="h-5 w-5 text-white" />
              ) : (
                <Bot className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              )}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 transition-all duration-300 ${
              message.role === 'user'
                ? isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'bg-gray-800 text-gray-100'
                  : 'bg-white text-gray-800 shadow-sm'
            }`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={`flex items-center gap-3 animate-slideIn ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className={`p-4 rounded-2xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex gap-2">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>●</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className={`p-4 border-t transition-all duration-300 ${
        isDarkMode
          ? 'bg-gray-900 border-gray-700'
          : 'bg-white border-gray-100'
      }`}>
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className={`w-full p-4 pr-12 rounded-xl transition-all duration-300 ${
              isDarkMode
                ? 'bg-gray-800 text-white placeholder-gray-400 focus:ring-blue-500'
                : 'bg-gray-100 text-gray-800 placeholder-gray-500 focus:ring-blue-600'
            } focus:outline-none focus:ring-2`}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-300 ${
              input.trim()
                ? isDarkMode
                  ? 'bg-blue-500 hover:bg-blue-400'
                  : 'bg-blue-600 hover:bg-blue-500'
                : isDarkMode
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
            }`}
          >
            <Send className={`h-5 w-5 ${
              input.trim() ? 'text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-400'
            }`} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
