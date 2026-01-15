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
    return updated;
  },

  addInvoice: (invoice) => {
    const invoices = localStorageManager.getInvoices();
    const newInvoice = { 
      ...invoice, 
      id: `INV${String(invoices.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0]
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
    return updated;
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
    return updated;
  },

  // Helper to get dashboard stats
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
  }
};