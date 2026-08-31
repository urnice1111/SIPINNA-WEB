import './App.css'
import InteractiveMap from './pages/InteractiveMap'
import { BrowserRouter, Routes, Route} from 'react-router-dom'; // <- Add link for future navbar


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/map' element={<InteractiveMap/>}/>
      </Routes>
      
    </BrowserRouter>
  )
}

export default App