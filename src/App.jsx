import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Home from './pages/Home.jsx'
import ECDATLogin from './ECDATLogin.jsx'
import Dashboard from './pages/Dashboard.jsx'
import References from './pages/References.jsx'
import News from './pages/News.jsx'
import { ActivityPage, SettingsPage, HelpPage } from './pages/AccountPages.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<ECDATLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/references" element={<References />} />
          <Route path="/news" element={<News />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
