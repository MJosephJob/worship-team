import React, { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useApp } from './contexts/AppContext'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'
import ToastContainer from './components/ToastContainer'
import InstallBanner from './components/InstallBanner'
import IOSInstallModal from './components/IOSInstallModal'
import SetupWizard from './pages/SetupWizard'
import LoginPage from './pages/LoginPage'
const OnboardingFlow = React.lazy(() => import('./pages/OnboardingFlow'))

const Dashboard = lazy(() => import('./pages/Dashboard'))
const AssetsPage = lazy(() => import('./pages/AssetsPage'))
const PrayerBoardPage = lazy(() => import('./pages/PrayerBoardPage'))
const NoticeBoardPage = lazy(() => import('./pages/NoticeBoardPage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const RosterPage = lazy(() => import('./pages/RosterPage'))
const BirthdayPage = lazy(() => import('./pages/BirthdayPage'))
const AuditionsPage = lazy(() => import('./pages/AuditionsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const VMReaderPage = lazy(() => import('./pages/VMReaderPage'))
const YearEndPage = lazy(() => import('./pages/YearEndPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function RequireAuth({ children }) {
  const { member, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!member) return <Navigate to="/login" replace />
  return children
}

function RequireOnboarded({ children }) {
  const { member } = useAuth()
  if (member && !member.isOnboarded && member.role === 'MEMBER') {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

export default function App() {
  const { member, loading, needsSetup } = useAuth()
  const { setInstallPrompt } = useApp()
  const [showIOSModal, setShowIOSModal] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [setInstallPrompt])

  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone
    const dismissed = localStorage.getItem('ios_install_dismissed') === 'true'
    if (isIOS && !dismissed) {
      const timer = setTimeout(() => setShowIOSModal(true), 20000)
      return () => clearTimeout(timer)
    }
  }, [])

  if (loading) return <LoadingScreen />
  if (needsSetup) return <SetupWizard />

  return (
    <>
      <ToastContainer />
      <InstallBanner />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={member ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/onboarding" element={
            <RequireAuth>
              <OnboardingFlow />
            </RequireAuth>
          } />
          <Route path="/" element={
            <RequireAuth>
              <RequireOnboarded>
                <Layout />
              </RequireOnboarded>
            </RequireAuth>
          }>
            <Route index element={<Dashboard />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="prayer" element={<PrayerBoardPage />} />
            <Route path="notices" element={<NoticeBoardPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="roster" element={<RosterPage />} />
            <Route path="birthdays" element={<BirthdayPage />} />
            <Route path="auditions" element={<AuditionsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="vm" element={<VMReaderPage />} />
            <Route path="year-end" element={<YearEndPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <IOSInstallModal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)} />
    </>
  )
}
