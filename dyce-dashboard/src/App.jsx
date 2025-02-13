import './assets/styles/App.css'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { Preferences } from './components/Preferences'
import { Register } from './components/Register'
import { Verify } from './components/Verify'
import { AuthProvider } from './components/AuthContext.jsx'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {

  return (
    <div className='wrapper'>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path='/register' element={<Register />} />
            <Route path='/verify' element={<Verify />} />
            <Route path='/dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path='/preferences' element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
            <Route path='*' element={<Navigate to="/dashboard" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  )
}

export default App
