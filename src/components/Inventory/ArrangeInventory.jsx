// src/components/Inventory/ArrangeInventory.jsx
import React, { useState } from 'react';
import { FiMapPin, FiSave, FiRefreshCw } from 'react-icons/fi';
import { localStorageManager } from '../../utils/localStorage';

const ArrangeInventory = () => {
  const inventory = localStorageManager.getInventory();
  const [arrangements, setArrangements] = useState(inventory);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);

  const rooms = ['Room A', 'Room B', 'Room C', 'Freezer Room', 'Storage Room'];
  const racks = ['R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07', 'R08'];
  const freezers = ['F01', 'F02', 'F03', 'F04'];

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setEditedProduct({ ...product });
  };

  const handleUpdateArrangement = () => {
    if (!editedProduct) return;

    const updated = arrangements.map(item =>
      item.id === editedProduct.id ? editedProduct : item
    );
    
    setArrangements(updated);
    setSelectedProduct(editedProduct);
    
    // Update localStorage
    localStorageManager.updateInventoryItem(editedProduct.id, {
      room: editedProduct.room,
      rack: editedProduct.rack,
      freezer: editedProduct.freezer
    });
  };

  const handleSaveAll = () => {
    localStorageManager.setInventory(arrangements);
    alert('All arrangements saved successfully!');
  };

  const handleReset = () => {
    setArrangements(inventory);
    setSelectedProduct(null);
    setEditedProduct(null);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <FiMapPin />
            <span>Arrange Inventory</span>
          </h2>
          <p className="text-gray-600">Assign products to rooms, racks, and freezers</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center space-x-2"
          >
            <FiRefreshCw />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="btn-primary flex items-center space-x-2"
          >
            <FiSave />
            <span>Save All Arrangements</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold mb-4">Select Product</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {arrangements.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedProduct?.id === product.id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">Qty: {product.quantity} {product.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{product.category}</p>
                      <p className="text-xs text-gray-600">
                        {product.room || 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Arrangement Controls */}
        <div className="lg:col-span-2">
          {selectedProduct ? (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                  <p className="text-gray-600">SKU: {selectedProduct.sku}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {selectedProduct.category}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Room Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Room</label>
                  <select
                    className="input-field"
                    value={editedProduct?.room || ''}
                    onChange={(e) => setEditedProduct({...editedProduct, room: e.target.value})}
                  >
                    <option value="">Select Room</option>
                    {rooms.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>

                {/* Rack Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Rack</label>
                  <select
                    className="input-field"
                    value={editedProduct?.rack || ''}
                    onChange={(e) => setEditedProduct({...editedProduct, rack: e.target.value})}
                    disabled={!editedProduct?.room || editedProduct?.room === 'Freezer Room'}
                  >
                    <option value="">Select Rack</option>
                    {racks.map(rack => (
                      <option key={rack} value={rack}>{rack}</option>
                    ))}
                  </select>
                </div>

                {/* Freezer Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Freezer</label>
                  <select
                    className="input-field"
                    value={editedProduct?.freezer || ''}
                    onChange={(e) => setEditedProduct({...editedProduct, freezer: e.target.value})}
                    disabled={editedProduct?.room !== 'Freezer Room'}
                  >
                    <option value="">Select Freezer</option>
                    {freezers.map(freezer => (
                      <option key={freezer} value={freezer}>{freezer}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Current Arrangement */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Current Arrangement</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded">
                    <p className="text-sm text-gray-600">Room</p>
                    <p className="font-medium">{selectedProduct.room || 'Not set'}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded">
                    <p className="text-sm text-gray-600">Rack</p>
                    <p className="font-medium">{selectedProduct.rack || 'Not set'}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded">
                    <p className="text-sm text-gray-600">Freezer</p>
                    <p className="font-medium">{selectedProduct.freezer || 'Not set'}</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6">
                <button
                  onClick={handleUpdateArrangement}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                  disabled={
                    editedProduct?.room === selectedProduct?.room &&
                    editedProduct?.rack === selectedProduct?.rack &&
                    editedProduct?.freezer === selectedProduct?.freezer
                  }
                >
                  <FiSave />
                  <span>Update Arrangement</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FiMapPin className="mx-auto text-4xl text-gray-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Select a Product</h3>
              <p className="text-gray-600">Choose a product from the list to arrange it in your store</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArrangeInventory;