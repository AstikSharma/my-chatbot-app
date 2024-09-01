import React, { useState, FormEvent } from 'react';
import { invokeChain } from './utils/api';

interface Message {
  type: 'human' | 'ai';
  content: string;
}

const Chatbot: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [conversation, setConversation] = useState<Message[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Add human message
    const humanMessage: Message = { type: 'human', content: question };
    setConversation([...conversation, humanMessage]);

    // Fetch AI response
    const aiResponse: string = await invokeChain(question);

    // Add AI message
    const aiMessage: Message = { type: 'ai', content: aiResponse };
    setConversation((prevConversation) => [...prevConversation, aiMessage]);

    // Clear input
    setQuestion('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {conversation.map((msg, index) => (
          <div key={index} className={`speech ${msg.type === 'human' ? 'speech-human' : 'speech-ai'} mb-2`}>
            <div className={`p-4 rounded-lg ${msg.type === 'human' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
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
