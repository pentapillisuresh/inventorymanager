// src/components/Invoices/CreateInvoice.jsx
import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiCheck, FiX, FiSave } from 'react-icons/fi';
import { localStorageManager } from '../../utils/localStorage';
import { formatCurrency } from '../../utils/helpers';

const CreateInvoice = () => {
  const inventory = localStorageManager.getInventory();
  const outlets = localStorageManager.getOutlets();
  
  // Form state
  const [formData, setFormData] = useState({
    outletId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Credit',
    notes: '',
    items: []
  });

  // New item form state
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: 1,
    price: 0
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableOutlets = outlets.filter(outlet => outlet.status !== 'Blocked');
  const selectedOutlet = outlets.find(o => o.id === formData.outletId);

  // Handle outlet change
  const handleOutletChange = (e) => {
    const outletId = e.target.value;
    setFormData({
      ...formData,
      outletId,
      items: [] // Reset items when outlet changes
    });
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
    const productId = e.target.value;
    if (!productId) {
      setNewItem({ productId: '', quantity: 1, price: 0 });
      return;
    }
    
    const product = inventory.find(p => p.id === productId);
    setNewItem({
      productId,
      quantity: 1,
      price: product.price
    });
  };

  // Handle new item quantity change
  const handleQuantityChange = (e) => {
    const quantity = parseInt(e.target.value) || 1;
    const product = inventory.find(p => p.id === newItem.productId);
    
    if (product) {
      setNewItem({
        ...newItem,
        quantity: Math.min(Math.max(1, quantity), product.quantity)
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

    const product = inventory.find(p => p.id === newItem.productId);
    
    // Check if product already exists in items
    const existingItemIndex = formData.items.findIndex(
      item => item.productId === newItem.productId
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...formData.items];
      const currentQuantity = updatedItems[existingItemIndex].quantity;
      const newQuantity = currentQuantity + newItem.quantity;
      
      if (newQuantity > product.quantity) {
        alert(`Cannot add ${newItem.quantity} more. Only ${product.quantity - currentQuantity} available.`);
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
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            price: product.price,
            quantity: newItem.quantity,
            available: product.quantity,
            unit: product.unit || 'pcs',
            category: product.category
          }
        ]
      });
    }

    // Reset new item form
    setNewItem({
      productId: '',
      quantity: 1,
      price: 0
    });
  };

  // Update item quantity
  const updateItemQuantity = (index, newQuantity) => {
    const item = formData.items[index];
    const product = inventory.find(p => p.id === item.productId);
    
    if (!product) return;
    
    newQuantity = Math.max(1, Math.min(newQuantity, product.quantity));
    
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

  const calculateTax = () => {
    // Assuming 10% tax
    return calculateSubtotal() * 0.1;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.outletId) {
      newErrors.outletId = 'Please select an outlet';
    }

    if (!formData.invoiceDate) {
      newErrors.invoiceDate = 'Please select invoice date';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Please add at least one item';
    }

    // Check credit limit if payment is Credit
    if (formData.paymentMethod === 'Credit' && selectedOutlet) {
      const totalAmount = calculateTotal();
      const newDue = selectedOutlet.currentDue + totalAmount;
      
      if (newDue > selectedOutlet.creditLimit) {
        newErrors.creditLimit = `Invoice total (${formatCurrency(totalAmount)}) will exceed credit limit of ${formatCurrency(selectedOutlet.creditLimit)}. Current due: ${formatCurrency(selectedOutlet.currentDue)}`;
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
      const selectedOutletData = outlets.find(o => o.id === formData.outletId);

      // Create invoice object
      const newInvoice = {
        outletId: formData.outletId,
        outletName: selectedOutletData.name,
        date: formData.invoiceDate,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: totalAmount,
        status: 'Pending',
        payment: formData.paymentMethod,
        items: formData.items.map(item => ({
          ...item,
          total: item.price * item.quantity
        })),
        notes: formData.notes,
        createdBy: localStorageManager.getManagerData()?.name || 'Manager',
        createdAt: new Date().toISOString()
      };

      // Save to localStorage
      const addedInvoice = localStorageManager.addInvoice(newInvoice);
      
      // Update outlet due if credit
      if (formData.paymentMethod === 'Credit') {
        localStorageManager.updateOutletDue(formData.outletId, totalAmount);
      }

      // Update inventory quantities
      formData.items.forEach(item => {
        const product = inventory.find(p => p.id === item.productId);
        if (product) {
          localStorageManager.updateInventoryItem(item.productId, {
            quantity: product.quantity - item.quantity
          });
        }
      });

      alert(`Invoice ${addedInvoice.id} created successfully!`);
      
      // Reset form
      setFormData({
        outletId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Credit',
        notes: '',
        items: []
      });
      
      setNewItem({
        productId: '',
        quantity: 1,
        price: 0
      });
      
      setErrors({});
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear the form?')) {
      setFormData({
        outletId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Credit',
        notes: '',
        items: []
      });
      setNewItem({
        productId: '',
        quantity: 1,
        price: 0
      });
      setErrors({});
    }
  };

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
                    {availableOutlets.map(outlet => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name} - {outlet.type} (Credit: {formatCurrency(outlet.creditLimit)})
                      </option>
                    ))}
                  </select>
                  {errors.outletId && (
                    <p className="mt-1 text-sm text-red-500">{errors.outletId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="invoiceDate"
                    value={formData.invoiceDate}
                    onChange={handleInputChange}
                    className={`input-field w-full ${errors.invoiceDate ? 'border-red-500' : ''}`}
                  />
                  {errors.invoiceDate && (
                    <p className="mt-1 text-sm text-red-500">{errors.invoiceDate}</p>
                  )}
                </div>

                {selectedOutlet && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Outlet Credit Status</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Credit Limit:</span>
                        <span className="ml-2 font-medium">{formatCurrency(selectedOutlet.creditLimit)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Due:</span>
                        <span className="ml-2 font-medium text-orange-600">{formatCurrency(selectedOutlet.currentDue)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Available Credit:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {formatCurrency(selectedOutlet.creditLimit - selectedOutlet.currentDue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-2 font-medium ${
                          selectedOutlet.status === 'Active' ? 'text-green-600' :
                          selectedOutlet.status === 'Warning' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {selectedOutlet.status}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                    <select
                      value={newItem.productId}
                      onChange={handleProductSelect}
                      className="input-field w-full"
                    >
                      <option value="">-- Select Product --</option>
                      {inventory
                        .filter(p => p.quantity > 0)
                        .map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {formatCurrency(product.price)} (Stock: {product.quantity})
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
                    <option value="Credit">Credit</option>
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                {errors.creditLimit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{errors.creditLimit}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (10%):</span>
                      <span>{formatCurrency(calculateTax())}</span>
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