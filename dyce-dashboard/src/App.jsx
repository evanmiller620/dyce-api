import './assets/styles/App.css'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Dashboard } from './components/dashboard/Dashboard'
import { Preferences } from './components/dashboard/Preferences'
import { Register } from './components/auth/Register.jsx'
import { Verify } from './components/auth/Verify.jsx'
import { AuthProvider } from './components/auth/AuthContext.jsx'
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx'

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
