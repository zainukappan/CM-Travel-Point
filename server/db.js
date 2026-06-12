const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Neon requires SSL connection
  }
});

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('Successfully connected to Neon PostgreSQL database.');
    
    // Begin transaction for schema creation
    await client.query('BEGIN');

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'staff',
        permissions TEXT[]
      );
    `);

    // 2. Customers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(50),
        passport_no TEXT,
        passport_expiry VARCHAR(20),
        visa_details TEXT,
        is_walk_in BOOLEAN DEFAULT FALSE,
        encrypted BOOLEAN DEFAULT FALSE,
        created_date VARCHAR(20)
      );
    `);

    // 3. Airlines Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS airlines (
        name VARCHAR(100) PRIMARY KEY
      );
    `);

    // 4. Clients Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(50),
        is_client BOOLEAN DEFAULT TRUE,
        created_date VARCHAR(20)
      );
    `);

    // 5. Vendors Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        portal_name VARCHAR(100),
        advance_paid NUMERIC(12, 2) DEFAULT 0,
        outstanding_amount NUMERIC(12, 2) DEFAULT 0
      );
    `);

    // 6. Invoices Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE SET NULL,
        customer_name VARCHAR(100),
        pnr VARCHAR(10) NOT NULL,
        ticket_no VARCHAR(100) NOT NULL,
        travel_date VARCHAR(20) NOT NULL,
        travel_type VARCHAR(20) NOT NULL,
        details TEXT,
        from_location VARCHAR(100),
        to_location VARCHAR(100),
        airline_name VARCHAR(100),
        co_id VARCHAR(50) REFERENCES clients(id) ON DELETE SET NULL,
        co_name VARCHAR(100),
        base_fare NUMERIC(12, 2) DEFAULT 0,
        service_charge NUMERIC(12, 2) DEFAULT 0,
        tax_gst NUMERIC(12, 2) DEFAULT 0,
        total_amount NUMERIC(12, 2) DEFAULT 0,
        paid_amount NUMERIC(12, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        vendor_id VARCHAR(50),
        created_date VARCHAR(20)
      );
    `);

    // 7. Payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(50) PRIMARY KEY,
        invoice_id VARCHAR(50) REFERENCES invoices(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        date VARCHAR(20) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        reference VARCHAR(100)
      );
    `);

    // 8. Vendor Transactions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_transactions (
        id VARCHAR(50) PRIMARY KEY,
        vendor_id VARCHAR(50) REFERENCES vendors(id) ON DELETE CASCADE,
        invoice_id VARCHAR(50),
        type VARCHAR(20) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        date VARCHAR(20) NOT NULL,
        note TEXT
      );
    `);

    // 9. Expenses Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(50) PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        date VARCHAR(20) NOT NULL,
        description TEXT,
        type VARCHAR(20) DEFAULT 'expense'
      );
    `);

    await client.query('COMMIT');
    console.log('Database tables successfully created or already exist.');

    // Seed Data if Tables are Empty
    await seedInitialData(client);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing database tables:', err);
    throw err;
  } finally {
    client.release();
  }
};

const seedInitialData = async (client) => {
  // 1. Seed Users
  const userCheck = await client.query('SELECT COUNT(*) FROM users');
  if (parseInt(userCheck.rows[0].count) === 0) {
    console.log('Seeding initial users...');
    await client.query(`
      INSERT INTO users (id, username, password, name, role, permissions) VALUES
      ('USER-001', 'admin', 'password123', 'Adnan Director', 'admin', ARRAY['view_dashboard', 'create_invoice', 'view_expenses', 'manage_vendors', 'manage_staff']),
      ('USER-002', 'staff', 'staff123', 'Staff Executive', 'staff', ARRAY['view_dashboard', 'create_invoice'])
    `);
  }

  // 2. Seed Airlines
  const airlineCheck = await client.query('SELECT COUNT(*) FROM airlines');
  if (parseInt(airlineCheck.rows[0].count) === 0) {
    console.log('Seeding initial airlines...');
    const airlines = ['Emirates', 'Qatar Airways', 'Lufthansa', 'Air India', 'IndiGo', 'Gulf Air'];
    for (const air of airlines) {
      await client.query('INSERT INTO airlines (name) VALUES ($1)', [air]);
    }
  }

  // 3. Seed Clients
  const clientCheck = await client.query('SELECT COUNT(*) FROM clients');
  if (parseInt(clientCheck.rows[0].count) === 0) {
    console.log('Seeding initial corporate clients...');
    await client.query(`
      INSERT INTO clients (id, name, email, phone, is_client, created_date) VALUES
      ('CLI-001', 'Zain Travels', 'info@zaintravels.com', '+91 98456 12345', TRUE, '2026-05-10'),
      ('CLI-002', 'Global Tech Solutions', 'travel@globaltech.com', '+91 99123 45678', TRUE, '2026-05-15')
    `);
  }

  // 4. Seed Customers
  const customerCheck = await client.query('SELECT COUNT(*) FROM customers');
  if (parseInt(customerCheck.rows[0].count) === 0) {
    console.log('Seeding initial customers...');
    await client.query(`
      INSERT INTO customers (id, name, email, phone, passport_no, passport_expiry, visa_details, is_walk_in, encrypted, created_date) VALUES
      ('CUST-101', 'Adnan Siddiqui', 'adnan.siddiqui@gmail.com', '+92 321 4567890', 'U2FsdGVkX19DMTIzNDU2NxB1pMpxM/6s9z2r', '2030-10-15', 'U2FsdGVkX19DMTIzNDU2N3UKIFZpc2EgRGV0YWlscw==', FALSE, TRUE, '2026-04-12'),
      ('CUST-102', 'Sarah Thompson', 'sarah.t@outlook.com', '+1 415 889 0291', 'U2FsdGVkX19DMTIzNDU2NxB1pMpxM/6s9z2r', '2032-05-20', 'U2FsdGVkX19DMTIzNDU2N3UKIFZpc2EgRGV0YWlscw==', FALSE, TRUE, '2026-05-01'),
      ('CUST-103', 'Mohammed Al-Farsi', 'farsi.m@qu.edu.qa', '+974 5543 2190', 'U2FsdGVkX19DMTIzNDU2NxB1pMpxM/6s9z2r', '2031-12-05', 'U2FsdGVkX19DMTIzNDU2N3UKIFZpc2EgRGV0YWlscw==', FALSE, TRUE, '2026-05-10'),
      ('CUST-104', 'Elena Rostova', 'elena.rost@yandex.ru', '+7 901 234 5678', 'U2FsdGVkX19DMTIzNDU2NxB1pMpxM/6s9z2r', '2029-08-11', 'U2FsdGVkX19DMTIzNDU2N3UKIFZpc2EgRGV0YWlscw==', FALSE, TRUE, '2026-05-18')
    `);
  }

  // 5. Seed Vendors
  const vendorCheck = await client.query('SELECT COUNT(*) FROM vendors');
  if (parseInt(vendorCheck.rows[0].count) === 0) {
    console.log('Seeding initial vendors...');
    await client.query(`
      INSERT INTO vendors (id, name, portal_name, advance_paid, outstanding_amount) VALUES
      ('VEND-001', 'Sabre B2B Portal', 'Sabre Red Web', 5000.00, 0.00),
      ('VEND-002', 'Amadeus Air Ticketing', 'Amadeus Sell Connect', 3500.00, 1180.00),
      ('VEND-003', 'EuroRail & Train Consolidators', 'EuroStar Agent Portal', 500.00, 180.00)
    `);
  }

  // 6. Seed Invoices
  const invoiceCheck = await client.query('SELECT COUNT(*) FROM invoices');
  if (parseInt(invoiceCheck.rows[0].count) === 0) {
    console.log('Seeding initial invoices...');
    await client.query(`
      INSERT INTO invoices (id, customer_id, customer_name, pnr, ticket_no, travel_date, travel_type, details, from_location, to_location, airline_name, co_id, co_name, base_fare, service_charge, tax_gst, total_amount, paid_amount, status, vendor_id, created_date) VALUES
      ('INV-2026-001', 'CUST-101', 'Adnan Siddiqui', 'EK89PZ', '176-2490182745', '2026-06-05', 'Air', 'Emirates (Economy) - Lahore (LHE) to Dubai (DXB) - Roundtrip', 'LHE', 'DXB', 'Emirates', NULL, '', 450.00, 50.00, 35.00, 535.00, 535.00, 'paid', 'VEND-001', '2026-05-12'),
      ('INV-2026-002', 'CUST-102', 'Sarah Thompson', 'LH45T2', '220-9182309122', '2026-06-15', 'Air', 'Lufthansa (Business) - London (LHR) to New York (JFK) - One Way', 'LHR', 'JFK', 'Lufthansa', NULL, '', 1800.00, 150.00, 180.00, 2130.00, 1000.00, 'partial', 'VEND-002', '2026-05-15'),
      ('INV-2026-003', 'CUST-103', 'Mohammed Al-Farsi', 'PNR88902', '992018374', '2026-05-28', 'Train', 'Eurostar (Standard Premier) - Paris (CDG) to London (STP) - One Way', 'CDG', 'STP', '', NULL, '', 180.00, 20.00, 15.00, 215.00, 0.00, 'pending', 'VEND-003', '2026-05-20'),
      ('INV-2026-004', 'CUST-104', 'Elena Rostova', 'QR99LP', '157-8890123847', '2026-06-20', 'Air', 'Qatar Airways (Economy) - Moscow (DME) to Doha (DOH) - One Way', 'DME', 'DOH', 'Qatar Airways', NULL, '', 380.00, 40.00, 30.00, 450.00, 450.00, 'paid', 'VEND-002', '2026-05-21')
    `);
  }

  // 7. Seed Payments
  const paymentCheck = await client.query('SELECT COUNT(*) FROM payments');
  if (parseInt(paymentCheck.rows[0].count) === 0) {
    console.log('Seeding initial payments...');
    await client.query(`
      INSERT INTO payments (id, invoice_id, amount, date, payment_method, reference) VALUES
      ('PAY-301', 'INV-2026-001', 535.00, '2026-05-12', 'Credit Card', 'TXN_EK_778912'),
      ('PAY-302', 'INV-2026-002', 1000.00, '2026-05-15', 'Bank Transfer', 'WIRE-US-9902'),
      ('PAY-303', 'INV-2026-004', 450.00, '2026-05-21', 'Cash', 'CASH-REC-108')
    `);
  }

  // 8. Seed Vendor Transactions
  const vtCheck = await client.query('SELECT COUNT(*) FROM vendor_transactions');
  if (parseInt(vtCheck.rows[0].count) === 0) {
    console.log('Seeding initial vendor transactions...');
    await client.query(`
      INSERT INTO vendor_transactions (id, vendor_id, invoice_id, type, amount, date, note) VALUES
      ('VT-401', 'VEND-001', 'INV-2026-001', 'debit', 450.00, '2026-05-12', 'Base Fare Booking LHE-DXB'),
      ('VT-402', 'VEND-001', NULL, 'deposit', 5000.00, '2026-05-01', 'Advance bank deposit for credit threshold limit'),
      ('VT-403', 'VEND-002', NULL, 'deposit', 3500.00, '2026-05-01', 'Portal replenishment deposit'),
      ('VT-404', 'VEND-002', 'INV-2026-002', 'debit', 1800.00, '2026-05-15', 'Ticket cost LHR-JFK'),
      ('VT-405', 'VEND-002', 'INV-2026-004', 'debit', 380.00, '2026-05-21', 'Ticket cost DME-DOH'),
      ('VT-406', 'VEND-003', NULL, 'deposit', 500.00, '2026-05-01', 'Agency sign-up deposit'),
      ('VT-407', 'VEND-003', 'INV-2026-003', 'debit', 180.00, '2026-05-20', 'Booking EuroStar Paris-London')
    `);
  }

  // 9. Seed Expenses
  const expenseCheck = await client.query('SELECT COUNT(*) FROM expenses');
  if (parseInt(expenseCheck.rows[0].count) === 0) {
    console.log('Seeding initial expenses...');
    await client.query(`
      INSERT INTO expenses (id, category, amount, date, description, type) VALUES
      ('EXP-501', 'Rent', 800.00, '2026-05-01', 'Office commercial space rent - Suite 302', 'expense'),
      ('EXP-502', 'Salaries', 1200.00, '2026-05-05', 'Lead ticketing executive monthly stipend', 'expense'),
      ('EXP-503', 'Utilities', 145.00, '2026-05-10', 'High speed fiber internet & electricity bills', 'expense'),
      ('EXP-504', 'Marketing', 150.00, '2026-05-18', 'Social media flyer boosting for Summer vacation tour deals', 'expense')
    `);
  }
};

module.exports = {
  pool,
  initializeDatabase,
  seedInitialData
};
