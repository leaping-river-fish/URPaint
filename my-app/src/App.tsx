import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import Profile from "./Profile";
import Hub from './Hub';
import Studio from './Studio';

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<Navigate to="/signup" replace />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} /> 
            <Route path="/hub" element={<Hub />} />
            <Route path="/studio" element={<Studio />} />
        </Routes>
    </Router>
  );
}

export default App; 