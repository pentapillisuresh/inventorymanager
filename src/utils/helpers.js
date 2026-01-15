export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
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

export const generateReportData = (type, data) => {
  if (!data || !Array.isArray(data)) return [];
  
  switch(type) {
    case 'inventory':
      return data.map(item => ({
        'Product Name': item.name || '',
        'SKU': item.sku || '',
        'Category': item.category || '',
        'Quantity': item.quantity || 0,
        'Unit': item.unit || '',
        'Price': item.price || 0,
        'Min Stock': item.minStock || 0,
        'Location': `${item.room || ''} ${item.rack || ''} ${item.freezer || ''}`.trim()
      }));
    case 'sales':
      return data.map(inv => ({
        'Invoice ID': inv.id || '',
        'Outlet': inv.outletName || '',
        'Date': inv.date || '',
        'Amount': inv.total || 0,
        'Status': inv.status || '',
        'Payment': inv.payment || '',
        'Due Date': inv.dueDate || 'N/A'
      }));
    case 'outlets':
      return data.map(outlet => ({
        'Outlet Name': outlet.name || '',
        'Type': outlet.type || '',
        'Phone': outlet.phone || '',
        'Credit Limit': outlet.creditLimit || 0,
        'Current Due': outlet.currentDue || 0,
        'Available Credit': (outlet.creditLimit || 0) - (outlet.currentDue || 0),
        'Status': outlet.status || ''
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