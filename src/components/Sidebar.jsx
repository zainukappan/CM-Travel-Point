import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

// High-fidelity Logo SVG matching the user's design layout
export const LogoSVG = ({ width = '56px', height = '36px' }) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 120 80" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, overflow: 'visible' }}
  >
    {/* Vibrant Scarlet Red Capsule */}
    <rect 
      x="5" 
      y="15" 
      width="95" 
      height="60" 
      rx="16" 
      fill="var(--primary)" 
    />
    
    {/* White Cursive script "cm" inside */}
    <text 
      x="22" 
      y="58" 
      fill="white" 
      fontFamily='"Caveat", "Brush Script MT", "cursive", sans-serif'
      fontSize="44px" 
      fontWeight="700" 
      fontStyle="italic"
      letterSpacing="-0.5px"
      style={{ userSelect: 'none' }}
    >
      cm
    </text>

    {/* Elegant White Flight swoosh trail */}
    <path 
      d="M 68 50 Q 88 50 96 32" 
      stroke="white" 
      strokeWidth="4" 
      strokeLinecap="round" 
      fill="none" 
    />

    {/* Flying red airplane at the end of the trail */}
    <g transform="translate(98, 20) rotate(42) scale(1.1)">
      <path 
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5L21 16z" 
        fill="var(--primary)" 
      />
    </g>
  </svg>
);


export default function Sidebar({ currentTab, setCurrentTab }) {
  const { role, currentUser, logout } = useContext(AppContext);

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Financial Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      )
    },
    {
      id: 'invoices',
      name: 'Invoices & Billing',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      id: 'crm',
      name: 'Customer CRM',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'vendors',
      name: 'B2B Vendor Ledger',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      adminOnly: true
    },
    {
      id: 'expenses',
      name: 'Expense Log',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      adminOnly: true
    },
    {
      id: 'ledger',
      name: 'Unified Ledger',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="9" y1="18" x2="15" y2="18" />
          <line x1="12" y1="6" x2="12" y2="18" />
          <path d="M16 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
        </svg>
      ),
      adminOnly: true
    },
    {
      id: 'security',
      name: 'Staff & Security',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      adminOnly: true
    }
  ];

  return (
    <div className="sidebar no-print">
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', paddingLeft: '4px' }}>
        {/* High-fidelity Logo SVG parallel to the Brand Name */}
        <LogoSVG />

        {/* Parallel Brand Text */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#ffffff',
            letterSpacing: '0.3px',
            lineHeight: '1.2'
          }}>CM Travel Point</span>
          <span style={{
            fontSize: '9px',
            fontWeight: '600',
            color: '#94a3b8',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            lineHeight: '1.1',
            marginTop: '2px'
          }}>Tours & Services</span>
        </div>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map(item => {
          // If staff role, hide Admin-only panels
          if (item.adminOnly && role !== 'admin') return null;

          return (
            <li key={item.id}>
              <button
                className={`sidebar-item ${currentTab === item.id ? 'active' : ''}`}
                onClick={() => setCurrentTab(item.id)}
                style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        {currentUser && (
          <button 
            onClick={logout}
            className="sidebar-item"
            style={{ 
              width: '100%', 
              border: 'none', 
              background: 'rgba(239, 68, 68, 0.08)', 
              color: '#f87171',
              textAlign: 'left',
              cursor: 'pointer',
              marginTop: '5px',
              marginBottom: '5px',
              padding: '10px 14px'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '10px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Log Out Session</span>
          </button>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>SECURITY STATUS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            <span>SSL & AES Encrypted</span>
          </div>
        </div>
        <div className={`role-badge ${role}`}>
          {role} portal
        </div>
      </div>
    </div>
  );
}
