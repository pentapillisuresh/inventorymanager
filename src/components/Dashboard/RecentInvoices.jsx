// src/components/Dashboard/RecentInvoices.jsx
import React from 'react';
import { FiCheckCircle, FiClock, FiXCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { formatCurrency, getStatusColor } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

const RecentInvoices = ({ invoices, pagination, onPageChange }) => {
  const navigate = useNavigate();

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved': return <FiCheckCircle className="text-green-500" />;
      case 'pending': return <FiClock className="text-yellow-500" />;
      case 'rejected': return <FiXCircle className="text-red-500" />;
      default: return <FiClock className="text-gray-500" />;
    }
  };

  // Transform API invoice data to match component expectations
  const transformedInvoices = invoices.map(invoice => ({
    id: invoice.id,
    outletName: invoice.outletName || invoice.Store?.name || 'Unknown',
    date: invoice.date ? new Date(invoice.date).toLocaleDateString() : new Date(invoice.createdAt).toLocaleDateString(),
    total: invoice.total || invoice.totalAmount || 0,
    status: invoice.status || 'pending'
  }));

  const { currentPage = 1, totalPages = 0, total = 0 } = pagination;
  const startItem = (currentPage - 1) * 5 + 1;
  const endItem = Math.min(currentPage * 5, total);

  if (total === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Invoices</h2>
          <button 
            onClick={() => navigate('/invoices')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </button>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiFileText className="text-gray-400 text-2xl" />
          </div>
          <h3 className="font-bold text-gray-800">No Invoices Found</h3>
          <p className="text-gray-600 mt-1">No invoices have been created yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Invoices</h2>
        <button 
          onClick={() => navigate('/invoices')}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          View All →
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Invoice ID</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Outlet</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {transformedInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                <td className="py-3 px-4">
                  <span className="font-medium text-primary-600">#{invoice.id}</span>
                </td>
                <td className="py-3 px-4">{invoice.outletName}</td>
                <td className="py-3 px-4">{invoice.date}</td>
                <td className="py-3 px-4 font-semibold">
                  {formatCurrency(invoice.total)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(invoice.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

export default RecentInvoices;