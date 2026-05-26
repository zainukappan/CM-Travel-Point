// CSV Exporter Utility for CM Travel Point
// Formats datasets into RFC 4180 compliant CSV streams with Excel compatibility (UTF-8 BOM).

// Helper to escape CSV cell fields containing commas or quotes
const escapeCSVField = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val).replace(/"/g, '""'); // escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
};

// Helper to trigger browser file download
const downloadCSVFile = (filename, csvContent) => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportInvoicesToCSV = (invoices) => {
  const headers = ['Invoice ID', 'Customer Name', 'PNR', 'Ticket No', 'Travel Date', 'Travel Type', 'Details', 'Base Fare (INR)', 'Service Charge (INR)', 'Tax/GST (INR)', 'Total Amount (INR)', 'Paid Amount (INR)', 'Status', 'Created Date'];
  const rows = invoices.map(inv => [
    inv.id,
    inv.customerName,
    inv.pnr,
    inv.ticketNo,
    inv.travelDate,
    inv.travelType,
    inv.details,
    inv.baseFare,
    inv.serviceCharge,
    inv.taxGst,
    inv.totalAmount,
    inv.paidAmount,
    inv.status,
    inv.createdDate
  ]);

  const csvContent = [
    headers.map(escapeCSVField).join(','),
    ...rows.map(row => row.map(escapeCSVField).join(','))
  ].join('\n');

  downloadCSVFile(`CM_Invoices_Ledger_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
};

export const exportCustomersToCSV = (customers) => {
  const headers = ['Customer ID', 'Full Name', 'Email Address', 'Phone Number', 'Passport Number', 'Passport Expiry', 'Visa Details', 'Created Date'];
  const rows = customers.map(c => [
    c.id,
    c.name,
    c.email,
    c.phone,
    c.passportNo,
    c.passportExpiry,
    c.visaDetails,
    c.createdDate
  ]);

  const csvContent = [
    headers.map(escapeCSVField).join(','),
    ...rows.map(row => row.map(escapeCSVField).join(','))
  ].join('\n');

  downloadCSVFile(`CM_CRM_Passengers_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
};

export const exportExpensesToCSV = (expenses) => {
  const headers = ['Expense ID', 'Category', 'Amount (INR)', 'Transaction Date', 'Description'];
  const rows = expenses.map(exp => [
    exp.id,
    exp.category,
    exp.amount,
    exp.date,
    exp.description
  ]);

  const csvContent = [
    headers.map(escapeCSVField).join(','),
    ...rows.map(row => row.map(escapeCSVField).join(','))
  ].join('\n');

  downloadCSVFile(`CM_Expenses_Ledger_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
};

export const exportVendorsToCSV = (vendors) => {
  const headers = ['Vendor ID', 'Portal/Vendor Name', 'Portal Software', 'Transaction ID', 'Transaction Type', 'Amount (INR)', 'Post Date', 'Ref Invoice', 'Note'];
  
  const rows = [];
  vendors.forEach(v => {
    v.transactions.forEach(t => {
      rows.push([
        v.id,
        v.name,
        v.portalName,
        t.id,
        t.type,
        t.amount,
        t.date,
        t.invoiceId || 'N/A',
        t.note
      ]);
    });
  });

  const csvContent = [
    headers.map(escapeCSVField).join(','),
    ...rows.map(row => row.map(escapeCSVField).join(','))
  ].join('\n');

  downloadCSVFile(`CM_B2B_Vendors_Ledger_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
};

// Generates a comprehensive Multi-Sheet Unified Ledger Report containing all databases
export const exportUnifiedDatabaseBackupCSV = (invoices, customers, vendors, expenses, payments) => {
  let reportLines = [];
  
  // Section 1: Corporate Summary Header
  reportLines.push('========================================================================');
  reportLines.push('CM TRAVEL POINT (TOURS & SERVICES) - UNIFIED BACKUP DATABASE LEDGER');
  reportLines.push(`Exported On: ${new Date().toLocaleString()} - Secure SSL Offline Ledger`);
  reportLines.push('========================================================================');
  reportLines.push('');

  // Section 2: Invoices
  reportLines.push('--- SECTION 1: CUSTOMER TICKETING INVOICES & BILLING ---');
  const invHeaders = ['Invoice ID', 'Customer Name', 'PNR', 'Ticket No', 'Travel Date', 'Travel Type', 'Base Fare (INR)', 'Service Charge (INR)', 'Tax/GST (INR)', 'Total Amount (INR)', 'Paid Amount (INR)', 'Status', 'Created Date'];
  reportLines.push(invHeaders.map(escapeCSVField).join(','));
  invoices.forEach(inv => {
    reportLines.push([
      inv.id, inv.customerName, inv.pnr, inv.ticketNo, inv.travelDate, inv.travelType,
      inv.baseFare, inv.serviceCharge, inv.taxGst, inv.totalAmount, inv.paidAmount, inv.status, inv.createdDate
    ].map(escapeCSVField).join(','));
  });
  reportLines.push('');
  
  // Section 3: CRM Customers
  reportLines.push('--- SECTION 2: CRM PASSENGER AND DOCUMENTATION DIRECTORY ---');
  const custHeaders = ['Customer ID', 'Full Name', 'Email Address', 'Phone Number', 'Passport Number', 'Passport Expiry', 'Visa Details', 'Created Date'];
  reportLines.push(custHeaders.map(escapeCSVField).join(','));
  customers.forEach(c => {
    reportLines.push([
      c.id, c.name, c.email, c.phone, c.passportNo, c.passportExpiry, c.visaDetails, c.createdDate
    ].map(escapeCSVField).join(','));
  });
  reportLines.push('');

  // Section 4: Payments/Receipts
  reportLines.push('--- SECTION 3: CUSTOMER PAYMENTS & RECEIPT RECORDS ---');
  const payHeaders = ['Receipt ID', 'Invoice ID', 'Amount Received (INR)', 'Payment Date', 'Payment Method', 'Reference No'];
  reportLines.push(payHeaders.map(escapeCSVField).join(','));
  payments.forEach(p => {
    reportLines.push([
      p.id, p.invoiceId, p.amount, p.date, p.paymentMethod, p.reference
    ].map(escapeCSVField).join(','));
  });
  reportLines.push('');

  // Section 5: B2B Vendors
  reportLines.push('--- SECTION 4: B2B GDS PORTALS & CONSOLIDATOR LEDGER ---');
  const vendHeaders = ['Vendor ID', 'Portal/Vendor Name', 'Transaction ID', 'Type', 'Amount (INR)', 'Date', 'Ref Invoice', 'Note'];
  reportLines.push(vendHeaders.map(escapeCSVField).join(','));
  vendors.forEach(v => {
    v.transactions.forEach(t => {
      reportLines.push([
        v.id, v.name, t.id, t.type, t.amount, t.date, t.invoiceId || 'N/A', t.note
      ].map(escapeCSVField).join(','));
    });
  });
  reportLines.push('');

  // Section 6: Expenses
  reportLines.push('--- SECTION 5: OFFICE OPERATING COSTS & ADMINISTRATIVE EXPENSES ---');
  const expHeaders = ['Expense ID', 'Category', 'Amount (INR)', 'Transaction Date', 'Description'];
  reportLines.push(expHeaders.map(escapeCSVField).join(','));
  expenses.forEach(exp => {
    reportLines.push([
      exp.id, exp.category, exp.amount, exp.date, exp.description
    ].map(escapeCSVField).join(','));
  });
  
  const csvContent = reportLines.join('\n');
  downloadCSVFile(`CM_Travel_Point_Unified_Backup_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
};
