// src/components/Invoices/CreateInvoice.jsx
import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCheck, FiX, FiSave } from 'react-icons/fi';
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
    inventoryId: ''

  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientToken = localStorage.getItem('token');
  const storeId = localStorage.getItem('storeId');
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
      const response = await ApiService.post(`/stores/1/outlets/${outletId}/invoices`, invoiceData, {
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
          fetchInventoryList()
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

  // Handle new item product selection
  const handleProductSelect = (e) => {
    const inventoryId = e.target.value;

    if (!inventoryId) {
      setNewItem({
        productId: '',
        inventoryId: '',
        quantity: 1,
        price: 0
      });
      return;
    }

    const product = inventory.find(p => p.id === Number(inventoryId));

    if (product) {
      setNewItem({
        productId: product.productId,
        inventoryId: product.id,
        quantity: 1,
        price: parseFloat(product.Product?.price) || 0
      });
    }
  };
  // Handle new item quantity change
  const handleQuantityChange = (e) => {
    const quantity = parseInt(e.target.value) || 1;
    const inventoryItem = inventory.find(p => p.productId === newItem.productId);

    if (inventoryItem) {
      setNewItem({
        ...newItem,
        quantity: Math.min(Math.max(1, quantity), inventoryItem.quantity)
      });
    }
  };

  // Add item to invoice
  const addItemToInvoice = () => {
    // Validate item
    if (!newItem.productId) {
      alert('Please select a product');
      return;
    }

    const inventoryItem = inventory.find(p => p.productId === newItem.productId);
    const product = inventoryItem?.Product;

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
        quantity: newQuantity
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
            id: newItem.inventoryId,
            quantity: newItem.quantity,
            available: inventoryItem.quantity,
            unit: 'units',
            category: product?.Category?.name || 'Uncategorized'
          }
        ]
      });
    }

    // Reset new item form
    setNewItem({
      productId: '',
      quantity: 1,
      inventoryId: '',
      price: 0
    });

    // Clear any items errors
    if (errors.items) {
      setErrors({ ...errors, items: null });
    }
  };

  // Update item quantity
  const updateItemQuantity = (index, newQuantity) => {
    const item = formData.items[index];
    const inventoryItem = inventory.find(p => p.productId === item.productId);

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
      const inventoryItem = inventory.find(p => p.productId === item.productId);
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
      const totalAmount = calculateTotal();
      console.log("rrr::", formData.items)
      // Prepare items for API
      const items = formData.items.map(item => ({
        productId: item.productId,
        inventoryId: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      console.log("items:::", items)
      // Create invoice
      const response = await createInvoice(formData.outletId, {
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        items: items,
      });

      if (response.message === 'Invoice created successfully') {
        alert(`Invoice ${response.invoice.invoiceNumber} created successfully!`);

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
          price: 0
        });

        setErrors({});

        // Refresh inventory list to update stock counts
        const updatedInventory = await fetchInventoryList();
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
        price: 0
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    Total: {formatCurrency(newItem.price * newItem.quantity)}
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
                                className="w-6 h-6 flex items-center justify-center border rounded"
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
                                className="w-6 h-6 flex items-center justify-center border rounded"
                                disabled={item.quantity >= item.available}
                              >
                                +
                              </button>
                            </div>
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