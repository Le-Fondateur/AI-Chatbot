const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const mongoose = require('mongoose');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Schemas
const messageSchema = new mongoose.Schema({
  role: String,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  messages: [messageSchema],
  startedAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

// MongoDB Connectection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Conversation management
class ConversationManager {
  constructor() {
    this.conversations = new Map();
  }

  async getOrCreateConversation(userId) {
    if (!this.conversations.has(userId)) {
      const conversation = {
        messages: [{
          role: 'system',
          content: `You are a helpful and friendly AI assistant. 
                    Always provide concise, accurate, and helpful responses.
                    If you're unsure about something, admit it.
                    Maintain a professional yet approachable tone.`
        }]
      };
      this.conversations.set(userId, conversation);
    }
    return this.conversations.get(userId);
  }

  async addMessage(userId, message) {
    const conversation = await this.getOrCreateConversation(userId);
    conversation.messages.push(message);
    
    if (conversation.messages.length > 11) { 
      conversation.messages = [
        conversation.messages[0],
        ...conversation.messages.slice(-10)
      ];
    }
    
    return conversation;
  }
}

const conversationManager = new ConversationManager();

// Response generation
async function generateAIResponse(userId, userMessage) {
  try {
    await conversationManager.addMessage(userId, {
      role: 'user',
      content: userMessage
    });

    const conversation = await conversationManager.getOrCreateConversation(userId);

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", 
      messages: conversation.messages,
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    const aiResponse = completion.choices[0].message.content;

    await conversationManager.addMessage(userId, {
      role: 'assistant',
      content: aiResponse
    });

    return aiResponse;
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}

// WebSocket connection
wss.on('connection', (ws) => {
  const userId = Math.random().toString(36).substring(7); // Simple user ID generation
  console.log(`New client connected: ${userId}`);
  
  ws.on('message', async (data) => {
    const message = JSON.parse(data);
    
    try {
      ws.send(JSON.stringify({
        type: 'status',
        data: { isTyping: true }
      }));
      
      const aiResponse = await generateAIResponse(userId, message.content);
      
      const conversation = new Conversation({
        messages: [
          { role: 'user', content: message.content },
          { role: 'bot', content: aiResponse }
        ],
        lastMessageAt: new Date()
      });
      await conversation.save();
      
      ws.send(JSON.stringify({
        type: 'message',
        data: {
          role: 'bot',
          content: aiResponse,
          timestamp: new Date()
        }
      }));
            ws.send(JSON.stringify({
        type: 'status',
        data: { isTyping: false }
      }));
      
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message. Please try again.'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log(`Client disconnected: ${userId}`);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});