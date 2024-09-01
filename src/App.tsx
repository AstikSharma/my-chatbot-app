import React from 'react';
import Chatbot from './Chatbot';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="bg-blue-600 text-white text-center py-4">
        <h1 className="text-3xl font-bold">My AI Chatbot</h1>
      </header>
      <main className="flex justify-center items-center h-screen">
        <Chatbot />
      </main>
    </div>
  );
}

export default App;
