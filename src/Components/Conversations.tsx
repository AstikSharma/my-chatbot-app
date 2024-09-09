import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Conversation {
  query_text: string;
  session_id: string;
  timestamp: string;
  query_type: 'human' | 'ai';  // Differentiates user and AI messages
}

interface ConversationsProps {
  userId: string;
  onLoadConversation: (conversation: Conversation[], sessionId: string) => void;  // Callback to load conversation
}

const Conversations: React.FC<ConversationsProps> = ({ userId, onLoadConversation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem('token'); // Ensure token is retrieved
      if (!token) {
        console.error('No token found, user not authenticated.');
        return;
      }
    
      try {
        const response = await axios.get(`http://localhost:8000/queries/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`  // Add Authorization header with the token
          }
        });
        const fetchedConversations = response.data;
    
        // Filter to only get the first human question from each session
        const firstQuestions = fetchedConversations.reduce((acc: Conversation[], current: Conversation) => {
          const existingSession = acc.find(conv => conv.session_id === current.session_id);
          if (!existingSession && current.query_type === 'human') {
            acc.push(current);  // Add only the first question of each session
          }
          return acc;
        }, []);
    
        setConversations(firstQuestions);  // Only set the first questions in the dropdown
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };    
  
    fetchConversations();
  }, [userId]);
  

  const handleSelectConversation = async (session_id: string) => {
    const token = localStorage.getItem('token');  // Get token from localStorage
  
    if (!token) {
      console.error('No token found, user not authenticated.');
      return;
    }
  
    setSelectedSession(session_id);
  
    try {
      // Fetch the conversation messages from the backend based on session_id
      const response = await axios.get(`http://localhost:8000/conversations/${session_id}`, {
        headers: {
          Authorization: `Bearer ${token}`  // Include token in the Authorization header
        }
      });
      onLoadConversation(response.data, session_id);  // Load the conversation into the chat
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };  

  const handleDeleteConversation = async (session_id: string) => {
    const token = localStorage.getItem('token');  // Retrieve the token from localStorage
  
    if (!token) {
      console.error('No token found, user not authenticated.');
      return;
    }
  
    try {
      await axios.delete(`http://localhost:8000/conversations/${session_id}`, {
        headers: {
          Authorization: `Bearer ${token}`  // Add the Authorization header
        }
      });
      setConversations(conversations.filter(conversation => conversation.session_id !== session_id));  // Remove deleted conversation from state
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };
  

  return (
    <div className="mb-4">
      <label htmlFor="conversationDropdown" className="block mb-2 text-gray-700">
        Previous Conversations
      </label>
      <div className="relative w-full">
        <select
          id="conversationDropdown"
          value={selectedSession}
          onChange={(e) => handleSelectConversation(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select a conversation</option>
          {conversations.map((conversation, index) => (
            <option key={index} value={conversation.session_id}>
              {conversation.query_text} - {new Date(conversation.timestamp).toLocaleString()}
            </option>
          ))}
        </select>
        <div className="absolute right-0 top-0">
          {conversations.map((conversation, index) => (
            <button
              key={index}
              onClick={() => handleDeleteConversation(conversation.session_id)}
              className="ml-4 bg-red-500 text-white p-1 rounded"
              style={{ marginLeft: '-50px' }}  // Adjust position to fit inside dropdown
            >
              Delete
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Conversations;
