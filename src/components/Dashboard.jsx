import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ClientDashboard from './client/ClientDashboard'
import OwnerDashboard from './owner/OwnerDashboard'

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.role === 'tenant') {
      navigate('/client')
    } else if (user?.role === 'owner') {
      navigate('/owner')
    }
  }, [user, navigate])

  // This component acts as a router, so we return the appropriate dashboard
  if (user?.role === 'tenant') {
    return <ClientDashboard user={user} onLogout={onLogout} />
  } else if (user?.role === 'owner') {
    return <OwnerDashboard user={user} onLogout={onLogout} />
  }

  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  )
}

export default Dashboard