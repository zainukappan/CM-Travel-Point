import React, { useState, useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import Sidebar, { LogoSVG } from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard/Dashboard';
import Invoices from './components/Invoices/Invoices';
import CRM from './components/CRM/CRM';
import Vendors from './components/Vendors/Vendors';
import Expenses from './components/Expenses/Expenses';
import Security from './components/Security/Security';
import './App.css';

function MainAppShell() {
  const { currentUser, login } = useContext(AppContext);
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Login form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    const success = login(username, password);
    if (!success) {
      setLoginError('Invalid username or secret password.');
    }
  };

  // If no user is logged in, show the gorgeous glassmorphism Login card
  if (!currentUser) {
    return (
      <div className="login-overlay">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-wrapper">
              <LogoSVG width="64px" height="42px" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <h1 className="login-logo-title">CM Travel Point</h1>
                <span className="login-logo-subtitle">Tours & Services</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
              Ticketing, Invoicing & Financial CRM System
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label style={{ color: '#94a3b8' }}>Login Username ID</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white' }}
                placeholder="Enter username" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label style={{ color: '#94a3b8' }}>Secret Password</label>
              <input 
                type="password" 
                className="form-input" 
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white' }}
                placeholder="Enter password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>

            {loginError && (
              <span style={{ fontSize: '12px', color: '#f87171', fontWeight: '500', textAlign: 'center' }}>
                {loginError}
              </span>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', height: '44px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Unlock System Desk</span>
            </button>
          </form>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', fontSize: '11px', color: '#64748b', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: '600', color: '#94a3b8' }}>DEMO CREDENTIALS:</span>
            <span>Administrator: <b style={{ color: '#cbd5e1' }}>admin</b> / <b style={{ color: '#cbd5e1' }}>password123</b></span>
            <span>Ticketing Executive: <b style={{ color: '#cbd5e1' }}>staff</b> / <b style={{ color: '#cbd5e1' }}>staff123</b></span>
          </div>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'invoices':
        return <Invoices />;
      case 'crm':
        return <CRM />;
      case 'vendors':
        return <Vendors />;
      case 'expenses':
        return <Expenses />;
      case 'security':
        return <Security />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Workspace Area */}
      <div className="main-content">
        <Topbar currentTab={currentTab} />
        
        <div className="page-body">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppShell />
    </AppProvider>
  );
}
