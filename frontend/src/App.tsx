import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Header from './components/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewProposal from './pages/NewProposal'
import ProposalReview from './pages/ProposalReview'
import Professionals from './pages/Professionals'
import Parameters from './pages/Parameters'
import Users from './pages/Users'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Private Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <div className="min-h-screen bg-gray-50">
                <Header />
                <Dashboard />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/new"
          element={
            <PrivateRoute>
              <div className="min-h-screen bg-gray-50">
                <Header />
                <NewProposal />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/proposals/:id"
          element={
            <PrivateRoute>
              <div className="min-h-screen bg-gray-50">
                <Header />
                <ProposalReview />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/professionals"
          element={
            <PrivateRoute>
              <div className="min-h-screen bg-gray-50">
                <Header />
                <Professionals />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/parameters"
          element={
            <PrivateRoute>
              <div className="min-h-screen bg-gray-50">
                <Header />
                <Parameters />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <div className="min-h-screen bg-gray-50">
                <Header />
                <Users />
              </div>
            </PrivateRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
