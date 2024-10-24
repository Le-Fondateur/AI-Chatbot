export class ChatbotWebSocket {
    constructor(url) {
      this.url = url;
      this.ws = null;
      this.messageHandlers = new Set();
      this.connect();
    }
  
    connect() {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('Connected to chatbot server');
      };
      
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(message));
      };
      
      this.ws.onclose = () => {
        console.log('Disconnected from server. Attempting to reconnect...');
        setTimeout(() => this.connect(), 3000);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }
  
    sendMessage(content) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ content }));
      } else {
        console.error('WebSocket is not connected');
      }
    }
  
    onMessage(handler) {
      this.messageHandlers.add(handler);
      return () => this.messageHandlers.delete(handler);
    }
  
    disconnect() {
      if (this.ws) {
        this.ws.close();
      }
    }
  }
  
  // Updated ChatBot component integration
  import React, { useState, useRef, useEffect } from 'react';
  import { ChatbotWebSocket } from './chatbot-websocket';
  
  const ChatBot = () => {
    // ... existing state declarations ...
    const [websocket, setWebsocket] = useState(null);
  
    useEffect(() => {
      const ws = new ChatbotWebSocket('ws://localhost:3001');
      
      const messageHandler = (message) => {
        if (message.type === 'message') {
          setMessages(prev => [...prev, message.data]);
          setIsLoading(false);
        } else if (message.type === 'error') {
          console.error('Server error:', message.message);
          setIsLoading(false);
        }
      };
      
      const unsubscribe = ws.onMessage(messageHandler);
      setWebsocket(ws);
      
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
      
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      websocket.sendMessage(userMessage);
    };
  
    // ... rest of the component code ...
  };
  
  export default ChatBot;