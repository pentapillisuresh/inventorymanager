export const dummyManagerData = {
  manager: {
    id: "M001",
    name: "John Manager",
    email: "manager@store.com",
    storeId: "ST001",
    storeName: "Main Store Downtown",
    location: "123 Main Street",
    phone: "+1 234-567-8900",
    joinedDate: "2024-01-15"
  },
  
  store: {
    id: "ST001",
    name: "Main Store Downtown",
    location: "Downtown Plaza",
    capacity: 5000,
    status: "Active",
    rooms: 5,
    racks: 50,
    freezers: 10
  }
};

export const dummyInventory = [
  { id: "P001", name: "Premium Rice 5kg", sku: "RIC001", category: "Grains", price: 25.99, quantity: 150, unit: "bags", rack: "R01", room: "Room A", minStock: 50 },
  { id: "P002", name: "Organic Flour 2kg", sku: "FLO001", category: "Grains", price: 8.99, quantity: 200, unit: "bags", rack: "R02", room: "Room A", minStock: 80 },
  { id: "P003", name: "Virgin Olive Oil 1L", sku: "OIL001", category: "Oils", price: 18.50, quantity: 85, unit: "bottles", rack: "R03", room: "Room B", minStock: 40 },
  { id: "P004", name: "Canned Tomatoes 400g", sku: "CAN001", category: "Canned Goods", price: 2.99, quantity: 300, unit: "cans", rack: "R04", room: "Room C", minStock: 100 },
  { id: "P005", name: "Pasta 500g", sku: "PAS001", category: "Grains", price: 3.49, quantity: 180, unit: "packs", rack: "R05", room: "Room A", minStock: 60 },
  { id: "P006", name: "Frozen Chicken 1kg", sku: "CHK001", category: "Frozen", price: 12.99, quantity: 75, unit: "packs", freezer: "F01", room: "Freezer Room", minStock: 30 },
  { id: "P007", name: "Ice Cream 1L", sku: "ICE001", category: "Frozen", price: 6.99, quantity: 120, unit: "tubs", freezer: "F02", room: "Freezer Room", minStock: 50 },
];

export const dummyOutlets = [
  { id: "OUT001", name: "Downtown Supermarket", type: "Official", phone: "+1 234-567-8901", creditLimit: 5000, currentDue: 1250, status: "Active" },
  { id: "OUT002", name: "Westside Grocery", type: "Official", phone: "+1 234-567-8902", creditLimit: 3000, currentDue: 0, status: "Active" },
  { id: "OUT003", name: "Express Mart", type: "Dummy", phone: "+1 234-567-8903", creditLimit: 2000, currentDue: 2100, status: "Blocked" },
  { id: "OUT004", name: "24/7 Convenience", type: "Official", phone: "+1 234-567-8904", creditLimit: 4000, currentDue: 3800, status: "Warning" },
];

export const dummyInvoices = [
  { id: "INV001", outletId: "OUT001", outletName: "Downtown Supermarket", date: "2024-03-15", total: 1250.75, status: "Approved", payment: "Credit", dueDate: "2024-04-15" },
  { id: "INV002", outletId: "OUT002", outletName: "Westside Grocery", date: "2024-03-14", total: 890.50, status: "Pending", payment: "Pending" },
  { id: "INV003", outletId: "OUT003", outletName: "Express Mart", date: "2024-03-13", total: 2100.00, status: "Rejected", payment: "Credit", reason: "Credit limit exceeded" },
  { id: "INV004", outletId: "OUT001", outletName: "Downtown Supermarket", date: "2024-03-12", total: 650.25, status: "Approved", payment: "Paid" },
  { id: "INV005", outletId: "OUT004", outletName: "24/7 Convenience", date: "2024-03-11", total: 3800.00, status: "Approved", payment: "Credit", dueDate: "2024-03-25" },
];

export const initialDummyData = {
  manager: dummyManagerData.manager,
  store: dummyManagerData.store,
  inventory: dummyInventory,
  outlets: dummyOutlets,
  invoices: dummyInvoices,
  loginStatus: false
};