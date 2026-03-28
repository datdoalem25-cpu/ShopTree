import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import SearchPage from './pages/SearchPage';
import TrackPage from './pages/TrackPage';
import DialogHost from './components/DialogHost';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/track" element={<TrackPage />} />
      </Routes>
      <DialogHost />
    </BrowserRouter>
  );
}

export default App;
