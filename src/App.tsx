import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Chatbot from './Chatbot';
import SignUp from './Pages/SignUp';
import SignIn from './Pages/SignIn';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Chatbot />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<SignIn />} />
      </Routes>
    </Router>
  );
}; 

export default App;
