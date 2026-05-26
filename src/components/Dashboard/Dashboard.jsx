import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';

export default function Dashboard() {
  const { role, invoices, payments, expenses, vendors } = useContext(AppContext);

  // Filter state
  const [filterType, setFilterType] = useState('all'); // 'all' | 'month' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Format currency helper
  const formatCurr = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Dynamic filter application
  const filteredInvoices = invoices.filter(inv => {
    const d = inv.createdDate || inv.travelDate;
    if (filterType === 'all') return true;
    if (filterType === 'month') {
      return d && d.startsWith(selectedMonth);
    }
    if (filterType === 'custom') {
      return d && (!startDate || d >= startDate) && (!endDate || d <= endDate);
    }
    return true;
  });

  const filteredPayments = payments.filter(pay => {
    const d = pay.date;
    if (filterType === 'all') return true;
    if (filterType === 'month') {
      return d && d.startsWith(selectedMonth);
    }
    if (filterType === 'custom') {
      return d && (!startDate || d >= startDate) && (!endDate || d <= endDate);
    }
    return true;
  });

  const filteredExpenses = expenses.filter(exp => {
    const d = exp.date;
    if (filterType === 'all') return true;
    if (filterType === 'month') {
      return d && d.startsWith(selectedMonth);
    }
    if (filterType === 'custom') {
      return d && (!startDate || d >= startDate) && (!endDate || d <= endDate);
    }
    return true;
  });

  // Recompute metrics on the fly
  const totalSalesVolume = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = filteredPayments.reduce((sum, pay) => sum + pay.amount, 0);
  const totalPending = filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
  const agencyGrossIncome = filteredInvoices.reduce((sum, inv) => sum + inv.serviceCharge, 0);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = agencyGrossIncome - totalExpenses;

  // Vendor statistics
  const vendorStats = vendors.map(v => {
    const deposits = v.transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
    const debits = v.transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    const balance = deposits - debits;
    return {
      ...v,
      balance,
      totalDeposited: deposits,
      totalDebited: debits
    };
  });

  const stats = {
    totalSalesVolume,
    totalCollected,
    totalPending,
    agencyGrossIncome,
    totalExpenses,
    netProfit,
    vendorStats
  };

  // Recent bookings are sliced from the filtered invoices
  const recentBookings = filteredInvoices.slice(0, 4);

  // SVG Chart Calculations
  // 1. Sort invoices chronologically
  const chartInvoices = [...filteredInvoices].sort((a, b) => {
    const dA = a.createdDate || a.travelDate || '';
    const dB = b.createdDate || b.travelDate || '';
    return dA.localeCompare(dB);
  });

  const N = chartInvoices.length;
  const maxTotalAmount = Math.max(...chartInvoices.map(i => i.totalAmount), 100);

  // Compute coordinate points
  const salesPoints = chartInvoices.map((inv, index) => {
    const x = 30 + (N > 1 ? (index / (N - 1)) * 450 : 225);
    const y = 170 - (inv.totalAmount / maxTotalAmount) * 140;
    return { x, y, val: inv.totalAmount, date: inv.createdDate || inv.travelDate };
  });

  const marginPoints = chartInvoices.map((inv, index) => {
    const x = 30 + (N > 1 ? (index / (N - 1)) * 450 : 225);
    const y = 170 - (inv.serviceCharge / maxTotalAmount) * 140;
    return { x, y, val: inv.serviceCharge, date: inv.createdDate || inv.travelDate };
  });

  // Generate path strings
  let salesPathD = "M 30,170 L 480,170";
  let salesFillD = "M 30,170 L 480,170 Z";
  let marginPathD = "M 30,170 L 480,170";
  let marginFillD = "M 30,170 L 480,170 Z";

  if (N > 0) {
    if (N === 1) {
      salesPathD = `M 30,${salesPoints[0].y} L 480,${salesPoints[0].y}`;
      salesFillD = `M 30,${salesPoints[0].y} L 480,${salesPoints[0].y} L 480,170 L 30,170 Z`;
      marginPathD = `M 30,${marginPoints[0].y} L 480,${marginPoints[0].y}`;
      marginFillD = `M 30,${marginPoints[0].y} L 480,${marginPoints[0].y} L 480,170 L 30,170 Z`;
    } else {
      salesPathD = "M " + salesPoints.map(p => `${p.x},${p.y}`).join(" L ");
      salesFillD = salesPathD + ` L ${salesPoints[N-1].x},170 L ${salesPoints[0].x},170 Z`;
      marginPathD = "M " + marginPoints.map(p => `${p.x},${p.y}`).join(" L ");
      marginFillD = marginPathD + ` L ${marginPoints[N-1].x},170 L ${marginPoints[0].x},170 Z`;
    }
  }

  const renderXLabels = () => {
    if (N === 0) {
      return (
        <>
          <text x="30" y="195" fill="var(--text-muted)" fontSize="9" fontWeight="600">No Data</text>
          <text x="480" y="195" fill="var(--text-muted)" fontSize="9" fontWeight="600" textAnchor="end">No Data</text>
        </>
      );
    }
    return salesPoints.map((p, idx) => {
      const showLabel = N <= 6 || idx === 0 || idx === N - 1 || idx % Math.floor(N / 4) === 0;
      if (!showLabel) return null;
      
      let formattedDate = p.date || '';
      if (p.date) {
        const parts = p.date.split('-');
        if (parts.length === 3) {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const mIdx = parseInt(parts[1], 10) - 1;
          formattedDate = `${months[mIdx]} ${parseInt(parts[2], 10)}`;
        }
      }
      return (
        <text 
          key={idx} 
          x={p.x} 
          y="195" 
          fill="var(--text-muted)" 
          fontSize="9" 
          fontWeight="600" 
          textAnchor={idx === 0 ? 'start' : idx === N - 1 ? 'end' : 'middle'}
        >
          {formattedDate}
        </text>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Date Filter Controls */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-glow)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600' }}>Sales Volume Tracker</h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Select date range for analytics tracking</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div className="filter-group" style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
            <button 
              className={`filter-tab-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
              style={{
                border: 'none',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: filterType === 'all' ? 'var(--primary)' : 'transparent',
                color: filterType === 'all' ? '#fff' : 'var(--text-muted)',
                transition: 'var(--transition-smooth)'
              }}
            >
              All Time
            </button>
            <button 
              className={`filter-tab-btn ${filterType === 'month' ? 'active' : ''}`}
              onClick={() => setFilterType('month')}
              style={{
                border: 'none',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: filterType === 'month' ? 'var(--primary)' : 'transparent',
                color: filterType === 'month' ? '#fff' : 'var(--text-muted)',
                transition: 'var(--transition-smooth)'
              }}
            >
              Month-wise
            </button>
            <button 
              className={`filter-tab-btn ${filterType === 'custom' ? 'active' : ''}`}
              onClick={() => setFilterType('custom')}
              style={{
                border: 'none',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: filterType === 'custom' ? 'var(--primary)' : 'transparent',
                color: filterType === 'custom' ? '#fff' : 'var(--text-muted)',
                transition: 'var(--transition-smooth)'
              }}
            >
              Custom Date
            </button>
          </div>

          {filterType === 'month' && (
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="custom-input"
              style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', width: '160px' }}
            />
          )}

          {filterType === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="custom-input"
                style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="custom-input"
                style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 1. Metric Cards Grid */}
      <div className="dashboard-grid">
        {/* Metric 1: Sales Volume */}
        <div className="card metric-card">
          <div className="metric-details">
            <h3>Total Sales Volume</h3>
            <div className="metric-value">{formatCurr(stats.totalSalesVolume)}</div>
            <div className="metric-trend up">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span>+14.8% vs last month</span>
            </div>
          </div>
          <div className="metric-icon-box" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        {/* Metric 2: Collected Revenue */}
        <div className="card metric-card">
          <div className="metric-details">
            <h3>Payments Collected</h3>
            <div className="metric-value">{formatCurr(stats.totalCollected)}</div>
            <div className="metric-trend up">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span>{Math.round((stats.totalCollected / stats.totalSalesVolume) * 100 || 0)}% Collection Rate</span>
            </div>
          </div>
          <div className="metric-icon-box" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Metric 3: Pending Balances */}
        <div className="card metric-card">
          <div className="metric-details">
            <h3>Pending Balances</h3>
            <div className="metric-value">{formatCurr(stats.totalPending)}</div>
            <div className={`metric-trend ${stats.totalPending > 1000 ? 'down' : 'up'}`}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <polyline points="18 9 12 15 6 9" />
              </svg>
              <span>Outstanding Customer Receivables</span>
            </div>
          </div>
          <div className="metric-icon-box" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>

        {/* Metric 4: Agency Net Profit (RBAC PROTECTED) */}
        <div className="card metric-card" style={{ overflow: 'hidden' }}>
          {role === 'admin' ? (
            <>
              <div className="metric-details">
                <h3>Agency Net Income</h3>
                <div className="metric-value">{formatCurr(stats.netProfit)}</div>
                <div className="metric-trend up" style={{ color: stats.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  <span>Markup Profit minus Expenses</span>
                </div>
              </div>
              <div className="metric-icon-box" style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--secondary)' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
            </>
          ) : (
            /* Sleek Blur Glass Lock for Restricted Employee access */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              padding: '6px 0',
              textAlign: 'center'
            }}>
              <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>FINANCIAL DATA LOCKED</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '180px' }}>
                Admin access is required to view agency profit margins.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Visual Chart & Vendor quick stats Grid */}
      <div className="content-grid-2">
        {/* Left Side: Dynamic Custom Area Chart */}
        <div className="card">
          <div className="chart-header">
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Sales Volume & Margin Tracker</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time business ticketing activity</span>
            </div>
            {role === 'admin' && (
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }}></span>
                  <span>Sales Volume</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--secondary)', display: 'inline-block' }}></span>
                  <span>Net Income</span>
                </div>
              </div>
            )}
          </div>

          <div className="svg-chart-container">
            {/* Embedded Custom SVG Graph */}
            <svg className="svg-chart" viewBox="0 0 500 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
                {role === 'admin' && (
                  <linearGradient id="margin-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.0" />
                  </linearGradient>
                )}
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="20" x2="480" y2="20" className="chart-grid-line" />
              <line x1="30" y1="70" x2="480" y2="70" className="chart-grid-line" />
              <line x1="30" y1="120" x2="480" y2="120" className="chart-grid-line" />
              <line x1="30" y1="170" x2="480" y2="170" className="chart-grid-line" />

              {/* Sales Volume Curve */}
              <path
                d={salesPathD}
                className="chart-line"
              />
              <path
                d={salesFillD}
                fill="url(#line-grad)"
                opacity="0.15"
              />

              {/* Margin Curve (Admin Only) */}
              {role === 'admin' && N > 0 && (
                <>
                  <path
                    d={marginPathD}
                    className="chart-line"
                    style={{ stroke: 'var(--secondary)' }}
                  />
                  <path
                    d={marginFillD}
                    fill="url(#margin-grad)"
                    opacity="0.15"
                  />
                </>
              )}

              {/* Data Interactive Dots */}
              {salesPoints.map((p, idx) => (
                <circle 
                  key={idx} 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  className="chart-dot" 
                  title={`Sales: ${formatCurr(p.val)}`}
                />
              ))}

              {role === 'admin' && marginPoints.map((p, idx) => (
                <circle 
                  key={`m-${idx}`} 
                  cx={p.x} 
                  cy={p.y} 
                  r="3.5" 
                  className="chart-dot" 
                  style={{ fill: 'var(--secondary)', stroke: 'var(--secondary)' }}
                  title={`Net: ${formatCurr(p.val)}`}
                />
              ))}

              {/* Horizontal axis labels */}
              {renderXLabels()}
            </svg>
          </div>
        </div>

        {/* Right Side: Vendor Quick Balance Overview (RBAC PROTECTED) */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>B2B Portal Balances</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '16px' }}>Ticketing agent credits</span>

          {role === 'admin' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {stats.vendorStats.map(v => (
                <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', fontSize: '13px' }}>{v.name}</span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: v.balance >= 0 ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {v.balance >= 0 ? `${formatCurr(v.balance)} Credit` : `${formatCurr(Math.abs(v.balance))} Owed`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Portal: {v.portalName}</span>
                    <span>Outstandings: {formatCurr(v.outstandingAmount)}</span>
                  </div>
                  {/* Progress bar representing safe advance credit */}
                  <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-app)', borderRadius: '10px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(0, (v.balance / (v.advancePaid || 1)) * 100))}%`,
                      height: '100%',
                      backgroundColor: v.balance >= 1000 ? 'var(--success)' : v.balance >= 0 ? 'var(--warning)' : 'var(--danger)'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="restricted-panel" style={{ padding: '24px 10px', border: '1px dashed var(--border-color)' }}>
              <div className="restricted-icon-box" style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Access Restricted</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '200px' }}>
                Ticketing executives cannot view central B2B deposit balances.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Recent Bookings Logger Table */}
      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>Recent Boarding Logs & Invoices</h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>Latest bookings processed</span>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Passenger</th>
                <th>PNR / Ticket</th>
                <th>Travel Date</th>
                <th>Type</th>
                <th>Booking Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{inv.id}</td>
                  <td>{inv.customerName}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>{inv.pnr}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>t: {inv.ticketNo || 'N/A'}</span>
                    </div>
                  </td>
                  <td>{inv.travelDate}</td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: inv.travelType === 'Air' ? 'rgba(79, 70, 229, 0.08)' : 'rgba(13, 148, 136, 0.08)',
                      color: inv.travelType === 'Air' ? 'var(--primary)' : 'var(--secondary)'
                    }}>
                      {inv.travelType}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700' }}>{formatCurr(inv.totalAmount)}</td>
                  <td>
                    <span className={`status-pill ${inv.status}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
