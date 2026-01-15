// src/components/Inventory/InventoryTable.jsx
import React, { useState } from 'react';
import { FiSearch, FiFilter, FiEdit2, FiEye } from 'react-icons/fi';
import { formatCurrency } from '../../utils/helpers';

const InventoryTable = ({ inventory, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const categories = ['all', ...new Set(inventory.map(item => item.category))];

  const filteredInventory = inventory
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'quantity') return a.quantity - b.quantity;
      if (sortBy === 'price') return a.price - b.price;
      return 0;
    });

  const getStockLevelColor = (quantity, minStock) => {
    const percentage = (quantity / minStock) * 100;
    if (percentage < 50) return 'bg-red-100 text-red-800';
    if (percentage < 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-gray-600">Total {inventory.length} items in stock</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="input-field"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">
                <button 
                  onClick={() => setSortBy('name')}
                  className="flex items-center font-medium text-gray-600"
                >
                  Product Name
                  <FiFilter className="ml-1" />
                </button>
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">SKU</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
              <th className="text-left py-3 px-4">
                <button 
                  onClick={() => setSortBy('quantity')}
                  className="flex items-center font-medium text-gray-600"
                >
                  Quantity
                  <FiFilter className="ml-1" />
                </button>
              </th>
              <th className="text-left py-3 px-4">
                <button 
                  onClick={() => setSortBy('price')}
                  className="flex items-center font-medium text-gray-600"
                >
                  Price
                  <FiFilter className="ml-1" />
                </button>
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Location</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">ID: {item.id}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                    {item.sku}
                  </span>
                </td>
                <td className="py-4 px-4">{item.category}</td>
                <td className="py-4 px-4">
                  <div>
                    <span className="font-medium">{item.quantity} {item.unit}</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            item.quantity < item.minStock ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((item.quantity / item.minStock) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStockLevelColor(item.quantity, item.minStock)}`}>
                        Min: {item.minStock}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 font-semibold">
                  {formatCurrency(item.price)}
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm">
                    {item.room && <p>Room: {item.room}</p>}
                    {item.rack && <p>Rack: {item.rack}</p>}
                    {item.freezer && <p>Freezer: {item.freezer}</p>}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="View Details"
                    >
                      <FiEye />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;