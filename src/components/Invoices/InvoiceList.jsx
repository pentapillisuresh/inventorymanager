// src/components/Invoices/InvoiceList.jsx
import React, { useState } from 'react';
import { FiSearch, FiFilter, FiEye, FiFileText, FiCheckCircle, FiXCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { formatCurrency, getStatusColor } from '../../utils/helpers';

const InvoiceList = ({ invoices, pagination, onPageChange, onView, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const statuses = ['all', 'pending', 'completed', 'cancelled'];

  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = 
        (invoice.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.outlet?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.id?.toString() || '').includes(searchTerm);
      const matchesStatus = filterStatus === 'all' || 
                           (invoice.status || '').toLowerCase() === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return <FiCheckCircle className="text-green-500" />;
      case 'pending': return <FiFileText className="text-yellow-500" />;
      case 'cancelled': return <FiXCircle className="text-red-500" />;
      default: return <FiFileText className="text-gray-500" />;
    }
  };

  const { currentPage = 1, totalPages = 0, total = 0 } = pagination;
  const startItem = (currentPage - 1) * 10 + 1;
  const endItem = Math.min(currentPage * 10, total);

  if (loading && invoices.length === 0) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-gray-600">{total} total invoices</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, number or outlet..."
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
              <th className="text-left py-3 px-4 font-medium text-gray-600">Invoice Number</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Outlet</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Total Amount</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Payment Method</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onView(invoice)}>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(invoice.status)}
                    <span className="font-medium">#{invoice.id}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="font-mono text-sm">{invoice.invoiceNumber}</span>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium">{invoice.outlet?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">ID: {invoice.outletId}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </td>
                <td className="py-4 px-4 font-semibold">
                  {formatCurrency(parseFloat(invoice.totalAmount))}
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    invoice.paymentMethod === 'paid' 
                      ? 'bg-green-100 text-green-800'
                      : invoice.paymentMethod === 'credit'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.paymentMethod?.charAt(0).toUpperCase() + invoice.paymentMethod?.slice(1) || 'N/A'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || 'Pending'}
                  </span>
                  {invoice.notes && (
                    <p className="text-xs text-gray-600 mt-1 truncate max-w-xs">{invoice.notes}</p>
                  )}
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(invoice);
                    }}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {startItem} to {endItem} of {total} invoices
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <FiChevronLeft />
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }
              
              if (pageNum > 0 && pageNum <= totalPages) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-2 rounded-lg border ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;