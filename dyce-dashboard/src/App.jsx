import './assets/styles/App.css'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Dashboard } from './components/dashboard/Dashboard'
import { Register } from './components/auth/Register.jsx'
import { Verify } from './components/auth/Verify.jsx'
import { AuthProvider } from './components/auth/AuthContext.jsx'
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx'
import { APIClientProvider } from './components/DyceApi.jsx'
import BackgroundCanvas from './components/background.jsx'

function App() {

  return (
    <div className='wrapper'>
      <BackgroundCanvas />
      <BrowserRouter>
        <APIClientProvider>
          <AuthProvider>
            <Routes>
              <Route path='/register' element={<Register />} />
              <Route path='/verify' element={<Verify />} />
              <Route path='/dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path='*' element={<Navigate to="/dashboard" />} />
            </Routes>
          </AuthProvider>
        </APIClientProvider>
      </BrowserRouter>
    </div>
  )
}

export default App
