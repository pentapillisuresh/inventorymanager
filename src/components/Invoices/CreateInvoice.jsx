// src/components/Invoices/CreateInvoice.jsx
import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiX, FiSave } from 'react-icons/fi';
import { formatCurrency } from '../../utils/helpers';
import ApiService from '../../utils/ApiService';

const CreateInvoice = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [outlets, setOutlets] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    outletId: '',
    paymentMethod: 'paid',
    notes: '',
    items: []
  });

  // New item form state
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: 1,
    price: 0,
    boxNumber: 1,
    inventoryId: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientToken = localStorage.getItem('token');
  const storeId = localStorage.getItem('storeId');

  async function generateBatchNumber() {
    const now = new Date();

    // Format: dd/mm/yy
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);

    const date = `${day}/${month}/${year}`;


    return `${date}`;
  }

  const fetchOutlets = async () => {
    try {
      const response = await ApiService.get('/outlets', {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response;
    } catch (error) {
      console.error('Error fetching outlets:', error);
      throw error;
    }
  };

  const fetchInventoryList = async (storeId = 1) => {
    try {
      const response = await ApiService.get(`/inventory/store/${storeId}`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response;
    } catch (error) {
      console.error('Error fetching inventory list:', error);
      throw error;
    }
  };

  const createInvoice = async (outletId, invoiceData) => {
    try {
      const response = await ApiService.post(`/stores/${storeId}/outlets/${outletId}/invoices`, invoiceData, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [outletsData, inventoryData] = await Promise.all([
          fetchOutlets(),
          fetchInventoryList(storeId)
        ]);

        setOutlets(outletsData.outlets || []);
        setInventory(inventoryData || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        alert('Failed to load data. Please refresh the page.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const selectedOutlet = outlets.find(o => o.id === parseInt(formData.outletId));

  // Handle outlet change
  const handleOutletChange = (e) => {
    const outletId = e.target.value;
    setFormData({
      ...formData,
      outletId,
      items: [] // Reset items when outlet changes
    });
    setErrors({});
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const showSuccessPopup = (distributionData) => {
    console.log('Distribution Data:', distributionData);

    // Extract invoice and items from response
    const invoice = distributionData.invoice;
    const invoiceItems = distributionData.invoiceItems || [];

    // Calculate total amount
    const totalAmount = parseFloat(invoice.totalAmount) || 0;
    const paidAmount = parseFloat(invoice.paidAmount) || 0;
    const creditAmount = parseFloat(invoice.creditAmount) || 0;

    // Group products by boxName
    const groupedBoxes = invoiceItems.reduce((acc, item) => {
      const boxName = item.boxName || 'Unassigned';

      if (!acc[boxName]) {
        acc[boxName] = {
          products: [],
          total: 0
        };
      }

      // Calculate item total
      const itemTotal = parseFloat(item.totalPrice) || 0;

      acc[boxName].products.push({
        productName: item.Product?.name || 'Unknown Product',
        quantity: item.quantity,
        price: parseFloat(item.price) || 0,
        total: itemTotal,
        batchId: item.batchId,
        hsnNo: item.Product?.HSN_No || 'N/A'
      });

      acc[boxName].total += itemTotal;

      return acc;
    }, {});

    // Create popup
    const popupDiv = document.createElement('div');
    popupDiv.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] overflow-y-auto';

    popupDiv.innerHTML = `
      <div class="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-green-600">
              Invoice Created Successfully!
            </h2>
          </div>
  
          <button class="close-popup text-gray-400 hover:text-gray-600 text-2xl">
            &times;
          </button>
        </div>
  
        <div class="p-6">
  
          <!-- Invoice Summary -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 mb-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p class="text-sm text-gray-600">Invoice Number</p>
                <p class="text-2xl font-bold text-blue-800 font-mono">
                  ${invoice.invoiceNumber || 'N/A'}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Date: ${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleString() : 'N/A'}
                </p>
              </div>
  
              <div class="text-right">
                <p class="text-sm text-gray-600">Total Amount</p>
                <p class="text-3xl font-bold text-green-600">
                  ₹${totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
  
          <!-- Distribution Details -->
          <div class="mb-6">
            <h3 class="font-semibold text-gray-800 mb-3 border-b pb-2">
              Invoice Details
            </h3>
  
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p class="text-gray-500">Type:</p>
                <p class="font-medium capitalize">
                  ${invoice.type === 'outlet_sale' ? 'Outlet Sale' : invoice.type || 'N/A'}
                </p>
              </div>
  
              <div>
                <p class="text-gray-500">Payment Method:</p>
                <p class="font-medium capitalize">
                  ${invoice.paymentMethod || 'N/A'}
                </p>
              </div>
  
              <div>
                <p class="text-gray-500">Status:</p>
                <p class="font-medium">
                  <span class="px-2 py-1 rounded-full text-xs ${invoice.status === 'completed'
        ? 'bg-green-100 text-green-700'
        : invoice.status === 'pending'
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-700'
      }">
                    ${invoice.status || 'N/A'}
                  </span>
                </p>
              </div>
  
              <div>
                <p class="text-gray-500">Batch ID:</p>
                <p class="font-mono text-xs">
                  ${invoice.batchID || 'N/A'}
                </p>
              </div>
  
              ${paidAmount > 0 ? `
                <div>
                  <p class="text-gray-500">Paid Amount:</p>
                  <p class="font-medium text-green-600">
                    ₹${paidAmount.toFixed(2)}
                  </p>
                </div>
              ` : ''}
  
              ${creditAmount > 0 ? `
                <div>
                  <p class="text-gray-500">Credit Amount:</p>
                  <p class="font-medium text-blue-600">
                    ₹${creditAmount.toFixed(2)}
                  </p>
                </div>
              ` : ''}
            </div>
          </div>
  
          <!-- All Products Table -->
          <div class="mb-8">
            <h3 class="font-semibold text-gray-800 mb-3 border-b pb-2">
              Products Distributed
            </h3>
  
            <div class="overflow-x-auto border rounded-lg">
              <table class="w-full text-sm">
                
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">HSN</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Box</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
  
                <tbody>
                  ${invoiceItems.map((item) => `
                    <tr class="border-t border-gray-200 hover:bg-gray-50">
                      <td class="px-4 py-3">
                        <div>
                          <p class="font-medium">${item.Product?.name || 'Unknown'}</p>
                          <p class="text-xs text-gray-500">SKU: ${item.Product?.sku || 'N/A'}</p>
                        </div>
                      </td>
  
                      <td class="px-4 py-3 text-center">
                        ${item.Product?.HSN_No || 'N/A'}
                      </td>
  
                      <td class="px-4 py-3 text-center">
                        ${item.quantity}
                      </td>
  
                      <td class="px-4 py-3 text-right">
                        ₹${parseFloat(item.price).toFixed(2)}
                      </td>
  
                      <td class="px-4 py-3">
                        <span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          ${item.boxName || 'N/A'}
                        </span>
                      </td>
  
                      <td class="px-4 py-3 text-right font-medium">
                        ₹${parseFloat(item.totalPrice).toFixed(2)}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
  
                <tfoot class="bg-gray-50">
                  <tr>
                    <td colspan="5" class="px-4 py-3 text-right font-semibold">
                      Grand Total:
                    </td>
  
                    <td class="px-4 py-3 text-right font-bold text-green-700">
                      ₹${totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
  
              </table>
            </div>
          </div>
  
          <!-- BOXES SECTION - Grouped by Box -->
          ${Object.keys(groupedBoxes).length > 0 ? `
            <div class="mb-6">
              <h3 class="font-bold text-xl text-gray-800 mb-4 border-b pb-2">
                📦 Box Wise Distribution
              </h3>
  
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
  
                ${Object.entries(groupedBoxes).map(([boxName, boxData]) => `
                  <div class="border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <!-- Box Header -->
                    <div class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-3">
                      <div class="flex justify-between items-center">
                        <div>
                          <p class="text-xs opacity-80">Box Name</p>
                          <h4 class="font-semibold text-base font-mono">
                            ${boxName}
                          </h4>
                        </div>
                        <div class="text-right">
                          <p class="text-xs opacity-80">Total Items</p>
                          <p class="font-bold text-lg">
                            ${boxData.products.length}
                          </p>
                        </div>
                      </div>
                    </div>
  
                    <!-- Products in Box -->
                    <div class="p-4">
                      <table class="w-full text-sm">
                        <thead>
                          <tr class="border-b border-gray-200">
                            <th class="text-left py-2 text-xs font-medium text-gray-500">Product</th>
                            <th class="text-center py-2 text-xs font-medium text-gray-500">Qty</th>
                            <th class="text-right py-2 text-xs font-medium text-gray-500">Price</th>
                            <th class="text-right py-2 text-xs font-medium text-gray-500">Amount</th>
                          </tr>
                        </thead>
  
                        <tbody>
                          ${boxData.products.map((product) => `
                            <tr class="border-b border-gray-100">
                              <td class="py-2 text-sm">
                                ${product.productName}
                                <div class="text-xs text-gray-400">HSN: ${product.hsnNo}</div>
                              </td>
                              <td class="py-2 text-sm text-center">
                                ${product.quantity}
                              </td>
                              <td class="py-2 text-sm text-right">
                                ₹${product.price.toFixed(2)}
                              </td>
                              <td class="py-2 text-sm text-right font-medium">
                                ₹${product.total.toFixed(2)}
                              </td>
                            </tr>
                          `).join('')}
                        </tbody>
  
                        <tfoot>
                          <tr>
                            <td colspan="3" class="pt-3 text-right font-bold text-gray-700">
                              Box Total:
                            </td>
                            <td class="pt-3 text-right font-bold text-indigo-700">
                              ₹${boxData.total.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                `).join('')}
  
              </div>
            </div>
          ` : ''}
  
          <!-- Footer -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button class="close-popup bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
              Close
            </button>
          </div>
  
        </div>
      </div>
    `;

    document.body.appendChild(popupDiv);

    // Close handlers
    const closeButtons = popupDiv.querySelectorAll('.close-popup');

    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        popupDiv.remove();
      });
    });

    // Outside click close
    popupDiv.addEventListener('click', (e) => {
      if (e.target === popupDiv) {
        popupDiv.remove();
      }
    });
  };
  // Handle new item product selection
  const handleProductSelect = (e) => {
    const inventoryId = e.target.value;

    if (!inventoryId) {
      setNewItem({
        productId: '',
        inventoryId: '',
        quantity: 1,
        price: 0,
        boxNumber: 1
      });
      return;
    }

    const product = inventory.find(p => p.id === Number(inventoryId));

    if (product) {
      setNewItem({
        productId: product.productId,
        inventoryId: product.id,
        quantity: 1,
        price: parseFloat(product.Product?.price) || 0,
        boxNumber: 1
      });
    }
  };

  // Handle new item quantity change
  const handleQuantityChange = (e) => {
    const quantity = parseInt(e.target.value) || 1;
    const inventoryItem = inventory.find(p => p.id === newItem.inventoryId);

    if (inventoryItem) {
      const maxQuantity = inventoryItem.quantity;
      setNewItem({
        ...newItem,
        quantity: Math.min(Math.max(1, quantity), maxQuantity)
      });
    }
  };

  // Handle box number change for new item
  const handleBoxNumberChange = (e) => {
    const boxNumber = parseInt(e.target.value) || 1;
    setNewItem({
      ...newItem,
      boxNumber: Math.max(1, boxNumber)
    });
  };

  // Update item box number for existing items
  const updateItemBoxNumber = async (index, newBoxNumber) => {
    const item = formData.items[index];
    const updatedItems = [...formData.items];

    updatedItems[index] = {
      ...updatedItems[index],
      boxNumber: newBoxNumber,
      boxName: `BOX-${await generateBatchNumber()}-${newBoxNumber}`
    };

    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Add item to invoice
  const addItemToInvoice = async () => {
    // Validate item
    if (!newItem.productId) {
      alert('Please select a product');
      return;
    }

    const inventoryItem = inventory.find(p => p.id === newItem.inventoryId);
    const product = inventoryItem?.Product;

    if (!inventoryItem) {
      alert('Product not found');
      return;
    }

    // Check if product already exists in items
    const existingItemIndex = formData.items.findIndex(
      item => item.productId === newItem.productId
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...formData.items];
      const currentQuantity = updatedItems[existingItemIndex].quantity;
      const newQuantity = currentQuantity + newItem.quantity;

      if (newQuantity > inventoryItem.quantity) {
        alert(`Cannot add ${newItem.quantity} more. Only ${inventoryItem.quantity - currentQuantity} available.`);
        return;
      }

      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity,
        boxNumber: newItem.boxNumber,
        boxName: `BOX-${await generateBatchNumber()}-${newItem.boxNumber}`
      };

      setFormData({
        ...formData,
        items: updatedItems
      });
    } else {
      // Add new item
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            productId: newItem.productId,
            productName: product?.name || 'Unknown Product',
            sku: product?.sku || 'N/A',
            price: newItem.price,
            inventoryId: newItem.inventoryId,
            quantity: newItem.quantity,
            available: inventoryItem.quantity,
            unit: 'units',
            category: product?.Category?.name || 'Uncategorized',
            boxNumber: newItem.boxNumber,
            boxName: `BOX-${await generateBatchNumber()}-${newItem.boxNumber}`
          }
        ]
      });
    }

    // Reset new item form
    setNewItem({
      productId: '',
      quantity: 1,
      inventoryId: '',
      price: 0,
      boxNumber: 1
    });

    // Clear any items errors
    if (errors.items) {
      setErrors({ ...errors, items: null });
    }
  };


  // Update item quantity
  const updateItemQuantity = (index, newQuantity) => {
    const item = formData.items[index];
    const inventoryItem = inventory.find(p => p.id === item.inventoryId);

    if (!inventoryItem) return;

    newQuantity = Math.max(1, Math.min(newQuantity, inventoryItem.quantity));

    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: newQuantity
    };

    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Remove item from invoice
  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) =>
      total + (item.price * item.quantity), 0
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.outletId) {
      newErrors.outletId = 'Please select an outlet';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Please add at least one item';
    }

    // Check each item quantity against available stock
    for (const item of formData.items) {
      const inventoryItem = inventory.find(p => p.id === item.inventoryId);
      if (inventoryItem && item.quantity > inventoryItem.quantity) {
        newErrors.items = `Insufficient stock for ${item.productName}. Available: ${inventoryItem.quantity}`;
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare items for API
      const items = formData.items.map(item => ({
        productId: item.productId,
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        price: item.price,
        boxNumber: item.boxNumber,
        boxName: item.boxName
      }));

      // Create invoice
      const response = await createInvoice(formData.outletId, {
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        items: items,
      });

      if (response.message === 'Invoice created successfully') {
        alert(`Invoice ${response.invoice.invoiceNumber} created successfully!`);
        const salePDF = response;
        // Reset form
        setFormData({
          outletId: '',
          paymentMethod: 'paid',
          notes: '',
          items: []
        });

        setNewItem({
          productId: '',
          quantity: 1,
          inventoryId: '',
          price: 0,
          boxNumber: 1
        });

        setErrors({});
        showSuccessPopup(salePDF)
        // Refresh inventory list to update stock counts
        const updatedInventory = await fetchInventoryList(storeId);
        setInventory(updatedInventory);
      } else {
        throw new Error('Failed to create invoice');
      }

    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(error.message || 'Failed to create invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear the form?')) {
      setFormData({
        outletId: '',
        paymentMethod: 'paid',
        notes: '',
        items: []
      });
      setNewItem({
        productId: '',
        quantity: 1,
        inventoryId: '',
        price: 0,
        boxNumber: 1
      });
      setErrors({});
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
        <p className="text-gray-600">Fill in the details to create a new invoice</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Section - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Outlet Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Outlet Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Outlet <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="outletId"
                    value={formData.outletId}
                    onChange={handleOutletChange}
                    className={`input-field w-full ${errors.outletId ? 'border-red-500' : ''}`}
                  >
                    <option value="">-- Select an outlet --</option>
                    {outlets.map(outlet => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name} - {outlet.type} (Credit: {formatCurrency(parseFloat(outlet.creditLimit))})
                      </option>
                    ))}
                  </select>
                  {errors.outletId && (
                    <p className="mt-1 text-sm text-red-500">{errors.outletId}</p>
                  )}
                </div>

                {selectedOutlet && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Outlet Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Contact Person:</span>
                        <span className="ml-2 font-medium">{selectedOutlet.contactPerson || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="ml-2 font-medium">{selectedOutlet.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Address:</span>
                        <span className="ml-2 font-medium">{selectedOutlet.address || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Credit Limit:</span>
                        <span className="ml-2 font-medium text-green-600">{formatCurrency(parseFloat(selectedOutlet.creditLimit))}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Credit:</span>
                        <span className={`ml-2 font-medium ${parseFloat(selectedOutlet.currentCredit) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatCurrency(parseFloat(selectedOutlet.currentCredit))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Items Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Invoice Items</h2>

              {/* Add Item Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-3">Add New Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product
                    </label>
                    <select
                      value={newItem.inventoryId}
                      onChange={handleProductSelect}
                      className="input-field w-full"
                    >
                      <option value="">-- Select Product --</option>
                      {inventory
                        .filter(p => p.quantity > 0)
                        .map(item => (
                          <option key={item.id} value={item.id}>
                            {item.Product?.name} - {formatCurrency(parseFloat(item.Product?.price))} (Stock: {item.quantity})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={handleQuantityChange}
                      disabled={!newItem.productId}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Box Number</label>
                    <input
                      type="number"
                      min="1"
                      value={newItem.boxNumber}
                      onChange={handleBoxNumberChange}
                      disabled={!newItem.productId}
                      className="input-field w-full"
                      placeholder="Box #"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addItemToInvoice}
                      disabled={!newItem.productId}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <FiPlus />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>

                {newItem.productId && (
                  <p className="mt-2 text-sm text-gray-600">
                    Price: {formatCurrency(newItem.price)} |
                    Total: {formatCurrency(newItem.price * newItem.quantity)} |
                    Box: {newItem.boxNumber}
                  </p>
                )}
              </div>

              {/* Items List */}
              {formData.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Box #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={item.available}
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                className="w-16 text-center border rounded py-1"
                              />
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
                                disabled={item.quantity >= item.available}
                              >
                                +
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Available: {item.available}</p>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.boxNumber}
                              onChange={(e) => updateItemBoxNumber(index, parseInt(e.target.value) || 1)}
                              className="w-20 text-center border rounded py-1"
                            />
                          </td>

                          <td className="px-4 py-3 font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No items added yet</p>
                </div>
              )}

              {errors.items && (
                <p className="mt-2 text-sm text-red-500">{errors.items}</p>
              )}
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Additional Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes or comments..."
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>

          {/* Summary Section - 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Invoice Summary</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  >
                    <option value="paid">Paid</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-primary-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Summary</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-medium">{formData.items.length}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Total Quantity:</span>
                      <span className="font-medium">
                        {formData.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Unique Boxes:</span>
                      <span className="font-medium">
                        {new Set(formData.items.map(item => item.boxNumber)).size}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Form Actions */}
                <div className="space-y-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <FiSave />
                        <span>Create Invoice</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-secondary w-full flex items-center justify-center space-x-2 py-3"
                  >
                    <FiX />
                    <span>Reset Form</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;