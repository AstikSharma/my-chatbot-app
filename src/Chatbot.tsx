import React, { useState, useEffect, FormEvent } from 'react';
import { invokeChain } from './utils/api';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';  // Import the UUID generator
import Conversations from "./Components/Conversations";
import { useNavigate } from 'react-router-dom';

interface Message {
  type: 'human' | 'ai';
  content: string;
}

const Chatbot: React.FC = () => { 
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userId, setUserId] = useState<string>(''); // Track the authenticated user's ID
  const [question, setQuestion] = useState<string>('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>(uuidv4());  // Generate a new session ID by default

  useEffect(() => {
    // Redirect to login if token is missing
    if (!token) { 
      navigate('/login');
    } else {
      // Fetch user data using the token
      fetchUserInfo();
    }
  }, [navigate, token]);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('http://localhost:8000/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,  // Send the token to retrieve user info
        },
      });

      // Store the user ID from the backend response
      setUserId(response.data.id);
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      localStorage.removeItem('token');
      navigate('/login');  // Redirect to login if token is invalid or expired
    }
  };

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
        user_id: userId,  // Use the userId fetched from backend
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
          'Authorization': `Bearer ${token}`,  // Include token in requests
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
          'Authorization': `Bearer ${token}`,
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
