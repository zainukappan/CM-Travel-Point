import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

// Empty seed arrays to let the user start fresh with their own data
const INITIAL_CUSTOMERS = [];
const INITIAL_INVOICES = [];
const INITIAL_PAYMENTS = [];
const INITIAL_VENDORS = [];
const INITIAL_EXPENSES = [];
const INITIAL_USERS = [
  {
    id: 'USER-001',
    username: 'admin',
    password: 'password123',
    name: 'Adnan Director',
    role: 'admin',
    permissions: ['view_dashboard', 'create_invoice', 'view_expenses', 'manage_vendors', 'manage_staff']
  },
  {
    id: 'USER-002',
    username: 'staff',
    password: 'staff123',
    name: 'Staff Executive',
    role: 'staff',
    permissions: ['view_dashboard', 'create_invoice']
  }
];
const INITIAL_AIRLINES = ['Emirates', 'Qatar Airways', 'Lufthansa', 'Air India', 'IndiGo', 'Gulf Air'];
const INITIAL_CLIENTS = [];

export const AppProvider = ({ children }) => {
  // User Security Accounts
  const [users, setUsers] = useState(() => {
    const local = localStorage.getItem('aero_users');
    return local ? JSON.parse(local) : INITIAL_USERS;
  });

  // Current Session User
  const [currentUser, setCurrentUser] = useState(() => {
    const local = localStorage.getItem('aero_current_user');
    if (local) return JSON.parse(local);
    // Seed default admin user on first run
    const localUsers = localStorage.getItem('aero_users');
    const userArray = localUsers ? JSON.parse(localUsers) : INITIAL_USERS;
    return userArray.find(u => u.username === 'admin') || userArray[0];
  });

  // Global Role: 'admin' or 'staff'
  const [role, setRole] = useState(() => {
    return localStorage.getItem('aero_role') || 'admin';
  });

  // Keep Role State synced with Current Session User
  useEffect(() => {
    if (currentUser) {
      setRole(currentUser.role);
    }
  }, [currentUser]);

  // Global Theme: 'light' or 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aero_theme') || 'light';
  });

  // Core Data Tables
  const [customers, setCustomers] = useState(() => {
    const local = localStorage.getItem('aero_customers');
    return local ? JSON.parse(local) : INITIAL_CUSTOMERS;
  });

  const [airlines, setAirlines] = useState(() => {
    const local = localStorage.getItem('aero_airlines');
    return local ? JSON.parse(local) : INITIAL_AIRLINES;
  });

  const [clients, setClients] = useState(() => {
    const local = localStorage.getItem('aero_clients');
    return local ? JSON.parse(local) : INITIAL_CLIENTS;
  });

  const [invoices, setInvoices] = useState(() => {
    const local = localStorage.getItem('aero_invoices');
    return local ? JSON.parse(local) : INITIAL_INVOICES;
  });

  const [payments, setPayments] = useState(() => {
    const local = localStorage.getItem('aero_payments');
    return local ? JSON.parse(local) : INITIAL_PAYMENTS;
  });

  const [vendors, setVendors] = useState(() => {
    const local = localStorage.getItem('aero_vendors');
    return local ? JSON.parse(local) : INITIAL_VENDORS;
  });

  const [expenses, setExpenses] = useState(() => {
    const local = localStorage.getItem('aero_expenses');
    return local ? JSON.parse(local) : INITIAL_EXPENSES;
  });

  // Automatically sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('aero_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('aero_current_user', JSON.stringify(currentUser));
      localStorage.setItem('aero_role', currentUser.role);
    } else {
      localStorage.removeItem('aero_current_user');
    }
  }, [currentUser]);

  // Role toggler wrapper for fast simulator demo changes
  const handleSetRole = (newRole) => {
    const foundUser = users.find(u => u.role === newRole);
    if (foundUser) {
      setCurrentUser(foundUser);
    } else {
      setRole(newRole);
    }
  };


  useEffect(() => {
    localStorage.setItem('aero_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('aero_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('aero_airlines', JSON.stringify(airlines));
  }, [airlines]);

  useEffect(() => {
    localStorage.setItem('aero_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('aero_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('aero_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('aero_vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('aero_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Relational Database Actions
  const addCustomer = (customerData) => {
    const newCust = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      encrypted: true,
      createdDate: new Date().toISOString().split('T')[0],
      ...customerData
    };
    setCustomers(prev => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (id, updatedData) => {
    setCustomers(prev => prev.map(cust => {
      if (cust.id === id) {
        // If passenger details are updated in CRM, clear the walk-in incomplete profile flag
        return { 
          ...cust, 
          ...updatedData, 
          isWalkIn: false 
        };
      }
      return cust;
    }));

    // Cascade name changes dynamically to all linked invoices in the database
    if (updatedData.name) {
      setInvoices(prev => prev.map(inv => 
        inv.customerId === id ? { ...inv, customerName: updatedData.name } : inv
      ));
    }
  };

  const addInvoice = (invoiceData) => {
    const invId = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const baseFare = Number(invoiceData.baseFare || 0);
    const serviceCharge = Number(invoiceData.serviceCharge || 0);
    const taxGst = Number(invoiceData.taxGst || 0);
    const totalAmount = baseFare + serviceCharge + taxGst;
    const paidAmount = Number(invoiceData.initialPayment || 0);
    
    let status = 'pending';
    if (paidAmount >= totalAmount) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    // Check if customerId is specified, if not, auto-create a walk-in guest in CRM
    let finalCustomerId = invoiceData.customerId;
    let finalCustomerName = invoiceData.customerName;

    if (!finalCustomerId && finalCustomerName) {
      const cleanName = finalCustomerName.trim();
      const existing = customers.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        finalCustomerId = existing.id;
        finalCustomerName = existing.name;
      } else {
        const newCustId = `CUST-${Date.now().toString().slice(-4)}`;
        const walkInCustomer = {
          id: newCustId,
          name: cleanName,
          email: '',
          phone: 'Incomplete Profile',
          passportNo: '',
          passportExpiry: '',
          visaDetails: '',
          isWalkIn: true,
          encrypted: false,
          createdDate: new Date().toISOString().split('T')[0]
        };
        setCustomers(prev => [walkInCustomer, ...prev]);
        finalCustomerId = newCustId;
        finalCustomerName = cleanName;
      }
    } else if (finalCustomerId) {
      const activeCust = customers.find(c => c.id === finalCustomerId);
      if (activeCust) {
        finalCustomerName = activeCust.name;
      }
    }

    // Check if coName is provided, if so auto-match or auto-seed a corporate Client in clients list
    let finalCoId = invoiceData.coId || '';
    let finalCoName = invoiceData.coName ? invoiceData.coName.trim() : '';

    if (finalCoName && !finalCoId) {
      const existingClient = clients.find(c => c.name.toLowerCase() === finalCoName.toLowerCase());
      if (existingClient) {
        finalCoId = existingClient.id;
        finalCoName = existingClient.name;
      } else {
        const newCliId = `CLI-${Date.now().toString().slice(-4)}`;
        const newClient = {
          id: newCliId,
          name: finalCoName,
          email: 'No email registered',
          phone: 'Incomplete Client Profile',
          isClient: true,
          createdDate: new Date().toISOString().split('T')[0]
        };
        setClients(prev => [newClient, ...prev]);
        finalCoId = newCliId;
      }
    } else if (finalCoId) {
      const activeCli = clients.find(c => c.id === finalCoId);
      if (activeCli) {
        finalCoName = activeCli.name;
      }
    }

    const newInvoice = {
      id: invId,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      pnr: invoiceData.pnr.toUpperCase(),
      ticketNo: invoiceData.ticketNo,
      travelDate: invoiceData.travelDate,
      travelType: invoiceData.travelType,
      details: invoiceData.details,
      fromLocation: invoiceData.fromLocation || '',
      toLocation: invoiceData.toLocation || '',
      airlineName: invoiceData.airlineName || '',
      coId: finalCoId,
      coName: finalCoName,
      baseFare,
      serviceCharge,
      taxGst,
      totalAmount,
      paidAmount,
      status,
      vendorId: invoiceData.vendorId,
      createdDate: new Date().toISOString().split('T')[0]
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // Relational Side Effects:
    // 1. Create a Payment ledger row if initial payment was logged
    if (paidAmount > 0) {
      const newPay = {
        id: `PAY-${Date.now().toString().slice(-3)}`,
        invoiceId: invId,
        amount: paidAmount,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: invoiceData.paymentMethod || 'Cash',
        reference: invoiceData.paymentReference || 'Initial Invoice Dep'
      };
      setPayments(prev => [newPay, ...prev]);
    }

    // 2. Log B2B Ticket Debit in the specified Vendor ledger
    if (invoiceData.vendorId) {
      setVendors(prev => prev.map(vend => {
        if (vend.id === invoiceData.vendorId) {
          const transId = `VT-${Date.now().toString().slice(-3)}`;
          const debitTransaction = {
            id: transId,
            invoiceId: invId,
            type: 'debit',
            amount: baseFare, // The ticketing agency's cost is the base fare
            date: new Date().toISOString().split('T')[0],
            note: `Auto-Booked Base Fare for Ticket: ${invoiceData.ticketNo} PNR: ${invoiceData.pnr}`
          };
          
          return {
            ...vend,
            transactions: [...vend.transactions, debitTransaction]
          };
        }
        return vend;
      }));
    }

    return newInvoice;
  };

  const addPayment = (invoiceId, paymentData) => {
    const amt = Number(paymentData.amount);
    
    // Log receipt/payment transaction
    const newPay = {
      id: `PAY-${Date.now().toString().slice(-3)}`,
      invoiceId,
      amount: amt,
      date: paymentData.date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentData.paymentMethod || 'Cash',
      reference: paymentData.reference || 'Partial Pay Rec'
    };
    
    setPayments(prev => [newPay, ...prev]);

    // Update corresponding invoice status
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        const nextPaid = inv.paidAmount + amt;
        let nextStatus = 'pending';
        if (nextPaid >= inv.totalAmount) {
          nextStatus = 'paid';
        } else if (nextPaid > 0) {
          nextStatus = 'partial';
        }
        return {
          ...inv,
          paidAmount: nextPaid,
          status: nextStatus
        };
      }
      return inv;
    }));
  };

  const addVendorDeposit = (vendorId, depositData) => {
    const amt = Number(depositData.amount);
    setVendors(prev => prev.map(vend => {
      if (vend.id === vendorId) {
        const transId = `VT-${Date.now().toString().slice(-3)}`;
        const newTrans = {
          id: transId,
          type: 'deposit',
          amount: amt,
          date: depositData.date || new Date().toISOString().split('T')[0],
          note: depositData.note || 'Manual Portal Topup'
        };
        return {
          ...vend,
          transactions: [...vend.transactions, newTrans]
        };
      }
      return vend;
    }));
  };

  const addExpense = (expenseData) => {
    const isIncome = expenseData.type === 'income';
    const newExp = {
      id: `${isIncome ? 'INC' : 'EXP'}-${Date.now().toString().slice(-3)}`,
      category: expenseData.category,
      amount: Number(expenseData.amount),
      date: expenseData.date || new Date().toISOString().split('T')[0],
      description: expenseData.description,
      type: expenseData.type || 'expense'
    };
    setExpenses(prev => [newExp, ...prev]);
  };

  const updateInvoice = (id, updatedData) => {
    // Check if customerId is specified, if not, auto-create a walk-in guest in CRM
    let finalCustomerId = updatedData.customerId;
    let finalCustomerName = updatedData.customerName;

    if (!finalCustomerId && finalCustomerName) {
      const cleanName = finalCustomerName.trim();
      const existing = customers.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        finalCustomerId = existing.id;
        finalCustomerName = existing.name;
      } else {
        const newCustId = `CUST-${Date.now().toString().slice(-4)}`;
        const walkInCustomer = {
          id: newCustId,
          name: cleanName,
          email: '',
          phone: 'Incomplete Profile',
          passportNo: '',
          passportExpiry: '',
          visaDetails: '',
          isWalkIn: true,
          encrypted: false,
          createdDate: new Date().toISOString().split('T')[0]
        };
        setCustomers(prev => [walkInCustomer, ...prev]);
        finalCustomerId = newCustId;
        finalCustomerName = cleanName;
      }
    }

    // Check if coName is provided in update, and auto-match or auto-seed corporate Client
    let finalCoId = updatedData.coId || '';
    let finalCoName = updatedData.coName ? updatedData.coName.trim() : '';

    if (finalCoName && !finalCoId) {
      const existingClient = clients.find(c => c.name.toLowerCase() === finalCoName.toLowerCase());
      if (existingClient) {
        finalCoId = existingClient.id;
        finalCoName = existingClient.name;
      } else {
        const newCliId = `CLI-${Date.now().toString().slice(-4)}`;
        const newClient = {
          id: newCliId,
          name: finalCoName,
          email: 'No email registered',
          phone: 'Incomplete Client Profile',
          isClient: true,
          createdDate: new Date().toISOString().split('T')[0]
        };
        setClients(prev => [newClient, ...prev]);
        finalCoId = newCliId;
      }
    } else if (finalCoId) {
      const activeCli = clients.find(c => c.id === finalCoId);
      if (activeCli) {
        finalCoName = activeCli.name;
      }
    }

    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        const merged = { 
          ...inv, 
          ...updatedData,
          customerId: finalCustomerId,
          customerName: finalCustomerName,
          coId: finalCoId,
          coName: finalCoName
        };
        const baseFare = Number(merged.baseFare || 0);
        const serviceCharge = Number(merged.serviceCharge || 0);
        const taxGst = Number(merged.taxGst || 0);
        const totalAmount = baseFare + serviceCharge + taxGst;
        const paidAmount = Number(merged.paidAmount || 0);
        
        let status = 'pending';
        if (paidAmount >= totalAmount) {
          status = 'paid';
        } else if (paidAmount > 0) {
          status = 'partial';
        }
        
        return {
          ...merged,
          baseFare,
          serviceCharge,
          taxGst,
          totalAmount,
          status
        };
      }
      return inv;
    }));
  };

  const deleteInvoice = (id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const deleteCustomer = (id) => {
    setCustomers(prev => prev.filter(cust => cust.id !== id));
  };

  const addAirline = (name) => {
    const clean = name.trim();
    if (!clean) return;
    setAirlines(prev => {
      if (prev.some(a => a.toLowerCase() === clean.toLowerCase())) return prev;
      return [...prev, clean];
    });
  };

  const addClient = (clientData) => {
    const newCli = {
      id: `CLI-${Date.now().toString().slice(-4)}`,
      isClient: true,
      createdDate: new Date().toISOString().split('T')[0],
      ...clientData
    };
    setClients(prev => [newCli, ...prev]);
    return newCli;
  };

  const updateClient = (id, updatedData) => {
    setClients(prev => prev.map(cli => {
      if (cli.id === id) {
        return { ...cli, ...updatedData, isClient: true };
      }
      return cli;
    }));
    // Cascade name changes dynamically to all linked invoices in the database
    if (updatedData.name) {
      setInvoices(prev => prev.map(inv => 
        inv.coId === id ? { ...inv, coName: updatedData.name } : inv
      ));
    }
  };

  const deleteClient = (id) => {
    setClients(prev => prev.filter(cli => cli.id !== id));
    // Clear coId and coName in linked invoices
    setInvoices(prev => prev.map(inv =>
      inv.coId === id ? { ...inv, coId: '', coName: '' } : inv
    ));
  };

  const addVendor = (vendorData) => {
    const newVend = {
      id: `VEND-${Date.now().toString().slice(-3)}`,
      advancePaid: 0,
      outstandingAmount: 0,
      transactions: [],
      ...vendorData
    };
    setVendors(prev => [...prev, newVend]);
    return newVend;
  };

  const updateVendor = (id, updatedData) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updatedData } : v));
  };

  const deleteVendor = (id) => {
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  const updateUser = (id, updatedData) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const merged = { ...u, ...updatedData };
        return merged;
      }
      return u;
    }));
    // Sync current session user immediately if it's the current user
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updatedData }));
    }
  };

  // Relational aggregates for visual dashboard representation
  const getFinancialStats = () => {
    // Volume metrics
    const totalSalesVolume = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalCollected = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalPending = invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
    
    // Revenue metrics (Agency service fee is the actual earning of travel ticket agency)
    const agencyGrossIncome = invoices.reduce((sum, inv) => sum + inv.serviceCharge, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = agencyGrossIncome - totalExpenses;

    // Vendor stats (Debit vs Deposit)
    const vendorStats = vendors.map(v => {
      const deposits = v.transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
      const debits = v.transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
      const balance = deposits - debits;
      
      return {
        ...v,
        balance, // positive is advance balance, negative is outstanding debt
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

  // User management helper methods
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

  const addUser = (userData) => {
    const newUser = {
      id: `USER-${Date.now().toString().slice(-4)}`,
      ...userData
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const deleteUser = (id) => {
    if (currentUser && currentUser.id === id) {
      return { success: false, error: "Cannot delete currently active user session." };
    }
    const adminCount = users.filter(u => u.role === 'admin').length;
    const targetUser = users.find(u => u.id === id);
    if (targetUser && targetUser.role === 'admin' && adminCount <= 1) {
      return { success: false, error: "Cannot delete the last remaining Administrator account." };
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    return { success: true };
  };

  const updateUserPermissions = (id, newPermissions) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, permissions: newPermissions } : u));
    
    // Sync current session user immediately if permissions changed for them
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, permissions: newPermissions }));
    }
  };

  const resetDatabase = () => {
    localStorage.removeItem('aero_customers');
    localStorage.removeItem('aero_clients');
    localStorage.removeItem('aero_invoices');
    localStorage.removeItem('aero_payments');
    localStorage.removeItem('aero_vendors');
    localStorage.removeItem('aero_expenses');
    
    setCustomers([]);
    setClients([]);
    setInvoices([]);
    setPayments([]);
    setVendors([]);
    setExpenses([]);
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
      getFinancialStats,
      updateUser,
      resetDatabase
    }}>
      {children}
    </AppContext.Provider>
  );
};
