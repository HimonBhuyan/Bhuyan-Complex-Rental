import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useOwner } from '../context/OwnerContext'
import { 
  User, 
  Settings, 
  LogOut, 
  HelpCircle, 
  Phone,
  Sun,
  Moon,
  Home,
  Menu,
  X
} from 'lucide-react'
import './SlidingNavbar.css'

const SlidingNavbar = ({ onLogout, onThemeToggle, isDarkTheme, onOwnerProfile, lockCollapsed = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()
  const { user } = useUser()
  const { ownerInfo } = useOwner()

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const tenantMenuItems = [
    { icon: User, label: 'My Profile', action: 'profile' },
    { icon: isDarkTheme ? Sun : Moon, label: isDarkTheme ? 'Light Theme' : 'Dark Theme', action: 'theme' },
    { icon: HelpCircle, label: 'Building Assistance', action: 'assistance' },
    { icon: Phone, label: 'HelpLine Numbers', action: 'helpline' },
    { icon: Settings, label: 'Settings', action: 'settings' },
    { icon: HelpCircle, label: 'Help', action: 'help' },
    { icon: LogOut, label: 'Log out', action: 'logout' }
  ]

  const ownerMenuItems = [
    { icon: User, label: 'My Profile', action: 'profile' },
    { icon: isDarkTheme ? Sun : Moon, label: isDarkTheme ? 'Light Theme' : 'Dark Theme', action: 'theme' },
    { icon: Settings, label: 'Settings', action: 'settings' },
    { icon: HelpCircle, label: 'Building Assistance', action: 'assistance' },
    { icon: Phone, label: 'HelpLine Numbers', action: 'helpline' },
    { icon: LogOut, label: 'Log out', action: 'logout' }
  ]

  const menuItems = user?.role === 'tenant' ? tenantMenuItems : ownerMenuItems

  const handleMenuClick = (action) => {
    // Close mobile menu when item is clicked
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }

    switch (action) {
      case 'logout':
        if (window.confirm('Are you sure you want to log out?')) {
          onLogout()
        }
        break
      case 'theme':
        onThemeToggle()
        break
      case 'profile':
        if (user?.role === 'tenant') {
          navigate('/tenant/profile')
        } else if (user?.role === 'owner') {
          if (onOwnerProfile) {
            onOwnerProfile()
          } else {
            navigate('/owner/profile') // fallback
          }
        }
        break
      case 'settings':
        // Handle settings action
        console.log('Settings clicked')
        break
      case 'help':
      case 'assistance':
      case 'helpline':
        navigate('/help')
        break
      default:
        break
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      {/* Mobile hamburger toggle button */}
      {isMobile && (
        <button 
          className="mobile-navbar-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && (
        <div 
          className={`mobile-navbar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div 
        className={`sliding-navbar ${(!lockCollapsed && isOpen) ? 'open' : ''} ${lockCollapsed ? 'locked' : ''} ${isMobile && isMobileMenuOpen ? 'mobile-open' : ''}`}
        onMouseEnter={() => { if (!lockCollapsed && !isMobile) setIsOpen(true) }}
        onMouseLeave={() => { if (!lockCollapsed && !isMobile) setIsOpen(false) }}
      >
        <div className="navbar-content">
        <div className="navbar-header">
          <div className="navbar-title">
            {(isOpen || (isMobile && isMobileMenuOpen)) && (
              <span>{(ownerInfo.buildingName || (user?.profileData?.buildingDetails?.buildingName) || '').toUpperCase() || 'BHUYAN COMPLEX'}</span>
            )}
          </div>
        </div>
        
        <div className="navbar-menu">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon
            return (
              <div
                key={index}
                className={`menu-item ${item.action === 'logout' ? 'logout-item' : ''} ${item.action === 'theme' ? 'theme-item' : ''}`}
                onClick={() => handleMenuClick(item.action)}
              >
                <IconComponent size={20} />
                {(isOpen || (isMobile && isMobileMenuOpen)) && <span className="menu-label">{item.label}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
    </>
  )
}

export default SlidingNavbar
