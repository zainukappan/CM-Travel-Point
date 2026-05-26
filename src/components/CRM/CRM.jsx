import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { encryptField, decryptField, maskDocument } from '../../utils/crypto';

const formatCurr = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val);
};

export default function CRM() {
  const { 
    customers, 
    invoices, 
    clients, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    addClient, 
    updateClient, 
    deleteClient 
  } = useContext(AppContext);

  // Tab controller: 'passengers' | 'clients'
  const [activeTab, setActiveTab] = useState('passengers');

  // Search filter
  const [search, setSearch] = useState('');

  // Modals state for Passengers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Modals state for Corporate Clients
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);

  // Decryption simulated state for active vault view
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);

  const [newCust, setNewCust] = useState({
    name: '',
    email: '',
    phone: '',
    passportNo: '',
    passportExpiry: '',
    visaDetails: ''
  });

  const [editingCust, setEditingCust] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    passportNo: '',
    passportExpiry: '',
    visaDetails: ''
  });

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [editingClient, setEditingClient] = useState({
    id: '',
    name: '',
    email: '',
    phone: ''
  });

  // Passengers handlers
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newCust.name || !newCust.phone) {
      alert('Passenger name and contact number are mandatory.');
      return;
    }

    // Encrypt sensitive fields before database submission
    const securedPassport = encryptField(newCust.passportNo);
    const securedVisa = encryptField(newCust.visaDetails);

    addCustomer({
      name: newCust.name,
      email: newCust.email,
      phone: newCust.phone,
      passportNo: securedPassport,
      passportExpiry: newCust.passportExpiry,
      visaDetails: securedVisa
    });

    // Reset Form
    setNewCust({
      name: '',
      email: '',
      phone: '',
      passportNo: '',
      passportExpiry: '',
      visaDetails: ''
    });
    setIsAddOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingCust.name || !editingCust.phone) {
      alert('Passenger name and contact number are mandatory.');
      return;
    }

    const securedPassport = encryptField(editingCust.passportNo);
    const securedVisa = encryptField(editingCust.visaDetails);

    updateCustomer(editingCust.id, {
      name: editingCust.name,
      email: editingCust.email,
      phone: editingCust.phone,
      passportNo: securedPassport,
      passportExpiry: editingCust.passportExpiry,
      visaDetails: securedVisa
    });

    setIsEditOpen(false);
    setEditingCust({
      id: '',
      name: '',
      email: '',
      phone: '',
      passportNo: '',
      passportExpiry: '',
      visaDetails: ''
    });
  };

  // Corporate Clients handlers
  const handleAddClientSubmit = (e) => {
    e.preventDefault();
    if (!newClient.name) {
      alert('Client / Coordinator name is required.');
      return;
    }

    addClient({
      name: newClient.name,
      email: newClient.email || 'No email registered',
      phone: newClient.phone || 'Incomplete Client Profile'
    });

    setNewClient({
      name: '',
      email: '',
      phone: ''
    });
    setIsAddClientOpen(false);
  };

  const handleEditClientSubmit = (e) => {
    e.preventDefault();
    if (!editingClient.name) {
      alert('Client / Coordinator name is required.');
      return;
    }

    updateClient(editingClient.id, {
      name: editingClient.name,
      email: editingClient.email,
      phone: editingClient.phone
    });

    setIsEditClientOpen(false);
    setEditingClient({
      id: '',
      name: '',
      email: '',
      phone: ''
    });
  };

  // Perform decryption action with simulated military-grade visual transition
  const handleDecryptVault = () => {
    if (vaultUnlocked) {
      setVaultUnlocked(false);
      return;
    }
    
    setIsDecrypting(true);
    setTimeout(() => {
      setIsDecrypting(false);
      setVaultUnlocked(true);
    }, 1200); // 1.2s realistic loading pulse
  };

  // Search filter matching
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Get relational boarding timeline for a specific customer
  const getCustomerTimeline = (customerId) => {
    return invoices
      .filter(inv => inv.customerId === customerId)
      .sort((a, b) => new Date(b.travelDate) - new Date(a.travelDate));
  };

  // Get relational booking timeline for a corporate client Care-Of account
  const getClientTimeline = (clientId) => {
    return invoices
      .filter(inv => inv.coId === clientId)
      .sort((a, b) => new Date(b.travelDate) - new Date(a.travelDate));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sliding Tab Segmented Header Controller */}
      <div className="no-print" style={{ 
        display: 'flex', 
        backgroundColor: 'var(--bg-card)', 
        padding: '6px', 
        borderRadius: '16px', 
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto 10px auto'
      }}>
        <button
          type="button"
          onClick={() => { setActiveTab('passengers'); setSearch(''); }}
          style={{ 
            flex: 1, 
            padding: '10px 16px', 
            fontWeight: '700', 
            fontSize: '14px',
            border: 'none',
            borderRadius: '12px', 
            backgroundColor: activeTab === 'passengers' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'passengers' ? '#ffffff' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>👥</span> Passengers
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('clients'); setSearch(''); }}
          style={{ 
            flex: 1, 
            padding: '10px 16px', 
            fontWeight: '700', 
            fontSize: '14px',
            border: 'none',
            borderRadius: '12px', 
            backgroundColor: activeTab === 'clients' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'clients' ? '#ffffff' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🏢</span> Corporate Clients (C/o)
        </button>
      </div>

      {/* Directory Controls */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <input
            type="text"
            className="form-input"
            placeholder={activeTab === 'passengers' ? "Search Passengers by Name, Phone, Email..." : "Search Clients by Name, Phone, Email..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: '1', maxWidth: '400px' }}
          />

          {activeTab === 'passengers' ? (
            <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Register Traveler</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsAddClientOpen(true)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Register Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Passengers Grid */}
      {activeTab === 'passengers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(cust => {
              const custInvoices = invoices.filter(inv => inv.customerId === cust.id);
              const tripsCount = custInvoices.length;
              const totalBilled = custInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);
              const totalPaid = custInvoices.reduce((sum, inv) => sum + (parseFloat(inv.paidAmount) || 0), 0);
              const debt = totalBilled - totalPaid;
              const isGuestWalkIn = cust.isWalkIn || cust.name.toLowerCase().includes('guest');

              let cardStyle = {
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              };

              if (isGuestWalkIn) {
                cardStyle.borderLeft = '4px solid #f59e0b';
                cardStyle.boxShadow = '0 0 16px rgba(245, 158, 11, 0.15), inset 0 0 0 1px rgba(245, 158, 11, 0.1)';
                cardStyle.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(245, 158, 11, 0.02) 100%)';
              } else if (debt > 0) {
                cardStyle.borderLeft = '4px solid #ef4444';
                cardStyle.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%)';
                cardStyle.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.04)';
              } else if (tripsCount > 0) {
                cardStyle.borderLeft = '4px solid #10b981';
                cardStyle.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.01) 100%)';
              }

              return (
                <div
                  key={cust.id}
                  className="card card-glass"
                  style={cardStyle}
                  onClick={() => {
                    setSelectedCustomer(cust);
                    setVaultUnlocked(false);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase' }}>{cust.id}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '2px 6px', fontSize: '10px', minWidth: 'auto' }}
                        onClick={() => {
                          setEditingCust({
                            id: cust.id,
                            name: cust.name,
                            email: cust.email,
                            phone: cust.phone,
                            passportNo: decryptField(cust.passportNo) || '',
                            passportExpiry: cust.passportExpiry || '',
                            visaDetails: decryptField(cust.visaDetails) || ''
                          });
                          setIsEditOpen(true);
                        }}
                        title="Update profile details"
                      >
                        Update
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '2px 6px', fontSize: '10px', minWidth: 'auto', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderColor: 'transparent' }}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete passenger ${cust.name}? This will remove them from the directory.`)) {
                            deleteCustomer(cust.id);
                          }
                        }}
                        title="Delete profile"
                      >
                        Delete
                      </button>
                      <span style={{ fontSize: '11px', backgroundColor: 'rgba(79, 70, 229, 0.08)', padding: '2px 8px', borderRadius: '10px', color: 'var(--primary)', fontWeight: '600' }}>
                        {tripsCount} {tripsCount === 1 ? 'Trip' : 'Trips'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      {cust.name}
                      {isGuestWalkIn && (
                        <span style={{ fontSize: '10px', color: '#fff', backgroundColor: '#f59e0b', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                          Guest
                        </span>
                      )}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{cust.email || 'No email registered'}</p>
                    
                    {/* Financial Status and Profile Warnings */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {isGuestWalkIn && (
                        <span style={{ fontSize: '11px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: '12px', color: '#d97706', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ⚠️ Walk-In Guest (Needs Profile Update)
                        </span>
                      )}
                      {debt > 0 ? (
                        <span style={{ fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: '12px', color: '#ef4444', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ⚠️ Debt: {formatCurr(debt)}
                        </span>
                      ) : tripsCount > 0 ? (
                        <span style={{ fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px', color: '#10b981', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ✓ Clear
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Contact:</span>
                      <span style={{ fontWeight: '500' }}>{cust.phone}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Passport Expiry:</span>
                      <span style={{ fontWeight: '500', color: cust.passportExpiry && new Date(cust.passportExpiry) < new Date() ? 'var(--danger)' : 'var(--text-main)' }}>
                        {cust.passportExpiry || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No traveler records found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* Corporate Clients Tab Grid */}
      {activeTab === 'clients' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredClients.length > 0 ? (
            filteredClients.map(client => {
              const clientInvoices = invoices.filter(inv => inv.coId === client.id);
              const tripsCount = clientInvoices.length;
              const totalBilled = clientInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);
              const totalPaid = clientInvoices.reduce((sum, inv) => sum + (parseFloat(inv.paidAmount) || 0), 0);
              const debt = totalBilled - totalPaid;
              
              let cardStyle = {
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              };

              if (debt > 0) {
                cardStyle.borderLeft = '4px solid #ef4444';
                cardStyle.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%)';
                cardStyle.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.04)';
              } else if (tripsCount > 0) {
                cardStyle.borderLeft = '4px solid #10b981';
                cardStyle.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.01) 100%)';
              }

              return (
                <div
                  key={client.id}
                  className="card card-glass"
                  style={cardStyle}
                  onClick={() => {
                    setSelectedClient(client);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase' }}>{client.id}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '2px 6px', fontSize: '10px', minWidth: 'auto' }}
                        onClick={() => {
                          setEditingClient({
                            id: client.id,
                            name: client.name,
                            email: client.email || '',
                            phone: client.phone || ''
                          });
                          setIsEditClientOpen(true);
                        }}
                        title="Update Client details"
                      >
                        Update
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '2px 6px', fontSize: '10px', minWidth: 'auto', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderColor: 'transparent' }}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete corporate client ${client.name}? Historical passenger records will remain fully intact.`)) {
                            deleteClient(client.id);
                          }
                        }}
                        title="Delete Client"
                      >
                        Delete
                      </button>
                      <span style={{ fontSize: '11px', backgroundColor: 'rgba(79, 70, 229, 0.08)', padding: '2px 8px', borderRadius: '10px', color: 'var(--primary)', fontWeight: '600' }}>
                        {tripsCount} {tripsCount === 1 ? 'Trip' : 'Trips'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>
                      {client.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{client.email || 'No email registered'}</p>
                    
                    {/* Financial Status Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {debt > 0 ? (
                        <span style={{ fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: '12px', color: '#ef4444', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ⚠️ Debt: {formatCurr(debt)}
                        </span>
                      ) : tripsCount > 0 ? (
                        <span style={{ fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px', color: '#10b981', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ✓ Clear
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Contact:</span>
                      <span style={{ fontWeight: '500' }}>{client.phone || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Volume:</span>
                      <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{formatCurr(totalBilled)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No corporate client records found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Register Traveler Form */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Register New CRM Passenger Profile</h2>
              <button className="modal-close-btn" onClick={() => setIsAddOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Passenger Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Jane Doe"
                    value={newCust.name}
                    onChange={(e) => setNewCust(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    required
                    placeholder="e.g. +92 300 1234567"
                    value={newCust.phone}
                    onChange={(e) => setNewCust(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Passenger Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. jane.doe@example.com"
                  value={newCust.email}
                  onChange={(e) => setNewCust(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="form-grid" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div className="form-group">
                  <label>Passport Number (AES Masked)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. AB1234567"
                    value={newCust.passportNo}
                    onChange={(e) => setNewCust(prev => ({ ...prev, passportNo: e.target.value.toUpperCase() }))}
                  />
                </div>

                <div className="form-group">
                  <label>Passport Expiration Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newCust.passportExpiry}
                    onChange={(e) => setNewCust(prev => ({ ...prev, passportExpiry: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Sensitive Travel Visas & Approvals (AES Masked)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Schengen Business Visa Multi-Entry"
                  value={newCust.visaDetails}
                  onChange={(e) => setNewCust(prev => ({ ...prev, visaDetails: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', padding: '10px', backgroundColor: 'var(--success-bg)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '11px', color: 'var(--success)' }}>
                <span>🔒 Secure AES-256 local database simulation will be applied to Passport Number and Visa Details.</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Profile & Secure Timeline View */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', padding: '24px' }}>
            <div className="modal-header">
              <h2>Traveler Directory Dossier</h2>
              <button className="modal-close-btn" onClick={() => setSelectedCustomer(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Profile Details header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <div className="user-avatar" style={{ width: '56px', height: '56px', borderRadius: '16px', fontSize: '20px' }}>
                  {selectedCustomer.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{selectedCustomer.name}</h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Passenger ID: {selectedCustomer.id} | Active customer since {selectedCustomer.createdDate || '2026'}</span>
                </div>
              </div>

              {/* Secure Document Encryption Vault */}
              <div className="card" style={{ backgroundColor: 'hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.03)', border: '1px solid var(--primary-glow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: vaultUnlocked ? 'var(--success)' : 'var(--warning)' }}>
                      {vaultUnlocked ? '🔓' : '🔒'}
                    </span>
                    <h3 style={{ fontSize: '14px', fontWeight: '700' }}>AES-256 Secure Passenger Vault</h3>
                  </div>
                  <button
                    className={`btn ${vaultUnlocked ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                    onClick={handleDecryptVault}
                    disabled={isDecrypting}
                  >
                    {isDecrypting ? 'Processing Decrypter...' : vaultUnlocked ? 'Lock Vault Records' : 'Decrypt Document Vault'}
                  </button>
                </div>

                {isDecrypting ? (
                  /* Decryption loader simulation */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', padding: '16px 0' }}>
                    <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div className="decryption-bar" style={{ width: '40%', height: '100%', backgroundColor: 'var(--warning)', borderRadius: '10px', animation: 'pulse 1s infinite alternate' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: '600', letterSpacing: '1px' }}>PERFORMING CRYPTOGRAPHIC HANDSHAKE...</span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600' }}>PASSPORT NUMBER</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '14px', letterSpacing: '1px' }}>
                        {vaultUnlocked
                          ? decryptField(selectedCustomer.passportNo) || 'No Passport Saved'
                          : maskDocument(decryptField(selectedCustomer.passportNo) || 'No Passport Saved', 2)
                        }
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600' }}>SENSITIVE VISA RECORDS</span>
                      <span style={{ fontWeight: '600' }}>
                        {vaultUnlocked
                          ? decryptField(selectedCustomer.visaDetails) || 'None'
                          : maskDocument(decryptField(selectedCustomer.visaDetails) || 'None', 3)
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Trip and transaction history timeline */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>relational Booking Timeline</h3>
                
                <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                  {getCustomerTimeline(selectedCustomer.id).length > 0 ? (
                    <div className="timeline">
                      {getCustomerTimeline(selectedCustomer.id).map(inv => {
                        const ratio = inv.totalAmount > 0 ? (inv.paidAmount / inv.totalAmount) * 100 : 0;
                        const ratioColor = ratio >= 100 ? '#10b981' : ratio > 0 ? '#f59e0b' : '#ef4444';
                        
                        return (
                          <div key={inv.id} className="timeline-item" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                            <div className={`timeline-dot ${inv.status}`} style={{ marginTop: '6px' }} />
                            <div className="timeline-content" style={{ marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '14px' }}>{inv.id}</span>
                                  <span style={{ fontSize: '11px', backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>PNR: {inv.pnr || 'N/A'}</span>
                                </div>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📅 {inv.travelDate}</span>
                              </div>
                              
                              <p style={{ fontSize: '13px', fontWeight: '500', margin: 0, color: 'var(--text-main)' }}>{inv.details}</p>
                              
                              {/* Route information subcategory display */}
                              {(inv.fromLocation || inv.toLocation) && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  📍 <strong>Route:</strong> {inv.fromLocation || 'N/A'} ➔ {inv.toLocation || 'N/A'} 
                                  {inv.travelType === 'Air' && inv.airlineName && ` (${inv.airlineName})`}
                                </span>
                              )}

                              {/* Micro-grid for fare details & B2B supplier */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', backgroundColor: 'rgba(0, 0, 0, 0.02)', padding: '10px', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border-color)' }}>
                                <div>
                                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Supplier (GDS)</span>
                                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{inv.vendorId || 'Direct Booking'}</span>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Ticket Number</span>
                                  <span style={{ fontWeight: '600', color: 'var(--text-main)', fontFamily: 'monospace' }}>{inv.ticketNo || 'N/A'}</span>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Total Amount</span>
                                  <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{formatCurr(inv.totalAmount || 0)}</span>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Amount Paid</span>
                                  <span style={{ fontWeight: '700', color: 'var(--success)' }}>{formatCurr(inv.paidAmount || 0)}</span>
                                </div>
                              </div>

                              {/* Paid ratio & progress indicator */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Payment Settlement Ratio</span>
                                  <span style={{ fontWeight: '600', color: ratioColor }}>
                                    {formatCurr(inv.paidAmount)} / {formatCurr(inv.totalAmount)} ({ratio.toFixed(0)}%)
                                  </span>
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(ratio, 100)}%`, height: '100%', backgroundColor: ratioColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px', fontSize: '13px' }}>
                      No boarding cards or invoices logged for this traveler.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>Close Dossier</button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Update Passenger Form */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Update CRM Passenger Profile ({editingCust.id})</h2>
              <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Passenger Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Jane Doe"
                    value={editingCust.name}
                    onChange={(e) => setEditingCust(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    required
                    placeholder="e.g. +92 300 1234567"
                    value={editingCust.phone}
                    onChange={(e) => setEditingCust(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Passenger Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. jane.doe@example.com"
                  value={editingCust.email}
                  onChange={(e) => setEditingCust(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="form-grid" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div className="form-group">
                  <label>Passport Number (AES Decrypted for editing)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. AB1234567"
                    value={editingCust.passportNo}
                    onChange={(e) => setEditingCust(prev => ({ ...prev, passportNo: e.target.value.toUpperCase() }))}
                  />
                </div>

                <div className="form-group">
                  <label>Passport Expiration Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingCust.passportExpiry}
                    onChange={(e) => setEditingCust(prev => ({ ...prev, passportExpiry: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Sensitive Travel Visas & Approvals (AES Decrypted for editing)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Schengen Business Visa Multi-Entry"
                  value={editingCust.visaDetails}
                  onChange={(e) => setEditingCust(prev => ({ ...prev, visaDetails: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', padding: '10px', backgroundColor: 'var(--success-bg)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '11px', color: 'var(--success)' }}>
                <span>🔒 Secured passport credentials are automatically decrypted so you can view and edit them in cleartext. They will be re-encrypted upon submission.</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Updates</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Register Corporate Client Form */}
      {isAddClientOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Register New Corporate Client / Coordinator</h2>
              <button className="modal-close-btn" onClick={() => setIsAddClientOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddClientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Company / Coordinator Name (C/o)</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Zain Travels, Global Tech Solutions"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Contact Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +91 98456 12345"
                    value={newClient.phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Corporate Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. travel@company.com"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddClientOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Update Corporate Client Form */}
      {isEditClientOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Update Corporate Client Profile ({editingClient.id})</h2>
              <button className="modal-close-btn" onClick={() => setIsEditClientOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleEditClientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Company / Coordinator Name (C/o)</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Zain Travels, Global Tech Solutions"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Contact Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +91 98456 12345"
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Corporate Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. travel@company.com"
                    value={editingClient.email}
                    onChange={(e) => setEditingClient(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditClientOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Updates</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Corporate Client Dossier Modal */}
      {selectedClient && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', padding: '24px' }}>
            <div className="modal-header">
              <h2>Corporate Client Directory Dossier</h2>
              <button className="modal-close-btn" onClick={() => setSelectedClient(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Profile Details header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <div className="user-avatar" style={{ width: '56px', height: '56px', borderRadius: '16px', fontSize: '20px', backgroundColor: 'var(--primary)', color: '#fff' }}>
                  {selectedClient.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{selectedClient.name}</h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Client ID: {selectedClient.id} | Active corporate account since {selectedClient.createdDate || '2026'}</span>
                </div>
              </div>

              {/* Client Contact Info Card */}
              <div className="card" style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600' }}>EMAIL ADDRESS</span>
                    <span style={{ fontWeight: '600' }}>{selectedClient.email || 'No email registered'}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600' }}>PHONE NUMBER</span>
                    <span style={{ fontWeight: '600' }}>{selectedClient.phone || 'Incomplete Profile'}</span>
                  </div>
                </div>
              </div>

              {/* Trip and transaction history timeline */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Corporate Care-of Booking History</h3>
                
                <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                  {getClientTimeline(selectedClient.id).length > 0 ? (
                    <div className="timeline">
                      {getClientTimeline(selectedClient.id).map(inv => {
                        const ratio = inv.totalAmount > 0 ? (inv.paidAmount / inv.totalAmount) * 100 : 0;
                        const ratioColor = ratio >= 100 ? '#10b981' : ratio > 0 ? '#f59e0b' : '#ef4444';
                        
                        return (
                          <div key={inv.id} className="timeline-item" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                            <div className={`timeline-dot ${inv.status}`} style={{ marginTop: '6px' }} />
                            <div className="timeline-content" style={{ marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '14px' }}>{inv.id}</span>
                                  <span style={{ fontSize: '11px', backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>PNR: {inv.pnr || 'N/A'}</span>
                                  <span style={{ fontSize: '11px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                    Passenger: {inv.customerName}
                                  </span>
                                </div>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📅 {inv.travelDate}</span>
                              </div>
                              
                              <p style={{ fontSize: '13px', fontWeight: '500', margin: 0, color: 'var(--text-main)' }}>{inv.details}</p>
                              
                              {/* Route information subcategory display */}
                              {(inv.fromLocation || inv.toLocation) && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  📍 <strong>Route:</strong> {inv.fromLocation || 'N/A'} ➔ {inv.toLocation || 'N/A'} 
                                  {inv.travelType === 'Air' && inv.airlineName && ` (${inv.airlineName})`}
                                </span>
                              )}
                              
                              {/* Micro-grid for fare details & B2B supplier */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', backgroundColor: 'rgba(0, 0, 0, 0.02)', padding: '10px', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border-color)' }}>
                                <div>
                                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Supplier (GDS)</span>
                                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{inv.vendorId || 'Direct Booking'}</span>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Ticket Number</span>
                                  <span style={{ fontWeight: '600', color: 'var(--text-main)', fontFamily: 'monospace' }}>{inv.ticketNo || 'N/A'}</span>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Total Amount</span>
                                  <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{formatCurr(inv.totalAmount || 0)}</span>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Amount Paid</span>
                                  <span style={{ fontWeight: '700', color: 'var(--success)' }}>{formatCurr(inv.paidAmount || 0)}</span>
                                </div>
                              </div>

                              {/* Paid ratio & progress indicator */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Payment Settlement Ratio</span>
                                  <span style={{ fontWeight: '600', color: ratioColor }}>
                                    {formatCurr(inv.paidAmount)} / {formatCurr(inv.totalAmount)} ({ratio.toFixed(0)}%)
                                  </span>
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(ratio, 100)}%`, height: '100%', backgroundColor: ratioColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px', fontSize: '13px' }}>
                      No boarding cards or care-of invoices logged for this corporate client.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedClient(null)}>Close Dossier</button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
