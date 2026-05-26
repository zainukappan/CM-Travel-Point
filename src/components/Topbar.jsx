import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function Topbar({ currentTab }) {
  const { role, setRole, theme, setTheme, currentUser } = useContext(AppContext);

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Financial Analytics Dashboard';
      case 'invoices': return 'Ticketing Invoices & Billing';
      case 'crm': return 'CRM Passenger Directory';
      case 'vendors': return 'B2B Consolidator Ledger';
      case 'expenses': return 'Office Administrative Costs';
      case 'security': return 'Staff & Security Portal';
      default: return 'CM Travel Point';
    }
  };

  return (
    <div className="topbar no-print">
      <h1 className="topbar-title">{getTitle()}</h1>

      <div className="topbar-actions">
        {/* Theme Switcher Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          title="Toggle Light/Dark Display Style"
        >
          {theme === 'light' ? (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        {/* User Segment */}
        {currentUser && (
          <div className="user-profile">
            <div className="user-avatar" style={{ textTransform: 'uppercase' }}>
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">{currentUser.role === 'admin' ? 'Administrator' : 'Ticketing Agent'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
