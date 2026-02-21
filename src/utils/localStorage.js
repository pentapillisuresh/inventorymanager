// src/utils/localStorage.js
import { 
  dummyManagerData, 
  dummyInventory, 
  dummyOutlets, 
  dummyInvoices 
} from './dummyData.js';

const STORAGE_KEYS = {
  MANAGER_DATA: 'manager_data',
  INVENTORY: 'manager_inventory',
  OUTLETS: 'manager_outlets',
  INVOICES: 'manager_invoices',
  LOGIN_STATUS: 'manager_login_status'
};

export const localStorageManager = {
  // Initialize dummy data if not exists
  initializeData: () => {
    if (!localStorage.getItem(STORAGE_KEYS.MANAGER_DATA)) {
      localStorage.setItem(STORAGE_KEYS.MANAGER_DATA, JSON.stringify(dummyManagerData.manager));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(dummyInventory));
      localStorage.setItem(STORAGE_KEYS.OUTLETS, JSON.stringify(dummyOutlets));
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(dummyInvoices));
      localStorage.setItem(STORAGE_KEYS.LOGIN_STATUS, 'false');
      console.log('Dummy data initialized in localStorage');
    }
  },

  // Get data
  getManagerData: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.MANAGER_DATA) || '{}'),
  getInventory: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || '[]'),
  getOutlets: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.OUTLETS) || '[]'),
  getInvoices: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]'),
  isLoggedIn: () => localStorage.getItem(STORAGE_KEYS.LOGIN_STATUS) === 'true',

  // Set data
  setManagerData: (data) => localStorage.setItem(STORAGE_KEYS.MANAGER_DATA, JSON.stringify(data)),
  setInventory: (data) => localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(data)),
  setOutlets: (data) => localStorage.setItem(STORAGE_KEYS.OUTLETS, JSON.stringify(data)),
  setInvoices: (data) => localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(data)),
  setLoginStatus: (status) => localStorage.setItem(STORAGE_KEYS.LOGIN_STATUS, status.toString()),

  // Update specific items
  updateInventoryItem: (id, updates) => {
    const inventory = localStorageManager.getInventory();
    const updated = inventory.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    localStorageManager.setInventory(updated);
    return updated.find(item => item.id === id);
  },

  addInvoice: (invoice) => {
    const invoices = localStorageManager.getInvoices();
    const newInvoice = { 
      ...invoice, 
      id: `INV${String(invoices.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newInvoice, ...invoices];
    localStorageManager.setInvoices(updated);
    return newInvoice;
  },

  updateInvoiceStatus: (invoiceId, status, reason = '') => {
    const invoices = localStorageManager.getInvoices();
    const updated = invoices.map(inv => 
      inv.id === invoiceId ? { ...inv, status, ...(reason && { reason }) } : inv
    );
    localStorageManager.setInvoices(updated);
    return updated.find(inv => inv.id === invoiceId);
  },

  updateOutletDue: (outletId, amount) => {
    const outlets = localStorageManager.getOutlets();
    const updated = outlets.map(outlet => {
      if (outlet.id === outletId) {
        const newDue = outlet.currentDue + amount;
        const status = newDue > outlet.creditLimit ? 'Blocked' : 
                      newDue > outlet.creditLimit * 0.8 ? 'Warning' : 'Active';
        return { ...outlet, currentDue: newDue, status };
      }
      return outlet;
    });
    localStorageManager.setOutlets(updated);
    return updated.find(outlet => outlet.id === outletId);
  },

  // Get single items by ID
  getInvoiceById: (id) => {
    const invoices = localStorageManager.getInvoices();
    return invoices.find(inv => inv.id === id);
  },

  getOutletById: (id) => {
    const outlets = localStorageManager.getOutlets();
    return outlets.find(outlet => outlet.id === id);
  },

  getProductById: (id) => {
    const inventory = localStorageManager.getInventory();
    return inventory.find(product => product.id === id);
  },

  // Filter methods
  getInvoicesByStatus: (status) => {
    const invoices = localStorageManager.getInvoices();
    return invoices.filter(inv => inv.status === status);
  },

  getInvoicesByOutlet: (outletId) => {
    const invoices = localStorageManager.getInvoices();
    return invoices.filter(inv => inv.outletId === outletId);
  },

  getInvoicesByDate: (date) => {
    const invoices = localStorageManager.getInvoices();
    return invoices.filter(inv => inv.date === date);
  },

  getInvoicesByDateRange: (startDate, endDate) => {
    const invoices = localStorageManager.getInvoices();
    return invoices.filter(inv => inv.date >= startDate && inv.date <= endDate);
  },

  getInvoicesByPaymentMethod: (method) => {
    const invoices = localStorageManager.getInvoices();
    return invoices.filter(inv => inv.payment === method);
  },

  // Outlet filters
  getActiveOutlets: () => {
    const outlets = localStorageManager.getOutlets();
    return outlets.filter(outlet => outlet.status === 'Active');
  },

  getOutletsWithWarning: () => {
    const outlets = localStorageManager.getOutlets();
    return outlets.filter(outlet => outlet.status === 'Warning');
  },

  getBlockedOutlets: () => {
    const outlets = localStorageManager.getOutlets();
    return outlets.filter(outlet => outlet.status === 'Blocked');
  },

  // Inventory filters
  getLowStockProducts: () => {
    const inventory = localStorageManager.getInventory();
    return inventory.filter(product => product.quantity < product.minStock);
  },

  getOutOfStockProducts: () => {
    const inventory = localStorageManager.getInventory();
    return inventory.filter(product => product.quantity === 0);
  },

  getProductsByCategory: (category) => {
    const inventory = localStorageManager.getInventory();
    return inventory.filter(product => product.category === category);
  },

  // Statistics and calculations
  getDashboardStats: () => {
    const inventory = localStorageManager.getInventory();
    const invoices = localStorageManager.getInvoices();
    const outlets = localStorageManager.getOutlets();
    
    const totalStockValue = inventory.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    const lowStockItems = inventory.filter(item => 
      item.quantity < item.minStock
    ).length;
    
    const pendingInvoices = invoices.filter(inv => 
      inv.status === 'Pending'
    ).length;
    
    const approvedInvoices = invoices.filter(inv => 
      inv.status === 'Approved'
    ).length;
    
    const rejectedInvoices = invoices.filter(inv => 
      inv.status === 'Rejected'
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
    
    const today = new Date().toISOString().split('T')[0];
    const todaySales = invoices
      .filter(inv => inv.status === 'Approved' && inv.date === today)
      .reduce((sum, inv) => sum + inv.total, 0);
    
    return {
      totalStockValue,
      lowStockItems,
      pendingInvoices,
      approvedInvoices,
      rejectedInvoices,
      activeOutlets,
      totalCredit,
      totalSales,
      todaySales
    };
  },

  getOutletStats: (outletId) => {
    const outlet = localStorageManager.getOutletById(outletId);
    const invoices = localStorageManager.getInvoicesByOutlet(outletId);
    
    const totalInvoices = invoices.length;
    const approvedInvoices = invoices.filter(inv => inv.status === 'Approved').length;
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pending').length;
    const totalPurchases = invoices
      .filter(inv => inv.status === 'Approved')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    return {
      outlet,
      totalInvoices,
      approvedInvoices,
      pendingInvoices,
      totalPurchases,
      currentDue: outlet?.currentDue || 0,
      creditLimit: outlet?.creditLimit || 0,
      creditUtilization: outlet ? (outlet.currentDue / outlet.creditLimit) * 100 : 0
    };
  },

  getProductStats: (productId) => {
    const product = localStorageManager.getProductById(productId);
    const invoices = localStorageManager.getInvoices();
    
    let totalSold = 0;
    let totalRevenue = 0;
    
    invoices.forEach(invoice => {
      if (invoice.status === 'Approved') {
        const item = invoice.items.find(item => item.productId === productId);
        if (item) {
          totalSold += item.quantity;
          totalRevenue += item.price * item.quantity;
        }
      }
    });
    
    return {
      product,
      totalSold,
      totalRevenue,
      currentStock: product?.quantity || 0,
      stockValue: product ? product.price * product.quantity : 0
    };
  },

  // Search functions
  searchProducts: (query) => {
    const inventory = localStorageManager.getInventory();
    const searchTerm = query.toLowerCase();
    return inventory.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku.toLowerCase().includes(searchTerm) ||
      (product.category && product.category.toLowerCase().includes(searchTerm)) ||
      (product.description && product.description.toLowerCase().includes(searchTerm))
    );
  },

  searchOutlets: (query) => {
    const outlets = localStorageManager.getOutlets();
    const searchTerm = query.toLowerCase();
    return outlets.filter(outlet => 
      outlet.name.toLowerCase().includes(searchTerm) ||
      outlet.type.toLowerCase().includes(searchTerm) ||
      outlet.id.toLowerCase().includes(searchTerm) ||
      (outlet.contactPerson && outlet.contactPerson.toLowerCase().includes(searchTerm))
    );
  },

  searchInvoices: (query) => {
    const invoices = localStorageManager.getInvoices();
    const searchTerm = query.toLowerCase();
    return invoices.filter(invoice => 
      invoice.id.toLowerCase().includes(searchTerm) ||
      invoice.outletName.toLowerCase().includes(searchTerm) ||
      invoice.outletId.toLowerCase().includes(searchTerm) ||
      (invoice.notes && invoice.notes.toLowerCase().includes(searchTerm))
    );
  },

  // Bulk operations
  bulkUpdateInventory: (updates) => {
    const inventory = localStorageManager.getInventory();
    const updated = inventory.map(item => {
      const update = updates.find(u => u.id === item.id);
      return update ? { ...item, ...update.changes } : item;
    });
    localStorageManager.setInventory(updated);
    return updated;
  },

  bulkUpdateOutlets: (updates) => {
    const outlets = localStorageManager.getOutlets();
    const updated = outlets.map(outlet => {
      const update = updates.find(u => u.id === outlet.id);
      return update ? { ...outlet, ...update.changes } : outlet;
    });
    localStorageManager.setOutlets(updated);
    return updated;
  },

  // Delete operations
  deleteInvoice: (invoiceId) => {
    const invoices = localStorageManager.getInvoices();
    const updated = invoices.filter(inv => inv.id !== invoiceId);
    localStorageManager.setInvoices(updated);
    return updated;
  },

  deleteProduct: (productId) => {
    const inventory = localStorageManager.getInventory();
    const updated = inventory.filter(product => product.id !== productId);
    localStorageManager.setInventory(updated);
    return updated;
  },

  // Clear all data
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    console.log('All localStorage data cleared');
  },

  // Reset to initial dummy data
  resetToDummyData: () => {
    localStorage.setItem(STORAGE_KEYS.MANAGER_DATA, JSON.stringify(dummyManagerData.manager));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(dummyInventory));
    localStorage.setItem(STORAGE_KEYS.OUTLETS, JSON.stringify(dummyOutlets));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(dummyInvoices));
    localStorage.setItem(STORAGE_KEYS.LOGIN_STATUS, 'false');
    console.log('Reset to initial dummy data');
  },

  // Export/Import data
  exportData: () => {
    return {
      managerData: localStorageManager.getManagerData(),
      inventory: localStorageManager.getInventory(),
      outlets: localStorageManager.getOutlets(),
      invoices: localStorageManager.getInvoices(),
      exportDate: new Date().toISOString()
    };
  },

  importData: (data) => {
    if (data.managerData) localStorageManager.setManagerData(data.managerData);
    if (data.inventory) localStorageManager.setInventory(data.inventory);
    if (data.outlets) localStorageManager.setOutlets(data.outlets);
    if (data.invoices) localStorageManager.setInvoices(data.invoices);
    console.log('Data imported successfully');
    return true;
  }
};