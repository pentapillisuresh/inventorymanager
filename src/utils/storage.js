import {
  initialStores,
  initialOutlets,
  pendingApprovals,
  creditDues,
  stockAlerts,
  recentActivities
} from './dummyData';

// Add initial managers data
export const initialManagers = [];

// Add initial products data
export const initialProducts = [];

// Add categories data
export const initialCategories = [
  'Beverages',
  'Snacks',
  'Frozen',
  'Dairy',
  'Bakery',
  'Meat',
  'Produce',
  'Canned Goods',
  'Cleaning Supplies',
  'Personal Care'
];

// Add initial stock distributions data
export const initialDistributions = [];

// Add initial invoices data
export const initialInvoices = [];

// Add initial expenditure categories
export const initialExpenseCategories = [
  'Transport',
  'Maintenance',
  'Utilities',
  'Office Supplies',
  'Marketing',
  'Salaries',
  'Rent',
  'Travel',
  'Insurance',
  'Taxes',
  'Miscellaneous'
];

// Add initial expenditures data
export const initialExpenditures = [];

// Add initial reports data
export const initialReports = [];

export const storage = {
  // Stores
  getStores: () => {
    const stores = localStorage.getItem('stores');
    return stores ? JSON.parse(stores) : initialStores;
  },
  
  saveStores: (stores) => {
    localStorage.setItem('stores', JSON.stringify(stores));
  },
  
  addStore: (store) => {
    const stores = storage.getStores();
    const newStore = {
      ...store,
      id: Date.now(),
      status: 'Active',
      totalProducts: 0,
      totalValue: '$0K',
      totalItems: 0,
      infrastructure: [],
      racks: [],
      freezers: []
    };
    stores.push(newStore);
    storage.saveStores(stores);
    return newStore;
  },
  
  updateStore: (id, updatedData) => {
    const stores = storage.getStores();
    const index = stores.findIndex(store => store.id === id);
    if (index !== -1) {
      stores[index] = { ...stores[index], ...updatedData };
      storage.saveStores(stores);
      return stores[index];
    }
    return null;
  },
  
  deleteStore: (id) => {
    const stores = storage.getStores();
    const filteredStores = stores.filter(store => store.id !== id);
    storage.saveStores(filteredStores);
    return filteredStores;
  },
  
  getStoreById: (id) => {
    const stores = storage.getStores();
    return stores.find(store => store.id === id);
  },
  
  // Invoices Management
  getInvoices: () => {
    const invoices = localStorage.getItem('invoices');
    return invoices ? JSON.parse(invoices) : initialInvoices;
  },
  
  saveInvoices: (invoices) => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  },
  
  addInvoice: (invoiceData) => {
    const invoices = storage.getInvoices();
    const invoiceCount = invoices.length + 1;
    const invoiceId = `INV-${String(invoiceCount).padStart(3, '0')}`;
    
    const newInvoice = {
      id: invoiceId,
      ...invoiceData,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    
    invoices.push(newInvoice);
    storage.saveInvoices(invoices);
    
    const activities = storage.getRecentActivities();
    activities.unshift({
      id: Date.now(),
      type: 'invoice_created',
      description: `New invoice ${invoiceId} created`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    });
    storage.saveRecentActivities(activities);
    
    return newInvoice;
  },
  
  updateInvoice: (id, updatedData) => {
    const invoices = storage.getInvoices();
    const index = invoices.findIndex(invoice => invoice.id === id);
    
    if (index !== -1) {
      invoices[index] = { ...invoices[index], ...updatedData };
      storage.saveInvoices(invoices);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'invoice_updated',
        description: `Invoice ${id} updated`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return invoices[index];
    }
    return null;
  },
  
  deleteInvoice: (id) => {
    const invoices = storage.getInvoices();
    const invoiceToDelete = invoices.find(invoice => invoice.id === id);
    const filteredInvoices = invoices.filter(invoice => invoice.id !== id);
    storage.saveInvoices(filteredInvoices);
    
    if (invoiceToDelete) {
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'invoice_deleted',
        description: `Invoice ${id} deleted`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
    }
    
    return filteredInvoices;
  },
  
  getInvoiceById: (id) => {
    const invoices = storage.getInvoices();
    return invoices.find(invoice => invoice.id === id);
  },
  
  approveInvoice: (id) => {
    const invoices = storage.getInvoices();
    const index = invoices.findIndex(invoice => invoice.id === id);
    
    if (index !== -1) {
      invoices[index].status = 'Approved';
      invoices[index].approvedBy = 'Admin';
      invoices[index].approvedDate = new Date().toISOString();
      storage.saveInvoices(invoices);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'invoice_approved',
        description: `Invoice ${id} approved`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return invoices[index];
    }
    return null;
  },
  
  rejectInvoice: (id) => {
    const invoices = storage.getInvoices();
    const index = invoices.findIndex(invoice => invoice.id === id);
    
    if (index !== -1) {
      invoices[index].status = 'Rejected';
      invoices[index].rejectedBy = 'Admin';
      invoices[index].rejectedDate = new Date().toISOString();
      storage.saveInvoices(invoices);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'invoice_rejected',
        description: `Invoice ${id} rejected`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return invoices[index];
    }
    return null;
  },
  
  // Expenditures Management
  getExpenditures: () => {
    const expenditures = localStorage.getItem('expenditures');
    return expenditures ? JSON.parse(expenditures) : initialExpenditures;
  },
  
  saveExpenditures: (expenditures) => {
    localStorage.setItem('expenditures', JSON.stringify(expenditures));
  },
  
  addExpenditure: (expenseData) => {
    const expenditures = storage.getExpenditures();
    const newExpense = {
      id: Date.now(),
      ...expenseData,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    
    expenditures.push(newExpense);
    storage.saveExpenditures(expenditures);
    
    const activities = storage.getRecentActivities();
    activities.unshift({
      id: Date.now(),
      type: 'expense_created',
      description: `New expense added: ${expenseData.description}`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    });
    storage.saveRecentActivities(activities);
    
    return newExpense;
  },
  
  updateExpenditure: (id, updatedData) => {
    const expenditures = storage.getExpenditures();
    const index = expenditures.findIndex(expense => expense.id === id);
    
    if (index !== -1) {
      expenditures[index] = { ...expenditures[index], ...updatedData };
      storage.saveExpenditures(expenditures);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'expense_updated',
        description: `Expense updated: ${expenditures[index].description}`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return expenditures[index];
    }
    return null;
  },
  
  deleteExpenditure: (id) => {
    const expenditures = storage.getExpenditures();
    const expenseToDelete = expenditures.find(expense => expense.id === id);
    const filteredExpenditures = expenditures.filter(expense => expense.id !== id);
    storage.saveExpenditures(filteredExpenditures);
    
    if (expenseToDelete) {
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'expense_deleted',
        description: `Expense deleted: ${expenseToDelete.description}`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
    }
    
    return filteredExpenditures;
  },
  
  getExpenditureById: (id) => {
    const expenditures = storage.getExpenditures();
    return expenditures.find(expense => expense.id === id);
  },
  
  approveExpenditure: (id) => {
    const expenditures = storage.getExpenditures();
    const index = expenditures.findIndex(expense => expense.id === id);
    
    if (index !== -1) {
      expenditures[index].status = 'Approved';
      expenditures[index].approvedBy = 'Admin';
      expenditures[index].approvedDate = new Date().toISOString();
      storage.saveExpenditures(expenditures);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'expense_approved',
        description: `Expense approved: ${expenditures[index].description}`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return expenditures[index];
    }
    return null;
  },
  
  // Expense Categories Management
  getExpenseCategories: () => {
    const categories = localStorage.getItem('expenseCategories');
    return categories ? JSON.parse(categories) : initialExpenseCategories;
  },
  
  saveExpenseCategories: (categories) => {
    localStorage.setItem('expenseCategories', JSON.stringify(categories));
  },
  
  addExpenseCategory: (categoryName) => {
    const categories = storage.getExpenseCategories();
    if (!categories.includes(categoryName)) {
      categories.push(categoryName);
      storage.saveExpenseCategories(categories);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'expense_category_added',
        description: `New expense category added: ${categoryName}`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return categories;
    }
    return categories;
  },
  
  deleteExpenseCategory: (categoryName) => {
    const categories = storage.getExpenseCategories();
    const filteredCategories = categories.filter(cat => cat !== categoryName);
    storage.saveExpenseCategories(filteredCategories);
    
    const activities = storage.getRecentActivities();
    activities.unshift({
      id: Date.now(),
      type: 'expense_category_deleted',
      description: `Expense category deleted: ${categoryName}`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    });
    storage.saveRecentActivities(activities);
    
    return filteredCategories;
  },
  
  // Reports Management
  getReports: () => {
    const reports = localStorage.getItem('reports');
    return reports ? JSON.parse(reports) : initialReports;
  },
  
  saveReports: (reports) => {
    localStorage.setItem('reports', JSON.stringify(reports));
  },
  
  addReport: (reportData) => {
    const reports = storage.getReports();
    const newReport = {
      id: Date.now(),
      ...reportData,
      createdAt: new Date().toISOString()
    };
    
    reports.push(newReport);
    storage.saveReports(reports);
    
    const activities = storage.getRecentActivities();
    activities.unshift({
      id: Date.now(),
      type: 'report_generated',
      description: `New report generated: ${reportData.name}`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    });
    storage.saveRecentActivities(activities);
    
    return newReport;
  },
  
  // Stock Distributions Management
  getDistributions: () => {
    const distributions = localStorage.getItem('distributions');
    return distributions ? JSON.parse(distributions) : initialDistributions;
  },
  
  saveDistributions: (distributions) => {
    localStorage.setItem('distributions', JSON.stringify(distributions));
  },
  
  addDistribution: (distributionData) => {
    const distributions = storage.getDistributions();
    const stores = storage.getStores();
    const managers = storage.getManagers();
    const products = storage.getProducts();
    
    const store = stores.find(s => s.id === parseInt(distributionData.storeId));
    const manager = distributionData.managerId 
      ? managers.find(m => m.id === parseInt(distributionData.managerId))
      : null;
    
    // Generate distribution ID
    const distributionCount = distributions.length + 1;
    const distributionId = `DIST-${String(distributionCount).padStart(3, '0')}`;
    
    // Calculate totals
    let totalItems = 0;
    let totalValue = 0;
    
    distributionData.products.forEach(item => {
      totalItems += item.quantity;
      totalValue += item.total;
    });
    
    // Apply discount if credit payment
    let finalTotal = totalValue;
    if (distributionData.paymentType === 'Credit' && distributionData.discount) {
      finalTotal = totalValue * (1 - distributionData.discount / 100);
    }
    
    const newDistribution = {
      id: distributionId,
      storeId: parseInt(distributionData.storeId),
      storeName: store?.name || 'Unknown Store',
      managerId: manager?.id || null,
      managerName: manager?.name || 'Unassigned',
      date: new Date().toISOString().split('T')[0],
      products: distributionData.products,
      totalItems: totalItems,
      totalValue: finalTotal,
      paymentType: distributionData.paymentType,
      status: distributionData.paymentType === 'Paid' ? 'Completed' : 'Pending',
      notes: distributionData.notes || '',
      createdAt: new Date().toISOString(),
      discount: distributionData.discount || 0
    };
    
    // Update product stock
    distributionData.products.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const updatedStock = product.stock - item.quantity;
        storage.updateProduct(product.id, { stock: updatedStock });
      }
    });
    
    distributions.push(newDistribution);
    storage.saveDistributions(distributions);
    
    const activities = storage.getRecentActivities();
    activities.unshift({
      id: Date.now(),
      type: 'distribution_created',
      description: `New distribution ${distributionId} to ${store?.name}`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    });
    storage.saveRecentActivities(activities);
    
    return newDistribution;
  },
  
  updateDistribution: (id, updatedData) => {
    const distributions = storage.getDistributions();
    const index = distributions.findIndex(dist => dist.id === id);
    
    if (index !== -1) {
      distributions[index] = { ...distributions[index], ...updatedData };
      storage.saveDistributions(distributions);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'distribution_updated',
        description: `Distribution ${id} updated`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return distributions[index];
    }
    return null;
  },
  
  deleteDistribution: (id) => {
    const distributions = storage.getDistributions();
    const distributionToDelete = distributions.find(dist => dist.id === id);
    const filteredDistributions = distributions.filter(dist => dist.id !== id);
    storage.saveDistributions(filteredDistributions);
    
    if (distributionToDelete) {
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'distribution_deleted',
        description: `Distribution ${id} deleted`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
    }
    
    return filteredDistributions;
  },
  
  getDistributionById: (id) => {
    const distributions = storage.getDistributions();
    return distributions.find(dist => dist.id === id);
  },
  
  updateDistributionStatus: (id, status) => {
    const distributions = storage.getDistributions();
    const index = distributions.findIndex(dist => dist.id === id);
    
    if (index !== -1) {
      distributions[index].status = status;
      storage.saveDistributions(distributions);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'distribution_status_changed',
        description: `Distribution ${id} status changed to ${status}`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return distributions[index];
    }
    return null;
  },
  
  // Infrastructure Management
  addRoom: (storeId, roomData) => {
    const stores = storage.getStores();
    const storeIndex = stores.findIndex(store => store.id === storeId);
    
    if (storeIndex !== -1) {
      const newRoom = {
        id: Date.now(),
        ...roomData,
        type: 'room'
      };
      
      if (!stores[storeIndex].infrastructure) {
        stores[storeIndex].infrastructure = [];
      }
      
      stores[storeIndex].infrastructure.push(newRoom);
      
      stores[storeIndex].totalItems = (stores[storeIndex].totalItems || 0) + roomData.items;
      
      storage.saveStores(stores);
      return newRoom;
    }
    return null;
  },
  
  addRack: (storeId, rackData) => {
    const stores = storage.getStores();
    const storeIndex = stores.findIndex(store => store.id === storeId);
    
    if (storeIndex !== -1) {
      const newRack = {
        id: Date.now(),
        ...rackData,
        type: 'rack'
      };
      
      if (!stores[storeIndex].racks) {
        stores[storeIndex].racks = [];
      }
      
      stores[storeIndex].racks.push(newRack);
      
      const currentItems = parseInt(rackData.items?.split('/')[0]?.trim() || '0');
      stores[storeIndex].totalItems = (stores[storeIndex].totalItems || 0) + currentItems;
      
      storage.saveStores(stores);
      return newRack;
    }
    return null;
  },
  
  addFreezer: (storeId, freezerData) => {
    const stores = storage.getStores();
    const storeIndex = stores.findIndex(store => store.id === storeId);
    
    if (storeIndex !== -1) {
      const newFreezer = {
        id: Date.now(),
        ...freezerData,
        type: 'freezer'
      };
      
      if (!stores[storeIndex].freezers) {
        stores[storeIndex].freezers = [];
      }
      
      stores[storeIndex].freezers.push(newFreezer);
      storage.saveStores(stores);
      return newFreezer;
    }
    return null;
  },
  
  deleteRoom: (storeId, roomId) => {
    const stores = storage.getStores();
    const storeIndex = stores.findIndex(store => store.id === storeId);
    
    if (storeIndex !== -1 && stores[storeIndex].infrastructure) {
      const roomIndex = stores[storeIndex].infrastructure.findIndex(room => room.id === roomId);
      if (roomIndex !== -1) {
        stores[storeIndex].totalItems = Math.max(0, (stores[storeIndex].totalItems || 0) - (stores[storeIndex].infrastructure[roomIndex].items || 0));
        
        stores[storeIndex].infrastructure.splice(roomIndex, 1);
        storage.saveStores(stores);
        return true;
      }
    }
    return false;
  },
  
  deleteRack: (storeId, rackId) => {
    const stores = storage.getStores();
    const storeIndex = stores.findIndex(store => store.id === storeId);
    
    if (storeIndex !== -1 && stores[storeIndex].racks) {
      const rackIndex = stores[storeIndex].racks.findIndex(rack => rack.id === rackId);
      if (rackIndex !== -1) {
        const currentItems = parseInt(stores[storeIndex].racks[rackIndex].items?.split('/')[0]?.trim() || '0');
        stores[storeIndex].totalItems = Math.max(0, (stores[storeIndex].totalItems || 0) - currentItems);
        
        stores[storeIndex].racks.splice(rackIndex, 1);
        storage.saveStores(stores);
        return true;
      }
    }
    return false;
  },
  
  deleteFreezer: (storeId, freezerId) => {
    const stores = storage.getStores();
    const storeIndex = stores.findIndex(store => store.id === storeId);
    
    if (storeIndex !== -1 && stores[storeIndex].freezers) {
      const freezerIndex = stores[storeIndex].freezers.findIndex(freezer => freezer.id === freezerId);
      if (freezerIndex !== -1) {
        stores[storeIndex].freezers.splice(freezerIndex, 1);
        storage.saveStores(stores);
        return true;
      }
    }
    return false;
  },
  
  // Enhanced Outlets Management
  getOutlets: () => {
    const outlets = localStorage.getItem('outlets');
    return outlets ? JSON.parse(outlets) : initialOutlets;
  },
  
  saveOutlets: (outlets) => {
    localStorage.setItem('outlets', JSON.stringify(outlets));
  },
  
  addOutlet: (outlet) => {
    const outlets = storage.getOutlets();
    const newOutlet = {
      ...outlet,
      id: Date.now(),
      status: 'Active',
      creditUsed: 0,
      totalOrders: 0,
      lastOrder: 'No orders yet',
      orderHistory: [],
      creditHistory: [],
      createdAt: new Date().toISOString()
    };
    outlets.push(newOutlet);
    storage.saveOutlets(outlets);
    
    const activities = storage.getRecentActivities();
    activities.unshift({
      id: Date.now(),
      type: 'outlet_created',
      description: `New outlet "${outlet.name}" created`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    });
    storage.saveRecentActivities(activities);
    
    return newOutlet;
  },
  
  updateOutlet: (id, updatedData) => {
    const outlets = storage.getOutlets();
    const index = outlets.findIndex(outlet => outlet.id === id);
    if (index !== -1) {
      outlets[index] = { ...outlets[index], ...updatedData };
      storage.saveOutlets(outlets);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'outlet_updated',
        description: `Outlet "${outlets[index].name}" updated`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return outlets[index];
    }
    return null;
  },
  
  deleteOutlet: (id) => {
    const outlets = storage.getOutlets();
    const outletToDelete = outlets.find(outlet => outlet.id === id);
    const filteredOutlets = outlets.filter(outlet => outlet.id !== id);
    storage.saveOutlets(filteredOutlets);
    
    if (outletToDelete) {
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'outlet_deleted',
        description: `Outlet "${outletToDelete.name}" deleted`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
    }
    
    return filteredOutlets;
  },
  
  getOutletById: (id) => {
    const outlets = storage.getOutlets();
    return outlets.find(outlet => outlet.id === id);
  },
  
  addOutletOrder: (outletId, orderData) => {
    const outlets = storage.getOutlets();
    const index = outlets.findIndex(outlet => outlet.id === outletId);
    
    if (index !== -1) {
      const orderId = `INV-${String(outlets[index].totalOrders + 1).padStart(3, '0')}`;
      const newOrder = {
        id: orderId,
        ...orderData,
        date: new Date().toISOString().split('T')[0]
      };
      
      outlets[index].totalOrders += 1;
      outlets[index].lastOrder = new Date().toISOString().split('T')[0];
      outlets[index].creditUsed += orderData.amount;
      
      if (!outlets[index].orderHistory) {
        outlets[index].orderHistory = [];
      }
      outlets[index].orderHistory.unshift(newOrder);
      
      if (!outlets[index].creditHistory) {
        outlets[index].creditHistory = [];
      }
      outlets[index].creditHistory.unshift({
        date: new Date().toISOString().split('T')[0],
        type: 'Purchase',
        amount: orderData.amount,
        balance: outlets[index].creditLimit - (outlets[index].creditUsed + orderData.amount)
      });
      
      storage.saveOutlets(outlets);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'order_created',
        description: `New order ${orderId} for ${outlets[index].name}`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return newOrder;
    }
    return null;
  },
  
  addPayment: (outletId, paymentData) => {
    const outlets = storage.getOutlets();
    const index = outlets.findIndex(outlet => outlet.id === outletId);
    
    if (index !== -1) {
      outlets[index].creditUsed = Math.max(0, outlets[index].creditUsed - paymentData.amount);
      
      if (!outlets[index].creditHistory) {
        outlets[index].creditHistory = [];
      }
      outlets[index].creditHistory.unshift({
        date: new Date().toISOString().split('T')[0],
        type: 'Payment',
        amount: paymentData.amount,
        balance: outlets[index].creditLimit - outlets[index].creditUsed
      });
      
      storage.saveOutlets(outlets);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'payment_received',
        description: `Payment of $${paymentData.amount} from ${outlets[index].name}`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return outlets[index];
    }
    return null;
  },
  
  // Managers Management
  getManagers: () => {
    const managers = localStorage.getItem('managers');
    return managers ? JSON.parse(managers) : initialManagers;
  },
  
  saveManagers: (managers) => {
    localStorage.setItem('managers', JSON.stringify(managers));
  },
  
  addManager: (managerData) => {
    const managers = storage.getManagers();
    const stores = storage.getStores();
    const selectedStore = stores.find(store => store.id === parseInt(managerData.storeId));
    
    const newManager = {
      id: Date.now(),
      ...managerData,
      storeName: selectedStore ? selectedStore.name : 'Unassigned',
      status: 'Active',
      lastLogin: 'Never',
      invoices: 0,
      createdAt: new Date().toISOString()
    };
    
    managers.push(newManager);
    storage.saveManagers(managers);
    
    const activities = storage.getRecentActivities();
    activities.unshift({
      id: Date.now(),
      type: 'manager_created',
      description: `New manager "${managerData.name}" created`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    });
    storage.saveRecentActivities(activities);
    
    return newManager;
  },
  
  updateManager: (id, updatedData) => {
    const managers = storage.getManagers();
    const stores = storage.getStores();
    const index = managers.findIndex(manager => manager.id === id);
    
    if (index !== -1) {
      const selectedStore = stores.find(store => store.id === parseInt(updatedData.storeId));
      
      managers[index] = { 
        ...managers[index], 
        ...updatedData,
        storeName: selectedStore ? selectedStore.name : managers[index].storeName
      };
      storage.saveManagers(managers);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'manager_updated',
        description: `Manager "${managers[index].name}" updated`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return managers[index];
    }
    return null;
  },
  
  deleteManager: (id) => {
    const managers = storage.getManagers();
    const managerToDelete = managers.find(manager => manager.id === id);
    const filteredManagers = managers.filter(manager => manager.id !== id);
    storage.saveManagers(filteredManagers);
    
    if (managerToDelete) {
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'manager_deleted',
        description: `Manager "${managerToDelete.name}" deleted`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
    }
    
    return filteredManagers;
  },
  
  getManagerById: (id) => {
    const managers = storage.getManagers();
    return managers.find(manager => manager.id === id);
  },
  
  resendCredentials: (managerId) => {
    const managers = storage.getManagers();
    const index = managers.findIndex(manager => manager.id === managerId);
    
    if (index !== -1) {
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'credentials_resent',
        description: `Credentials resent to "${managers[index].name}"`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return true;
    }
    return false;
  },
  
  // Products Management
  getProducts: () => {
    const products = localStorage.getItem('products');
    return products ? JSON.parse(products) : initialProducts;
  },
  
  saveProducts: (products) => {
    localStorage.setItem('products', JSON.stringify(products));
  },
  
  addProduct: (productData) => {
    const products = storage.getProducts();
    const newProduct = {
      id: Date.now(),
      ...productData,
      status: productData.stock > 0 ? 'In Stock' : 'Out of Stock',
      createdAt: new Date().toISOString()
    };
    
    if (productData.stock < productData.minStock) {
      newProduct.status = 'Low Stock';
    }
    
    products.push(newProduct);
    storage.saveProducts(products);
    
    if (newProduct.stock < newProduct.minStock) {
      storage.addStockAlert({
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        currentStock: newProduct.stock,
        minStock: newProduct.minStock,
        category: newProduct.category
      });
    }
    
    const activities = storage.getRecentActivities();
    activities.unshift({
      id: Date.now(),
      type: 'product_created',
      description: `New product "${productData.name}" added`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    });
    storage.saveRecentActivities(activities);
    
    return newProduct;
  },
  
  updateProduct: (id, updatedData) => {
    const products = storage.getProducts();
    const index = products.findIndex(product => product.id === id);
    
    if (index !== -1) {
      let status = 'In Stock';
      if (updatedData.stock === 0) {
        status = 'Out of Stock';
      } else if (updatedData.stock < (updatedData.minStock || products[index].minStock)) {
        status = 'Low Stock';
      }
      
      products[index] = { 
        ...products[index], 
        ...updatedData,
        status: status
      };
      
      storage.saveProducts(products);
      
      if (products[index].stock < products[index].minStock) {
        storage.addStockAlert({
          productId: products[index].id,
          productName: products[index].name,
          sku: products[index].sku,
          currentStock: products[index].stock,
          minStock: products[index].minStock,
          category: products[index].category
        });
      } else {
        const alerts = storage.getStockAlerts();
        const filteredAlerts = alerts.filter(alert => alert.productId !== id);
        storage.saveStockAlerts(filteredAlerts);
      }
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'product_updated',
        description: `Product "${products[index].name}" updated`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return products[index];
    }
    return null;
  },
  
  deleteProduct: (id) => {
    const products = storage.getProducts();
    const productToDelete = products.find(product => product.id === id);
    const filteredProducts = products.filter(product => product.id !== id);
    storage.saveProducts(filteredProducts);
    
    const alerts = storage.getStockAlerts();
    const filteredAlerts = alerts.filter(alert => alert.productId !== id);
    storage.saveStockAlerts(filteredAlerts);
    
    if (productToDelete) {
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'product_deleted',
        description: `Product "${productToDelete.name}" deleted`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
    }
    
    return filteredProducts;
  },
  
  getProductById: (id) => {
    const products = storage.getProducts();
    return products.find(product => product.id === id);
  },
  
  // Categories Management
  getCategories: () => {
    const categories = localStorage.getItem('categories');
    return categories ? JSON.parse(categories) : initialCategories;
  },
  
  saveCategories: (categories) => {
    localStorage.setItem('categories', JSON.stringify(categories));
  },
  
  addCategory: (categoryName) => {
    const categories = storage.getCategories();
    if (!categories.includes(categoryName)) {
      categories.push(categoryName);
      storage.saveCategories(categories);
      
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'category_added',
        description: `New category "${categoryName}" added`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      return categories;
    }
    return categories;
  },
  
  deleteCategory: (categoryName) => {
    const categories = storage.getCategories();
    const filteredCategories = categories.filter(cat => cat !== categoryName);
    storage.saveCategories(filteredCategories);
    
    const activities = storage.getRecentActivities();
    activities.unshift({
      id: Date.now(),
      type: 'category_deleted',
      description: `Category "${categoryName}" deleted`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    });
    storage.saveRecentActivities(activities);
    
    return filteredCategories;
  },
  
  // Stock Alerts
  addStockAlert: (alertData) => {
    const alerts = storage.getStockAlerts();
    const existingAlertIndex = alerts.findIndex(alert => alert.productId === alertData.productId);
    
    if (existingAlertIndex !== -1) {
      alerts[existingAlertIndex] = {
        ...alerts[existingAlertIndex],
        ...alertData,
        timestamp: new Date().toISOString()
      };
    } else {
      alerts.unshift({
        id: Date.now(),
        ...alertData,
        timestamp: new Date().toISOString(),
        status: 'Pending'
      });
    }
    
    storage.saveStockAlerts(alerts);
  },
  
  // Other functions
  getPendingApprovals: () => {
    const approvals = localStorage.getItem('pendingApprovals');
    return approvals ? JSON.parse(approvals) : pendingApprovals;
  },
  
  savePendingApprovals: (approvals) => {
    localStorage.setItem('pendingApprovals', JSON.stringify(approvals));
  },
  
  getCreditDues: () => {
    const dues = localStorage.getItem('creditDues');
    return dues ? JSON.parse(dues) : creditDues;
  },
  
  saveCreditDues: (dues) => {
    localStorage.setItem('creditDues', JSON.stringify(dues));
  },
  
  getStockAlerts: () => {
    const alerts = localStorage.getItem('stockAlerts');
    return alerts ? JSON.parse(alerts) : stockAlerts;
  },
  
  saveStockAlerts: (alerts) => {
    localStorage.setItem('stockAlerts', JSON.stringify(alerts));
  },
  
  getRecentActivities: () => {
    const activities = localStorage.getItem('recentActivities');
    return activities ? JSON.parse(activities) : recentActivities;
  },
  
  saveRecentActivities: (activities) => {
    localStorage.setItem('recentActivities', JSON.stringify(activities));
  },
  
  initializeData: () => {
    if (!localStorage.getItem('stores')) {
      localStorage.setItem('stores', JSON.stringify(initialStores));
    }
    if (!localStorage.getItem('outlets')) {
      localStorage.setItem('outlets', JSON.stringify(initialOutlets));
    }
    if (!localStorage.getItem('managers')) {
      localStorage.setItem('managers', JSON.stringify(initialManagers));
    }
    if (!localStorage.getItem('products')) {
      localStorage.setItem('products', JSON.stringify(initialProducts));
    }
    if (!localStorage.getItem('categories')) {
      localStorage.setItem('categories', JSON.stringify(initialCategories));
    }
    if (!localStorage.getItem('distributions')) {
      localStorage.setItem('distributions', JSON.stringify(initialDistributions));
    }
    if (!localStorage.getItem('invoices')) {
      localStorage.setItem('invoices', JSON.stringify(initialInvoices));
    }
    if (!localStorage.getItem('expenditures')) {
      localStorage.setItem('expenditures', JSON.stringify(initialExpenditures));
    }
    if (!localStorage.getItem('expenseCategories')) {
      localStorage.setItem('expenseCategories', JSON.stringify(initialExpenseCategories));
    }
    if (!localStorage.getItem('reports')) {
      localStorage.setItem('reports', JSON.stringify(initialReports));
    }
    if (!localStorage.getItem('pendingApprovals')) {
      localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals));
    }
    if (!localStorage.getItem('creditDues')) {
      localStorage.setItem('creditDues', JSON.stringify(creditDues));
    }
    if (!localStorage.getItem('stockAlerts')) {
      localStorage.setItem('stockAlerts', JSON.stringify(stockAlerts));
    }
    if (!localStorage.getItem('recentActivities')) {
      localStorage.setItem('recentActivities', JSON.stringify(recentActivities));
    }
  }
};