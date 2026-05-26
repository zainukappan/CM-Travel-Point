import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';

export default function Expenses() {
  const { role, expenses, addExpense } = useContext(AppContext);

  // States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newExp, setNewExp] = useState({
    category: 'Rent',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [filterType, setFilterType] = useState('All'); // 'All' | 'Month' | 'Custom'
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter expenses list on-the-fly
  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;

    const date = exp.date || '';
    let matchesDate = true;
    if (filterType === 'Month') {
      matchesDate = date.startsWith(selectedMonth);
    } else if (filterType === 'Custom') {
      matchesDate = (!startDate || date >= startDate) && (!endDate || date <= endDate);
    }

    return matchesCategory && matchesDate;
  });

  // Calculate total expense overhead on the filtered list
  const totalExpenseVal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Helper formatting
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
      alert('Please fill out all expense fields.');
      return;
    }

    addExpense(newExp);
    
    // Reset local modal state
    setNewExp({
      category: 'Rent',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsAddOpen(false);
  };

  // 1. Double check RBAC safety
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
      
      {/* Top Card */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Office Administrative Expense Ledger</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monitor and log monthly operational overheads</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                {categoryFilter !== 'All' || filterType !== 'All' ? 'Filtered Overhead' : 'Total Operating Overhead'}
              </span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--danger)' }}>{formatCurr(totalExpenseVal)}</span>
            </div>

            <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Record Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Standalone Filter Block */}
      <div className="card no-print" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Filter Overhead Statements:</span>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Rent">Rent & Lease</option>
              <option value="Salaries">Staff Salaries</option>
              <option value="Utilities">Office Utilities & Power</option>
              <option value="Marketing">Marketing & Promotions</option>
              <option value="Software">API & GDS Software Seats</option>
              <option value="Other">Other Miscellaneous</option>
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
                <th>Category</th>
                <th>Expense Memo Description</th>
                <th style={{ textAlign: 'right' }}>Debit Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses
                  .sort((a,b) => new Date(b.date) - new Date(a.date))
                  .map(exp => (
                    <tr key={exp.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{exp.id}</td>
                      <td>{exp.date}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          color: 'var(--danger)',
                          textTransform: 'uppercase'
                        }}>
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: '500' }}>{exp.description}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--danger)' }}>
                        {formatCurr(exp.amount)}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No administrative expenses logged for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Record Expense Form */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Record Administrative Expense</h2>
              <button className="modal-close-btn" onClick={() => setIsAddOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group">
                <label>Expense Category</label>
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
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div className="form-group">
                <label>Expense Cost Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="1"
                  value={newExp.amount || ''}
                  placeholder="e.g. 150"
                  onChange={(e) => setNewExp(prev => ({ ...prev, amount: Number(e.target.value) }))}
                />
              </div>

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

              <div className="form-group">
                <label>Ledger Memo Description</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Monthly high-speed internet"
                  value={newExp.description}
                  onChange={(e) => setNewExp(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Debit</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
