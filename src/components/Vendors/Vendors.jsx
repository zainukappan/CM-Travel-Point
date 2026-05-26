import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';

export default function Vendors() {
  const { vendors, addVendorDeposit, addVendor, updateVendor, deleteVendor } = useContext(AppContext);

  // States
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [deposit, setDeposit] = useState({
    vendorId: '',
    amount: 0,
    reference: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Register state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    portalName: ''
  });

  // Edit state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState({
    id: '',
    name: '',
    portalName: ''
  });

  // Helper formatting
  const formatCurr = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Compile calculations for vendors (Debits vs Deposits)
  const getVendorDetails = (v) => {
    const deposits = v.transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
    const debits = v.transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = deposits - debits; // positive is credit, negative is payable
    return {
      ...v,
      deposits,
      debits,
      netBalance
    };
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (deposit.amount <= 0 || !deposit.vendorId) {
      alert('Please fill out all payment details.');
      return;
    }

    addVendorDeposit(deposit.vendorId, {
      amount: deposit.amount,
      date: deposit.date,
      note: `${deposit.note || 'Advance Topup'} (Ref: ${deposit.reference || 'WIRE-DEP'})`
    });

    // Reset local modal state
    setDeposit({
      vendorId: '',
      amount: 0,
      reference: '',
      note: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsDepositOpen(false);

    // If modal of vendor detail is open, update that view state too
    if (selectedVendor) {
      const freshV = vendors.find(v => v.id === selectedVendor.id);
      if (freshV) {
        setSelectedVendor(freshV);
      }
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newVendor.name || !newVendor.portalName) {
      alert('Please fill out all details.');
      return;
    }
    addVendor({
      name: newVendor.name,
      portalName: newVendor.portalName
    });
    setNewVendor({ name: '', portalName: '' });
    setIsAddOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingVendor.name || !editingVendor.portalName) {
      alert('Please fill out all details.');
      return;
    }
    updateVendor(editingVendor.id, {
      name: editingVendor.name,
      portalName: editingVendor.portalName
    });
    setEditingVendor({ id: '', name: '', portalName: '' });
    setIsEditOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Upper header overview cards */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>B2B Ticketing Portal Ledger Accounts</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monitor credits and outstanding vendor balances</span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(true)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Register Consolidator</span>
            </button>

            <button className="btn btn-primary" onClick={() => setIsDepositOpen(true)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Top-up B2B Advance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Vendor grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {vendors.map(v => {
          const vDetails = getVendorDetails(v);
          const hasAdvance = vDetails.netBalance >= 0;

          return (
            <div
              key={v.id}
              className="card card-glass"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px' }}
              onClick={() => setSelectedVendor(v)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{v.id}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '2px 6px', fontSize: '10px', minWidth: 'auto' }}
                    onClick={() => {
                      setEditingVendor({
                        id: v.id,
                        name: v.name,
                        portalName: v.portalName
                      });
                      setIsEditOpen(true);
                    }}
                  >
                    Update
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '2px 6px', fontSize: '10px', minWidth: 'auto', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderColor: 'transparent' }}
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete consolidator ${v.name}? This will purge their transaction ledger.`)) {
                        deleteVendor(v.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                  <span className={`status-pill ${hasAdvance ? 'paid' : 'pending'}`}>
                    {hasAdvance ? 'Advance Credit' : 'Outstanding Liability'}
                  </span>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{v.name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Portal Channel: {v.portalName}</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: 'var(--bg-app)',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL TOPUPS</span>
                  <span style={{ fontWeight: '700', color: 'var(--success)' }}>{formatCurr(vDetails.deposits)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TICKET CHARGES</span>
                  <span style={{ fontWeight: '700', color: 'var(--danger)' }}>{formatCurr(vDetails.debits)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Net Running Balance:</span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '800',
                  color: hasAdvance ? 'var(--success)' : 'var(--danger)'
                }}>
                  {formatCurr(vDetails.netBalance)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: B2B Deposit replenishment Form */}
      {isDepositOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Top-up B2B Vendor Advance Account</h2>
              <button className="modal-close-btn" onClick={() => setIsDepositOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Select Vendor Portal</label>
                <select
                  className="form-select"
                  required
                  value={deposit.vendorId}
                  onChange={(e) => setDeposit(prev => ({ ...prev, vendorId: e.target.value }))}
                >
                  <option value="">-- Choose Portal Account --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.portalName})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Deposit Replenishment Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="1"
                  value={deposit.amount || ''}
                  placeholder="e.g. 5000"
                  onChange={(e) => setDeposit(prev => ({ ...prev, amount: Number(e.target.value) }))}
                />
              </div>

              <div className="form-group">
                <label>Deposit Date</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={deposit.date}
                  onChange={(e) => setDeposit(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Wire Transfer ID / Reference</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Bank Wire reference number"
                  value={deposit.reference}
                  onChange={(e) => setDeposit(prev => ({ ...prev, reference: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Internal Memo / Note</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. May standard quota increase"
                  value={deposit.note}
                  onChange={(e) => setDeposit(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsDepositOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Deposit Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Running Statement Ledger Details */}
      {selectedVendor && (() => {
        const vDetails = getVendorDetails(selectedVendor);
        
        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '750px', padding: '24px' }}>
              <div className="modal-header">
                <h2>B2B Running Account Statement</h2>
                <button className="modal-close-btn" onClick={() => setSelectedVendor(null)}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{selectedVendor.name}</h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Portal Channel: {selectedVendor.portalName}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Net Portal Balance:</span>
                    <span style={{ fontSize: '22px', fontWeight: '800', color: vDetails.netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {formatCurr(vDetails.netBalance)}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Historical Ledger Logs</h3>

                  <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="custom-table" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Transaction Detail</th>
                          <th>Invoice Ref</th>
                          <th>Type</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vDetails.transactions && vDetails.transactions.length > 0 ? (
                          vDetails.transactions
                            .sort((a,b) => new Date(b.date) - new Date(a.date))
                            .map(t => (
                              <tr key={t.id}>
                                <td>{t.date}</td>
                                <td>
                                  <span style={{ fontWeight: '500' }}>{t.note || 'Portal operation'}</span>
                                </td>
                                <td>
                                  {t.invoiceId ? (
                                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{t.invoiceId}</span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>--</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`status-pill ${t.type === 'deposit' ? 'paid' : 'pending'}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                                    {t.type === 'deposit' ? 'DEPOSIT' : 'DEBIT'}
                                  </span>
                                </td>
                                <td style={{
                                  textAlign: 'right',
                                  fontWeight: '700',
                                  color: t.type === 'deposit' ? 'var(--success)' : 'var(--danger)'
                                }}>
                                  {t.type === 'deposit' ? `+${formatCurr(t.amount)}` : `-${formatCurr(t.amount)}`}
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                              No transactions recorded for this supplier.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                  <button className="btn btn-secondary" onClick={() => setSelectedVendor(null)}>Close Statement</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: Register Consolidator Form */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Register New B2B Consolidator</h2>
              <button className="modal-close-btn" onClick={() => setIsAddOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Consolidator Agency Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Galileo Ticketing Hub"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>GDS / Connection Portal Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Smartpoint Galileo Web"
                  value={newVendor.portalName}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, portalName: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(true)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Register Portal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Update Consolidator Form */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Update B2B Consolidator Profile ({editingVendor.id})</h2>
              <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Consolidator Agency Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Galileo Ticketing Hub"
                  value={editingVendor.name}
                  onChange={(e) => setEditingVendor(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>GDS / Connection Portal Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Smartpoint Galileo Web"
                  value={editingVendor.portalName}
                  onChange={(e) => setEditingVendor(prev => ({ ...prev, portalName: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
