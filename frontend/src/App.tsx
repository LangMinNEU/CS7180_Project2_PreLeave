import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import PlanPage from './pages/PlanPage';
import NotificationToast from './components/NotificationToast';

function App() {
  return (
    <Router>
      <NotificationToast />
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/trips/new" element={<PlanPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
