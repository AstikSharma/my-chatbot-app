import { useState, useEffect } from "react";
import axios from 'axios';
import { FaAngleDown, FaTrash } from "react-icons/fa";

interface Conversation {
  query_text: string;
  session_id: string;
  timestamp: string;
  query_type: 'human' | 'ai';
}

interface ConversationsProps {
  userId: string;  // Ensure userId is passed and used properly
  onLoadConversation: (conversation: Conversation[], sessionId: string) => void;
}

const Conversations: React.FC<ConversationsProps> = ({ userId, onLoadConversation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [selectedSession, setSelectedSession] = useState<string>('');

  useEffect(() => {
    if (userId) {  // Only attempt to fetch conversations if userId is available
      fetchConversations();
    }
  }, [userId]);

  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, user not authenticated.');
      return;
    } 

    if (!userId) {
      console.error('No userId found.');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8000/queries/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const fetchedConversations = response.data;

      // Filter to get the first human question from each session
      const firstQuestions = fetchedConversations.reduce((acc: Conversation[], current: Conversation) => {
        const existingSession = acc.find(conv => conv.session_id === current.session_id);
        if (!existingSession && current.query_type === 'human') {
          acc.push(current);  // Add only the first question of each session
        }
        return acc;
      }, []);

      setConversations(firstQuestions);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleSelectConversation = async (session_id: string) => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No token found, user not authenticated.');
      return;
    }

    setSelectedSession(session_id);
    setShowDropdown(false);

    try {
      const response = await axios.get(`http://localhost:8000/conversations/${session_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      onLoadConversation(response.data, session_id);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleDeleteConversation = async (session_id: string) => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No token found, user not authenticated.');
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/conversations/${session_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setConversations(conversations.filter(conversation => conversation.session_id !== session_id));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  return (
    <div className="relative">
      {/* Dropdown Arrow Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 rounded-full bg-blue-500 text-white"
      >
        <FaAngleDown />
      </button>

      {/* Dropdown List of Conversations */}
      {showDropdown && (
        <div className="absolute left-0 mt-2 bg-white shadow-md w-64 border border-gray-200 rounded-md z-10 text-black">
          {conversations.length === 0 ? (
            <p className="p-4 text-center">No conversations</p>
          ) : (
            conversations.map((conversation, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-100">
                <div className="flex flex-col">
                  <span
                    onClick={() => handleSelectConversation(conversation.session_id)}
                    className="cursor-pointer font-semibold"
                  >
                    {conversation.query_text}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(conversation.timestamp).toLocaleDateString()} - {new Date(conversation.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {/* Trash Icon to Delete */}
                <button
                  onClick={() => handleDeleteConversation(conversation.session_id)}
                  className="ml-4 text-red-500"
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Conversations;
