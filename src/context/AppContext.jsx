import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

const API_BASE_URL = 'http://localhost:5000/api';

export const AppProvider = ({ children }) => {
  // User Security Accounts
  const [users, setUsers] = useState([]);
  
  // Current Session User
  const [currentUser, setCurrentUser] = useState(() => {
    const local = localStorage.getItem('aero_current_user');
    return local ? JSON.parse(local) : null;
  });

  // Global Role: 'admin' or 'staff'
  const [role, setRole] = useState(() => {
    return localStorage.getItem('aero_role') || 'admin';
  });

  // Global Theme: 'light' or 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aero_theme') || 'light';
  });

  // Core Data Tables
  const [customers, setCustomers] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Fetch initial data from PostgreSQL Backend
  const refreshData = async () => {
    try {
      const [
        usersRes, 
        custRes, 
        airRes, 
        cliRes, 
        invRes, 
        payRes, 
        vendRes, 
        expRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/users`),
        fetch(`${API_BASE_URL}/customers`),
        fetch(`${API_BASE_URL}/airlines`),
        fetch(`${API_BASE_URL}/clients`),
        fetch(`${API_BASE_URL}/invoices`),
        fetch(`${API_BASE_URL}/payments`),
        fetch(`${API_BASE_URL}/vendors`),
        fetch(`${API_BASE_URL}/expenses`)
      ]);

      const [
        usersData,
        custData,
        airData,
        cliData,
        invData,
        payData,
        vendData,
        expData
      ] = await Promise.all([
        usersRes.json(),
        custRes.json(),
        airRes.json(),
        cliRes.json(),
        invRes.json(),
        payRes.json(),
        vendRes.json(),
        expRes.json()
      ]);

      setUsers(usersData);
      setCustomers(custData);
      setAirlines(airData);
      setClients(cliData);
      
      // Parse numeric database values to float/number to prevent operations errors
      setInvoices(invData.map(inv => ({
        ...inv,
        baseFare: Number(inv.base_fare || inv.baseFare || 0),
        serviceCharge: Number(inv.service_charge || inv.serviceCharge || 0),
        taxGst: Number(inv.tax_gst || inv.taxGst || 0),
        totalAmount: Number(inv.total_amount || inv.totalAmount || 0),
        paidAmount: Number(inv.paid_amount || inv.paidAmount || 0),
        customerId: inv.customer_id || inv.customerId || '',
        customerName: inv.customer_name || inv.customerName || '',
        coId: inv.co_id || inv.coId || '',
        coName: inv.co_name || inv.coName || '',
        travelDate: inv.travel_date || inv.travelDate || '',
        travelType: inv.travel_type || inv.travelType || '',
        ticketNo: inv.ticket_no || inv.ticketNo || '',
        airlineName: inv.airline_name || inv.airlineName || '',
        fromLocation: inv.from_location || inv.fromLocation || '',
        toLocation: inv.to_location || inv.toLocation || '',
        vendorId: inv.vendor_id || inv.vendorId || '',
        createdDate: inv.created_date || inv.createdDate || ''
      })));

      setPayments(payData.map(pay => ({
        ...pay,
        amount: Number(pay.amount || 0),
        invoiceId: pay.invoice_id || pay.invoiceId || ''
      })));

      setVendors(vendData);
      setExpenses(expData.map(exp => ({
        ...exp,
        amount: Number(exp.amount || 0)
      })));

      // Auto-set current session user if empty and users exist
      if (!currentUser && usersData.length > 0) {
        const defaultAdmin = usersData.find(u => u.username === 'admin') || usersData[0];
        setCurrentUser(defaultAdmin);
      }
    } catch (error) {
      console.error('Error fetching data from Neon backend:', error);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Keep Role State synced with Current Session User
  useEffect(() => {
    if (currentUser) {
      setRole(currentUser.role);
      localStorage.setItem('aero_current_user', JSON.stringify(currentUser));
      localStorage.setItem('aero_role', currentUser.role);
    } else {
      localStorage.removeItem('aero_current_user');
    }
  }, [currentUser]);

  // Sync Theme
  useEffect(() => {
    localStorage.setItem('aero_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Role toggler wrapper for fast simulator demo changes
  const handleSetRole = (newRole) => {
    const foundUser = users.find(u => u.role === newRole);
    if (foundUser) {
      setCurrentUser(foundUser);
    } else {
      setRole(newRole);
    }
  };

  // Relational Database Actions (calling API endpoints)
  const addCustomer = async (customerData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          passportNo: customerData.passportNo,
          passportExpiry: customerData.passportExpiry,
          visaDetails: customerData.visaDetails
        })
      });
      const data = await res.json();
      setCustomers(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding customer:', err);
    }
  };

  const updateCustomer = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      
      // Refresh to fetch cascaded changes (like name edits on invoices)
      await refreshData();
      return data;
    } catch (err) {
      console.error('Error updating customer:', err);
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/customers/${id}`, { method: 'DELETE' });
      setCustomers(prev => prev.filter(cust => cust.id !== id));
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  const addAirline = async (name) => {
    try {
      const res = await fetch(`${API_BASE_URL}/airlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      setAirlines(prev => {
        if (prev.includes(data.name)) return prev;
        return [...prev, data.name];
      });
    } catch (err) {
      console.error('Error adding airline:', err);
    }
  };

  const addClient = async (clientData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      const data = await res.json();
      setClients(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding client:', err);
    }
  };

  const updateClient = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      
      // Refresh to fetch cascaded coordinator name edits on invoices
      await refreshData();
      return data;
    } catch (err) {
      console.error('Error updating client:', err);
    }
  };

  const deleteClient = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/clients/${id}`, { method: 'DELETE' });
      
      // Refresh to handle nullifying C/o references on invoices
      await refreshData();
    } catch (err) {
      console.error('Error deleting client:', err);
    }
  };

  const addInvoice = async (invoiceData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      const data = await res.json();
      
      // Refresh data so client-side has initial payment and vendor transactions synced correctly
      await refreshData();
      return data;
    } catch (err) {
      console.error('Error adding invoice:', err);
    }
  };

  const updateInvoice = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      
      await refreshData();
      return data;
    } catch (err) {
      console.error('Error updating invoice:', err);
    }
  };

  const deleteInvoice = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/invoices/${id}`, { method: 'DELETE' });
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (err) {
      console.error('Error deleting invoice:', err);
    }
  };

  const addPayment = async (invoiceId, paymentData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          amount: paymentData.amount,
          date: paymentData.date,
          paymentMethod: paymentData.paymentMethod,
          reference: paymentData.reference
        })
      });
      const data = await res.json();
      
      // Reload to get updated invoice paid amounts and statuses
      await refreshData();
      return data;
    } catch (err) {
      console.error('Error registering payment:', err);
    }
  };

  const addVendor = async (vendorData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData)
      });
      const data = await res.json();
      setVendors(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding vendor:', err);
    }
  };

  const updateVendor = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vendors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      
      await refreshData();
      return data;
    } catch (err) {
      console.error('Error updating vendor:', err);
    }
  };

  const deleteVendor = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/vendors/${id}`, { method: 'DELETE' });
      setVendors(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error('Error deleting vendor:', err);
    }
  };

  const addVendorDeposit = async (vendorId, depositData) => {
    try {
      await fetch(`${API_BASE_URL}/vendors/${vendorId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depositData)
      });
      
      await refreshData();
    } catch (err) {
      console.error('Error processing vendor deposit:', err);
    }
  };

  const addExpense = async (expenseData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });
      const data = await res.json();
      setExpenses(prev => [data, ...prev]);
    } catch (err) {
      console.error('Error registering expense:', err);
    }
  };

  const deleteExpense = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/expenses/${id}`, { method: 'DELETE' });
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const updateUser = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      
      setUsers(prev => prev.map(u => u.id === id ? data : u));
      if (currentUser && currentUser.id === id) {
        setCurrentUser(data);
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
    }
  };

  const addUser = async (userData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      setUsers(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding user:', err);
    }
  };

  const deleteUser = async (id) => {
    if (currentUser && currentUser.id === id) {
      return { success: false, error: "Cannot delete currently active user session." };
    }
    const adminCount = users.filter(u => u.role === 'admin').length;
    const targetUser = users.find(u => u.id === id);
    if (targetUser && targetUser.role === 'admin' && adminCount <= 1) {
      return { success: false, error: "Cannot delete the last remaining Administrator account." };
    }

    try {
      await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting user:', err);
      return { success: false, error: err.message };
    }
  };

  const updateUserPermissions = async (id, newPermissions) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: newPermissions })
      });
      const data = await res.json();
      
      setUsers(prev => prev.map(u => u.id === id ? data : u));
      if (currentUser && currentUser.id === id) {
        setCurrentUser(data);
      }
    } catch (err) {
      console.error('Error updating user permissions:', err);
    }
  };

  const resetDatabase = async () => {
    try {
      await fetch(`${API_BASE_URL}/reset`, { method: 'POST' });
      await refreshData();
    } catch (err) {
      console.error('Error resetting database:', err);
    }
  };

  // Relational aggregates for visual dashboard representation
  const getFinancialStats = () => {
    const totalSalesVolume = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalCollected = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    const totalPending = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0);
    
    const agencyGrossIncome = invoices.reduce((sum, inv) => sum + Number(inv.serviceCharge), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const netProfit = agencyGrossIncome - totalExpenses;

    const vendorStats = vendors.map(v => {
      const deposits = (v.transactions || []).filter(t => t.type === 'deposit').reduce((sum, t) => sum + Number(t.amount), 0);
      const debits = (v.transactions || []).filter(t => t.type === 'debit').reduce((sum, t) => sum + Number(t.amount), 0);
      const balance = deposits - debits;
      
      return {
        ...v,
        balance,
        totalDeposited: deposits,
        totalDebited: debits
      };
    });

    return {
      totalSalesVolume,
      totalCollected,
      totalPending,
      agencyGrossIncome,
      totalExpenses,
      netProfit,
      vendorStats
    };
  };

  const login = (username, password) => {
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (found) {
      setCurrentUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider value={{
      role,
      setRole: handleSetRole,
      theme,
      setTheme,
      customers,
      airlines,
      clients,
      invoices,
      payments,
      vendors,
      expenses,
      users,
      currentUser,
      login,
      logout,
      addUser,
      deleteUser,
      updateUserPermissions,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addAirline,
      addClient,
      updateClient,
      deleteClient,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      addPayment,
      addVendor,
      updateVendor,
      deleteVendor,
      addVendorDeposit,
      addExpense,
      deleteExpense,
      getFinancialStats,
      updateUser,
      resetDatabase
    }}>
      {children}
    </AppContext.Provider>
  );
};
