export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export const getStatusColor = (status) => {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  switch(status.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
    case 'blocked':
      return 'bg-red-100 text-red-800';
    case 'warning':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const calculateStats = (inventory, invoices, outlets) => {
  const totalStockValue = inventory.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );
  
  const lowStockItems = inventory.filter(item => 
    item.quantity < item.minStock
  ).length;
  
  const pendingInvoices = invoices.filter(inv => 
    inv.status === 'Pending'
  ).length;
  
  const activeOutlets = outlets.filter(outlet => 
    outlet.status === 'Active'
  ).length;
  
  const totalCredit = outlets.reduce((sum, outlet) => 
    sum + outlet.currentDue, 0
  );
  
  const totalSales = invoices
    .filter(inv => inv.status === 'Approved')
    .reduce((sum, inv) => sum + inv.total, 0);
  
  return {
    totalStockValue,
    lowStockItems,
    pendingInvoices,
    activeOutlets,
    totalCredit,
    totalSales
  };
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

export const calculateInvoiceTotal = (items) => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const getStockStatus = (quantity, minStock) => {
  const percentage = (quantity / minStock) * 100;
  if (percentage < 50) return { level: 'critical', color: 'red', label: 'Critical' };
  if (percentage < 80) return { level: 'low', color: 'yellow', label: 'Low' };
  if (percentage < 120) return { level: 'normal', color: 'blue', label: 'Normal' };
  return { level: 'good', color: 'green', label: 'Good' };
};

// src/utils/helpers.js - Update generateReportData function

export const generateReportData = (type, data) => {
  if (!data || !Array.isArray(data)) return [];
  
  switch(type) {
    case 'inventory':
      return data.map(item => ({
        'ID': item.id || '',
        'Product Name': item.Product?.name || '',
        'SKU': item.Product?.sku || '',
        'Category': item.Product?.Category?.name || '',
        'Quantity': item.quantity || 0,
        'Reorder Level': item.reorderLevel || 0,
        'Price': parseFloat(item.Product?.price || 0),
        'Location': `${item.Room?.name || ''} ${item.Rack?.name || ''} ${item.Freezer?.name || ''}`.trim(),
        'Store': item.Store?.name || '',
        'Last Updated': new Date(item.lastUpdated).toLocaleDateString()
      }));
      
    case 'sales':
      return data.map(inv => ({
        'Invoice ID': inv.id || '',
        'Invoice Number': inv.invoiceNumber || '',
        'Outlet': inv.Outlet?.name || '',
        'Date': new Date(inv.invoiceDate).toLocaleDateString(),
        'Total Amount': parseFloat(inv.totalAmount || 0),
        'Paid Amount': parseFloat(inv.paidAmount || 0),
        'Credit Amount': parseFloat(inv.creditAmount || 0),
        'Payment Method': inv.paymentMethod || '',
        'Status': inv.status || '',
        'Store Manager': inv.StoreManager?.name || ''
      }));
      
    case 'outlets':
      return data.map(outlet => ({
        'Outlet Name': outlet.name || '',
        'Type': outlet.type || '',
        'Contact Person': outlet.contactPerson || '',
        'Phone': outlet.phoneNumber || '',
        'Address': outlet.address || '',
        'Credit Limit': parseFloat(outlet.creditLimit || 0),
        'Current Credit': parseFloat(outlet.currentCredit || 0),
        'Available Credit': parseFloat(outlet.creditLimit || 0) - parseFloat(outlet.currentCredit || 0),
        'Status': outlet.isActive ? 'Active' : 'Inactive',
        'Store': outlet.Store?.name || ''
      }));
      
    case 'credit':
      const creditInvoices = data.filter(inv => inv.paymentMethod === 'credit');
      return creditInvoices.map(inv => ({
        'Invoice ID': inv.id || '',
        'Invoice Number': inv.invoiceNumber || '',
        'Outlet': inv.Outlet?.name || '',
        'Date': new Date(inv.invoiceDate).toLocaleDateString(),
        'Total Amount': parseFloat(inv.totalAmount || 0),
        'Paid Amount': parseFloat(inv.paidAmount || 0),
        'Outstanding Amount': parseFloat(inv.totalAmount || 0) - parseFloat(inv.paidAmount || 0),
        'Payment Method': inv.paymentMethod || '',
        'Status': inv.status || ''
      }));
      
    default:
      return [];
  }
};

export const filterByStockLevel = (inventory, level) => {
  if (!inventory || !Array.isArray(inventory)) return [];
  
  switch(level) {
    case 'critical':
      return inventory.filter(item => item.quantity < item.minStock * 0.5);
    case 'low':
      return inventory.filter(item => 
        item.quantity < item.minStock && item.quantity >= item.minStock * 0.5
      );
    case 'normal':
      return inventory.filter(item => 
        item.quantity >= item.minStock && item.quantity < item.minStock * 1.5
      );
    case 'good':
      return inventory.filter(item => item.quantity >= item.minStock * 1.5);
    default:
      return inventory;
  }
};

export const getOutletCreditStatus = (outlet) => {
  if (!outlet || !outlet.creditLimit) return { status: 'Unknown', color: 'gray' };
  
  const percentage = (outlet.currentDue / outlet.creditLimit) * 100;
  if (percentage >= 100) return { status: 'Exceeded', color: 'red' };
  if (percentage >= 80) return { status: 'Critical', color: 'orange' };
  if (percentage >= 60) return { status: 'High', color: 'yellow' };
  if (percentage >= 30) return { status: 'Moderate', color: 'blue' };
  return { status: 'Good', color: 'green' };
};

export const sortInventory = (inventory, sortBy, order = 'asc') => {
  if (!inventory || !Array.isArray(inventory)) return [];
  
  const sorted = [...inventory];
  
  sorted.sort((a, b) => {
    let aValue, bValue;
    
    switch(sortBy) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'quantity':
        aValue = a.quantity || 0;
        bValue = b.quantity || 0;
        break;
      case 'price':
        aValue = a.price || 0;
        bValue = b.price || 0;
        break;
      case 'stockValue':
        aValue = (a.price || 0) * (a.quantity || 0);
        bValue = (b.price || 0) * (b.quantity || 0);
        break;
      case 'stockLevel':
        aValue = (a.quantity || 0) / (a.minStock || 1);
        bValue = (b.quantity || 0) / (b.minStock || 1);
        break;
      default:
        return 0;
    }
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  return sorted;
};