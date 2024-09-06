import React, { useState, useEffect, FormEvent } from 'react';
import { invokeChain } from './utils/api';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';  // Import the UUID generator
import Conversations from "./Components/Conversations";

interface Message {
  type: 'human' | 'ai';
  content: string;
}

const Chatbot: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>(uuidv4());  // Generate a new session ID by default
  const userId =  'ac94f7ca-a370-4b32-bca9-48fd140d61d9' //Mongo User ID
  // '66dae162ed3cee22bf79e403' //Postgres USER ID

  // Load saved conversation and set session ID
  const loadSavedConversation = (savedConversation: any[], selectedSessionId: string) => {
    const formattedConversation = savedConversation.map((message) => ({
      type: message.query_type === 'human' ? 'human' : 'ai',
      content: message.query_text,
    }));

    setConversation(formattedConversation);
    setSessionId(selectedSessionId);  // Persist the session ID for continued messages
  };

  // Create a new chat
  const handleNewChat = () => {
    setConversation([]);  // Clear the conversation
    setSessionId(uuidv4());  // Generate a new session ID
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Add human message to the conversation
    const humanMessage: Message = { type: 'human', content: question };
    const updatedConversation = [...conversation, humanMessage];
    setConversation(updatedConversation);

    // Fetch AI response
    const aiResponse: string = await invokeChain(question);

    // Add AI message to the conversation
    const aiMessage: Message = { type: 'ai', content: aiResponse };
    const finalConversation = [...updatedConversation, aiMessage];
    setConversation(finalConversation);

    // Save conversation to backend using the current session ID
    await saveConversationToBackend(question, aiResponse);

    // Clear input
    setQuestion('');
  };

  const saveConversationToBackend = async (userQuestion: string, aiResponse: string) => {
    try {
      // Prepare user message
      const userQueryData = {
        user_id: userId,
        query_text: userQuestion,
        session_id: sessionId,  // Use the current sessionId
        query_type: 'human',
        device_type: 'web',
        location: null,
        intent_detected: 'chatbot',
      };

      await axios.post('http://localhost:8000/queries/', userQueryData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Prepare AI message
      const aiQueryData = {
        user_id: userId,
        query_text: aiResponse,
        session_id: sessionId,  // Use the current sessionId
        query_type: 'ai',
        device_type: 'web',
        location: null,
        intent_detected: 'chatbot',
      };

      await axios.post('http://localhost:8000/queries/', aiQueryData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Failed to save conversation:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      {/* Conversations dropdown */}
      <Conversations userId={userId} onLoadConversation={loadSavedConversation} />

      {/* New chat button */}
      <button onClick={handleNewChat} className="mb-4 bg-green-500 text-white p-2 rounded">
        New Chat
      </button>

      {/* Display chat messages */}
      <div className="flex-1 overflow-y-auto mb-4">
        {conversation.map((msg, index) => (
          <div key={index} className={`speech ${msg.type === 'human' ? 'speech-human' : 'speech-ai'} mb-2`}>
            <div className={`p-4 rounded-lg ${msg.type === 'human' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 p-2 rounded-l-lg border border-gray-300"
          placeholder="Ask me anything..."
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-r-lg">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
