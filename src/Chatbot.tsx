import React, { useState, useEffect, FormEvent } from 'react';
import { invokeChain } from './utils/api';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { FaPlus, FaRobot } from 'react-icons/fa';
import Conversations from "./Components/Conversations";
import { useNavigate } from 'react-router-dom';
import "./App.css";

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
  const [isTyping, setIsTyping] = useState<boolean>(false);  // Manage bot typing animation

  // Check for token and redirect if not present
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        navigate('/login'); // Redirect to login if no token is found
      } else {
        await fetchUserInfo(); // Fetch user information if token exists
      }
    };
    checkToken();
  }, [token, navigate]);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('http://localhost:8000/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserId(response.data.id);
    } catch (error) {
      console.error('Error fetching user info:', error);
      localStorage.removeItem('token'); // Clear invalid token
      navigate('/login');
    }
  };

  const loadSavedConversation = (savedConversation: any[], selectedSessionId: string) => {
    const formattedConversation = savedConversation.map((message) => ({
      type: message.query_type === 'human' ? 'human' : 'ai',
      content: message.query_text,
    }));

    setConversation(formattedConversation);
    setSessionId(selectedSessionId);  // Persist the session ID for continued messages
  };

  const handleNewChat = () => {
    setConversation([]);  // Clear the conversation
    setSessionId(uuidv4());  // Generate a new session ID
  };

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  const humanMessage: Message = { type: 'human', content: question };
  const updatedConversation = [...conversation, humanMessage];
  setConversation(updatedConversation);
  setIsTyping(true);  // Set the bot as typing

  try {
    // Invoke the chain using LangGraph's invokeChain
    const aiResponse: string = await invokeChain(question);

    const aiMessage: Message = { type: 'ai', content: aiResponse };
    const finalConversation = [...updatedConversation, aiMessage];
    setConversation(finalConversation);
  } catch (err) {
    console.error("Error fetching AI response:", err);
    const aiMessage: Message = { type: 'ai', content: "Sorry, something went wrong." };
    setConversation([...updatedConversation, aiMessage]);
  } finally {
    setIsTyping(false);  // Stop the bot typing animation
    setQuestion('');  // Clear the input field
  }

  // Save conversation to backend
  await saveConversationToBackend(question, aiResponse);
};


  const saveConversationToBackend = async (userQuestion: string, aiResponse: string) => {
    try {
      const userQueryData = {
        user_id: userId,
        query_text: userQuestion,
        session_id: sessionId,
        query_type: 'human',
        device_type: 'web',
        location: null,
        intent_detected: 'chatbot',
      };

      await axios.post('http://localhost:8000/queries/', userQueryData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const aiQueryData = {
        user_id: userId,
        query_text: aiResponse,
        session_id: sessionId,
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
    <div className="flex flex-col h-[70vh] w-[30vw] bg-white shadow-lg rounded-lg mb-0 pb-0">
      {/* Header */}
      <div className="flex justify-between items-center bg-black p-4 rounded-t-lg text-white">
        <div className="flex items-center space-x-2">
          <div className="bg-white p-2 rounded-full">
            <span className="text-black">🤖</span>
          </div>
          <div>
            <p className="text-lg font-semibold">ChatBot</p>
            <p className="text-sm text-green-400">🟢 online</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Dropdown Icon */}
          <Conversations userId={userId} onLoadConversation={loadSavedConversation} />
          {/* New Chat + Icon */}
          <button onClick={handleNewChat} className="text-white text-lg">
            <FaPlus />
          </button>
          {/* Logout Button */}
          <button onClick={() => {
            localStorage.removeItem('token');
            navigate('/login');
          }} className="bg-gray-700 px-4 py-1 rounded-lg text-white">
            Logout
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-200 mb-0 pb-0">
        {conversation.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <FaRobot className="text-6xl text-gray-400 animate-bounce" />
          </div>
        )}
        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${msg.type === 'human' ? 'text-right' : 'text-left'} fade-in-message`}
          >
            <div
              className={`inline-block p-3 rounded-message ${msg.type === 'human' ? 'bg-black text-white' : 'bg-white text-black border border-gray-400'
                } smooth-message-box`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="text-left mb-4 fade-in-message">
            <div className="inline-block p-3 rounded-lg bg-white text-black border border-gray-400 smooth-message-box">
              <div className="typing-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex p-4 bg-gray-100 border-t border-gray-300 mb-0 pb-0">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 p-2 rounded-l-lg border border-gray-300 smooth-input-transition"
          placeholder="Ask your question..."
        />
        <button type="submit" className="bg-black text-white p-2 rounded-r-lg smooth-input-transition">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
