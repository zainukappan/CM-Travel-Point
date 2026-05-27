import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';

export default function Expenses() {
  const { role, expenses, addExpense, deleteExpense } = useContext(AppContext);

  // States for Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newExp, setNewExp] = useState({
    type: 'expense', // 'expense' | 'income'
    category: 'Rent',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [txnTypeFilter, setTxnTypeFilter] = useState('All'); // 'All' | 'expense' | 'income'
  const [dateFilterType, setDateFilterType] = useState('All'); // 'All' | 'Month' | 'Custom'
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter cash flow list on-the-fly
  const filteredExpenses = expenses.filter(exp => {
    // Category match
    const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;

    // Type match
    const itemType = exp.type || 'expense';
    const matchesTxnType = txnTypeFilter === 'All' || itemType === txnTypeFilter;

    // Date match
    const date = exp.date || '';
    let matchesDate = true;
    if (dateFilterType === 'Month') {
      matchesDate = date.startsWith(selectedMonth);
    } else if (dateFilterType === 'Custom') {
      matchesDate = (!startDate || date >= startDate) && (!endDate || date <= endDate);
    }

    return matchesCategory && matchesTxnType && matchesDate;
  });

  // Calculate total expense & income overheads
  const totalExpenseVal = filteredExpenses.filter(e => (e.type || 'expense') === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const totalIncomeVal = filteredExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const netOverheadVal = totalIncomeVal - totalExpenseVal;

  // Helper currency formatting
  const formatCurr = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newExp.amount <= 0 || !newExp.description) {
      alert('Please fill out all cash flow fields.');
      return;
    }

    addExpense(newExp);
    
    // Reset local modal state
    setNewExp({
      type: 'expense',
      category: 'Rent',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsAddOpen(false);
  };

  // Adjust categories when type changes
  const handleTypeChange = (typeVal) => {
    setNewExp(prev => ({
      ...prev,
      type: typeVal,
      category: typeVal === 'income' ? 'Service Fees' : 'Rent'
    }));
  };

  // Double check RBAC safety
  if (role !== 'admin') {
    return (
      <div className="restricted-panel" style={{ marginTop: '40px' }}>
        <div className="restricted-icon-box">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2>Restricted Administrative Screen</h2>
        <p>
          You are currently signed in under the <strong>Staff Desk</strong> role. General operators do not have permissions to view office administrative costs, P&L statements, or log business overheads.
        </p>
        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
          💡 Tip: Use the dynamic "Admin Portal" toggle in the top navigation bar to unlock this panel!
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Card / P&L Balance Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Total Income */}
        <div className="card" style={{ flex: '1 1 30%', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: '600' }}>
            Total Logging Incomes
          </span>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#22c55e' }}>{formatCurr(totalIncomeVal)}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ticket markups, Attestation & consultation fees</span>
        </div>

        {/* Total Expenses */}
        <div className="card" style={{ flex: '1 1 30%', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: '600' }}>
            Total Logging Expenses
          </span>
          <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--danger)' }}>{formatCurr(totalExpenseVal)}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Salaries, space rent, power bills & marketing</span>
        </div>

        {/* Net Flow Balance */}
        <div className="card" style={{ 
          flex: '1 1 30%', 
          padding: '16px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '4px',
          background: netOverheadVal >= 0 ? 'rgba(34, 197, 94, 0.04)' : 'rgba(239, 68, 68, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: '600' }}>
              Logging Operational Net
            </span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: netOverheadVal >= 0 ? '#22c55e' : 'var(--danger)' }}>
              {netOverheadVal >= 0 ? 'SURPLUS' : 'DEFICIT'}
            </span>
          </div>
          <span style={{ fontSize: '24px', fontWeight: '800', color: netOverheadVal >= 0 ? '#22c55e' : 'var(--danger)' }}>
            {formatCurr(netOverheadVal)}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Difference between logs during active timeframe</span>
        </div>

      </div>

      {/* Action Header card */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Office Administrative Cash Flow Ledger</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Record and manage administrative overheads and misc transaction inflows</span>
          </div>

          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Record Cash Flow</span>
          </button>
        </div>
      </div>

      {/* Standalone Filter Block */}
      <div className="card no-print" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Filter Statements:</span>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Type selector */}
            <select
              className="form-select"
              value={txnTypeFilter}
              onChange={(e) => setTxnTypeFilter(e.target.value)}
            >
              <option value="All">All Inflows & Outflows</option>
              <option value="income">Incomes (Inflow)</option>
              <option value="expense">Expenses (Outflow)</option>
            </select>

            {/* Category selector */}
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {/* Expense Categories */}
              <option value="Rent">Rent & Lease</option>
              <option value="Salaries">Staff Salaries</option>
              <option value="Utilities">Office Utilities & Power</option>
              <option value="Marketing">Marketing & Promotions</option>
              <option value="Software">API & GDS Software Seats</option>
              {/* Income Categories */}
              <option value="Ticket Markups">Ticket Markups</option>
              <option value="Visa Commissions">Visa Commissions</option>
              <option value="Tour Commissions">Tour Package Commissions</option>
              <option value="Service Fees">Service / Consultation Fees</option>
              <option value="Attestation Charges">Attestation Services</option>
              <option value="Other">Other Misc Overhead</option>
            </select>

            {/* Date interval type */}
            <select
              className="form-select"
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value)}
            >
              <option value="All">All Dates</option>
              <option value="Month">Month-wise</option>
              <option value="Custom">Custom Range</option>
            </select>

            {dateFilterType === 'Month' && (
              <input 
                type="month"
                className="form-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ width: '140px', padding: '6px' }}
              />
            )}

            {dateFilterType === 'Custom' && (
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
          </div>
        </div>
      </div>

      {/* Expense ledger list card */}
      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Administrative Ledger Statement</h2>
        
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Date</th>
                <th>Flow Type</th>
                <th>Category</th>
                <th>Memo Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses
                  .sort((a,b) => new Date(b.date) - new Date(a.date))
                  .map(exp => {
                    const isIncome = exp.type === 'income';
                    return (
                      <tr key={exp.id}>
                        <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{exp.id}</td>
                        <td>{exp.date}</td>
                        {/* Flow direction indicator */}
                        <td>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: '700',
                            color: isIncome ? '#22c55e' : 'var(--danger)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {isIncome ? 'INFLOW' : 'OUTFLOW'}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: isIncome ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                            color: isIncome ? '#22c55e' : 'var(--danger)',
                            textTransform: 'uppercase'
                          }}>
                            {exp.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: '500' }}>{exp.description}</td>
                        <td style={{ 
                          textAlign: 'right', 
                          fontWeight: '700', 
                          color: isIncome ? '#22c55e' : 'var(--danger)' 
                        }}>
                          {isIncome ? '+' : '-'}{formatCurr(exp.amount)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '11px', height: '24px' }}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete cash flow record ${exp.id} (${exp.category}: ${exp.description})? This will permanently remove it.`)) {
                                deleteExpense(exp.id);
                              }
                            }}
                            title="Delete this transaction log"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No cash flows logged for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Record Flow Form */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Record Administrative Cash Flow</h2>
              <button className="modal-close-btn" onClick={() => setIsAddOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Type Select */}
              <div className="form-group">
                <label>Flow Direction Type</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ 
                      flex: 1, 
                      backgroundColor: newExp.type === 'expense' ? 'var(--danger)' : 'rgba(255,255,255,0.04)',
                      color: newExp.type === 'expense' ? 'white' : 'var(--text-muted)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontWeight: '600'
                    }}
                    onClick={() => handleTypeChange('expense')}
                  >
                    Expense (Outflow)
                  </button>
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ 
                      flex: 1, 
                      backgroundColor: newExp.type === 'income' ? '#22c55e' : 'rgba(255,255,255,0.04)',
                      color: newExp.type === 'income' ? 'white' : 'var(--text-muted)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontWeight: '600'
                    }}
                    onClick={() => handleTypeChange('income')}
                  >
                    Income (Inflow)
                  </button>
                </div>
              </div>

              {/* Dynamic Category Selector */}
              <div className="form-group">
                <label>Flow Category</label>
                {newExp.type === 'expense' ? (
                  <select
                    className="form-select"
                    value={newExp.category}
                    onChange={(e) => setNewExp(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Rent">Rent & Lease</option>
                    <option value="Salaries">Staff Salaries</option>
                    <option value="Utilities">Office Utilities & Power</option>
                    <option value="Marketing">Marketing & Promotions</option>
                    <option value="Software">API & GDS Software Seats</option>
                    <option value="Other">Other Miscellaneous Overhead</option>
                  </select>
                ) : (
                  <select
                    className="form-select"
                    value={newExp.category}
                    onChange={(e) => setNewExp(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Service Fees">Service / Consultation Fees</option>
                    <option value="Ticket Markups">Ticket Markups</option>
                    <option value="Visa Commissions">Visa Commissions</option>
                    <option value="Tour Commissions">Tour Package Commissions</option>
                    <option value="Attestation Charges">Attestation Services</option>
                    <option value="Other">Other Misc Income</option>
                  </select>
                )}
              </div>

              {/* Amount Field */}
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="1"
                  value={newExp.amount || ''}
                  placeholder="e.g. 1500"
                  onChange={(e) => setNewExp(prev => ({ ...prev, amount: Number(e.target.value) }))}
                />
              </div>

              {/* Date Field */}
              <div className="form-group">
                <label>Remittance Date</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={newExp.date}
                  onChange={(e) => setNewExp(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              {/* Memo Description */}
              <div className="form-group">
                <label>Ledger Memo Description</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder={newExp.type === 'income' ? 'e.g. Markup on Schengen visa ticket' : 'e.g. Monthly space rent'}
                  value={newExp.description}
                  onChange={(e) => setNewExp(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: newExp.type === 'income' ? '#22c55e' : 'var(--primary)' }}>
                  {newExp.type === 'income' ? 'Process Credit' : 'Process Debit'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
