import './App.css'
import InteractiveMap from './pages/InteractiveMap'
import Login from './pages/Login'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/map" element={<InteractiveMap />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App