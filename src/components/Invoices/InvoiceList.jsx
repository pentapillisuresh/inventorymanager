// src/components/Invoices/InvoiceList.jsx
import React, { useState } from 'react';
import { FiSearch, FiFilter, FiEye, FiFileText, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { formatCurrency, getStatusColor } from '../../utils/helpers';

const InvoiceList = ({ invoices, onView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const statuses = ['all', 'pending', 'approved', 'rejected', 'paid'];

  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.outletName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
                           invoice.status.toLowerCase() === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'approved': return <FiCheckCircle className="text-green-500" />;
      case 'pending': return <FiFileText className="text-yellow-500" />;
      case 'rejected': return <FiXCircle className="text-red-500" />;
      default: return <FiFileText className="text-gray-500" />;
    }
  };

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-gray-600">{invoices.length} total invoices</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              className="pl-10 input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="input-field"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Invoice ID</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Outlet</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Total Amount</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Payment</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(invoice.status)}
                    <span className="font-medium">{invoice.id}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium">{invoice.outletName}</p>
                    <p className="text-sm text-gray-600">ID: {invoice.outletId}</p>
                  </div>
                </td>
                <td className="py-4 px-4">{invoice.date}</td>
                <td className="py-4 px-4 font-semibold">
                  {formatCurrency(invoice.total)}
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    invoice.payment === 'Paid' 
                      ? 'bg-green-100 text-green-800'
                      : invoice.payment === 'Credit'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.payment}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                  {invoice.reason && (
                    <p className="text-xs text-gray-600 mt-1">{invoice.reason}</p>
                  )}
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => onView(invoice)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                    title="View Details"
                  >
                    <FiEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <FiFileText className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-500">No invoices found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;