import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { LogoSVG } from '../Sidebar';

export default function Invoices() {
  const { invoices, customers, vendors, airlines, clients, addInvoice, addPayment, updateInvoice, deleteInvoice, addAirline } = useContext(AppContext);

  // Filter and Search States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterType, setFilterType] = useState('All'); // 'All' | 'Month' | 'Custom'
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit Invoice States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Sorting States
  const [sortField, setSortField] = useState('createdDate'); // default sorting by Invoice Date
  const [sortDirection, setSortDirection] = useState('desc'); // default descending (newest first)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Form Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    customerId: '',
    customerName: '',
    pnr: '',
    ticketNo: '',
    travelDate: '',
    travelType: 'Air',
    details: '',
    fromLocation: '',
    toLocation: '',
    airlineName: '',
    coId: '',
    coName: '',
    baseFare: 0,
    serviceCharge: 0,
    taxGst: 0,
    additionalAmount: 0,
    additionalAmountDate: new Date().toISOString().split('T')[0],
    initialPayment: 0,
    paymentMethod: 'Cash',
    paymentReference: '',
    vendorId: ''
  });

  // View Modal States
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLogPaymentOpen, setIsLogPaymentOpen] = useState(false);
  const [logPayment, setLogPayment] = useState({
    amount: 0,
    paymentMethod: 'Cash',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Dynamic cost calculations for form
  const computedTotal = Number(newInvoice.baseFare || 0) + Number(newInvoice.serviceCharge || 0) + Number(newInvoice.taxGst || 0) + Number(newInvoice.additionalAmount || 0);

  // Handles Search and Filter logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.pnr.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.ticketNo.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'All' || inv.travelType === typeFilter;
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter.toLowerCase();

    const date = inv.createdDate || inv.travelDate || '';
    let matchesDate = true;
    if (filterType === 'Month') {
      matchesDate = date.startsWith(selectedMonth);
    } else if (filterType === 'Custom') {
      matchesDate = (!startDate || date >= startDate) && (!endDate || date <= endDate);
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  // Sort Invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();

    if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
    if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Format currency
  const formatCurr = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newInvoice.customerId && !newInvoice.customerName) {
      alert('Please select a customer or provide a name.');
      return;
    }
    
    // Choose customer name from dropdown if selected
    let custName = newInvoice.customerName;
    if (newInvoice.customerId) {
      const activeCust = customers.find(c => c.id === newInvoice.customerId);
      if (activeCust) custName = activeCust.name;
    }

    let finalCoId = newInvoice.coId;
    let finalCoName = newInvoice.coName;
    if (finalCoId === 'custom') {
      finalCoId = '';
    }

    addInvoice({
      ...newInvoice,
      customerName: custName,
      coId: finalCoId,
      coName: finalCoName
    });

    // Reset Form
    setNewInvoice({
      customerId: '',
      customerName: '',
      pnr: '',
      ticketNo: '',
      travelDate: '',
      travelType: 'Air',
      details: '',
      fromLocation: '',
      toLocation: '',
      airlineName: '',
      coId: '',
      coName: '',
      baseFare: 0,
      serviceCharge: 0,
      taxGst: 0,
      initialPayment: 0,
      paymentMethod: 'Cash',
      paymentReference: '',
      vendorId: ''
    });
    
    setIsCreateOpen(false);
  };

  const handleLogPaymentSubmit = (e) => {
    e.preventDefault();
    if (logPayment.amount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    addPayment(selectedInvoice.id, logPayment);
    
    // Update local state in view modal to show new metrics immediately
    const updatedInvoice = invoices.find(inv => inv.id === selectedInvoice.id);
    if (updatedInvoice) {
      const nextPaid = updatedInvoice.paidAmount + Number(logPayment.amount);
      const isPaid = nextPaid >= updatedInvoice.totalAmount;
      setSelectedInvoice({
        ...updatedInvoice,
        paidAmount: nextPaid,
        status: isPaid ? 'paid' : 'partial'
      });
    }

    setLogPayment({
      amount: 0,
      paymentMethod: 'Cash',
      reference: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsLogPaymentOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingInvoice.customerId && !editingInvoice.customerName) {
      alert('Please select a customer or provide a name.');
      return;
    }
    
    let custName = editingInvoice.customerName;
    if (editingInvoice.customerId) {
      const activeCust = customers.find(c => c.id === editingInvoice.customerId);
      if (activeCust) custName = activeCust.name;
    }

    let finalCoId = editingInvoice.coId;
    let finalCoName = editingInvoice.coName;
    if (finalCoId === 'custom') {
      finalCoId = '';
    }

    updateInvoice(editingInvoice.id, {
      ...editingInvoice,
      customerName: custName,
      coId: finalCoId,
      coName: finalCoName
    });

    setIsEditOpen(false);
    setEditingInvoice(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = (inv) => {
    const passenger = customers.find(c => c.id === inv.customerId);
    const phone = passenger ? passenger.phone.replace(/[^0-9+]/g, '') : '';
    const pendingBalance = inv.totalAmount - inv.paidAmount;
    
    const message = `Dear ${inv.customerName},\n\nYour *${inv.travelType} Booking* has been processed successfully!\n\n📋 *PNR:* ${inv.pnr}\n🎫 *Ticket No:* ${inv.ticketNo}\n✈️ *Travel Details:* ${inv.details}\n📅 *Travel Date:* ${inv.travelDate}\n\n*Fare Breakdown:*\n- Base Fare: ${formatCurr(inv.baseFare)}\n- Taxes: ${formatCurr(inv.taxGst)}\n- Total Cost: ${formatCurr(inv.totalAmount)}\n- Amount Paid: ${formatCurr(inv.paidAmount)}\n- Outstanding Balance: ${formatCurr(pendingBalance)}\n\nThank you for booking with CM Travel Point! For support, contact us anytime.`;
    
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = (inv) => {
    const passenger = customers.find(c => c.id === inv.customerId);
    const email = passenger ? passenger.email : '';
    const pendingBalance = inv.totalAmount - inv.paidAmount;
    
    const subject = `Booking Confirmation & Invoice Reference: ${inv.id} (PNR: ${inv.pnr})`;
    const body = `Dear ${inv.customerName},\n\nThank you for choosing CM Travel Point. We have generated your travel invoice.\n\nBooking Summary:\n-----------------------------\nInvoice ID: ${inv.id}\nPNR: ${inv.pnr}\nTicket No: ${inv.ticketNo}\nDetails: ${inv.details}\nTravel Date: ${inv.travelDate}\n\nTotal Fare: ${formatCurr(inv.totalAmount)}\nAmount Paid: ${formatCurr(inv.paidAmount)}\nOutstanding Balance: ${formatCurr(pendingBalance)}\n\nTo complete pending payments, please remit to bank details or reply directly to this mail.\n\nBest regards,\nCM Travel Point Ticketing Team`;
    
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Search and Filters Header Block */}
      <div className="card no-print" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', flex: '1', minWidth: '260px', gap: '10px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search Invoices by Customer, PNR, Ticket..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Air">Air Flight</option>
              <option value="Train">Train Ticket</option>
            </select>

            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
            </select>

            <select
              className="form-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Dates</option>
              <option value="Month">Month-wise</option>
              <option value="Custom">Custom Range</option>
            </select>

            {filterType === 'Month' && (
              <input 
                type="month"
                className="form-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ width: '140px', padding: '6px' }}
              />
            )}

            {filterType === 'Custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input 
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '130px', padding: '6px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>to</span>
                <input 
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '130px', padding: '6px' }}
                />
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={() => setIsCreateOpen(true)}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Generate Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Directory Table */}
      <div className="card no-print">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Invoice ID {sortField === 'id' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th onClick={() => handleSort('createdDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Invoice Date {sortField === 'createdDate' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th onClick={() => handleSort('customerName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Passenger Name {sortField === 'customerName' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th onClick={() => handleSort('pnr')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  PNR / Ticket {sortField === 'pnr' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th onClick={() => handleSort('travelDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Travel Date {sortField === 'travelDate' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th onClick={() => handleSort('details')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Details {sortField === 'details' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th onClick={() => handleSort('totalAmount')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                  Invoice Cost {sortField === 'totalAmount' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th onClick={() => handleSort('paidAmount')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                  Paid {sortField === 'paidAmount' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Status {sortField === 'status' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.length > 0 ? (
                sortedInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{inv.id}</td>
                    <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{inv.createdDate || inv.travelDate || 'N/A'}</td>
                    <td>{inv.customerName}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600' }}>{inv.pnr}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.ticketNo}</span>
                      </div>
                    </td>
                    <td>{inv.travelDate}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inv.details}
                    </td>
                    <td style={{ fontWeight: '700' }}>{formatCurr(inv.totalAmount)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatCurr(inv.paidAmount)}</td>
                    <td>
                      <span className={`status-pill ${inv.status}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          onClick={() => {
                            setEditingInvoice({ ...inv });
                            setIsEditOpen(true);
                          }}
                          title="Edit Invoice details"
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          onClick={() => setSelectedInvoice(inv)}
                          title="Open PDF printable preview & payments log"
                        >
                          View Voucher
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px', minWidth: '32px' }}
                          onClick={() => handleShareWhatsApp(inv)}
                          title="Share confirmation on passenger WhatsApp"
                        >
                          💬
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete invoice ${inv.id} for ${inv.customerName}? This will permanently remove it from the system.`)) {
                              deleteInvoice(inv.id);
                            }
                          }}
                          title="Permanently delete this invoice"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No matching invoices found in history database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create Invoice Form */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h2>Generate Professional Ticketing Invoice</h2>
              <button className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }} className="form-group">
                  <label>Link Directory Customer (CRM)</label>
                  <select
                    className="form-select"
                    value={newInvoice.customerId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const custObj = customers.find(c => c.id === cid);
                      setNewInvoice(prev => ({
                        ...prev,
                        customerId: cid,
                        customerName: custObj ? custObj.name : ''
                      }));
                    }}
                  >
                    <option value="">-- Or Walk-in Custom Name below --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                {!newInvoice.customerId && (
                  <div style={{ flex: 1, minWidth: '240px' }} className="form-group">
                    <label>Walk-in Guest Name</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Enter Customer Name"
                      value={newInvoice.customerName}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, customerName: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              {/* Care of (C/o) Corporate Client */}
              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }} className="form-group">
                  <label>C/o Corporate Client / Agency</label>
                  <select
                    className="form-select"
                    value={newInvoice.coId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const cliObj = clients.find(c => c.id === cid);
                      setNewInvoice(prev => ({
                        ...prev,
                        coId: cid,
                        coName: cliObj ? cliObj.name : (cid === 'custom' ? '' : prev.coName)
                      }));
                    }}
                  >
                    <option value="">-- Direct Individual Passenger --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="custom">-- Custom C/o Name --</option>
                  </select>
                </div>

                {(newInvoice.coId === 'custom' || (!newInvoice.coId && newInvoice.coName)) && (
                  <div style={{ flex: 1, minWidth: '240px' }} className="form-group">
                    <label>Custom C/o Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter Custom C/o Name"
                      value={newInvoice.coName}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, coName: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Transit Mode</label>
                  <select
                    className="form-select"
                    value={newInvoice.travelType}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, travelType: e.target.value }))}
                  >
                    <option value="Air">Air flight ticketing</option>
                    <option value="Train">Train rail ticketing</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>PNR Reference Code</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    maxLength="6"
                    placeholder="e.g. EK99PL"
                    value={newInvoice.pnr}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, pnr: e.target.value.toUpperCase() }))}
                  />
                </div>

                <div className="form-group">
                  <label>Official Ticket Number</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. 176-99023812"
                    value={newInvoice.ticketNo}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, ticketNo: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Departure Travel Date</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={newInvoice.travelDate}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, travelDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Transit Subcategory Specific Fields */}
              {newInvoice.travelType === 'Air' && (
                <div className="form-grid" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '-10px' }}>
                  <div className="form-group">
                    <label>From Airport</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CCJ / Calicut"
                      value={newInvoice.fromLocation}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, fromLocation: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>To Airport</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. DXB / Dubai"
                      value={newInvoice.toLocation}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, toLocation: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span>Airline Name</span>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
                        onClick={() => {
                          const newAirName = prompt('Enter the name of the new Airline:');
                          if (newAirName && newAirName.trim()) {
                            addAirline(newAirName.trim());
                            setNewInvoice(prev => ({ ...prev, airlineName: newAirName.trim() }));
                          }
                        }}
                      >
                        + Add Airline
                      </button>
                    </label>
                    <select
                      className="form-select"
                      value={newInvoice.airlineName}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, airlineName: e.target.value }))}
                    >
                      <option value="">-- Choose Airline --</option>
                      {airlines.map(air => (
                        <option key={air} value={air}>{air}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {newInvoice.travelType === 'Train' && (
                <div className="form-grid" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '-10px' }}>
                  <div className="form-group">
                    <label>From Station</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CCJ / Calicut Station"
                      value={newInvoice.fromLocation}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, fromLocation: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>To Station</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. EKM / Ernakulam Junction"
                      value={newInvoice.toLocation}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, toLocation: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Carrier Flight/Train route details</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  required
                  placeholder="e.g. Emirates flight EK203 (Economy) Dubai to London Heathrow"
                  value={newInvoice.details}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, details: e.target.value }))}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>B2B Ticketing Supplier</label>
                  <select
                    className="form-select"
                    value={newInvoice.vendorId}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, vendorId: e.target.value }))}
                  >
                    <option value="">Direct Agency Booking</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid" style={{ backgroundColor: 'var(--bg-app)', padding: '16px', borderRadius: '12px' }}>
                <div className="form-group">
                  <label>Ticket Base Fare (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={newInvoice.baseFare}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, baseFare: Number(e.target.value) }))}
                  />
                </div>

                <div className="form-group">
                  <label>Agency Markup / Service Fee (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={newInvoice.serviceCharge}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, serviceCharge: Number(e.target.value) }))}
                  />
                </div>

                <div className="form-group">
                  <label>Tax & GST (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={newInvoice.taxGst}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, taxGst: Number(e.target.value) }))}
                  />
                </div>

                <div className="form-group" style={{ borderLeft: '1px dashed rgba(255,255,255,0.08)', paddingLeft: '12px' }}>
                  <label style={{ color: 'var(--primary)', fontWeight: '600' }}>Additional Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={newInvoice.additionalAmount || ''}
                    placeholder="e.g. Baggage/Visa additions"
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, additionalAmount: Number(e.target.value) }))}
                  />
                </div>

                <div className="form-group">
                  <label>Additional Charge Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newInvoice.additionalAmountDate}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, additionalAmountDate: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ justifyContent: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL AMOUNT</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)' }}>
                    {formatCurr(computedTotal)}
                  </span>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Initial Customer Deposit (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max={computedTotal}
                    value={newInvoice.initialPayment}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, initialPayment: Number(e.target.value) }))}
                  />
                </div>

                {newInvoice.initialPayment > 0 && (
                  <>
                    <div className="form-group">
                      <label>Payment Channel</label>
                      <select
                        className="form-select"
                        value={newInvoice.paymentMethod}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      >
                        <option value="Cash">Cash Receipt</option>
                        <option value="Bank Transfer">Bank Wire Transfer</option>
                        <option value="Credit Card">Credit Card Processing</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Transaction Reference ID</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Wire reference code"
                        value={newInvoice.paymentReference}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, paymentReference: e.target.value }))}
                      />
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Invoice Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: A4 printable Receipt Viewer */}
      {selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', padding: '16px' }}>
            <div className="modal-header no-print">
              <h2>Invoice Viewer & Digital Receipt</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-print-action"
                  onClick={() => setIsLogPaymentOpen(true)}
                  disabled={selectedInvoice.status === 'paid'}
                >
                  {selectedInvoice.status === 'paid' ? 'Paid off' : 'Log Partial Pay'}
                </button>
                <button className="btn btn-primary btn-print-action" onClick={handlePrint}>✕ Print / Export A4 PDF</button>
                <button className="modal-close-btn" onClick={() => setSelectedInvoice(null)}>✕</button>
              </div>
            </div>

            {/* A4 Printable Wrapper */}
            <div className="printable-invoice-container">
              
              <div className="invoice-print-header" style={{ borderBottom: '2px solid var(--primary)' }}>
                <div className="invoice-print-company">
                  <h1 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', margin: 0 }}>
                    <LogoSVG width="42px" height="28px" />
                    <span style={{ marginLeft: '4px' }}>CM TRAVEL POINT</span>
                  </h1>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px', marginBottom: '4px' }}>TOURS & SERVICES</p>
                  <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4', margin: 0 }}>
                    CM Travel Point Building, Main Junction, Calicut Road, Ernakulam, Kerala - 682016
                  </p>
                  <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4', margin: 0 }}>
                    License: #CMT-85909 | IATA Registered Agency
                  </p>
                  <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4', margin: 0 }}>
                    Email: cmtravelpoint@gmail.com | Phone: +91 85909 77 789
                  </p>
                </div>
                <div className="invoice-print-meta">
                  <h2 style={{ color: 'var(--primary)', margin: '0 0 8px 0' }}>INVOICE</h2>
                  <p><strong>Invoice ID:</strong> {selectedInvoice.id}</p>
                  <p><strong>Booking Date:</strong> {selectedInvoice.createdDate || 'May 22, 2026'}</p>
                  <p><strong>Travel Mode:</strong> {selectedInvoice.travelType === 'Air' ? 'Air Flight' : 'Railway Transit'}</p>
                </div>
              </div>

              <div className="invoice-print-details-grid">
                <div className="invoice-print-billing">
                  <h3>Customer (Billed To)</h3>
                  <p><strong>Passenger:</strong> {selectedInvoice.customerName}</p>
                  <p>
                    {customers.find(c => c.id === selectedInvoice.customerId)?.email && (
                      <><strong>Email:</strong> {customers.find(c => c.id === selectedInvoice.customerId)?.email}<br /></>
                    )}
                    {customers.find(c => c.id === selectedInvoice.customerId)?.phone && (
                      <><strong>Contact:</strong> {customers.find(c => c.id === selectedInvoice.customerId)?.phone}</>
                    )}
                  </p>
                  {selectedInvoice.coName && (
                    <p style={{ marginTop: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', fontSize: '12px' }}>
                      <strong>C/o Client:</strong> {selectedInvoice.coName}
                    </p>
                  )}
                </div>
                <div className="invoice-print-billing">
                  <h3>Agency Remittance Portal</h3>
                  <p><strong>Payment Status:</strong> <span className={`status-pill ${selectedInvoice.status}`} style={{ float: 'none', padding: '2px 8px' }}>{selectedInvoice.status.toUpperCase()}</span></p>
                  <p><strong>B2B Portal:</strong> {vendors.find(v => v.id === selectedInvoice.vendorId)?.name || 'Direct Ticketing Carrier'}</p>
                </div>
              </div>

              <div className="invoice-print-ticket-details">
                <h4>Transit Boarding Passes & PNR Logs</h4>
                <div className="ticket-grid">
                  <div className="ticket-grid-item">
                    <span>Booking PNR Code</span>
                    <span>{selectedInvoice.pnr}</span>
                  </div>
                  <div className="ticket-grid-item">
                    <span>Transit e-Ticket Number</span>
                    <span>{selectedInvoice.ticketNo}</span>
                  </div>
                  <div className="ticket-grid-item">
                    <span>Departure Schedule</span>
                    <span>{selectedInvoice.travelDate}</span>
                  </div>
                </div>
              </div>

              <table className="invoice-print-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Travel Details / Route Log</th>
                    <th style={{ width: '150px', textAlign: 'right' }}>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: '600', fontSize: '13px' }}>{selectedInvoice.details}</span>
                        {(selectedInvoice.fromLocation || selectedInvoice.toLocation) && (
                          <span style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📍 <strong>Route:</strong> {selectedInvoice.fromLocation || 'N/A'} ➔ {selectedInvoice.toLocation || 'N/A'}
                          </span>
                        )}
                        {selectedInvoice.travelType === 'Air' && selectedInvoice.airlineName && (
                          <span style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            ✈️ <strong>Carrier:</strong> {selectedInvoice.airlineName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '15px' }}>{formatCurr(selectedInvoice.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <div style={{ maxWidth: '350px' }}>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>
                    * Payments are non-refundable after standard cancellation windows. Agency service charges are fully non-refundable. High-fidelity dynamic print generated via CM Travel Point system.
                  </p>
                </div>
                
                <div className="invoice-print-totals">
                  <div className="print-total-row">
                    <span>Base Fare & Fees:</span>
                    <span>{formatCurr(Number(selectedInvoice.baseFare || 0) + Number(selectedInvoice.serviceCharge || 0) + Number(selectedInvoice.taxGst || 0))}</span>
                  </div>
                  {Number(selectedInvoice.additionalAmount || 0) > 0 && (
                    <div className="print-total-row">
                      <span>Additional Charge ({selectedInvoice.additionalAmountDate}):</span>
                      <span>{formatCurr(selectedInvoice.additionalAmount)}</span>
                    </div>
                  )}
                  <div className="print-total-row" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '4px', marginTop: '4px' }}>
                    <span>Total Invoice Cost:</span>
                    <span>{formatCurr(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className="print-total-row">
                    <span>Amount Remitted:</span>
                    <span style={{ color: 'var(--success)', fontWeight: '600' }}>{formatCurr(selectedInvoice.paidAmount)}</span>
                  </div>
                  <div className="print-total-row grand-total" style={{ borderTop: '2px solid var(--primary)' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Pending Balance:</span>
                    <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{formatCurr(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="invoice-print-footer">
                <p>Thank you for choosing CM Travel Point! We wish you a safe and pleasant journey.</p>
                <p style={{ marginTop: '4px', fontSize: '9px' }}>Generated electronically in compliance with standard flight agency licensing standards.</p>
              </div>

            </div>

            {/* Sharing buttons panel for screen preview */}
            <div className="no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '16px', borderTop: '1px solid var(--border-color)', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => handleShareWhatsApp(selectedInvoice)}>
                💬 Send passenger WhatsApp receipt
              </button>
              <button className="btn btn-secondary" onClick={() => handleShareEmail(selectedInvoice)}>
                ✉️ Email passenger invoice ledger
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: Log Partial Payment */}
      {isLogPaymentOpen && selectedInvoice && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Receipt Passenger Payment</h2>
              <button className="modal-close-btn" onClick={() => setIsLogPaymentOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleLogPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Total Bill:</span>
                  <span style={{ fontWeight: '600' }}>{formatCurr(selectedInvoice.totalAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Already Paid:</span>
                  <span style={{ fontWeight: '600', color: 'var(--success)' }}>{formatCurr(selectedInvoice.paidAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '6px' }}>
                  <span>Outstanding Balance:</span>
                  <span style={{ color: 'var(--danger)' }}>{formatCurr(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Recieved Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="1"
                  max={selectedInvoice.totalAmount - selectedInvoice.paidAmount}
                  value={logPayment.amount}
                  onChange={(e) => setLogPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                />
              </div>

              <div className="form-group">
                <label>Recipt Channel</label>
                <select
                  className="form-select"
                  value={logPayment.paymentMethod}
                  onChange={(e) => setLogPayment(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="Cash">Cash Voucher</option>
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                  <option value="Credit Card">Credit Card swipe</option>
                </select>
              </div>

              <div className="form-group">
                <label>Bank Reference / Memo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. TXN_Reference_9901"
                  value={logPayment.reference}
                  onChange={(e) => setLogPayment(prev => ({ ...prev, reference: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsLogPaymentOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Receipt Voucher</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Invoice Form */}
      {isEditOpen && editingInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h2>Edit Professional Ticketing Invoice ({editingInvoice.id})</h2>
              <button className="modal-close-btn" onClick={() => { setIsEditOpen(false); setEditingInvoice(null); }}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '16px' }}>
                <div style={{ flex: 1 }} className="form-group">
                  <label>Link Directory Customer (CRM)</label>
                  <select
                    className="form-select"
                    value={editingInvoice.customerId || ''}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const custObj = customers.find(c => c.id === cid);
                      setEditingInvoice(prev => ({
                        ...prev,
                        customerId: cid,
                        customerName: custObj ? custObj.name : prev.customerName
                      }));
                    }}
                  >
                    <option value="">-- Or Walk-in Custom Name below --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                {!editingInvoice.customerId && (
                  <div style={{ flex: 1 }} className="form-group">
                    <label>Walk-in Guest Name</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Enter Customer Name"
                      value={editingInvoice.customerName || ''}
                      onChange={(e) => setEditingInvoice(prev => ({ ...prev, customerName: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              {/* Care of (C/o) Corporate Client */}
              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }} className="form-group">
                  <label>C/o Corporate Client / Agency</label>
                  <select
                    className="form-select"
                    value={editingInvoice.coId || ''}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const cliObj = clients.find(c => c.id === cid);
                      setEditingInvoice(prev => ({
                        ...prev,
                        coId: cid,
                        coName: cliObj ? cliObj.name : (cid === 'custom' ? '' : prev.coName)
                      }));
                    }}
                  >
                    <option value="">-- Direct Individual Passenger --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="custom">-- Custom C/o Name --</option>
                  </select>
                </div>

                {(editingInvoice.coId === 'custom' || (!editingInvoice.coId && editingInvoice.coName)) && (
                  <div style={{ flex: 1, minWidth: '240px' }} className="form-group">
                    <label>Custom C/o Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter Custom C/o Name"
                      value={editingInvoice.coName || ''}
                      onChange={(e) => setEditingInvoice(prev => ({ ...prev, coName: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Transit Mode</label>
                  <select
                    className="form-select"
                    value={editingInvoice.travelType || 'Air'}
                    onChange={(e) => setEditingInvoice(prev => ({ ...prev, travelType: e.target.value }))}
                  >
                    <option value="Air">Air flight ticketing</option>
                    <option value="Train">Train rail ticketing</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>PNR Reference Code</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    maxLength="6"
                    placeholder="e.g. EK99PL"
                    value={editingInvoice.pnr || ''}
                    onChange={(e) => setEditingInvoice(prev => ({ ...prev, pnr: e.target.value.toUpperCase() }))}
                  />
                </div>

                <div className="form-group">
                  <label>Official Ticket Number</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. 176-99023812"
                    value={editingInvoice.ticketNo || ''}
                    onChange={(e) => setEditingInvoice(prev => ({ ...prev, ticketNo: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Departure Travel Date</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={editingInvoice.travelDate || ''}
                    onChange={(e) => setEditingInvoice(prev => ({ ...prev, travelDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Transit Subcategory Specific Fields */}
              {editingInvoice.travelType === 'Air' && (
                <div className="form-grid" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '-10px' }}>
                  <div className="form-group">
                    <label>From Airport</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CCJ / Calicut"
                      value={editingInvoice.fromLocation || ''}
                      onChange={(e) => setEditingInvoice(prev => ({ ...prev, fromLocation: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>To Airport</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. DXB / Dubai"
                      value={editingInvoice.toLocation || ''}
                      onChange={(e) => setEditingInvoice(prev => ({ ...prev, toLocation: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span>Airline Name</span>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
                        onClick={() => {
                          const newAirName = prompt('Enter the name of the new Airline:');
                          if (newAirName && newAirName.trim()) {
                            addAirline(newAirName.trim());
                            setEditingInvoice(prev => ({ ...prev, airlineName: newAirName.trim() }));
                          }
                        }}
                      >
                        + Add Airline
                      </button>
                    </label>
                    <select
                      className="form-select"
                      value={editingInvoice.airlineName || ''}
                      onChange={(e) => setEditingInvoice(prev => ({ ...prev, airlineName: e.target.value }))}
                    >
                      <option value="">-- Choose Airline --</option>
                      {airlines.map(air => (
                        <option key={air} value={air}>{air}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {editingInvoice.travelType === 'Train' && (
                <div className="form-grid" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '-10px' }}>
                  <div className="form-group">
                    <label>From Station</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CCJ / Calicut Station"
                      value={editingInvoice.fromLocation || ''}
                      onChange={(e) => setEditingInvoice(prev => ({ ...prev, fromLocation: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>To Station</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. EKM / Ernakulam Junction"
                      value={editingInvoice.toLocation || ''}
                      onChange={(e) => setEditingInvoice(prev => ({ ...prev, toLocation: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Carrier Flight/Train route details</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  required
                  placeholder="e.g. Emirates flight EK203 (Economy) Dubai to London Heathrow"
                  value={editingInvoice.details || ''}
                  onChange={(e) => setEditingInvoice(prev => ({ ...prev, details: e.target.value }))}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>B2B Ticketing Supplier</label>
                  <select
                    className="form-select"
                    value={editingInvoice.vendorId || ''}
                    onChange={(e) => setEditingInvoice(prev => ({ ...prev, vendorId: e.target.value }))}
                  >
                    <option value="">Direct Agency Booking</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid" style={{ backgroundColor: 'var(--bg-app)', padding: '16px', borderRadius: '12px' }}>
                <div className="form-group">
                  <label>Ticket Base Fare (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={editingInvoice.baseFare || 0}
                    onChange={(e) => setEditingInvoice(prev => ({ ...prev, baseFare: Number(e.target.value) }))}
                  />
                </div>

                <div className="form-group">
                  <label>Agency Markup / Service Fee (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={editingInvoice.serviceCharge || 0}
                    onChange={(e) => setEditingInvoice(prev => ({ ...prev, serviceCharge: Number(e.target.value) }))}
                  />
                </div>

                <div className="form-group">
                  <label>Tax & GST (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={editingInvoice.taxGst || 0}
                    onChange={(e) => setEditingInvoice(prev => ({ ...prev, taxGst: Number(e.target.value) }))}
                  />
                </div>

                <div className="form-group" style={{ borderLeft: '1px dashed rgba(255,255,255,0.08)', paddingLeft: '12px' }}>
                  <label style={{ color: 'var(--primary)', fontWeight: '600' }}>Additional Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={editingInvoice.additionalAmount || ''}
                    placeholder="e.g. Baggage/Visa additions"
                    onChange={(e) => setEditingInvoice(prev => ({ ...prev, additionalAmount: Number(e.target.value) }))}
                  />
                </div>

                <div className="form-group">
                  <label>Additional Charge Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingInvoice.additionalAmountDate || ''}
                    onChange={(e) => setEditingInvoice(prev => ({ ...prev, additionalAmountDate: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ justifyContent: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL AMOUNT</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)' }}>
                    {formatCurr(Number(editingInvoice.baseFare || 0) + Number(editingInvoice.serviceCharge || 0) + Number(editingInvoice.taxGst || 0) + Number(editingInvoice.additionalAmount || 0))}
                  </span>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Total Customer Paid So Far (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={editingInvoice.paidAmount || 0}
                    onChange={(e) => setEditingInvoice(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsEditOpen(false); setEditingInvoice(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
