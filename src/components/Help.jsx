import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  Send,
  ArrowLeft,
  HelpCircle,
  Shield,
  Wrench,
  Zap,
  Droplets,
  Home,
  MessageSquare
} from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useOwner } from '../context/OwnerContext'
import SlidingNavbar from './SlidingNavbar'
import './Help.css'

const Help = ({ onLogout }) => {
  const navigate = useNavigate()
  const { user } = useUser()
  const { ownerInfo } = useOwner()
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [queryForm, setQueryForm] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    message: '',
    contactPreference: 'email'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme)
    document.documentElement.classList.toggle('dark', !isDarkTheme)
  }

  const emergencyContacts = [
    {
      title: 'Building Owner/Manager',
      name: ownerInfo.fullName,
      phone: ownerInfo.emergencyPhone || ownerInfo.primaryPhone,
      email: ownerInfo.email,
      available: ownerInfo.emergencyAvailable,
      category: 'primary',
      photo: ownerInfo.profilePhoto
    },
    {
      title: 'Property Management Office',
      name: ownerInfo.managementCompany,
      phone: ownerInfo.managementPhone,
      email: ownerInfo.managementEmail,
      available: ownerInfo.officeHours,
      category: 'primary'
    },
    {
      title: 'Maintenance Emergency',
      name: 'Emergency Repairs',
      phone: ownerInfo.maintenancePhone,
      email: ownerInfo.maintenanceEmail,
      available: '24/7',
      category: 'emergency'
    },
    {
      title: 'Security Office',
      name: 'Building Security',
      phone: ownerInfo.securityPhone,
      email: ownerInfo.securityEmail,
      available: '24/7',
      category: 'security'
    }
  ]

  const utilityContacts = [
    {
      title: 'Electricity Provider',
      name: 'City Power Company',
      phone: '+1-555-0201',
      email: 'support@citypower.com',
      category: 'utility',
      icon: Zap
    },
    {
      title: 'Water Department',
      name: 'City Water Services',
      phone: '+1-555-0202',
      email: 'help@citywater.com',
      category: 'utility',
      icon: Droplets
    },
    {
      title: 'Gas Company',
      name: 'Metro Gas Services',
      phone: '+1-555-0203',
      email: 'emergency@metrogas.com',
      category: 'utility',
      icon: Home
    },
    {
      title: 'Internet/Cable',
      name: 'FastNet Communications',
      phone: '+1-555-0204',
      email: 'support@fastnet.com',
      category: 'utility',
      icon: Phone
    }
  ]

  const handleInputChange = (field, value) => {
    setQueryForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitQuery = async (e) => {
    e.preventDefault()
    
    if (!queryForm.subject || !queryForm.message) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate API call to send email to owner
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real application, this would send an email to the owner
      const emailData = {
        to: 'owner@rentalbuilding.com',
        from: user.email,
        subject: `[Tenant Query] ${queryForm.subject}`,
        body: `
          Tenant Details:
          - Name: ${user.name}
          - Room: ${user.roomNumber}
          - Email: ${user.email}
          - Phone: ${user.phone}
          
          Category: ${queryForm.category}
          Priority: ${queryForm.priority}
          Contact Preference: ${queryForm.contactPreference}
          
          Message:
          ${queryForm.message}
        `
      }
      
      console.log('Email would be sent:', emailData)
      
      toast.success('Your query has been sent successfully!')
      
      // Reset form
      setQueryForm({
        subject: '',
        category: '',
        priority: 'medium',
        message: '',
        contactPreference: 'email'
      })
      
    } catch (error) {
      toast.error('Failed to send query. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const ContactCard = ({ contact, isUtility = false }) => (
    <div className={`contact-card ${contact.category}`}>
      <div className="contact-header">
        <div className="contact-icon">
          {contact.photo ? (
            <img 
              src={contact.photo} 
              alt={contact.name} 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '2px solid #fff'
              }}
            />
          ) : isUtility && contact.icon ? (
            <contact.icon size={24} />
          ) : (
            <Phone size={24} />
          )}
        </div>
        <div className="contact-info">
          <h3>{contact.title}</h3>
          <p>{contact.name}</p>
        </div>
      </div>
      
      <div className="contact-details">
        <div className="contact-item">
          <Phone size={16} />
          <span>{contact.phone}</span>
          <button 
            className="contact-btn"
            onClick={() => window.open(`tel:${contact.phone}`)}
          >
            Call
          </button>
        </div>
        
        <div className="contact-item">
          <Mail size={16} />
          <span>{contact.email}</span>
          <button 
            className="contact-btn"
            onClick={() => window.open(`mailto:${contact.email}`)}
          >
            Email
          </button>
        </div>
        
        {contact.available && (
          <div className="contact-item">
            <Clock size={16} />
            <span>{contact.available}</span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={`help-page ${isDarkTheme ? 'dark' : ''}`}>
      <SlidingNavbar 
        onLogout={onLogout} 
        onThemeToggle={handleThemeToggle}
        isDarkTheme={isDarkTheme}
      />
      
      <div className="main-content">
        <div className="help-header">
          <div className="header-left">
            <button 
              className="back-btn"
              onClick={() => navigate(user?.role === 'tenant' ? '/client' : '/owner')}
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <h1>
              <HelpCircle size={32} />
              Help & Support
            </h1>
          </div>
        </div>

        <div className="help-content">
          {/* Emergency Contacts Section */}
          <div className="help-section">
            <div className="section-header emergency">
              <AlertTriangle size={24} />
              <h2>Emergency Contacts</h2>
            </div>
            
            <div className="section-content">
              <p className="section-description">
                For urgent matters requiring immediate attention, contact these numbers 24/7:
              </p>
              
              <div className="contacts-grid">
                {emergencyContacts.map((contact, index) => (
                  <ContactCard key={index} contact={contact} />
                ))}
              </div>
            </div>
          </div>

          {/* Utility Services Section */}
          <div className="help-section">
            <div className="section-header utility">
              <Wrench size={24} />
              <h2>Utility Services</h2>
            </div>
            
            <div className="section-content">
              <p className="section-description">
                Contact information for essential utility services:
              </p>
              
              <div className="contacts-grid">
                {utilityContacts.map((contact, index) => (
                  <ContactCard key={index} contact={contact} isUtility={true} />
                ))}
              </div>
            </div>
          </div>

          {/* Query Form Section */}
          <div className="help-section">
            <div className="section-header query">
              <MessageSquare size={24} />
              <h2>Submit a Query</h2>
            </div>
            
            <div className="section-content">
              <p className="section-description">
                Have a question or need assistance? Send a message directly to the property owner:
              </p>
              
              <form className="query-form" onSubmit={handleSubmitQuery}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      <Mail size={16} />
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={queryForm.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Brief description of your query"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <HelpCircle size={16} />
                      Category
                    </label>
                    <select
                      value={queryForm.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    >
                      <option value="">Select category</option>
                      <option value="maintenance">Maintenance Request</option>
                      <option value="payment">Payment/Billing</option>
                      <option value="complaint">Complaint</option>
                      <option value="general">General Inquiry</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <AlertTriangle size={16} />
                      Priority
                    </label>
                    <select
                      value={queryForm.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <Phone size={16} />
                      Preferred Contact Method
                    </label>
                    <select
                      value={queryForm.contactPreference}
                      onChange={(e) => handleInputChange('contactPreference', e.target.value)}
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone Call</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label>
                    <MessageSquare size={16} />
                    Message *
                  </label>
                  <textarea
                    value={queryForm.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Describe your query in detail..."
                    rows="6"
                    required
                  ></textarea>
                </div>
                
                <div className="tenant-info">
                  <h4>Your Contact Information</h4>
                  <div className="info-grid">
                    <span><User size={16} /> {user.name}</span>
                    <span><Home size={16} /> Room {user.roomNumber}</span>
                    <span><Mail size={16} /> {user.email}</span>
                    <span><Phone size={16} /> {user.phone}</span>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="btn-spinner"></div>
                  ) : (
                    <Send size={16} />
                  )}
                  {isSubmitting ? 'Sending...' : 'Send Query'}
                </button>
              </form>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="help-section">
            <div className="section-header faq">
              <HelpCircle size={24} />
              <h2>Frequently Asked Questions</h2>
            </div>
            
            <div className="section-content">
              <div className="faq-list">
                <div className="faq-item">
                  <h4>How do I report a maintenance issue?</h4>
                  <p>Use the query form above or call the maintenance emergency number for urgent repairs.</p>
                </div>
                
                <div className="faq-item">
                  <h4>What should I do in case of a power outage?</h4>
                  <p>First, check if it's a building-wide issue by contacting neighbors. If so, call the electricity provider. For building-specific issues, contact the property manager.</p>
                </div>
                
                <div className="faq-item">
                  <h4>Who do I contact for rent-related questions?</h4>
                  <p>Contact the Property Management Office during business hours or use the query form for billing inquiries.</p>
                </div>
                
                <div className="faq-item">
                  <h4>How can I request building improvements?</h4>
                  <p>Submit your suggestions using the query form above with the category "General Inquiry".</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Help