// src/components/Invoices/CreateInvoice.jsx
import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { localStorageManager } from '../../utils/localStorage';
import { formatCurrency } from '../../utils/helpers';

const CreateInvoice = () => {
  const inventory = localStorageManager.getInventory();
  const outlets = localStorageManager.getOutlets();
  
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit');
  const [notes, setNotes] = useState('');

  const availableOutlets = outlets.filter(outlet => outlet.status !== 'Blocked');

  const filteredProducts = inventory.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const addItemToInvoice = (product) => {
    const existingItem = invoiceItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setInvoiceItems(invoiceItems.map(item =>
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setInvoiceItems([...invoiceItems, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: 1,
        available: product.quantity
      }]);
    }
    
    setSearchProduct('');
  };

  const updateItemQuantity = (id, newQuantity) => {
    const product = inventory.find(p => p.id === id);
    if (!product) return;
    
    newQuantity = Math.max(0, Math.min(newQuantity, product.quantity));
    
    setInvoiceItems(invoiceItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = (id) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmitInvoice = () => {
    if (!selectedOutlet) {
      alert('Please select an outlet');
      return;
    }

    if (invoiceItems.length === 0) {
      alert('Please add at least one item to the invoice');
      return;
    }

    const selectedOutletData = outlets.find(o => o.id === selectedOutlet);
    const totalAmount = calculateTotal();
    const newDue = selectedOutletData.currentDue + totalAmount;

    // Check credit limit
    if (paymentMethod === 'Credit' && newDue > selectedOutletData.creditLimit) {
      alert(`This invoice will exceed the outlet's credit limit of ${formatCurrency(selectedOutletData.creditLimit)}. Current due: ${formatCurrency(selectedOutletData.currentDue)}. Invoice total: ${formatCurrency(totalAmount)}`);
      return;
    }

    // Create invoice
    const newInvoice = {
      outletId: selectedOutlet,
      outletName: selectedOutletData.name,
      date: new Date().toISOString().split('T')[0],
      total: totalAmount,
      status: 'Pending',
      payment: paymentMethod,
      items: invoiceItems,
      notes: notes
    };

    // Add to localStorage
    const addedInvoice = localStorageManager.addInvoice(newInvoice);
    
    // Update outlet due if credit
    if (paymentMethod === 'Credit') {
      localStorageManager.updateOutletDue(selectedOutlet, totalAmount);
    }

    // Update inventory quantities
    invoiceItems.forEach(item => {
      localStorageManager.updateInventoryItem(item.id, {
        quantity: inventory.find(p => p.id === item.id).quantity - item.quantity
      });
    });

    alert(`Invoice ${addedInvoice.id} created successfully and sent for admin approval!`);
    
    // Reset form
    setSelectedOutlet('');
    setInvoiceItems([]);
    setPaymentMethod('Credit');
    setNotes('');
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Create New Invoice</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Outlet & Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Outlet Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Outlet *</label>
            <select
              className="input-field"
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
            >
              <option value="">Choose an outlet</option>
              {availableOutlets.map(outlet => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name} ({outlet.type}) - Credit Limit: {formatCurrency(outlet.creditLimit)}, Due: {formatCurrency(outlet.currentDue)}
                </option>
              ))}
            </select>
          </div>

          {/* Product Search */}
          <div>
            <label className="block text-sm font-medium mb-2">Search Products</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or SKU..."
                className="input-field"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
              />
              
              {/* Product Suggestions */}
              {searchProduct && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addItemToInvoice(product)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">SKU: {product.sku} | Stock: {product.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(product.price)}</p>
                          <FiPlus className="ml-2 text-primary-600" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Invoice Items Table */}
          {invoiceItems.length > 0 && (
            <div className="border rounded-lg">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-bold">Invoice Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">Price</th>
                      <th className="text-left py-3 px-4">Quantity</th>
                      <th className="text-left py-3 px-4">Total</th>
                      <th className="text-left py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatCurrency(item.price)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center border rounded"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={item.available}
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center border rounded py-1"
                            />
                            <button
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center border rounded"
                              disabled={item.quantity >= item.available}
                            >
                              +
                            </button>
                            <span className="text-sm text-gray-600">
                              of {item.available}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Invoice Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
            <h3 className="font-bold text-lg mb-4">Invoice Summary</h3>
            
            {/* Selected Outlet Info */}
            {selectedOutlet && (
              <div className="mb-6 p-4 bg-white rounded-lg">
                <h4 className="font-medium mb-2">Outlet Details</h4>
                <p className="text-sm">
                  {outlets.find(o => o.id === selectedOutlet)?.name}
                </p>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-600">Credit Limit:</span>
                  <span className="font-medium">
                    {formatCurrency(outlets.find(o => o.id === selectedOutlet)?.creditLimit)}
                  </span>
                </div>
                <div className="flex justify-between mt-1 text-sm">
                  <span className="text-gray-600">Current Due:</span>
                  <span className="font-medium">
                    {formatCurrency(outlets.find(o => o.id === selectedOutlet)?.currentDue)}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Payment Method *</label>
              <select
                className="input-field"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Credit">Credit</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
              </select>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                className="input-field"
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for this invoice..."
              />
            </div>

            {/* Total */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSubmitInvoice}
                className="btn-primary w-full flex items-center justify-center space-x-2"
                disabled={!selectedOutlet || invoiceItems.length === 0}
              >
                <FiCheck />
                <span>Submit for Approval</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedOutlet('');
                  setInvoiceItems([]);
                  setNotes('');
                }}
                className="btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <FiX />
                <span>Clear Form</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;