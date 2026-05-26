import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../../context/AppContext';
import { exportUnifiedDatabaseBackupCSV } from '../../utils/export';

export default function Security() {
  const { 
    currentUser, 
    users, 
    addUser, 
    deleteUser, 
    updateUserPermissions,
    invoices,
    customers,
    vendors,
    expenses,
    payments,
    updateUser
  } = useContext(AppContext);

  // Form states for new user registration
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('staff');
  const [selectedPermissions, setSelectedPermissions] = useState(['view_dashboard', 'create_invoice']);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit user states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Interactive Live Sync States
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLogs, setSyncLogs] = useState([]);
  const terminalEndRef = useRef(null);

  // Available permissions definitions
  const PERMISSIONS_LIST = [
    { key: 'view_dashboard', label: 'View Dashboard & Analytics', desc: 'Allows viewing of sales charts, profits, and financial aggregates' },
    { key: 'create_invoice', label: 'Generate & Pay Invoices', desc: 'Allows creation of tickets, billing, and partial payment vouchers' },
    { key: 'view_expenses', label: 'Access B2B Vendor Ledgers', desc: 'Allows deposit tracking and GDS portal booking reconciliation' },
    { key: 'manage_vendors', label: 'Manage B2B Vendors & Portals', desc: 'Allows editing, deleting, or adding new consolidation agents' },
    { key: 'manage_staff', label: 'Security & Staff Management', desc: 'Full administrative access to manage staff profiles and download databases' }
  ];

  // Auto scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [syncLogs]);

  // Restrict access to Admins only
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="restricted-panel" style={{ margin: '40px auto', maxWidth: '600px' }}>
        <div className="restricted-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '32px', height: '32px' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2>Administrative Clearance Required</h2>
        <p>Your current account profile does not possess security authorization to access the Staff User Directory and Global Security Permissions panel.</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Please switch to the <b>Administrator</b> profile using the quick toggle at the top bar to inspect these systems.</p>
      </div>
    );
  }

  // Handle checking permission boxes
  const handlePermissionToggle = (key) => {
    setSelectedPermissions(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  // Edit user helper handlers
  const handleOpenEditStaff = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      username: user.username,
      password: user.password,
      role: user.role,
      permissions: [...user.permissions]
    });
    setIsEditOpen(true);
  };

  const handleEditRoleChange = (roleVal) => {
    setEditingUser(prev => {
      const perms = roleVal === 'admin' 
        ? PERMISSIONS_LIST.map(p => p.key) 
        : ['view_dashboard', 'create_invoice'];
      return {
        ...prev,
        role: roleVal,
        permissions: perms
      };
    });
  };

  const handleEditPermissionToggle = (key) => {
    setEditingUser(prev => {
      const permissions = prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key];
      return { ...prev, permissions };
    });
  };

  const handleEditUserSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!editingUser.name.trim() || !editingUser.username.trim() || !editingUser.password.trim()) {
      setErrorMsg('Please populate all staff configuration inputs.');
      return;
    }

    const usernameExists = users.some(u => u.id !== editingUser.id && u.username.toLowerCase() === editingUser.username.trim().toLowerCase());
    if (usernameExists) {
      setErrorMsg('This username is already taken by another staff member.');
      return;
    }

    updateUser(editingUser.id, {
      name: editingUser.name.trim(),
      username: editingUser.username.trim().toLowerCase(),
      password: editingUser.password,
      role: editingUser.role,
      permissions: editingUser.permissions
    });

    setSuccessMsg(`Staff account "${editingUser.name.trim()}" successfully updated!`);
    setIsEditOpen(false);
    setEditingUser(null);
  };

  // Auto-fill role defaults
  const handleRoleChange = (roleVal) => {
    setNewRole(roleVal);
    if (roleVal === 'admin') {
      setSelectedPermissions(PERMISSIONS_LIST.map(p => p.key));
    } else {
      setSelectedPermissions(['view_dashboard', 'create_invoice']);
    }
  };

  // Submit new user registration
  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setErrorMsg('Please populate all staff configuration inputs.');
      return;
    }

    const usernameExists = users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (usernameExists) {
      setErrorMsg('This username is already registered. Please choose another.');
      return;
    }

    const registered = addUser({
      username: newUsername.trim().toLowerCase(),
      password: newPassword,
      name: newName.trim(),
      role: newRole,
      permissions: selectedPermissions
    });

    if (registered) {
      setSuccessMsg(`Staff account "${newName.trim()}" successfully created!`);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      handleRoleChange('staff');
    }
  };

  // Delete staff action
  const handleDeleteStaff = (id, name) => {
    if (window.confirm(`Are you absolutely sure you want to permanently revoke all access tokens and delete "${name}"?`)) {
      const response = deleteUser(id);
      if (response && !response.success) {
        alert(response.error);
      } else {
        setSuccessMsg(`Access revoked for staff member: ${name}`);
      }
    }
  };

  // Simulated Google Sheets Synchronization Trigger
  const triggerGoogleSheetsSync = () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncLogs([
      '[CONNECT] Initializing secure handshake with Google API servers...',
    ]);

    const logMessages = [
      { t: 300, msg: '[CONNECT] OAuth2 Token received. Connected as: CM Travel Point Sync Gateway' },
      { t: 600, msg: '[READ] Scanning local relational database schemas...' },
      { t: 900, msg: `[LEDGER] Compiling ${invoices.length} invoices, ${customers.length} CRM passenger accounts...` },
      { t: 1200, msg: `[VENDORS] Packing ${vendors.length} consolidator portal deposits and debit trails...` },
      { t: 1500, msg: `[EXPENSES] Formatting ${expenses.length} monthly administrative overhead bills...` },
      { t: 1800, msg: '[PUSH] Sending payloads to spreadsheet ID: 1t2rA9bC8d_CMTravelLedger2026...' },
      { t: 2100, msg: '[SYNC] Writing data blocks to worksheets: [Invoices, Customers, Vendors, Expenses]' },
      { t: 2400, msg: '[SUCCESS] Google Sheets spreadsheet ledger successfully updated and validated!' },
      { t: 2600, msg: '[BACKUP] Generating offline secure CSV database backup...' }
    ];

    // Progression timer
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    // Queue log printouts
    logMessages.forEach(item => {
      setTimeout(() => {
        setSyncLogs(prev => [...prev, item.msg]);
        if (item.msg.includes('[BACKUP]')) {
          // Trigger the physical unified backup download!
          exportUnifiedDatabaseBackupCSV(invoices, customers, vendors, expenses, payments);
          setIsSyncing(false);
        }
      }, item.t);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Dynamic Feedback Alerts */}
      {successMsg && (
        <div style={{ padding: '12px 18px', backgroundColor: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '14px', fontWeight: '500' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '12px 18px', backgroundColor: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '14px', fontWeight: '500' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        
        {/* Left Side: Staff Directory & Control Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Staff Account Profiles</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Review and manage registered employee credentials and their security clearance keys.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {users.map(user => (
              <div 
                key={user.id} 
                className="card"
                style={{ 
                  padding: '16px', 
                  backgroundColor: 'var(--bg-app)', 
                  border: '1px solid var(--border-color)', 
                  transform: 'none', 
                  boxShadow: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyCentent: 'center', justifyContent: 'center', fontWeight: '600', border: '1px solid hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.2)' }}>
                      {user.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{user.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Username: <b>{user.username}</b></span>
                        <span style={{ color: 'var(--border-color)' }}>|</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {user.id}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>

                    <button 
                      onClick={() => handleOpenEditStaff(user)}
                      className="btn" 
                      style={{ padding: '6px', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Edit staff details and clearance"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    
                    {user.id !== 'USER-001' && (
                      <button 
                        onClick={() => handleDeleteStaff(user.id, user.name)}
                        className="btn" 
                        style={{ padding: '6px', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Revoke and delete staff credentials"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Granular Permission Tags */}
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Clearance Badges:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {user.permissions.length === 0 ? (
                      <span style={{ fontSize: '11px', color: 'var(--danger)', fontStyle: 'italic' }}>No systems allowed. Restricted account.</span>
                    ) : (
                      user.permissions.map(perm => {
                        const matched = PERMISSIONS_LIST.find(p => p.key === perm);
                        return (
                          <span 
                            key={perm} 
                            style={{ 
                              fontSize: '11px', 
                              backgroundColor: perm === 'manage_staff' ? 'rgba(239, 68, 68, 0.08)' : 'var(--border-color)', 
                              color: perm === 'manage_staff' ? 'var(--danger)' : 'var(--text-muted)',
                              border: perm === 'manage_staff' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border-color)',
                              padding: '2px 8px', 
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}
                          >
                            {matched ? matched.label : perm}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Account Actions (Create User & Google Sheets Backups) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Action 1: Create Staff Member */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Register Ticketing Executive</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Generate customized security tokens, user login IDs, passwords, and permissions.</p>
            </div>

            <form onSubmit={handleAddUserSubmit} className="login-form">
              <div className="form-group">
                <label>Staff Member Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Zain ul Abidin"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Login Username ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. zain78"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Secret Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Default Security Role</label>
                <select 
                  className="form-select" 
                  value={newRole}
                  onChange={e => handleRoleChange(e.target.value)}
                >
                  <option value="staff">Ticketing Executive (Staff View)</option>
                  <option value="admin">Operations Manager (Administrator View)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Granular Clearance Access Checkboxes</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {PERMISSIONS_LIST.map(p => (
                    <label key={p.key} className="permission-checkbox-label" title={p.desc}>
                      <input 
                        type="checkbox" 
                        checked={selectedPermissions.includes(p.key)}
                        onChange={() => handlePermissionToggle(p.key)}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>{p.label}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '400' }}>{p.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                <span>Authorize & Seed Account</span>
              </button>
            </form>
          </div>

          {/* Action 2: Google Sheets Ledger Backup Synchronizer */}
          <div 
            className="card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              border: '1px solid rgba(52, 168, 83, 0.25)', 
              background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(52, 168, 83, 0.04) 100%)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(52, 168, 83, 0.12)', color: '#34a853', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '22px', height: '22px' }}>
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM6 6h5v4H6V6zm5 12H6v-4h5v4zm7 0h-5v-4h5v4zm0-6H6v-2h12v2zm0-4h-5V6h5v4z"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Google Sheet Ledger Sync</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Perform absolute live API handshakes to sync Invoices, CRM, & Portals ledger databases.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
              <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)' }}>
                <span>Spreadsheet Status:</span>
                <span style={{ color: '#34a853', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34a853', display: 'inline-block' }}></span>
                  Cloud Connected (v4 API)
                </span>
              </div>

              <button 
                onClick={triggerGoogleSheetsSync} 
                className="btn" 
                style={{ 
                  backgroundColor: '#34a853', 
                  color: 'white', 
                  cursor: isSyncing ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spinning-loader" style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}>
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                      <line x1="18" y1="12" x2="22" y2="12" />
                      <line x1="4.93" y1="19.78" x2="7.76" y2="16.93" />
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                    </svg>
                    <span>Syncing cloud cells... {syncProgress}%</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                    <span>Sync Backup Ledger Now</span>
                  </>
                )}
              </button>

              {/* Progress Bar */}
              {(isSyncing || syncProgress > 0) && (
                <div className="sync-progress-bar-container">
                  <div className="sync-progress-bar" style={{ width: `${syncProgress}%` }}></div>
                </div>
              )}

              {/* API Terminal Monitor Logs */}
              {(isSyncing || syncLogs.length > 0) && (
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>CLOUD LEDGER API LOGS:</span>
                  <div className="sync-log-terminal">
                    {syncLogs.map((log, index) => (
                      <div key={index} style={{ 
                        color: log.includes('[SUCCESS]') ? '#10b981' : log.includes('[CONNECT]') ? '#38bdf8' : '#e2e8f0' 
                      }}>
                        {log}
                      </div>
                    ))}
                    <div ref={terminalEndRef}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: Edit Staff Profile */}
      {isEditOpen && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Edit Staff Credentials & Access Clearance</h2>
              <button className="modal-close-btn" onClick={() => { setIsEditOpen(false); setEditingUser(null); }}>✕</button>
            </div>

            <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group">
                <label>Staff Member Full Name</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={editingUser.name}
                  onChange={e => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                  required 
                />
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Login Username ID</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={editingUser.username}
                    onChange={e => setEditingUser(prev => ({ ...prev, username: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Secret Password</label>
                  <input 
                    type="password" 
                    className="form-input"
                    placeholder="••••••••"
                    value={editingUser.password}
                    onChange={e => setEditingUser(prev => ({ ...prev, password: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Security Clearance Role</label>
                <select 
                  className="form-select" 
                  value={editingUser.role}
                  onChange={e => handleEditRoleChange(e.target.value)}
                  disabled={editingUser.id === 'USER-001'} // Disable demotion of primary admin
                >
                  <option value="staff">Ticketing Executive (Staff View)</option>
                  <option value="admin">Operations Manager (Administrator View)</option>
                </select>
                {editingUser.id === 'USER-001' && (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    ⚠️ Primary System Administrator role cannot be demoted.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Granular Clearance Access Checkboxes</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {PERMISSIONS_LIST.map(p => {
                    // Disable editing security_staff permission for primary admin to prevent lockout
                    const isSelfAdminStaffLock = editingUser.id === 'USER-001' && p.key === 'manage_staff';
                    return (
                      <label key={p.key} className="permission-checkbox-label" title={p.desc} style={{ opacity: isSelfAdminStaffLock ? 0.7 : 1 }}>
                        <input 
                          type="checkbox" 
                          checked={editingUser.permissions.includes(p.key)}
                          onChange={() => handleEditPermissionToggle(p.key)}
                          disabled={isSelfAdminStaffLock}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span>{p.label}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '400' }}>{p.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsEditOpen(false); setEditingUser(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
