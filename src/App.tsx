import './App.css'
import InteractiveMap from './pages/InteractiveMap'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La raíz manda al dashboard; ProtectedRoute redirige a /login si no hay sesión. */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/map" element={<ProtectedRoute><InteractiveMap /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>
        {/* Cualquier ruta desconocida vuelve a la raíz en vez de quedar en blanco. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App