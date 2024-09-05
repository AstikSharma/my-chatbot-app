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
    // Fetch saved conversations from backend
    const fetchConversations = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/queries/${userId}`);
        setConversations(response.data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, [userId]);

  const handleSelectConversation = async (session_id: string) => {
    setSelectedSession(session_id);

    try {
      // Fetch the conversation messages from the backend based on session_id
      const response = await axios.get(`http://localhost:8000/conversations/${session_id}`);
      onLoadConversation(response.data, session_id);  // Load the conversation into the chat
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor="conversationDropdown" className="block mb-2 text-gray-700">
        Previous Conversations
      </label>
      <select
        id="conversationDropdown"
        value={selectedSession}
        onChange={(e) => handleSelectConversation(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md"
      >
        <option value="">Select a conversation</option>
        {conversations
          .filter(conversation => conversation.query_type === 'human')  // Show only human initial messages
          .map((conversation, index) => (
            <option key={index} value={conversation.session_id}>
              {conversation.query_text} - {new Date(conversation.timestamp).toLocaleString()}
            </option>
        ))}
      </select>
    </div>
  );
};

export default Conversations;
