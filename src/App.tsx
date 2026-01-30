import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/I18nContext'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import FriendPage from '@/pages/FriendPage'
import GroupsPage from '@/pages/GroupsPage'
import GroupPage from '@/pages/GroupPage'
import TournamentsPage from '@/pages/TournamentsPage'
import { Loader2 } from 'lucide-react'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 w-20 h-20 bg-primary border-3 border-foreground shadow-brutal flex items-center justify-center animate-pulse">
          <span className="text-4xl font-bold">8</span>
        </div>
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    </div>
  )
}

function ProtectedRoutes() {
  const { user, userData, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user || !userData) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/friend/:friendId" element={<FriendPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/groups/:groupId" element={<GroupPage />} />
      <Route path="/tournaments" element={<TournamentsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ProtectedRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

export default App
