// src/components/Outlets/OutletList.jsx
import React, { useState } from 'react';
import { FiSearch, FiFilter, FiEye, FiDollarSign, FiPhone, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { formatCurrency, getStatusColor } from '../../utils/helpers';

const OutletList = ({ outlets, onView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const types = ['all', ...new Set(outlets.map(outlet => outlet.type))];
  const statuses = ['all', ...new Set(outlets.map(outlet => outlet.status))];

  const filteredOutlets = outlets
    .filter(outlet => {
      const matchesSearch = outlet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           outlet.phone.includes(searchTerm);
      const matchesType = filterType === 'all' || outlet.type === filterType;
      const matchesStatus = filterStatus === 'all' || outlet.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => b.currentDue - a.currentDue);

  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'active': return <FiCheckCircle className="text-green-500" />;
      case 'blocked': return <FiXCircle className="text-red-500" />;
      case 'warning': return <FiCheckCircle className="text-yellow-500" />;
      default: return <FiCheckCircle className="text-gray-500" />;
    }
  };

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Outlet Management</h2>
          <p className="text-gray-600">{outlets.length} total outlets</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search outlets..."
              className="pl-10 input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="input-field"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {types.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
          
          <select
            className="input-field"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOutlets.map((outlet) => (
          <div key={outlet.id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">{outlet.name}</h3>
                <p className="text-gray-600 text-sm">{outlet.type} Outlet</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(outlet.status)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(outlet.status)}`}>
                  {outlet.status}
                </span>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-2">
                <FiPhone className="text-gray-400" />
                <span>{outlet.phone}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <FiDollarSign className="text-gray-400" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Credit Limit:</span>
                    <span className="font-medium">{formatCurrency(outlet.creditLimit)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Due:</span>
                    <span className={`font-medium ${
                      outlet.currentDue > outlet.creditLimit * 0.8 
                        ? 'text-red-600' 
                        : outlet.currentDue > 0 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                    }`}>
                      {formatCurrency(outlet.currentDue)}
                    </span>
                  </div>
                  
                  {/* Credit Usage Bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Credit Usage</span>
                      <span>{Math.round((outlet.currentDue / outlet.creditLimit) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          outlet.currentDue > outlet.creditLimit 
                            ? 'bg-red-500' 
                            : outlet.currentDue > outlet.creditLimit * 0.8 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((outlet.currentDue / outlet.creditLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => onView(outlet)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                View Details →
              </button>
              
              <span className={`text-xs px-2 py-1 rounded ${
                outlet.status === 'Blocked' 
                  ? 'bg-red-100 text-red-800' 
                  : outlet.status === 'Warning'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {outlet.status === 'Blocked' ? 'Cannot Order' : 'Can Order'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredOutlets.length === 0 && (
        <div className="text-center py-12">
          <FiEye className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-500">No outlets found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default OutletList;