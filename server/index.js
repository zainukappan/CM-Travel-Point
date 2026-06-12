const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize database schema and seed data before running
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server due to database initialization failure:', err);
  process.exit(1);
});

// ==========================================
// 1. Users Endpoints
// ==========================================
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password, name, role, permissions } = req.body;
  const id = `USER-${Date.now().toString().slice(-4)}`;
  try {
    const result = await pool.query(
      'INSERT INTO users (id, username, password, name, role, permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, username, password, name, role, permissions || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, name, role } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET username = $1, password = $2, name = $3, role = $4 WHERE id = $5 RETURNING *',
      [username, password, name, role, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User successfully deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/permissions', async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET permissions = $1 WHERE id = $2 RETURNING *',
      [permissions, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. Customers Endpoints
// ==========================================
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { name, email, phone, passportNo, passportExpiry, visaDetails } = req.body;
  const id = `CUST-${Date.now().toString().slice(-4)}`;
  const createdDate = new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      'INSERT INTO customers (id, name, email, phone, passport_no, passport_expiry, visa_details, is_walk_in, encrypted, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [id, name, email, phone, passportNo || '', passportExpiry || '', visaDetails || '', false, true, createdDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, passportNo, passportExpiry, visaDetails } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Update customer profile details
    const custResult = await client.query(
      'UPDATE customers SET name = $1, email = $2, phone = $3, passport_no = $4, passport_expiry = $5, visa_details = $6, is_walk_in = false WHERE id = $7 RETURNING *',
      [name, email, phone, passportNo, passportExpiry, visaDetails, id]
    );

    // 2. Cascade updated passenger name to all linked invoices
    await client.query(
      'UPDATE invoices SET customer_name = $1 WHERE customer_id = $2',
      [name, id]
    );

    await client.query('COMMIT');
    res.json(custResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    res.json({ message: 'Customer successfully deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. Airlines Endpoints
// ==========================================
app.get('/api/airlines', async (req, res) => {
  try {
    const result = await pool.query('SELECT name FROM airlines');
    res.json(result.rows.map(row => row.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/airlines', async (req, res) => {
  const { name } = req.body;
  const cleanName = name ? name.trim() : '';
  if (!cleanName) return res.status(400).json({ error: 'Airline name cannot be empty.' });

  try {
    await pool.query('INSERT INTO airlines (name) VALUES ($1) ON CONFLICT DO NOTHING', [cleanName]);
    res.status(201).json({ name: cleanName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. Clients (Corporate/Care-of) Endpoints
// ==========================================
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients ORDER BY created_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', async (req, res) => {
  const { name, email, phone } = req.body;
  const id = `CLI-${Date.now().toString().slice(-4)}`;
  const createdDate = new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      'INSERT INTO clients (id, name, email, phone, is_client, created_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, name, email || 'No email registered', phone || 'Incomplete Client Profile', true, createdDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    // 1. Update Corporate Client Profile
    const clientResult = await dbClient.query(
      'UPDATE clients SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
      [name, email, phone, id]
    );

    // 2. Cascade update corporate coordinator name to all linked invoices
    await dbClient.query(
      'UPDATE invoices SET co_name = $1 WHERE co_id = $2',
      [name, id]
    );

    await dbClient.query('COMMIT');
    res.json(clientResult.rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    dbClient.release();
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');
    
    // 1. Delete client record
    await dbClient.query('DELETE FROM clients WHERE id = $1', [id]);

    // 2. Nullify C/o links on invoices to keep historical integrity
    await dbClient.query('UPDATE invoices SET co_id = NULL, co_name = \'\' WHERE co_id = $1', [id]);

    await dbClient.query('COMMIT');
    res.json({ message: 'Corporate client successfully deleted and linked invoices unlinked.' });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    dbClient.release();
  }
});

// ==========================================
// 5. Invoices Endpoints
// ==========================================
app.get('/api/invoices', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices ORDER BY created_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  const invoiceData = req.body;
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const invId = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const baseFare = Number(invoiceData.baseFare || 0);
    const serviceCharge = Number(invoiceData.serviceCharge || 0);
    const taxGst = Number(invoiceData.taxGst || 0);
    const totalAmount = baseFare + serviceCharge + taxGst;
    const paidAmount = Number(invoiceData.initialPayment || 0);
    const createdDate = new Date().toISOString().split('T')[0];

    let status = 'pending';
    if (paidAmount >= totalAmount) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    // 1. Handle Customer Seeding/Matching
    let finalCustomerId = invoiceData.customerId;
    let finalCustomerName = invoiceData.customerName;

    if (!finalCustomerId && finalCustomerName) {
      const cleanName = finalCustomerName.trim();
      const existing = await dbClient.query('SELECT * FROM customers WHERE LOWER(name) = $1', [cleanName.toLowerCase()]);
      if (existing.rows.length > 0) {
        finalCustomerId = existing.rows[0].id;
        finalCustomerName = existing.rows[0].name;
      } else {
        const newCustId = `CUST-${Date.now().toString().slice(-4)}`;
        await dbClient.query(
          'INSERT INTO customers (id, name, email, phone, passport_no, passport_expiry, visa_details, is_walk_in, encrypted, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [newCustId, cleanName, '', 'Incomplete Profile', '', '', '', true, false, createdDate]
        );
        finalCustomerId = newCustId;
        finalCustomerName = cleanName;
      }
    } else if (finalCustomerId) {
      const activeCust = await dbClient.query('SELECT name FROM customers WHERE id = $1', [finalCustomerId]);
      if (activeCust.rows.length > 0) {
        finalCustomerName = activeCust.rows[0].name;
      }
    }

    // 2. Handle Client Coordinator Seeding/Matching
    let finalCoId = invoiceData.coId || '';
    let finalCoName = invoiceData.coName ? invoiceData.coName.trim() : '';

    if (finalCoName && !finalCoId) {
      const existingClient = await dbClient.query('SELECT * FROM clients WHERE LOWER(name) = $1', [finalCoName.toLowerCase()]);
      if (existingClient.rows.length > 0) {
        finalCoId = existingClient.rows[0].id;
        finalCoName = existingClient.rows[0].name;
      } else {
        const newCliId = `CLI-${Date.now().toString().slice(-4)}`;
        await dbClient.query(
          'INSERT INTO clients (id, name, email, phone, is_client, created_date) VALUES ($1, $2, $3, $4, $5, $6)',
          [newCliId, finalCoName, 'No email registered', 'Incomplete Client Profile', true, createdDate]
        );
        finalCoId = newCliId;
      }
    } else if (finalCoId) {
      const activeCli = await dbClient.query('SELECT name FROM clients WHERE id = $1', [finalCoId]);
      if (activeCli.rows.length > 0) {
        finalCoName = activeCli.rows[0].name;
      }
    }

    // 3. Insert Invoice
    const invoiceResult = await dbClient.query(`
      INSERT INTO invoices (
        id, customer_id, customer_name, pnr, ticket_no, travel_date, travel_type, details, 
        from_location, to_location, airline_name, co_id, co_name, base_fare, service_charge, 
        tax_gst, total_amount, paid_amount, status, vendor_id, created_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `, [
      invId, finalCustomerId, finalCustomerName, invoiceData.pnr.toUpperCase(), invoiceData.ticketNo,
      invoiceData.travelDate, invoiceData.travelType, invoiceData.details, invoiceData.fromLocation || '',
      invoiceData.toLocation || '', invoiceData.airlineName || '', finalCoId || null, finalCoName,
      baseFare, serviceCharge, taxGst, totalAmount, paidAmount, status, invoiceData.vendorId || '', createdDate
    ]);

    // 4. Create initial payment log if applicable
    if (paidAmount > 0) {
      const payId = `PAY-${Date.now().toString().slice(-3)}`;
      await dbClient.query(
        'INSERT INTO payments (id, invoice_id, amount, date, payment_method, reference) VALUES ($1, $2, $3, $4, $5, $6)',
        [payId, invId, paidAmount, createdDate, invoiceData.paymentMethod || 'Cash', invoiceData.paymentReference || 'Initial Invoice Dep']
      );
    }

    // 5. Log B2B Ticket Debit Transaction
    if (invoiceData.vendorId) {
      const transId = `VT-${Date.now().toString().slice(-3)}`;
      await dbClient.query(
        'INSERT INTO vendor_transactions (id, vendor_id, invoice_id, type, amount, date, note) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [transId, invoiceData.vendorId, invId, 'debit', baseFare, createdDate, `Auto-Booked Base Fare for Ticket: ${invoiceData.ticketNo} PNR: ${invoiceData.pnr}`]
      );
    }

    await dbClient.query('COMMIT');
    res.status(201).json(invoiceResult.rows[0]);

  } catch (err) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    dbClient.release();
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const baseFare = Number(updatedData.baseFare || 0);
    const serviceCharge = Number(updatedData.serviceCharge || 0);
    const taxGst = Number(updatedData.taxGst || 0);
    const totalAmount = baseFare + serviceCharge + taxGst;
    
    let paidAmount = Number(updatedData.paidAmount || 0);
    const createdDate = new Date().toISOString().split('T')[0];

    // Handle cascading payments list updates if supplied by the client
    if (updatedData.paymentsList) {
      // 1. Delete previous payments
      await dbClient.query('DELETE FROM payments WHERE invoice_id = $1', [id]);

      // 2. Insert updated payments
      paidAmount = 0;
      const validPayments = updatedData.paymentsList.filter(p => Number(p.amount || 0) > 0);
      for (let i = 0; i < validPayments.length; i++) {
        const p = validPayments[i];
        const payId = p.id || `PAY-${Date.now().toString().slice(-3)}-${i}`;
        const amt = Number(p.amount);
        paidAmount += amt;
        await dbClient.query(
          'INSERT INTO payments (id, invoice_id, amount, date, payment_method, reference) VALUES ($1, $2, $3, $4, $5, $6)',
          [payId, id, amt, p.date, p.paymentMethod || 'Cash', p.reference || (i === 0 ? 'Initial Deposit' : 'Future Due Clearance')]
        );
      }
    }

    let status = 'pending';
    if (paidAmount >= totalAmount) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    // 1. Handle Customer Seeding/Matching
    let finalCustomerId = updatedData.customerId;
    let finalCustomerName = updatedData.customerName;

    if (!finalCustomerId && finalCustomerName) {
      const cleanName = finalCustomerName.trim();
      const existing = await dbClient.query('SELECT * FROM customers WHERE LOWER(name) = $1', [cleanName.toLowerCase()]);
      if (existing.rows.length > 0) {
        finalCustomerId = existing.rows[0].id;
        finalCustomerName = existing.rows[0].name;
      } else {
        const newCustId = `CUST-${Date.now().toString().slice(-4)}`;
        await dbClient.query(
          'INSERT INTO customers (id, name, email, phone, passport_no, passport_expiry, visa_details, is_walk_in, encrypted, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [newCustId, cleanName, '', 'Incomplete Profile', '', '', '', true, false, createdDate]
        );
        finalCustomerId = newCustId;
        finalCustomerName = cleanName;
      }
    }

    // 2. Handle Client Seeding/Matching
    let finalCoId = updatedData.coId || '';
    let finalCoName = updatedData.coName ? updatedData.coName.trim() : '';

    if (finalCoName && !finalCoId) {
      const existingClient = await dbClient.query('SELECT * FROM clients WHERE LOWER(name) = $1', [finalCoName.toLowerCase()]);
      if (existingClient.rows.length > 0) {
        finalCoId = existingClient.rows[0].id;
        finalCoName = existingClient.rows[0].name;
      } else {
        const newCliId = `CLI-${Date.now().toString().slice(-4)}`;
        await dbClient.query(
          'INSERT INTO clients (id, name, email, phone, is_client, created_date) VALUES ($1, $2, $3, $4, $5, $6)',
          [newCliId, finalCoName, 'No email registered', 'Incomplete Client Profile', true, createdDate]
        );
        finalCoId = newCliId;
      }
    } else if (finalCoId) {
      const activeCli = await dbClient.query('SELECT name FROM clients WHERE id = $1', [finalCoId]);
      if (activeCli.rows.length > 0) {
        finalCoName = activeCli.rows[0].name;
      }
    }

    // 3. Update Invoice
    const invoiceResult = await dbClient.query(`
      UPDATE invoices SET 
        customer_id = $1, customer_name = $2, pnr = $3, ticket_no = $4, travel_date = $5, 
        travel_type = $6, details = $7, from_location = $8, to_location = $9, airline_name = $10, 
        co_id = $11, co_name = $12, base_fare = $13, service_charge = $14, tax_gst = $15, 
        total_amount = $16, paid_amount = $17, status = $18, vendor_id = $19 
      WHERE id = $20 
      RETURNING *
    `, [
      finalCustomerId, finalCustomerName, updatedData.pnr.toUpperCase(), updatedData.ticketNo,
      updatedData.travelDate, updatedData.travelType, updatedData.details, updatedData.fromLocation || '',
      updatedData.toLocation || '', updatedData.airlineName || '', finalCoId || null, finalCoName,
      baseFare, serviceCharge, taxGst, totalAmount, paidAmount, status, updatedData.vendorId || '', id
    ]);

    await dbClient.query('COMMIT');
    res.json(invoiceResult.rows[0]);

  } catch (err) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    dbClient.release();
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM invoices WHERE id = $1', [id]);
    res.json({ message: 'Invoice successfully deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. Payments Endpoints
// ==========================================
app.get('/api/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', async (req, res) => {
  const { invoiceId, amount, date, paymentMethod, reference } = req.body;
  const payId = `PAY-${Date.now().toString().slice(-3)}`;
  const payAmt = Number(amount);
  const paymentDate = date || new Date().toISOString().split('T')[0];

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    // 1. Insert Payment
    const paymentResult = await dbClient.query(
      'INSERT INTO payments (id, invoice_id, amount, date, payment_method, reference) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [payId, invoiceId, payAmt, paymentDate, paymentMethod || 'Cash', reference || '']
    );

    // 2. Fetch linked invoice parameters
    const invData = await dbClient.query('SELECT total_amount, paid_amount FROM invoices WHERE id = $1', [invoiceId]);
    if (invData.rows.length > 0) {
      const currentPaid = Number(invData.rows[0].paid_amount);
      const totalAmt = Number(invData.rows[0].total_amount);
      const nextPaid = currentPaid + payAmt;

      let nextStatus = 'pending';
      if (nextPaid >= totalAmt) {
        nextStatus = 'paid';
      } else if (nextPaid > 0) {
        nextStatus = 'partial';
      }

      // 3. Update linked invoice status and paid amount
      await dbClient.query(
        'UPDATE invoices SET paid_amount = $1, status = $2 WHERE id = $3',
        [nextPaid, nextStatus, invoiceId]
      );
    }

    await dbClient.query('COMMIT');
    res.status(201).json(paymentResult.rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    dbClient.release();
  }
});

// ==========================================
// 7. Vendors Endpoints
// ==========================================
app.get('/api/vendors', async (req, res) => {
  try {
    // We aggregate transactions inside backend queries to get live balances
    const vendorsResult = await pool.query('SELECT * FROM vendors');
    const transactionsResult = await pool.query('SELECT * FROM vendor_transactions');

    const parsedVendors = vendorsResult.rows.map(v => {
      const matches = transactionsResult.rows.filter(t => t.vendor_id === v.id);
      return {
        ...v,
        advancePaid: Number(v.advance_paid),
        outstandingAmount: Number(v.outstanding_amount),
        transactions: matches.map(t => ({
          id: t.id,
          invoiceId: t.invoice_id,
          type: t.type,
          amount: Number(t.amount),
          date: t.date,
          note: t.note
        }))
      };
    });
    
    res.json(parsedVendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vendors', async (req, res) => {
  const { name, portalName } = req.body;
  const id = `VEND-${Date.now().toString().slice(-3)}`;
  try {
    const result = await pool.query(
      'INSERT INTO vendors (id, name, portal_name, advance_paid, outstanding_amount) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, name, portalName || '', 0, 0]
    );
    res.status(201).json({
      ...result.rows[0],
      transactions: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vendors/:id', async (req, res) => {
  const { id } = req.params;
  const { name, portalName } = req.body;
  try {
    const result = await pool.query(
      'UPDATE vendors SET name = $1, portal_name = $2 WHERE id = $3 RETURNING *',
      [name, portalName, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vendors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM vendors WHERE id = $1', [id]);
    res.json({ message: 'Vendor successfully deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vendors/:id/deposit', async (req, res) => {
  const { id } = req.params;
  const { amount, date, note } = req.body;
  const transId = `VT-${Date.now().toString().slice(-3)}`;
  const depAmt = Number(amount);
  const depDate = date || new Date().toISOString().split('T')[0];

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    // 1. Log vendor transaction
    await dbClient.query(
      'INSERT INTO vendor_transactions (id, vendor_id, type, amount, date, note) VALUES ($1, $2, $3, $4, $5, $6)',
      [transId, id, 'deposit', depAmt, depDate, note || 'Manual Portal Topup']
    );

    // 2. Fetch vendor profile
    const vendQuery = await dbClient.query('SELECT advance_paid FROM vendors WHERE id = $1', [id]);
    if (vendQuery.rows.length > 0) {
      const nextAdvance = Number(vendQuery.rows[0].advance_paid) + depAmt;
      // 3. Update vendor advance paid column
      await dbClient.query('UPDATE vendors SET advance_paid = $1 WHERE id = $2', [nextAdvance, id]);
    }

    await dbClient.query('COMMIT');
    res.json({ message: 'Deposit successfully processed' });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    dbClient.release();
  }
});

// ==========================================
// 8. Expenses Endpoints
// ==========================================
app.get('/api/expenses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { category, amount, date, description, type } = req.body;
  const isIncome = type === 'income';
  const id = `${isIncome ? 'INC' : 'EXP'}-${Date.now().toString().slice(-3)}`;
  const expAmt = Number(amount);
  const expDate = date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      'INSERT INTO expenses (id, category, amount, date, description, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, category, expAmt, expDate, description || '', type || 'expense']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
    res.json({ message: 'Expense successfully deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reset', async (req, res) => {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');
    await dbClient.query('TRUNCATE TABLE payments, invoices, vendor_transactions, vendors, expenses, customers, clients CASCADE');
    const { seedInitialData } = require('./db');
    await seedInitialData(dbClient);
    await dbClient.query('COMMIT');
    res.json({ message: 'Database successfully reset to initial seed state.' });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    dbClient.release();
  }
});
